import base64
import datetime
import io
import os
from typing import List
import uuid
import json
import websocket
import urllib.request
import urllib.parse
from PIL import Image
from fastapi import FastAPI, File, Form, Request, UploadFile, Query, HTTPException, BackgroundTasks, APIRouter, Body
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import shutil
from threading import Thread
from database import save_user_details, user_details_collection
from datetime import datetime, timezone
from config import SERVER_ADDRESS, INPUT_FOLDER, OUTPUT_FOLDER, JPG_OUTPUT, WATERMARK_PATH
from dotenv import load_dotenv
load_dotenv(dotenv_path="./.env")
import logging
from pydantic import BaseModel, EmailStr
import smtplib
import httpx
from email.message import EmailMessage
from helper.random_seed import generate_random_seed
from helper.pdf_generator import create_interior_pdf
from helper.prepare_cover_inputs_from_selected_slides import prepare_cover_inputs_from_selected_indices

import re
import boto3
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class LoggedThread(Thread):
    def run(self):
        try:
            super().run()
        except Exception as e:
            logger.exception(f"🧵 Uncaught thread error: {e}")

app = FastAPI()
router = APIRouter()
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
S3_DIFFRUN_GENERATIONS = os.getenv("S3_DIFFRUN_GENERATIONS")
S3_JPG_PREFIX = os.getenv("S3_JPG_PREFIX", "jpg_output")
APPROVED_OUTPUT_BUCKET = os.getenv("S3_DIFFRUN_GENERATIONS")
APPROVED_OUTPUT_PREFIX = os.getenv("APPROVED_OUTPUT_PREFIX")

if not EMAIL_USER or not EMAIL_PASS:
    raise RuntimeError("Missing EMAIL_USER or EMAIL_PASS environment variables")

@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

class ApproveRequest(BaseModel):
    job_id: str
    selectedSlides: List[int]

class SaveUserDetailsRequest(BaseModel):
    job_id: str
    name: str
    gender: str
    preview_url: str
    user_name: str | None = None
    phone_number: str | None = None
    email: str | None = None

class EmailRequest(BaseModel):
    username: str
    name: str
    email: EmailStr
    preview_url: str

@app.post("/save-user-details")
async def save_user_details_endpoint(request: SaveUserDetailsRequest):
    try:
        data = request.model_dump()
        data["paid"] = False
        data["approved"] = False
        save_user_details(data)
        return {"status": "success", "message": "User details saved successfully!"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save user details: {str(e)}")

class CheckoutRequest(BaseModel):
    book_name: str
    request_id: str
    variant_id: str

@app.post("/create_checkout")
def create_checkout(payload: CheckoutRequest):
    
    shopify_store_domain = os.getenv("SHOPIFY_STORE_DOMAIN")
    if not shopify_store_domain:
        return {"error": "SHOPIFY_STORE_DOMAIN is not set"}
    
    shopify_cart_url = f"https://{shopify_store_domain}/cart/{payload.variant_id}:1"
    
    attributes = {
        "Book Name": payload.book_name,
        "Request ID": payload.request_id
    }
    encoded_attributes = "&".join([f"attributes[{urllib.parse.quote(k)}]={urllib.parse.quote(v)}" for k, v in attributes.items()])
    full_url = f"{shopify_cart_url}?{encoded_attributes}"

    return {"checkout_url": full_url}

@app.post("/webhooks/shopify")
async def shopify_webhook(request: Request):
    try:
        payload = await request.json()
        print("🔹 Shopify Webhook Received:", json.dumps(payload, indent=2))

        order_id = payload.get("name")
        customer_email = payload.get("email") or payload.get("contact_email")

        note_attrs = payload.get("note_attributes", [])
        book_name = request_id = None

        for attr in note_attrs:
            if attr.get("name") == "Book Name":
                book_name = attr.get("value")
            elif attr.get("name") == "Request ID":
                request_id = attr.get("value")

        username = (
            payload.get("billing_address", {}).get("first_name") or
            payload.get("customer", {}).get("first_name")
        )

        print(f"✅ Order Number: {order_id}")
        print(f"✅ Customer Email: {customer_email}")
        print(f"✅ Book Name: {book_name}")
        print(f"✅ Request ID: {request_id}")
        print(f"✅ Username: {username}")

        if request_id:
            result = user_details_collection.update_one(
                {"job_id": request_id},
                {"$set": {
                    "paid": True,
                    "order_id": order_id,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(
                f"💰 Updated paid status for {request_id}: matched={result.matched_count}, modified={result.modified_count}")

            record = user_details_collection.find_one({"job_id": request_id})
            preview_url = record.get("preview_url") if record else None
            name = record.get("name") if record else None

            if all([name, username, customer_email, preview_url]):
                payment_done_email(name=name, username=username,
                                   email=customer_email, preview_url=preview_url)
            else:
                print("⚠️ Missing data for email, skipping send")
        else:
            print("⚠️ No Request ID found, skipping DB update")

        return {"status": "success", "message": "Order processed"}

    except Exception as e:
        print("❌ Webhook Handling Error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/update-preview-url")
async def update_preview_url(job_id: str = Body(...), preview_url: str = Body(...)):
    print(f"🔧 Updating preview_url for job_id={job_id}: {preview_url}")
    
    result = user_details_collection.update_one(
        {"job_id": job_id},
        {"$set": {"preview_url": preview_url}}
    )
    
    if result.matched_count == 0:
        print("⚠️ No matching job_id found in DB")
        raise HTTPException(status_code=404, detail="Job ID not found")
    
    print(f"✅ Updated preview_url for job_id={job_id}")
    return {"message": "Preview URL updated successfully"}

@app.get("/get-user-details/{job_id}")
async def get_user_details(job_id: str):

    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id}, {"_id": 0})
        if not user_details:
            raise HTTPException(
                status_code=404, detail="User details not found.")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve user details: {str(e)}")

# Helper function to validate workflow files
def load_workflow(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Workflow file not found: {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            return data
        elif isinstance(data, list) and len(data) == 1 and isinstance(data[0], dict):
            return data[0]
        elif not isinstance(data, list):
            raise ValueError("Workflow must be a dictionary or list.")
        return data

    except json.JSONDecodeError as e:
        raise ValueError(
            f"Invalid JSON in workflow file: {file_path}. Error: {str(e)}")

# Function to queue a prompt
def queue_prompt(prompt, client_id):
    payload = {"prompt": prompt, "client_id": client_id}
    data = json.dumps(payload).encode('utf-8')

    try:
        req = urllib.request.Request(
            f"http://{SERVER_ADDRESS}/prompt", data=data)
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except Exception as e:
        print(f"ComfyUI API Error: {e}")
        raise HTTPException(
            status_code=400, detail=f"ComfyUI API Error: {str(e)}")

# Function to get an image from the server
def get_image(filename, subfolder, folder_type):
    params = {"filename": filename,
              "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(params)
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/view?{url_values}") as response:
        return response.read()

# Function to get history of a prompt execution
def get_history(prompt_id):
    with urllib.request.urlopen(f"http://{SERVER_ADDRESS}/history/{prompt_id}") as response:
        return json.loads(response.read())

# Function to convert PNG to JPG
def convert_png_to_jpg(png_data, output_path, watermark_path):
    try:
        img = Image.open(io.BytesIO(png_data))
        if img.mode != "RGB":
            img = img.convert("RGB")
       
        original_width, original_height = img.size
        new_height = 720
        new_width = int((original_width / original_height) * new_height) 
        img = img.resize((new_width, new_height))
        
        watermark = Image.open(watermark_path).convert("RGBA")
     
        watermark_size = (int(new_width * 0.5), int(new_height * 0.5))
        watermark = watermark.resize(watermark_size)
    
        r, g, b, a = watermark.split()
        a = a.point(lambda x: x * 0.2)  
        watermark = Image.merge('RGBA', (r, g, b, a))
        
        position = (
            (img.width - watermark.width) // 2,  
            (img.height - watermark.height) // 2 
        )
       
        img = img.convert("RGBA")
        img.paste(watermark, position, watermark)
        img = img.convert("RGB")
        img.save(output_path, format="JPEG", quality=90)
    
    except Exception as e:
        raise ValueError(f"Error converting PNG to JPG: {str(e)}")

# Function to get images after execution
def get_images(ws, prompt, job_id, workflow_number, client_id):
    logger.info(f"🧲 get_images() started for workflow {workflow_number}")

    try:
        if workflow_number.startswith("pg") and workflow_number[2:].isdigit():
            page_number = int(workflow_number[2:])
        elif workflow_number.split("_")[0].isdigit():
            page_number = int(workflow_number.split("_")[0])
        else:
            page_number = 0
        workflow_id_str = f"pg{page_number}"
    except Exception:
        workflow_id_str = workflow_number

    prompt_id = queue_prompt(prompt, client_id)["prompt_id"]
    output_images = {}
    image_index = 1

    logger.info(f"📡 Queued prompt {prompt_id} for workflow {workflow_id_str}")

    while True:
        logger.debug(f"🛰️ Waiting for WebSocket message for workflow {workflow_id_str}")
        out = ws.recv()

        if isinstance(out, str):
            message = json.loads(out)
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    logger.info(f"🔚 Execution complete for workflow {workflow_id_str}, prompt_id={prompt_id}")
                    break
        else:
            logger.warning(f"⚠️ Received non-string WebSocket message for workflow {workflow_id_str}")

    try:
        history = get_history(prompt_id)[prompt_id]
    except Exception as e:
        logger.error(f"❌ Failed to get execution history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve workflow execution history")

    logger.info(f"📜 Retrieved execution history for prompt {prompt_id}")

    for node_id, node_output in history['outputs'].items():
        images_output = []

        if 'images' not in node_output:
            continue

        for image in node_output['images']:
            logger.info(f"🖼️ Found image: {image['filename']} (type: {image['type']})")

            try:
                image_data = get_image(image['filename'], image['subfolder'], image['type'])
            except Exception as e:
                logger.error(f"❌ Failed to fetch image: {str(e)}")
                continue

            timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)
            jpg_filename = f"{job_id}_{workflow_id_str}_{timestamp}_{image_index:03d}.jpg"
            jpg_path = os.path.join(JPG_OUTPUT, jpg_filename)

            try:
                convert_png_to_jpg(image_data, jpg_path, WATERMARK_PATH)
            except Exception as e:
                logger.error(f"❌ Conversion failed: {e}")
                continue

            if not os.path.exists(jpg_path):
                logger.error(f"❌ JPG missing: {jpg_path}")
                continue

            try:
                s3_key = f"{S3_JPG_PREFIX}/{jpg_filename}"
                s3.upload_file(jpg_path, S3_DIFFRUN_GENERATIONS, s3_key)
                logger.info(f"📤 Uploaded to S3: s3://{S3_DIFFRUN_GENERATIONS}/{s3_key}")
            except Exception as e:
                logger.error(f"❌ Failed to upload {jpg_filename} to S3: {e}")
                continue

            try:
                with open(jpg_path, "rb") as f:
                    jpg_data = f.read()
                img_str = base64.b64encode(jpg_data).decode("utf-8")
                images_output.append(f"data:image/jpeg;base64,{img_str}")
            except Exception as e:
                logger.error(f"❌ Could not read JPG: {e}")
                continue

            image_index += 1

        output_images[node_id] = images_output

    logger.info(f"📸 Done saving and uploading {image_index - 1} image(s) for workflow {workflow_id_str}")
    return output_images

@app.get("/get-job-status/{job_id}")
async def get_job_status(job_id: str):
    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id},
            {"_id": 0, "paid": 1, "approved": 1, "workflow_status": 1}
        )
        if not user_details:
            raise HTTPException(status_code=404, detail="Job ID not found.")

        print(f"🔍 get-job-status → job_id={job_id}, paid={user_details.get('paid', False)}")

        return {
            "paid": user_details.get("paid", False),
            "approved": user_details.get("approved", False),
            "workflow_status": user_details.get("workflow_status", "")
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve job status: {str(e)}")

@app.post("/store-user-details")
async def store_user_details(
    name: str = Form(...),
    gender: str = Form(...),
    job_type: str = Form(...),
    images: List[UploadFile] = File(...)
):
    logger.info("📥 Received user details: name=%s, gender=%s", name, gender)
    logger.debug("📦 Number of uploaded files: %d", len(images))

    if not (1 <= len(images) <= 3):
        logger.warning("❌ Invalid number of images: %d", len(images))
        raise HTTPException(
            status_code=400, detail="You must upload between 1 and 3 images.")

    job_id = str(uuid.uuid4())
    logger.info("🆕 Generated job_id: %s", job_id)

    saved_filenames = []

    for i, image in enumerate(images):
        logger.info("🔍 Processing image %d: %s", i + 1, image.filename)
        image_data = await image.read()
        logger.debug("📏 Image size (bytes): %d", len(image_data))

        debug_file_path = os.path.join(INPUT_FOLDER, f"debug_{image.filename}")
        try:
            with open(debug_file_path, "wb") as f:
                f.write(image_data)
            logger.info("✅ Saved debug image to: %s", debug_file_path)
        except Exception as e:
            logger.error("❌ Failed to save debug image: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Failed to save debug file")

        new_filename = f"{job_id}_{i+1:02d}.jpg"
        image_path = os.path.join(INPUT_FOLDER, new_filename)

        try:
            image_bytes = io.BytesIO(image_data)
            img = Image.open(image_bytes)
            img = img.convert("RGB")
            img.save(image_path, "JPEG", quality=95)
            logger.info("💾 Saved processed image as: %s", new_filename)
        except Exception as e:
            logger.error("❌ Error processing image: %s", str(e))
            raise HTTPException(
                status_code=400, detail=f"Invalid image file: {str(e)}")

        saved_filenames.append(new_filename)

    logger.info("🎉 Successfully processed %d image(s)", len(saved_filenames))
    logger.debug("📝 Saved filenames: %s", saved_filenames)

    response = {
        "job_id": job_id,
        "job_type": job_type.lower(),
        "saved_files": saved_filenames,
        "gender": gender.lower(),
        "name": name.capitalize(),
        "preview_url": "",
        "paid": False,
        "approved": False,
        "status": "initiated"
    }

    try:
        save_user_details(response)
    except Exception as e:
        logger.error("❌ Could not save user details to MongoDB: %s", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to save user details to database.")

    logger.info("🚀 Returning response: %s", response)
    return response

@app.get("/get-user-details/{job_id}")
async def get_user_details(job_id: str):
    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id}, {"_id": 0})
        if not user_details:
            raise HTTPException(
                status_code=404, detail="User details not found.")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve user details: {str(e)}")

def get_sorted_workflow_files(book_id: str, gender: str) -> List[tuple[int, str]]:
    base_dir = os.path.join(
        "/Drive/ComfyUI/input/stories",
        book_id, gender
    )

    logger.info(f"📁 Checking base directory: {base_dir}")

    if not os.path.exists(base_dir):
        logger.error(f"❌ Base folder does not exist: {base_dir}")
        raise FileNotFoundError(f"Base folder not found: {base_dir}")

    page_dirs = []
    entries = os.listdir(base_dir)
    logger.debug(f"📂 Found {len(entries)} entries in {base_dir}: {entries}")

    for entry in entries:
        full_path = os.path.join(base_dir, entry)
        match = re.match(r'pg(\d+)', entry)
        if match and os.path.isdir(full_path):
            page_num = int(match.group(1))
            logger.debug(f"✅ Valid page directory found: {entry} (page {page_num})")
            page_dirs.append((page_num, entry))
        else:
            logger.debug(f"⏭️ Ignoring non-pgX or non-directory entry: {entry}")

    sorted_pages = sorted(page_dirs, key=lambda x: x[0])
    logger.info(f"🔢 Sorted page folders: {[f'pg{num}' for num, _ in sorted_pages]}")

    workflow_files = []
    for page_num, folder_name in sorted_pages:
        padded_page = f"{page_num:02d}"
        expected_file = f"{padded_page}_{book_id}_{gender}.json"
        workflow_path = os.path.join(base_dir, folder_name, expected_file)

        if os.path.exists(workflow_path):
            logger.info(f"📄 Workflow file found: {workflow_path}")
            workflow_files.append((page_num, expected_file))
        else:
            logger.warning(f"⚠️ Workflow file missing: {workflow_path}")

    logger.info(f"✅ Total valid workflows detected: {len(workflow_files)}")
    return workflow_files

# @app.post("/approve")
# async def approve_job(request: ApproveRequest):
#     job_id = request.job_id
#     selectedSlides = request.selectedSlides

#     try:
#         logger.info(f"📥 Received approval request for job_id={job_id}")

#         user_details = user_details_collection.find_one({"job_id": job_id})
#         if not user_details:
#             logger.warning(f"❌ No user details found for job_id={job_id}")
#             raise HTTPException(status_code=404, detail="User details not found.")

#         final_dir = os.path.join(FINAL_IMAGES, job_id)
#         os.makedirs(final_dir, exist_ok=True)
#         logger.info(f"📁 Final directory created at: {final_dir}")

#         workflows = user_details.get("workflows", {})
#         workflow_keys = sorted(workflows.keys())

#         logger.info(f"🧩 Found {len(workflow_keys)} workflows")
#         logger.info(f"🧷 Selected slides: {selectedSlides}")

#         if len(workflow_keys) != len(selectedSlides):
#             logger.warning("❌ Workflow and selectedSlides length mismatch")
#             raise HTTPException(status_code=400, detail="Mismatch between workflows and selected slides.")

#         for index, slide_index in enumerate(selectedSlides):
#             workflow_key = workflow_keys[index]
#             workflow_name = workflow_key.replace("workflow_", "")

#             image_files = [
#                 f for f in os.listdir(OUTPUT_FOLDER)
#                 if f.startswith(f"{job_id}_{workflow_name}_")
#                 and f.lower().endswith(".png")
#             ]
#             image_files.sort()

#             logger.info(f"📸 Found {len(image_files)} images for workflow {workflow_name}")

#             if not image_files:
#                 raise HTTPException(status_code=404, detail=f"No images found for workflow '{workflow_name}'.")

#             if "cover" in workflow_name.lower():
#                 selected_image = image_files[0]
#             else:
#                 if slide_index >= len(image_files):
#                     raise HTTPException(status_code=400, detail=f"Invalid slide index {slide_index} for workflow '{workflow_name}'.")
#                 selected_image = image_files[slide_index]

#             src_path = os.path.join(OUTPUT_FOLDER, selected_image)
#             dest_filename = f"page{index + 1:02d}image{slide_index + 1}.png"
#             dest_path = os.path.join(final_dir, dest_filename)

#             shutil.copy(src_path, dest_path)
#             logger.info(f"✅ Copied {selected_image} → {dest_path}")


#         try:
#             output_pdf_path = os.path.join(final_dir, "Finalized Book.pdf")
#             create_interior_pdf(final_dir, output_pdf_path)
#             logger.info(f"📄 PDF created at {output_pdf_path}")
#         except Exception as pdf_err:
#             logger.error(f"❌ PDF creation failed for {job_id}: {pdf_err}")

#         try:
#             if os.path.exists(output_pdf_path):
#                 s3_key = f"{job_id}/Finalized Book.pdf"
#                 logger.info(f"📤 Uploading PDF to S3: s3://diffrunassets/{s3_key}")
#                 s3.upload_file(output_pdf_path, "diffrunassets", s3_key)

#                 pdf_url = f"https://diffrunassets.s3.amazonaws.com/{s3_key}"
#                 logger.info(f"🔗 PDF URL: {pdf_url}")

#                 user_details_collection.update_one(
#                     {"job_id": job_id},
#                     {"$set": {
#                         "approved": True,
#                         "pdf_url": pdf_url,
#                         "updated_at": datetime.now(timezone.utc)
#                     }}
#                 )
#                 logger.info(f"📝 PDF URL saved in MongoDB for job_id={job_id}")
#             else:
#                 logger.warning(f"⚠️ PDF not found at path: {output_pdf_path}")

#         except Exception as s3_err:
#             logger.error(f"❌ S3 upload or MongoDB update failed: {s3_err}")

#         user_details_collection.update_one(
#             {"job_id": job_id},
#             {"$set": {"approved": True, "updated_at": datetime.now(timezone.utc)}}
#         )
#         logger.info(f"✅ Job marked as approved in DB: {job_id}")

#         try:
#             send_approval_confirmation_email(
#                 username=user_details.get("user_name", "there"),
#                 child_name=user_details.get("name", "Your Child"),
#                 email=user_details.get("email")
#             )
#             logger.info(f"📧 Approval email sent for job_id={job_id}")
#         except Exception as e:
#             logger.error(f"❌ Failed to send email: {e}")

#         return {
#             "status": "success",
#             "message": f"Images saved to {final_dir} and PDF generated.",
#             "pdf_url": pdf_url if 'pdf_url' in locals() else None
#         }

#     except Exception as e:
#         logger.error(f"❌ Exception occurred during approval: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")
    
@app.post("/approve")
def approve_endpoint(
    job_id: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    selectedSlides: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        logger.info(f"📥 Approve triggered for job_id={job_id}")

        selected = json.loads(selectedSlides)
        logger.info(f"🎯 Selected slides: {selected}")

        # Step 1: Generate pg0 covers and upload them to S3 (exterior)
        covers_started = generate_pg0_covers_for_stories(job_id, name, gender, background_tasks)

        # Step 2: Upload only selected interior images to S3
        final_dir = os.path.join("D:/ComfyUI_windows_portable/ComfyUI/output", job_id)
        upload_approved_images_to_s3(job_id, final_dir, selected)

        # Step 3: Copy selected images for PDF creation
        filtered_dir = os.path.normpath(os.path.join(final_dir, "interior_filtered"))
        interior_dir = os.path.normpath(os.path.join(final_dir, "interior"))
        os.makedirs(filtered_dir, exist_ok=True)

        all_filenames = sorted(os.listdir(interior_dir))

        for idx in selected:
            if idx < len(all_filenames):
                filename = all_filenames[idx]
                src_path = os.path.join(interior_dir, filename)
                dest_path = os.path.join(filtered_dir, filename)

                shutil.copy(src_path, dest_path)
                logger.info(f"📄 Copied for PDF: {filename}")
            else:
                logger.warning(f"⚠️ Index {idx} out of range for interior images")

        # Step 4: Generate PDF
        output_pdf_path = os.path.join(final_dir, "interior_final.pdf")
        create_interior_pdf(filtered_dir, output_pdf_path)
        logger.info(f"📄 Generated interior PDF at {output_pdf_path}")

        # Step 5: Upload PDF to S3
        user_record = user_details_collection.find_one({"job_id": job_id})
        order_id = user_record.get("order_id") if user_record else None

        if not order_id:
            raise HTTPException(status_code=400, detail="Order ID not found for this job.")

        s3_pdf_key = f"print_ready/{order_id}_{job_id}_interior.pdf"
        s3.upload_file(output_pdf_path, "diffrungenerations", s3_pdf_key)
        logger.info(f"📤 Uploaded PDF to s3://diffrungenerations/{s3_pdf_key}")

        # Step 6: Prepare cover inputs for final exterior composition
        prepare_cover_inputs_from_selected_indices(job_id, selected)
        logger.info(f"📦 Prepared selected cover inputs for job_id={job_id}")

        # Step 7: Mark approval status in DB
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "approved": True,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"✅ Marked job_id={job_id} as approved in DB")

        return {
            "status": "approved",
            "job_id": job_id,
            "covers_started": covers_started,
            "pdf_s3_key": s3_pdf_key
        }

    except Exception as e:
        logger.exception("🔥 Error during approval process")
        raise HTTPException(status_code=500, detail=f"Approval failed: {str(e)}")

@app.get("/get-job-status/{job_id}")
async def get_job_status(job_id: str):
    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id},
            {"_id": 0, "paid": 1, "approved": 1}
        )
        if not user_details:
            raise HTTPException(status_code=404, detail="Job ID not found.")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve job status: {str(e)}")

@app.get("/get-workflow-status/{job_id}")
async def get_workflow_status(job_id: str):
    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id},
            {"_id": 0, "workflow_status": 1}
        )
        if not user_details:
            raise HTTPException(status_code=404, detail="Job ID not found.")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve workflow status: {str(e)}")

def find_job_id_node(workflow_data: dict, known_job_id: str) -> str | None:
    for node_id, node_data in workflow_data.items():
        if isinstance(node_data, dict):
            inputs = node_data.get("inputs", {})
            if "strings" in inputs and inputs["strings"] == known_job_id:
                logger.info(f"🔍 Found job_id node: {node_id}")
                return node_id
    logger.warning("⚠️ No job_id node found matching known_job_id")
    return None

def run_workflow_in_background(
    job_id: str,
    name: str,
    gender: str,
    saved_filenames: List[str],
    job_type: str,
    book_id: str,
    workflow_filename: str
):
    name = name.capitalize()
    try:
        logger.info("🚀 Running workflow %s for job_id=%s", workflow_filename, job_id)
        script_dir = os.path.dirname(os.path.abspath(__file__))

        if job_type == "comic":
            gender_folder = "male_tod" if gender == "boy" else "female_tod"
            workflow_path = os.path.join(script_dir, "comics", "comic1", gender_folder, workflow_filename)
        else:
            gender_folder = gender.lower()
            
            try:
                match = re.match(r'^(?:pg)?(\d+)', workflow_filename)
                if not match:
                    raise ValueError("No pgX pattern found")
                page_num = int(match.group(1))

            except Exception as e:
                logger.error(f"❌ Failed to extract page number from {workflow_filename}: {e}")
                raise HTTPException(status_code=400, detail="Invalid workflow filename format.")

            expected_filename = f"{page_num:02d}_{book_id}_{gender}.json"
            workflow_path = os.path.join(
                "/Drive/ComfyUI/input/stories",
                book_id, gender_folder, f"pg{page_num}", expected_filename
            )

        if not os.path.exists(workflow_path):
            logger.error("❌ Workflow file not found: %s", workflow_path)
            raise HTTPException(status_code=404, detail=f"Workflow not found: {workflow_filename}")

        workflow_data = load_workflow(workflow_path)
        if isinstance(workflow_data, list):
            workflow_data = workflow_data[0] if workflow_data else {}

        # 🎨 Image Injection
        image_nodes = ["12", "13", "14"]
        for index, node_id in enumerate(image_nodes[:len(saved_filenames)]):
            if node_id in workflow_data and "inputs" in workflow_data[node_id]:
                workflow_data[node_id]["inputs"]["image"] = os.path.join(INPUT_FOLDER, saved_filenames[index])
                logger.info(f"🖼️ Injected image into node {node_id}")

        # 🧠 Dynamic Field Injection
        if "46" in workflow_data and "inputs" in workflow_data["46"]:
            workflow_data["46"]["inputs"]["value"] = name
            logger.info("📝 Injected name into node 46")

        known_job_id = "e44054af-f0ce-4413-8b37-853e1cc680aa" 
        job_id_node = find_job_id_node(workflow_data, known_job_id)

        if job_id_node and "inputs" in workflow_data[job_id_node]:
            workflow_data[job_id_node]["inputs"]["strings"] = job_id
            logger.info(f"🆔 Replaced job_id in node {job_id_node}")
        else:
            logger.warning("⚠️ Could not update job_id — node not found")

        random_seed = generate_random_seed()
        if "1" in workflow_data and "inputs" in workflow_data["1"]:
            workflow_data["1"]["inputs"]["seed"] = random_seed
            logger.info("🎲 Injected random seed into node 1: %d", random_seed)

        ws = websocket.WebSocket()
        client_id = f"{job_id}_workflow_{workflow_filename.replace('.json', '')}"
        try:
            ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={client_id}")
            get_images(ws, workflow_data, job_id, workflow_filename.replace(".json", ""), client_id)
        finally:
            ws.close()

        # ✅ Mark as completed
        workflow_key = f"workflow_{workflow_filename.replace('.json', '')}"
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "completed"}}
        )

    except Exception as e:
        logger.exception("🔥 Workflow %s failed for job_id=%s: %s", workflow_filename, job_id, str(e))
        workflow_key = f"workflow_{workflow_filename.replace('.json', '')}"
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "failed"}}
        )
        raise HTTPException(status_code=500, detail=f"Workflow {workflow_filename} failed: {str(e)}")

@app.post("/execute-workflow")
async def execute_workflow(
    job_id: str = Form(...),
    job_type: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    force: str = Form("false"),
    book_id: str = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    logger.info("📩 Received request to execute workflow: job_id=%s", job_id)

    name = name.capitalize()
    gender = gender.lower()
    job_type = job_type.lower()
    force_flag = force.lower() == "true"
    book_id = (book_id or "story1").lower()

    try:
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            logger.info("👤 No user record found for job_id=%s. Creating new entry.", job_id)
            user_details_collection.insert_one({
                "job_id": job_id,
                "name": name,
                "gender": gender,
                "job_type": job_type,
                "book_id": book_id,
                "preview_url": "",
                "user_name": None,
                "phone_number": None,
                "email": None,
                "paid": False,
                "approved": False,
                "workflows": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]

        if not (1 <= len(saved_filenames) <= 3):
            raise HTTPException(status_code=400, detail="Uploaded images not found.")
        
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"workflows": {}}}
        )

        script_dir = os.path.dirname(os.path.abspath(__file__))

        if job_type == "comic":
            gender_folder = "male_tod" if gender == "boy" else "female_tod"
            workflow_dir = os.path.join(script_dir, "comics", "comic1", gender_folder)
            workflow_files = sorted([
                f for f in os.listdir(workflow_dir)
                if f.startswith("Astronaut_") and f.endswith(".json")
            ])

            if not workflow_files:
                raise HTTPException(status_code=404, detail="No comic workflows found.")

            for file_name in workflow_files:
                workflow_key = f"workflow_pg{page_num}"

                user_details_collection.update_one(
                    {"job_id": job_id},
                    {"$set": {f"workflows.{workflow_key}.status": "processing"}}
                )

                thread = LoggedThread(target=run_workflow_in_background, args=(
                    job_id, name, gender, saved_filenames, job_type, book_id, file_name
                ))
                thread.start()

            return {
                "status": "processing",
                "job_id": job_id,
                "workflows_started": [f.rstrip(".json") for f in workflow_files]
            }

       # ✨ STORY MODE (New structure with pgX detection)
        workflow_files = get_sorted_workflow_files(book_id, gender)

        if not workflow_files:
            raise HTTPException(status_code=404, detail="No valid story workflow files found.")

        for page_num, file_name in workflow_files:
            workflow_key = f"workflow_pg{page_num}"
            user_details_collection.update_one(
                {"job_id": job_id},
                {"$set": {f"workflows.{workflow_key}.status": "processing"}}
            )

            background_tasks.add_task(
                run_workflow_in_background,
                job_id, name, gender, saved_filenames,
                job_type, book_id, file_name
            )

        return {
            "status": "processing",
            "job_id": job_id,
            "workflows_started": [f"pg{page}" for page, _ in workflow_files]
        }

    except Exception as e:
        logger.exception("❌ Error during workflow execution")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
@app.post("/regenerate-workflow")
def regenerate_workflow(
    job_id: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    workflow_number: str = Form(...), 
    job_type: str = Form("story"),
    book_id: str = Form("story1"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        logger.info(
            f"♻️ Regenerating workflow {workflow_number} for job_id={job_id} (type={job_type}, book={book_id})"
        )

        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]

        if not saved_filenames:
            raise HTTPException(status_code=404, detail="No input images found.")

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.workflow_{workflow_number}.status": "processing"}}
        )

        workflow_filename = ""
        if job_type.lower() == "comic":
            workflow_filename = f"Astronaut_{workflow_number}.json"
        else:
            workflow_filename = f"{workflow_number}.json"

        if job_type.lower() == "comic":
            thread = LoggedThread(target=run_workflow_in_background, args=(
                job_id, name, gender, saved_filenames, job_type, book_id, workflow_filename
            ))
            thread.start()
        else:
            background_tasks.add_task(
                run_workflow_in_background,
                job_id, name, gender, saved_filenames, job_type, book_id, workflow_filename
            )

        return {"status": "regenerating", "workflow": workflow_number}

    except Exception as e:
        logger.exception("🔥 Error during workflow regeneration")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/poll-images")
async def poll_images(job_id: str = Query(...)):
    logger.info("🔍 Handling /poll-images request for job_id=%s", job_id)
    workflow_groups = {}

    try:
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found for job ID.")

        workflows = user_details.get("workflows", {})
        expected_keys = list(workflows.keys())
        expected_suffixes = [
            key.replace("workflow_", "")
            for key in expected_keys
            if re.match(r"^workflow_pg\d+$", key)
        ]

        logger.debug(f"🧠 Expecting workflows: {expected_suffixes}")

        response = s3.list_objects_v2(Bucket=S3_DIFFRUN_GENERATIONS, Prefix=f"{S3_JPG_PREFIX}/{job_id}_")
        s3_files = response.get("Contents", [])
        logger.info("📂 Found %d files in S3 path %s/", len(s3_files), S3_JPG_PREFIX)

        for obj in s3_files:
            key = obj["Key"]
            file = os.path.basename(key)

            if (
                not file.startswith(job_id)
                or not file.lower().endswith(".jpg")
                or "collage" in file.lower()
            ):
                continue

            match = re.match(rf"{re.escape(job_id)}_(pg\d+|\d+)_\d+_\d+\.jpg", file)
            if not match:
                logger.debug("⚠️ Skipping unmatched filename: %s", file)
                continue

            workflow_id = match.group(1)
            if workflow_id not in expected_suffixes:
                logger.debug("🛑 Skipping non-expected workflow ID: %s", workflow_id)
                continue

            try:
                image_url = f"https://{S3_DIFFRUN_GENERATIONS}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
                workflow_groups.setdefault(workflow_id, []).append({
                    "filename": file,
                    "url": image_url
                })
            except Exception as e:
                logger.warning("❌ Could not construct image URL for file %s: %s", file, str(e))

        carousels = []
        for workflow_id in sorted(expected_suffixes, key=lambda x: int(re.sub(r"\D", "", x))):
            images = sorted(workflow_groups.get(workflow_id, []), key=lambda x: x["filename"])
            carousels.append({
                "workflow": workflow_id,
                "images": images
            })

        completed = all(len(c["images"]) > 0 for c in carousels)
        if completed:
            current_status = user_details.get("workflow_status", "")
            if current_status != "completed":
                user_details_collection.update_one(
                    {"job_id": job_id},
                    {"$set": {"workflow_status": "completed", "updated_at": datetime.now(timezone.utc)}}
                )
                logger.info("🎉 Workflow marked as COMPLETED for job_id=%s", job_id)

        logger.info("✅ Polling complete: %d workflows found, completed=%s", len(carousels), completed)

        return {
            "carousels": carousels,
            "completed": completed
        }

    except Exception as e:
        logger.exception("❌ Error while polling images for job_id=%s", job_id)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
@app.post("/run-combined-workflow")
async def run_combined_workflow(job_id: str = Form(...)):
    try:
        logger.info(f"🎬 Running combined workflow for job_id={job_id}")

        # Step 1: Collect the latest image from each of the 10 workflows
        input_images = []
        for i in range(1, 11):
            workflow_name = f"Astronaut_{i}"
            prefix = f"{job_id}_{workflow_name}_"
            matching_files = sorted([
                f for f in os.listdir(JPG_OUTPUT)
                if f.startswith(prefix) and f.lower().endswith(".jpg")
            ])

            if not matching_files:
                raise HTTPException(status_code=404, detail=f"Image not found for workflow {i}")
            input_images.append(os.path.join(JPG_OUTPUT, matching_files[-1]))

        # Step 2: Load combined workflow JSON
        script_dir = os.path.dirname(os.path.abspath(__file__))
        workflow_path = os.path.join(script_dir, "comics", "combined_comic", "combined_workflow.json")

        with open(workflow_path, "r", encoding="utf-8") as f:
            workflow_data = json.load(f)

        # Step 3: Inject the 10 images into specific node IDs
        target_nodes = [9, 10, 13, 14, 17, 19, 21, 23, 25, 27]
        for idx, node_id in enumerate(target_nodes):
            node_key = str(node_id)
            if node_key in workflow_data and "inputs" in workflow_data[node_key]:
                workflow_data[node_key]["inputs"]["image"] = input_images[idx]
                logger.info(f"🖼️ Injected image {input_images[idx]} into node {node_key}")
            else:
                logger.warning(f"⚠️ Node {node_key} missing or invalid")

        # Step 4: Inject job ID into node 41
        if "41" in workflow_data and "inputs" in workflow_data["41"]:
            workflow_data["41"]["inputs"]["strings"] = job_id
        else:
            logger.warning("⚠️ Node 41 not found or missing 'inputs'")

        # Step 5: Run the workflow
        ws = websocket.WebSocket()
        client_id = f"{job_id}_combined"
        ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={client_id}")
        result_images = get_images(ws, workflow_data, job_id, 99, client_id)
        # Cleanup: Remove intermediate files from workflow 99
        for file in os.listdir(JPG_OUTPUT):
            if file.startswith(f"{job_id}_99_") and file.endswith(".jpg"):
                try:
                    os.remove(os.path.join(JPG_OUTPUT, file))
                    logger.info(f"🧹 Deleted intermediate collage file: {file}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not delete {file}: {e}")

        ws.close()

        all_images = []
        for node_imgs in result_images.values():
            all_images.extend(node_imgs)

        if not all_images:
            raise HTTPException(status_code=500, detail="No images returned from workflow.")

        img_base64 = all_images[-1].split(",")[1] 
        img_data = base64.b64decode(img_base64)
        collage_filename = f"{job_id}_collage.jpg"
        collage_path = os.path.join(JPG_OUTPUT, collage_filename)

        try:
            with open(collage_path, "wb") as f:
                f.write(img_data)
            logger.info(f"✅ Saved collage as: {collage_path}")
        except Exception as e:
            logger.error(f"❌ Failed to save collage image: {e}")


    except Exception as e:
        logger.exception("🔥 Error running combined workflow")
        raise HTTPException(status_code=500, detail=str(e))

def upload_approved_images_to_s3(job_id: str, local_folder: str, selected_indices: List[int]):
    interior_path = os.path.join(local_folder, "interior")
    exterior_path = os.path.join(local_folder, "exterior")
    os.makedirs(interior_path, exist_ok=True)
    os.makedirs(exterior_path, exist_ok=True)

    for idx in selected_indices:
        page_num = idx + 1
        pattern = f"page{page_num:02d}image"
        for file in os.listdir(local_folder):
            if file.startswith(pattern) and file.endswith(".png"):
                src = os.path.join(local_folder, file)
                dest_folder = exterior_path if page_num == 1 else interior_path
                shutil.copy(src, os.path.join(dest_folder, file))

    for subfolder in ["interior", "exterior"]:
        full_path = os.path.join(local_folder, subfolder)
        if not os.path.exists(full_path):
            continue
        for file in os.listdir(full_path):
            if file.endswith(".png"):
                local_file_path = os.path.join(full_path, file)
                s3_key = f"approved_output/{job_id}/{subfolder}/{file}"
                try:
                    s3.upload_file(local_file_path, "diffrungenerations", s3_key)
                    logger.info(f"✅ Uploaded {file} to s3://diffrungenerations/{s3_key}")
                except Exception as e:
                    logger.error(f"❌ S3 upload failed for {file}: {e}")

def upload_pg0_covers_to_s3(job_id: str, local_folder: str):
    exterior_path = os.path.join(local_folder, "exterior")
    os.makedirs(exterior_path, exist_ok=True)

    pg0_covers = [
        f for f in os.listdir(local_folder)
        if f.startswith("page01image") and "pg0cover" in f.lower() and f.endswith(".png")
    ]

    for file in pg0_covers:
        src = os.path.join(local_folder, file)
        shutil.copy(src, os.path.join(exterior_path, file))

    for file in os.listdir(exterior_path):
        if file.endswith(".png"):
            local_file_path = os.path.join(exterior_path, file)
            s3_key = f"approved_output/{job_id}/exterior/{file}"
            try:
                s3.upload_file(local_file_path, "diffrungenerations", s3_key)
                logger.info(f"✅ Uploaded regenerated pg0 cover to s3://diffrungenerations/{s3_key}")
            except Exception as e:
                logger.error(f"❌ S3 upload failed for pg0 cover {file}: {e}")

def generate_pg0_covers_for_stories(
    job_id: str,
    name: str,
    gender: str,
    background_tasks: BackgroundTasks,
    exclude_book_id: str | None = None
) -> list[str]:
    base_dir = "/Drive/ComfyUI/input/stories"
    name = name.capitalize()
    gender = gender.lower()

    logger.info(f"🧢 Generating cover pages (pg0) for all stories for job_id={job_id}")

    if not os.path.exists(base_dir):
        raise HTTPException(status_code=500, detail="Stories base folder not found")

    story_books = [
        folder for folder in os.listdir(base_dir)
        if os.path.isdir(os.path.join(base_dir, folder))
    ]

    if exclude_book_id:
        story_books = [b for b in story_books if b.lower() != exclude_book_id.lower()]
        logger.info(f"📦 Excluding book: {exclude_book_id}, Remaining: {story_books}")

    saved_filenames = [
        file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
    ]

    if not saved_filenames:
        raise HTTPException(status_code=400, detail="No input images found for this job.")

    workflows_started = []

    for book_id in story_books:
        pg0_folder = os.path.join(base_dir, book_id, gender, "pg0")
        if not os.path.exists(pg0_folder):
            logger.warning(f"⏭️ Skipping {book_id} (pg0 folder missing for {gender})")
            continue

        json_files = [f for f in os.listdir(pg0_folder) if f.endswith(".json")]
        if not json_files:
            logger.warning(f"⏭️ No workflow JSON found in {pg0_folder}")
            continue

        workflow_file = json_files[0]
        workflow_key = f"workflow_pg0_{book_id}"

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "processing"}}
        )

        # 🧵 Launch background task to run pg0 workflow
        background_tasks.add_task(
            run_workflow_in_background,
            job_id, name, gender, saved_filenames, "story", book_id, workflow_file
        )

        # 📤 Also upload pg0 cover if already available
        final_pg0_path = os.path.join("/Drive/ComfyUI/output", job_id)
        upload_pg0_covers_to_s3(job_id, final_pg0_path)

        workflows_started.append(f"{book_id}/pg0 → {workflow_file}")

    return workflows_started

@app.get("/get-combined-image")
async def get_combined_image(job_id: str = Query(...)):
    collage_path = os.path.join(JPG_OUTPUT, f"{job_id}_collage.jpg")

    if not os.path.exists(collage_path):
        raise HTTPException(status_code=404, detail="Collage image not found.")

    try:
        with open(collage_path, "rb") as f:
            img_data = f.read()

        encoded = base64.b64encode(img_data).decode("utf-8")
        return {"image": f"data:image/jpeg;base64,{encoded}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading collage image: {e}")

@app.get("/generate-comic-pdf")
async def generate_pdf(job_id: str = Query(...)):
    collage_filename = f"{job_id}_collage.jpg"
    collage_path = os.path.join(JPG_OUTPUT, collage_filename)
    pdf_path = os.path.join(OUTPUT_FOLDER, f"Your_Story_{job_id}.pdf")

    if not os.path.exists(collage_path):
        raise HTTPException(status_code=404, detail="Collage image not found.")

    try:
        c = canvas.Canvas(pdf_path, pagesize=A4)
        width, height = A4

        img = Image.open(collage_path)
        img_width, img_height = img.size

        max_width = width - 100
        max_height = height - 100
        aspect_ratio = img_width / img_height

        if img_width > max_width:
            img_width = max_width
            img_height = int(img_width / aspect_ratio)

        if img_height > max_height:
            img_height = max_height
            img_width = int(img_height * aspect_ratio)

        x = (width - img_width) / 2
        y = (height - img_height) / 2

        c.drawImage(collage_path, x, y, width=img_width, height=img_height)
        c.save()

        return FileResponse(pdf_path, filename=f"Your-Story-{job_id}.pdf")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

def preview_email(name: str, username: str, email: str, preview_url: str):
    username = username.capitalize()
    name = name.capitalize()

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear <strong>{username}</strong>,</p>

        <p>Thank you for taking the first step toward creating a magical, personalized book for <strong>{name}</strong> with <strong>Diffrun</strong>!</p>

        <p>We make the storybooks truly special — <strong>{name}</strong> is the star of the story, brought to life through beautiful, personalised illustrations.</p>

        <p>🌈 You can now preview and refine the book to make it even more special.</p>

        <a href="{preview_url}" 
           style="display: inline-block; 
                  padding: 12px 24px; 
                  background-color: #6366F1; 
                  color: white; 
                  text-decoration: none; 
                  font-weight: bold; 
                  border-radius: 6px;
                  margin: 16px 0;">
            Refine {name}’s Book
        </a>

        <p>Keep the magic going — click above to continue building the book.</p>

        <p>With excitement,<br><strong>The Diffrun Team</strong></p>
      </body>
    </html>
    """

    msg = EmailMessage()
    msg["Subject"] = f"{name}'s Magical Book Is Being Crafted!"
    msg["From"] = EMAIL_USER
    msg["To"] = email
    msg.set_content("This email contains HTML content.")
    msg.add_alternative(html_content, subtype="html")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(EMAIL_USER, EMAIL_PASS)
        smtp.send_message(msg)

def payment_done_email(username: str, child_name: str, email: str, preview_url: str):
    try:
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hi <strong>{username}</strong>,</p>

            <p>Thank you for your order! <strong>{child_name}</strong>'s magical storybook is now ready for your review. ✨</p>

            <p>You still have 12 hours to make refinements before the book is sent for printing. If there are any pages you'd like to adjust, you can regenerate specific images directly within the preview.</p>

            <p>Once you're happy with the final result, please click the "Approve for printing" button on the preview page. This step is essential to finalize your book and prepare it for printing.</p>

            <h3>📖 Preview & Refine Your Book:</h3>

            <a href="{preview_url}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; font-weight: bold; border-radius: 6px;">
              View & Refine Storybook
            </a>

            <p>Our system automatically finalizes the book <strong>12 hours after payment</strong> to avoid any delays in printing.</p>

            <p>If you need any assistance, feel free to reply to this email. We're here to help!</p>

            <p>Warmest wishes,<br><strong>The Diffrun Team</strong></p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = f"{child_name}'s Storybook is Ready to Refine ✨"
        msg["From"] = EMAIL_USER
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        logger.info(f"📧 Refinement email sent to {email}")
    except Exception as e:
        logger.error(f"❌ Failed to send refinement email: {e}")

def send_approval_confirmation_email(username: str, child_name: str, email: str):
    try:
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hi <strong>{username}</strong>,</p>

            <p>Great news! <strong>{child_name}</strong>'s magical storybook has been finalized and sent for printing. It will soon be on its way to you. 🚀📚</p>

            <p>Please allow us <strong>7–8 working days</strong> as all books are custom made to order.</p>

            <p>In case the approval wasn't submitted manually, our system automatically finalizes the book <strong>12 hours after payment</strong> to avoid any delays in printing.</p>

            <p>We can't wait for you and {child_name} to enjoy this keepsake together. 💖</p>

            <p>Warm wishes,<br><strong>The Diffrun Team</strong></p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = f"{child_name}'s Storybook Is Now Being Printed! 🎉"
        msg["From"] = EMAIL_USER
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        logger.info(f"📦 Delivery confirmation email sent to {email}")

    except Exception as e:
        logger.error(f"❌ Failed to send delivery email: {e}")

@app.get("/about")
async def serve_about():
    return FileResponse("frontend/out/about.html")

@app.get("/books")
async def serve_about():
    return FileResponse("frontend/out/books.html")

@app.get("/child-details")
async def serve_child_details():
    return FileResponse("frontend/out/child-details.html")

@app.get("/preview")
async def serve_preview():
    return FileResponse("frontend/out/preview.html")

@app.get("/faq")
async def serve_user_details():
    return FileResponse("frontend/out/faq.html")

@app.get("/contact")
async def serve_contact():
    return FileResponse("frontend/out/contact.html")

@app.get("/user-details")
async def serve_user_details():
    return FileResponse("frontend/out/user-details.html")

@app.get("/email-preview-request")
async def serve_email_preview_request():
    return FileResponse("frontend/out/email-preview-request.html")

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="frontend/out", html=True), name="static")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)