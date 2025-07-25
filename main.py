import boto3
import re
from helper.prepare_cover_inputs_from_selected_slides import prepare_cover_inputs_from_selected_indices
from helper.pdf_generator import create_interior_pdf
from helper.random_seed import generate_random_seed
from helper.create_front_cover_pdf import create_front_cover_pdf
from email.message import EmailMessage
import smtplib
from pydantic import BaseModel, EmailStr
import logging
import base64
import datetime
import io
import os
import requests
from typing import List, Optional
import uuid
import json
import asyncio
import websocket
import urllib.request
import urllib.parse
from PIL import Image
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import FastAPI, File, Form, Request, UploadFile, Query, HTTPException, BackgroundTasks, APIRouter, Body, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import shutil
from threading import Thread
from database import save_user_details, user_details_collection
from datetime import datetime, timezone
from models import ItemShippedPayload, BookStylePayload
from pathlib import Path
import glob
from dotenv import load_dotenv
import hmac
import hashlib
import razorpay
from paypalcheckoutsdk.core import LiveEnvironment, PayPalHttpClient, SandboxEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest
from helper.paypal_utils import get_paypal_access_token
from pydantic import BaseModel, Field
from typing import Optional
from concurrent.futures import ProcessPoolExecutor
from html import escape
from email.header import Header

load_dotenv(dotenv_path=".env")
executor = ProcessPoolExecutor(max_workers=2) 

SERVER_ADDRESS = os.getenv("SERVER_ADDRESS")
INPUT_FOLDER = os.path.normpath(os.getenv("INPUT_FOLDER"))
OUTPUT_FOLDER = os.path.normpath(os.getenv("OUTPUT_FOLDER"))
JPG_OUTPUT = os.path.normpath(os.getenv("JPG_OUTPUT"))
WATERMARK_PATH = os.path.normpath(os.getenv("WATERMARK_PATH"))
STORIES_FOLDER = os.path.normpath(os.getenv("STORIES_FOLDER"))
IP_ADAPTER = os.getenv("IP_ADAPTER")
PYTORCH_MODEL = os.getenv("PYTORCH_MODEL")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
S3_DIFFRUN_GENERATIONS = os.getenv("S3_DIFFRUN_GENERATIONS")
S3_JPG_PREFIX = os.getenv("S3_JPG_PREFIX", "jpg_output")
APPROVED_OUTPUT_BUCKET = os.getenv("S3_DIFFRUN_GENERATIONS")
APPROVED_OUTPUT_PREFIX = os.getenv("APPROVED_OUTPUT_PREFIX")
REPLICACOMFY_BUCKET = os.getenv("REPLICACOMFY_BUCKET")
GEO = os.getenv("GEO")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_ENVIRONMENT = os.getenv("PAYPAL_ENVIRONMENT", "sandbox")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

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

if not EMAIL_USER or not EMAIL_PASS:
    raise RuntimeError(
        "Missing EMAIL_USER or EMAIL_PASS environment variables")

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
    phone_number: Optional[str] = Field(
        None,
        min_length=10,
        max_length=15,
        example="+1234567890",
        description="User's phone number (10-15 digits)"
    )
    user_name: str
    email: Optional[str] = Field(
        None,
        example="user@example.com",
        description="User's email address"
    )

class CheckoutRequest(BaseModel):
    book_name: str
    request_id: str
    variant_id: str

class EmailRequest(BaseModel):
    username: str
    name: str
    email: EmailStr
    preview_url: str

@app.post("/create-order-razorpay")
async def create_order(request: Request):
    data = await request.json()

    name = data.get("name")
    email = data.get("email")
    contact = data.get("contact")
    address1 = data.get("address1")
    address2 = data.get("address2")
    city = data.get("city")
    province = data.get("province")
    zip_code = data.get("zip")
    discount_code = data.get("discount_code", "").upper()
    job_id = data.get("job_id")

    order_data = {
        "amount": 100,
        "currency": "INR",
        "notes": {
            "name": name,
            "email": email,
            "contact": contact,
            "address1": address1,
            "address2": address2,
            "city": city,
            "province": province,
            "zip": zip_code,
            "discount_code": discount_code,
            "job_id": job_id
        }
    }

    final_amount = data.get("final_amount")
    if final_amount is None:
        return {"error": "Final amount missing."}

    amount_in_paise = int(final_amount * 100)
    order_data["amount"] = amount_in_paise

    razorpay_order = razorpay_client.order.create(data=order_data)

    return {
        "order_id": razorpay_order['id'],
        "amount": amount_in_paise,
        "currency": "INR",
        "razorpay_key": RAZORPAY_KEY_ID
    }

@app.post("/verify-razorpay")
async def verify_signature(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()

        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")
        job_id = data.get("job_id")

        actual_price = data.get("actual_price")
        discount_percentage = data.get("discount_percentage")
        discount_amount = data.get("discount_amount")
        shipping_price = data.get("shipping_price")
        taxes = data.get("taxes")
        final_amount = data.get("final_amount")

        logger.info(f"🧾 Starting Razorpay verification for job_id={job_id}")

        # Step 1: Signature verification
        body = razorpay_order_id + "|" + razorpay_payment_id
        generated_signature = hmac.new(
            bytes(RAZORPAY_KEY_SECRET, 'utf-8'),
            bytes(body, 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != razorpay_signature:
            logger.warning(f"❌ Signature verification failed for job_id={job_id}")
            return {"success": False, "error": "Signature verification failed"}

        logger.info(f"✅ Signature verified for job_id={job_id}, fetching payment details...")

        # Step 2: Fetch payment + user details
        payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
        notes = payment_details.get("notes", {})
        currency_code = payment_details.get("currency")
        processed_at = payment_details.get("created_at")

        payer_name = notes.get("name", "")
        payer_email = notes.get("email", "")
        payer_contact = notes.get("contact", "")
        discount_code = notes.get("discount_code") or data.get("discount_code", "")
        discount_code = discount_code.upper()

        logger.info(f"💡 Final resolved discount_code for job_id={job_id}: '{discount_code}'")

        shipping_info = {
            "name": payer_name,
            "address1": notes.get("address1", ""),
            "address2": notes.get("address2", ""),
            "city": notes.get("city", ""),
            "province": notes.get("province", ""),
            "zip": notes.get("zip", ""),
            "country": notes.get("country", "India"),
            "phone": payer_contact
        }

        # Step 3: Generate new order_id with robust incrementing logic
        try:
            # Define order ID patterns and defaults
            order_patterns = {
                "TEST": {
                    "regex": r"^TEST#(\d+)$",
                    "default": "TEST#0",
                    "prefix": "TEST#"
                },
                "COLLAB": {
                    "regex": r"^COLLAB#(\d+)$",
                    "default": "COLLAB#0",
                    "prefix": "COLLAB#"
                },
                "DEFAULT": {
                    "regex": r"^#(\d+)$",
                    "default": "#1199",
                    "prefix": "#"
                }
            }

            # Determine which pattern to use
            pattern_key = "DEFAULT"
            if discount_code == "TEST":
                pattern_key = "TEST"
            elif discount_code == "COLLAB":
                pattern_key = "COLLAB"

            pattern = order_patterns[pattern_key]
            logger.info(f"🎟️ Using order ID pattern: {pattern_key}")

            # Find the highest existing order number for this pattern
            pipeline = [
                {"$match": {"order_id": {"$regex": pattern['regex']}}},
                {"$project": {
                    "order_num": {
                        "$toInt": {
                            "$arrayElemAt": [
                                {"$split": ["$order_id", "#"]},
                                1
                            ]
                        }
                    }
                }},
                {"$sort": {"order_num": -1}},
                {"$limit": 1}
            ]

            result = list(user_details_collection.aggregate(pipeline))
            highest_num = result[0]["order_num"] if result else int(pattern['default'].split("#")[1])
            new_num = highest_num + 1
            new_order_id = f"{pattern['prefix']}{new_num}"

            logger.info(f"🔢 Generated new order ID: {new_order_id} (Previous highest: {highest_num})")

        except Exception as e:
            logger.exception(f"❌ Failed to generate order_id: {str(e)}")
            return {"success": False, "error": "Failed to generate order ID"}

        user = user_details_collection.find_one({"job_id": job_id})
        if not user:
            logger.error(f"❌ No user found for job_id={job_id}")
            return {"success": False, "error": "Job ID not found"}

        logger.info(f"👤 User record found for job_id={job_id}, updating DB...")

        # Step 4: Save payment & shipping data to MongoDB
        update_data = {
            "paid": True,
            "order_id": new_order_id,
            "transaction_id": razorpay_payment_id,
            "customer_email": payer_email,
            "discount_code": discount_code,
            "processed_at": datetime.fromtimestamp(processed_at, tz=timezone.utc),
            "currency": currency_code,
            "total_price": final_amount,
            "shipping_address": shipping_info,
            "actual_price": actual_price,
            "discount_percentage": discount_percentage,
            "discount_amount": discount_amount,
            "shipping_price": shipping_price,
            "taxes": taxes,
            "updated_at": datetime.now(timezone.utc)
        }

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )

        # Step 5: Determine lock vs full preview
        workflows = user.get("workflows", {})
        workflow_keys = list(workflows.keys())

        if len(workflow_keys) == 10:
            logger.info(f"🔐 LOCKED preview detected (10 workflows). Sending locked email for job_id={job_id}")

            await payment_done_email_lock(
                username=user.get("user_name", ""),
                child_name=user.get("name", ""),
                email=user.get("email", ""),
                preview_url=user.get("preview_url", ""),
                order_id=new_order_id,
                total_price=final_amount,
                currency_code=currency_code,
                discount_code=discount_code,
                payment_id=razorpay_payment_id,
                shipping_info=shipping_info,
                discount_amount=discount_amount,
                shipping_price=shipping_price,
                taxes=taxes,
                actual_price=actual_price
            )

            logger.info(f"📨 payment_done_email_lock sent for job_id={job_id}, triggering remaining workflows...")
            background_tasks.add_task(run_remaining_workflows_async, job_id, start_from_pg=10)

        else:
            logger.info(f"📖 Full preview detected (len={len(workflow_keys)}). Sending standard email for job_id={job_id}")

            await payment_done_email(
                username=user.get("user_name", ""),
                child_name=user.get("name", ""),
                email=user.get("email", ""),
                preview_url=user.get("preview_url", ""),
                order_id=new_order_id,
                total_price=final_amount,
                currency_code=currency_code,
                discount_code=discount_code,
                payment_id=razorpay_payment_id,
                shipping_info=shipping_info,
                discount_amount=discount_amount,
                shipping_price=shipping_price,
                taxes=taxes,
                actual_price=actual_price
            )

        logger.info(f"✅ Razorpay payment captured successfully for job_id={job_id}")
        return {"success": True}

    except Exception as e:
        logger.exception(f"❌ Exception during /verify-razorpay: {str(e)}")
        return {"success": False, "error": "Internal server error"}

@app.post("/save-user-details")
async def save_user_details_endpoint(request: SaveUserDetailsRequest):
    try:
        data = request.model_dump()
        data["paid"] = False
        data["approved"] = False

        save_user_details(data)

        return {
            "preview_url": data["preview_url"],
            "phone_number": data.get("phone_number"),
            "email": data.get("email"),
            "user_name": data["user_name"],
            "name": data["name"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save user details: {str(e)}")

@app.get("/api/order-status/{job_id}")
async def get_order_status(job_id: str):
    order = user_details_collection.find_one({"job_id": job_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipping = order.get("shipping_address", {})

    return {
        "job_id": job_id,
        "dlv_purchase_event_fired": order.get("dlv_purchase_event_fired", False),
        "value": order.get("total_price") or order.get("final_amount"),
        "currency": order.get("currency", "INR"),
        "gender": order.get("gender"),
        "city": shipping.get("city"),
        "country": shipping.get("country"),
        "postal_code": shipping.get("zip"),
        "preview_url": order.get("preview_url"),
        "username": order.get("user_name"),
        "email": order.get("email"),
        "name": order.get("name")
    }

@app.post("/api/mark-dlv-purchase-event-fired")
async def mark_purchase_fired(data: dict):
    job_id = data.get("job_id")
    if not job_id:
        raise HTTPException(status_code=400, detail="Missing job_id")

    result = user_details_collection.update_one(
        {"job_id": job_id},
        {"$set": {"dlv_purchase_event_fired": True}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job ID not found")

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
    encoded_attributes = "&".join(
        [f"attributes[{urllib.parse.quote(k)}]={urllib.parse.quote(v)}" for k, v in attributes.items()])
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

        processed_at = payload.get("processed_at")
        total_price = payload.get("total_price")

        discount_code = None
        if payload.get("discount_codes"):
            discount_code = payload["discount_codes"][0].get("code")

        shipping = payload.get("shipping_address") or {}
        shipping_info = {
            "name": f"{shipping.get('first_name', '')} {shipping.get('last_name', '')}".strip(),
            "address1": shipping.get("address1"),
            "address2": shipping.get("address2"),
            "city": shipping.get("city"),
            "province": shipping.get("province"),
            "zip": shipping.get("zip"),
            "country": shipping.get("country"),
            "phone": shipping.get("phone")
        }

        if request_id:
            result = user_details_collection.update_one(
                {"job_id": request_id},
                {"$set": {
                    "paid": True,
                    "order_id": order_id,
                    "shopify_email": customer_email,
                    "processed_at": processed_at,
                    "total_price": total_price,
                    "discount_code": discount_code,
                    "shipping_address": shipping_info,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(
                f"💰 Updated paid status for {request_id}: matched={result.matched_count}, modified={result.modified_count}")
            print(f"✅ Shopify Email stored: {customer_email}")

            record = user_details_collection.find_one({"job_id": request_id})
            preview_url = record.get("preview_url") if record else None
            name = record.get("name") if record else None

            if all([name, username, customer_email, preview_url]):
                payment_done_email(
                    child_name=name,
                    username=username,
                    email=customer_email,
                    preview_url=preview_url
                )
            else:
                print("⚠️ Missing data for email, skipping send")
        else:
            print("⚠️ No Request ID found, skipping DB update")

        return {"status": "success", "message": "Order processed"}

    except Exception as e:
        print("❌ Webhook Handling Error:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

def get_paypal_base_url():
    return "https://api-m.sandbox.paypal.com" if os.getenv("PAYPAL_ENVIRONMENT") == "sandbox" else "https://api-m.paypal.com"

def get_paypal_client():
    client_id = PAYPAL_CLIENT_ID
    client_secret = PAYPAL_CLIENT_SECRET
    env_mode = PAYPAL_ENVIRONMENT

    if env_mode == "sandbox":
        environment = SandboxEnvironment(client_id=client_id, client_secret=client_secret)
    else:
        environment = LiveEnvironment(client_id=client_id, client_secret=client_secret)

    logger.info(f"Using PayPal environment: {env_mode}")
    logger.info(f"PayPal Client ID: {client_id}")
    logger.info(f"PayPal Client Secret: {client_secret}")
    if not client_id or not client_secret:
        raise RuntimeError("PayPal client ID or secret is not set in environment variables")

    return PayPalHttpClient(environment)

@app.post("/api/orders/capture/{order_id}/")
async def capture_order(order_id: str):
    try:
        capture_request = OrdersCaptureRequest(order_id)
        capture_request.prefer('return=representation')
        response = get_paypal_client().execute(capture_request)
        order = response.result

        purchase_unit = order.purchase_units[0]
        capture = purchase_unit.payments.captures[0]

        payer = order.payer
        payer_name = payer.name.given_name + " " + payer.name.surname
        payer_email = payer.email_address

        processed_at = capture.create_time
        total_price = capture.amount.value
        currency_code = capture.amount.currency_code

        shipping_address_obj = purchase_unit.shipping.address
        shipping_info = {
            "name": purchase_unit.shipping.name.full_name,
            "address1": shipping_address_obj.address_line_1,
            "address2": shipping_address_obj.address_line_2,
            "city": shipping_address_obj.admin_area_2,
            "province": shipping_address_obj.admin_area_1,
            "zip": shipping_address_obj.postal_code,
            "country": shipping_address_obj.country_code,
            "phone": "",  # PayPal API doesn’t usually return phone here
        }

        # Find user by order_id
        user_record = user_details_collection.find_one({"order_id": order_id})
        if not user_record:
            logger.warning("No matching user found for order_id=%s", order_id)
            raise HTTPException(status_code=404, detail="User not found")

        job_id = user_record.get("job_id")

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "paid": True,
                "order_id": order_id,
                "customer_email": payer_email,
                "processed_at": processed_at,
                "total_price": total_price,
                "currency_code": currency_code,
                "shipping_address": shipping_info,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

        payment_done_email(
            child_name=user_record.get("name", ""),
            username=user_record.get("user_name", ""),
            email=user_record.get("email", ""),
            preview_url=user_record.get("preview_url", "")
        )

        logger.info("✅ PayPal payment captured and stored successfully")
        return {"status": "success"}

    except Exception as e:
        logger.exception("Error capturing PayPal order")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/orders")
async def create_order(request: Request):
    try:
        body = await request.json()
        cart = body.get("cart", [])
        shipping_value = body.get("shipping", "0")
        currency_code = body.get("currency", "USD")
        request_id = body.get("request_id") or str(uuid.uuid4())
        discount_code = body.get("discount_code", "").upper()
        if not discount_code:
            logger.warning(f"⚠️ No discount_code found for job_id={request_id}")

        if not cart:
            raise HTTPException(status_code=400, detail="Cart is empty")

        item = cart[0]
        item_price = item.get("price", "25")
        item_price_value = float(
            ''.join(c for c in item_price if c.isdigit() or c == '.'))
        shipping_value_value = float(
            ''.join(c for c in shipping_value if c.isdigit() or c == '.'))
        total_amount = str(round(item_price_value + shipping_value_value, 2))

        # Create PayPal order request
        order_request = OrdersCreateRequest()
        order_request.prefer("return=representation")
        order_request.request_body({
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency_code,
                        "value": total_amount,
                        "breakdown": {
                            "item_total": {
                                "currency_code": currency_code,
                                "value": str(item_price_value)
                            },
                            "shipping": {
                                "currency_code": currency_code,
                                "value": str(shipping_value_value)
                            }
                        }
                    },
                    "items": [
                        {
                            "name": item.get("name", "Storybook"),
                            "description": item.get("description", ""),
                            "unit_amount": {
                                "currency_code": currency_code,
                                "value": str(item_price_value)
                            },
                            "quantity": str(item.get("quantity", 1)),
                            "category": "PHYSICAL_GOODS"
                        }
                    ]
                }
            ]
        })

        # Execute request with PayPal SDK
        response = get_paypal_client().execute(order_request)
        print("Response: ", response)
        order_data = {
            "id": response.result.id,
            "status": response.result.status,
            "links": [
                {
                    "href": link.href,
                    "rel": link.rel,
                    "method": link.method
                }
                for link in response.result.links
            ]
        }
        print("Order Data: ", order_data)

        # Save to DB
        user_details_collection.update_one(
            {"job_id": request_id},
            {
                "$set": {
                    "order_id": order_data["id"],
                    "payment_status": "CREATED",
                    "discount_code": discount_code  
                }
            }
        )

        return JSONResponse(content=order_data)

    except Exception as e:
        logger.exception("❌ Error creating PayPal order")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/paypal/store-capture")
async def fetch_and_store_capture(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.json()
        order_id = body.get("order_id")
        job_id = body.get("job_id")

        if not order_id or not job_id:
            raise HTTPException(status_code=400, detail="Missing order_id or job_id")

        logger.info(f"🔍 Starting PayPal capture for job_id={job_id}, order_id={order_id}")

        # Step 1: Get access token
        token = await get_paypal_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Step 2: ✅ Trigger capture
        capture_url = f"{get_paypal_base_url()}/v2/checkout/orders/{order_id}/capture"
        capture_res = requests.post(capture_url, headers=headers)
        capture_res.raise_for_status()
        capture_data = capture_res.json()

        # Step 3: Extract capture details
        purchase_unit = capture_data["purchase_units"][0]
        capture = purchase_unit["payments"]["captures"][0]
        capture_id = capture["id"]

        logger.info(f"💳 Capture successful: capture_id={capture_id}")

        # Step 4: Extract shipping info
        shipping_address = purchase_unit.get("shipping", {}).get("address", {})
        shipping_name = purchase_unit.get("shipping", {}).get("name", {})

        shipping_info = {
            "name": shipping_name.get("full_name", ""),
            "address1": shipping_address.get("address_line_1", ""),
            "address2": shipping_address.get("address_line_2", ""),
            "city": shipping_address.get("admin_area_2", ""),
            "province": shipping_address.get("admin_area_1", ""),
            "zip": shipping_address.get("postal_code", ""),
            "country": shipping_address.get("country_code", ""),
            "phone": ""
        }

        # Step 5: Find user and resolve discount code
        user = user_details_collection.find_one({"job_id": job_id})
        if not user:
            logger.error(f"❌ No user found for job_id={job_id}")
            raise HTTPException(status_code=404, detail="User not found")

        discount_code = (user.get("discount_code") or "").upper()
        logger.info(f"🎟️ Using discount_code='{discount_code}' for job_id={job_id}")

        # Step 6: Generate new order_id based on discount_code
        try:
            order_patterns = {
                "TEST": {"regex": r"^TEST#(\d+)$", "prefix": "TEST#", "default": "TEST#0"},
                "COLLAB": {"regex": r"^COLLAB#(\d+)$", "prefix": "COLLAB#", "default": "COLLAB#0"},
                "DEFAULT": {"regex": r"^#(\d+)$", "prefix": "#", "default": "#1199"}
            }

            pattern_key = "DEFAULT"
            if discount_code == "TEST":
                pattern_key = "TEST"
            elif discount_code == "COLLAB":
                pattern_key = "COLLAB"

            pattern = order_patterns[pattern_key]
            logger.info(f"🔢 Generating order_id using pattern: {pattern_key}")

            pipeline = [
                {"$match": {"order_id": {"$regex": pattern["regex"]}}},
                {"$project": {
                    "order_num": {
                        "$toInt": {
                            "$arrayElemAt": [{"$split": ["$order_id", "#"]}, 1]
                        }
                    }
                }},
                {"$sort": {"order_num": -1}},
                {"$limit": 1}
            ]

            result = list(user_details_collection.aggregate(pipeline))
            highest_num = result[0]["order_num"] if result else int(pattern["default"].split("#")[1])
            new_order_id = f"{pattern['prefix']}{highest_num + 1}"

            logger.info(f"✅ Generated new_order_id: {new_order_id}")

        except Exception as e:
            logger.exception("❌ Failed to generate order ID")
            raise HTTPException(status_code=500, detail="Failed to generate order ID")

        # Step 7: Update MongoDB
        update_data = {
            "paid": True,
            "paypal_order_id": order_id,
            "paypal_capture_id": capture_id,
            "payment_status": capture.get("status"),
            "paypal_email": capture.get("payer", {}).get("email_address", ""),
            "total_price": capture.get("amount", {}).get("value"),
            "currency": capture.get("amount", {}).get("currency_code"),
            "processed_at": capture.get("create_time"),
            "updated_at": datetime.now(timezone.utc),
            "shipping_address": shipping_info,
            "order_id": new_order_id,
            "discount_code": discount_code
        }

        user_details_collection.update_one({"job_id": job_id}, {"$set": update_data})
        logger.info(f"📝 Updated MongoDB for job_id={job_id}")

        # Step 8: Send confirmation email (locked preview)
        await payment_done_email_lock(
            username=user.get("user_name", ""),
            child_name=user.get("name", ""),
            email=user.get("email", ""),
            preview_url=user.get("preview_url", ""),
            order_id=new_order_id,
            total_price=float(update_data["total_price"]),
            currency_code=update_data["currency"],
            discount_code=discount_code,
            payment_id=capture_id,
            shipping_info=shipping_info,
            discount_amount=float(user.get("discount_amount", 0) or 0),
            shipping_price=float(user.get("shipping_price", 0) or 0),
            taxes=float(user.get("taxes", 0) or 0),
            actual_price=float(user.get("actual_price", 0) or 0)
        )

        logger.info(f"📨 Sent payment_done_email_lock for job_id={job_id}")

        # Step 9: Trigger remaining workflows
        background_tasks.add_task(run_remaining_workflows_async, job_id, start_from_pg=10)
        logger.info(f"🚀 Background task triggered for job_id={job_id} starting from page 10")

        return {
            "status": "success",
            "capture_id": capture_id,
            "order_id": new_order_id,
            "shipping_info": shipping_info
        }

    except Exception as e:
        logger.exception("❌ Error in /api/paypal/store-capture")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-preview-url")
async def update_preview_url(
    job_id: str = Body(...),
    preview_url: str = Body(...),
    preview_country: Optional[str] = Body(default=None)
):
    if not preview_url or not preview_url.strip().lower().startswith("http"):
        print(f"⛔️ Invalid preview_url for job_id={job_id}: {preview_url}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or empty preview URL"
        )

    existing_job = user_details_collection.find_one({"job_id": job_id})
    if not existing_job:
        print("⚠️ No matching job_id found in DB")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job ID not found"
        )

    update_fields = {"preview_url": preview_url.strip()}

    if (not existing_job.get("preview_country")) and preview_country:
        update_fields["preview_country"] = preview_country

    result = user_details_collection.update_one(
        {"job_id": job_id},
        {"$set": update_fields}
    )

    return {"message": "Preview URL updated successfully"}

@app.get("/get-job-status/{job_id}")
async def get_job_status(job_id: str):
    try:
        user_details = user_details_collection.find_one(
            {"job_id": job_id},
            {
                "_id": 0,
                "paid": 1,
                "approved": 1,
                "preview_url": 1,
                "email": 1,
                "user_name": 1,
                "name": 1,
                "book_style": 1,
                "workflow_status": 1,
                "locale": 1,
            }
        )
        if not user_details:
            raise HTTPException(status_code=404, detail="Job ID not found.")
        return user_details
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve job status: {str(e)}")

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

@app.post("/update-book-style")
async def update_book_style(payload: BookStylePayload):
    try:
        job_id = payload.job_id
        book_style = payload.book_style

        if book_style not in ["hardcover", "paperback"]:
            raise HTTPException(status_code=400, detail="Invalid book style")

        result = user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"book_style": book_style}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Job ID not found")

        return {"status": "success", "book_style": book_style}

    except Exception as e:
        print("❌ Failed to update book style:", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to update book style")

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
def copy_interiors_for_print(job_id: str, selected: list[int]) -> str:
    logger.info("🔧 Copying selected interior PNGs...")

    source_dir = os.path.join("output", job_id, "interior")
    approved_dir = os.path.join(
        "output", job_id, "approved_output", "interior_approved")
    os.makedirs(approved_dir, exist_ok=True)

    interior_selected = selected[1:]

    for i, variant_index in enumerate(interior_selected):
        page_num = i + 1
        variant_num = variant_index + 1

        # 👇 pattern to match loosely: may or may not have underscores
        pattern = os.path.join(
            source_dir, f"*{job_id}*_{str(page_num).zfill(2)}_{str(variant_num).zfill(5)}*.png"
        )
        matches = glob.glob(pattern)

        if matches:
            src_path = matches[0]  # take first match
            dst_path = os.path.join(approved_dir, os.path.basename(src_path))
            shutil.copy(src_path, dst_path)
            logger.info(
                f"✅ Copied page {page_num} variant {variant_num} to interior_approved")
        else:
            logger.warning(
                f"⚠️ Interior image not found using pattern: {pattern}")

    return approved_dir

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
            base_filename = f"{job_id}_{workflow_id_str}_{timestamp}_{image_index:03d}"
            jpg_filename = f"{base_filename}.jpg"
            png_renamed_filename = f"{base_filename}.png"
            jpg_path = os.path.join(JPG_OUTPUT, jpg_filename)

            try:
                # Save PNG locally using original comfy filename (only once)
                folder_type = "exterior" if page_number == 0 else "interior"
                local_dir = os.path.join(OUTPUT_FOLDER, job_id, folder_type)
                os.makedirs(local_dir, exist_ok=True)
                

                original_png_name = os.path.basename(image['filename'])
                local_png_path = os.path.join(local_dir, original_png_name)
                
                
                with open(local_png_path, "wb") as f:
                    f.write(image_data)
                logger.info(f"🖼️ Saved PNG locally: {local_png_path}")
                

                # Convert PNG to JPG
                # Convert PNG to JPG
                convert_png_to_jpg(image_data, jpg_path, WATERMARK_PATH)
                logger.info(f"🖼️ Saved JPG to: {jpg_path}")
                
            except Exception as e:
                logger.error(f"❌ Conversion failed: {e}")
                continue

            if not os.path.exists(jpg_path):
                logger.error(f"❌ JPG missing: {jpg_path}")
                continue

            # Upload JPG to diffrungenerations
            # Upload JPG to diffrungenerations
            try:
                s3_key = f"{S3_JPG_PREFIX}/{jpg_filename}"
                s3.upload_file(jpg_path, S3_DIFFRUN_GENERATIONS, s3_key)
                logger.info(f"📤 Uploaded JPG to diffrungenerations: s3://{S3_DIFFRUN_GENERATIONS}/{s3_key}")
                
            except Exception as e:
                logger.error(f"❌ Failed to upload JPG: {e}")
                
                continue

            # Upload renamed PNG to replicacomfy (no redundant local save)
            try:
                replicacomfy_key = f"output/{job_id}/{folder_type}/{png_renamed_filename}"
                s3.upload_file(local_png_path, "replicacomfy", replicacomfy_key)
                logger.info(f"📤 Uploaded PNG to replicacomfy: s3://replicacomfy/{replicacomfy_key}")
            except Exception as e:
                logger.error(f"❌ Failed to upload PNG to replicacomfy: {e}")

        
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
    logger.info(f"📸 Done saving and uploading {image_index - 1} image(s) for workflow {workflow_id_str}")
    return output_images

@app.post("/store-user-details")
async def store_user_details(
    name: str = Form(...),
    email: str = Form(...),  # New email field
    gender: str = Form(...),
    book_id: str = Form(...),
    images: List[UploadFile] = File(...)
):
    # Input validation and sanitization
    name = name.strip()
    first_name = name.split()[0].capitalize() if name else "User"
    email = email.strip().lower()  # Normalize email
    
    # Validate email format
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        logger.warning("❌ Invalid email format: %s", email)
        raise HTTPException(
            status_code=400, 
            detail="Please provide a valid email address"
        )

    logger.info("📥 Received user details: name=%s, email=%s, gender=%s", name, email, gender)
    logger.debug("📦 Number of uploaded files: %d", len(images))

    if not (1 <= len(images) <= 3):
        logger.warning("❌ Invalid number of images: %d", len(images))
        raise HTTPException(
            status_code=400, 
            detail="You must upload between 1 and 3 images."
        )

    job_id = str(uuid.uuid4())
    logger.info("🆕 Generated job_id: %s", job_id)

    saved_filenames = []

    # Process images (unchanged from your original code)
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
                status_code=500, 
                detail="Failed to save debug file"
            )

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
                status_code=400, 
                detail=f"Invalid image file: {str(e)}"
            )
        
        try:
            s3_key = f"input_images/{job_id}/{new_filename}"

            with open(image_path, "rb") as f:
                s3.upload_fileobj(
                    f,
                    S3_DIFFRUN_GENERATIONS,
                    s3_key,
                    ExtraArgs={"ContentType": "image/jpeg"}
                )
                logger.info("☁️ Uploaded image to S3: %s/%s", S3_DIFFRUN_GENERATIONS, s3_key)
        except (BotoCoreError, ClientError) as e:
            logger.error("❌ Failed to upload image to S3: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Failed to upload image to S3")

        try:
            replicacomfy_key = f"input/{new_filename}"
            with open(image_path, "rb") as f:
                s3.upload_fileobj(
                    f,
                    REPLICACOMFY_BUCKET,
                    replicacomfy_key,   
                    ExtraArgs={"ContentType": "image/jpeg"}
                )
                logger.info("📤 Also uploaded to replicacomfy: %s", replicacomfy_key)
        except (BotoCoreError, ClientError) as e:
            logger.error("❌ Failed to upload image to replicacomfy: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Failed to upload image to replicacomfy S3 bucket.")        
        try:
            s3_key = f"input_images/{job_id}/{new_filename}"

            with open(image_path, "rb") as f:
                s3.upload_fileobj(
                    f,
                    S3_DIFFRUN_GENERATIONS,
                    s3_key,
                    ExtraArgs={"ContentType": "image/jpeg"}
                )
                logger.info("☁️ Uploaded image to S3: %s/%s", S3_DIFFRUN_GENERATIONS, s3_key)
        except (BotoCoreError, ClientError) as e:
            logger.error("❌ Failed to upload image to S3: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Failed to upload image to S3")

        try:
            replicacomfy_key = f"input/{new_filename}"
            with open(image_path, "rb") as f:
                s3.upload_fileobj(
                    f,
                    REPLICACOMFY_BUCKET,
                    replicacomfy_key,   
                    ExtraArgs={"ContentType": "image/jpeg"}
                )
                logger.info("📤 Also uploaded to replicacomfy: %s", replicacomfy_key)
        except (BotoCoreError, ClientError) as e:
            logger.error("❌ Failed to upload image to replicacomfy: %s", str(e))
            raise HTTPException(
                status_code=500, detail="Failed to upload image to replicacomfy S3 bucket.")        


        saved_filenames.append(new_filename)

    logger.info("🎉 Successfully processed %d image(s)", len(saved_filenames))
    logger.debug("📝 Saved filenames: %s", saved_filenames)

    # Prepare response with email included
    response = {
        "job_id": job_id,
        "saved_files": saved_filenames,
        "gender": gender.lower(),
        "name": first_name,
        "email": email, 
        "preview_url": "",
        "book_id": book_id,
        "paid": False,
        "approved": False,
        "created_at": datetime.now(timezone.utc), 
        "updated_at": datetime.now(timezone.utc)
    }

    try:
        save_user_details(response)
    except Exception as e:
        logger.error("❌ Could not save user details to MongoDB: %s", str(e))
        raise HTTPException(
            status_code=500, 
            detail="Failed to save user details to database."
        )

    logger.info("🚀 Returning response: %s", {**response, "email": "[REDACTED]"})
    return response

def get_sorted_workflow_files(book_id: str, gender: str) -> List[tuple[int, str]]:
    base_dir = os.path.join(
        STORIES_FOLDER,
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
            logger.debug(
                f"✅ Valid page directory found: {entry} (page {page_num})")
            page_dirs.append((page_num, entry))
        else:
            logger.debug(
                f"⏭️ Ignoring non-pgX or non-directory entry: {entry}")

    sorted_pages = sorted(page_dirs, key=lambda x: x[0])
    logger.info(
        f"🔢 Sorted page folders: {[f'pg{num}' for num, _ in sorted_pages]}")

    workflow_files = []
    for page_num, folder_name in sorted_pages:
        padded_page = f"{page_num:02d}"
        expected_file = f"{padded_page}_{book_id}_{gender}.json"
        workflow_path = os.path.abspath(
            os.path.join(base_dir, folder_name, expected_file))

        if os.path.exists(workflow_path):
            logger.info(f"📄 Workflow file found: {workflow_path}")
            workflow_files.append((page_num, expected_file))
        else:
            logger.warning(f"⚠️ Workflow file missing: {workflow_path}")

    logger.info(f"✅ Total valid workflows detected: {len(workflow_files)}")
    return workflow_files

def extract_sorted_candidates_by_pg(keys, pg_label):
    """
    Helper to extract all keys for a given page number,
    sort them by the timestamp embedded in the filename.
    """
    def extract_timestamp(key):
        parts = key.split("_")
        try:
            return int(parts[2])  # timestamp
        except (IndexError, ValueError):
            return 0

    filtered = [k for k in keys if f"_pg{pg_label}_" in k]
    sorted_keys = sorted(filtered, key=extract_timestamp)
    return sorted_keys


@app.post("/approve")
async def approve_for_printing(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    selectedSlides: str = Form(...)
):
    logger.info(f"🧪 Approve for printing triggered for job_id={job_id}")
    background_tasks.add_task(
        process_approval_workflow, job_id, selectedSlides)

    return {
        "status": "processing_started",
        "message": "Approval started. Backend is finalizing the book in background."
    }

def process_approval_workflow(job_id: str, selectedSlides: str):
    try:
        selected = json.loads(selectedSlides)
        logger.info(f"🧪 Selected slides: {selected}")
        interior_selected = selected[1:]

        
        # Create approved_output directory locally
        approved_dir = Path(OUTPUT_FOLDER) / job_id / "approved_output" / "interior_approved"
        approved_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Created approved_output folder: {approved_dir}")

        for i, variant_index in enumerate(interior_selected):
            pg_label = str(i + 1)
            local_path = None

            s3_prefix = f"output/{job_id}/interior/"
            result = s3.list_objects_v2(Bucket="replicacomfy", Prefix=s3_prefix)

            if "Contents" not in result:
                logger.warning(f"⚠️ No contents under {s3_prefix} in S3 bucket")
                continue

            all_keys = [obj["Key"] for obj in result["Contents"]]
            sorted_pg_keys = extract_sorted_candidates_by_pg(all_keys, pg_label)

            try:
                selected_key = sorted_pg_keys[variant_index]
                # Calculate the renamed format
                page_str = str(i + 1).zfill(2)
                variant_str = str(variant_index + 1).zfill(5)
                renamed_filename = f"_{job_id}_{page_str}_{variant_str}_.png"
                local_path = approved_dir / renamed_filename

                s3.download_file("replicacomfy", selected_key, str(local_path))
                logger.info(f"✅ Downloaded: {selected_key} → {local_path}")

                approved_s3_key = f"output/{job_id}/approved_output/interior_approved/{renamed_filename}"
                s3.upload_file(str(local_path), "replicacomfy", approved_s3_key)
                logger.info(f"📤 Uploaded to S3: {approved_s3_key}")

            except IndexError:
                logger.warning(f"❌ No match for pg{pg_label} variant {variant_index} (only {len(sorted_pg_keys)} found)")
            pg_label = str(i + 1)
            local_path = None

            s3_prefix = f"output/{job_id}/interior/"
            result = s3.list_objects_v2(Bucket="replicacomfy", Prefix=s3_prefix)

            if "Contents" not in result:
                logger.warning(f"⚠️ No contents under {s3_prefix} in S3 bucket")
                continue

            all_keys = [obj["Key"] for obj in result["Contents"]]
            sorted_pg_keys = extract_sorted_candidates_by_pg(all_keys, pg_label)

            try:
                selected_key = sorted_pg_keys[variant_index]
                # Calculate the renamed format
                page_str = str(i + 1).zfill(2)
                variant_str = str(variant_index + 1).zfill(5)
                renamed_filename = f"_{job_id}_{page_str}_{variant_str}_.png"
                local_path = approved_dir / renamed_filename

                s3.download_file("replicacomfy", selected_key, str(local_path))
                logger.info(f"✅ Downloaded: {selected_key} → {local_path}")

                approved_s3_key = f"output/{job_id}/approved_output/interior_approved/{renamed_filename}"
                s3.upload_file(str(local_path), "replicacomfy", approved_s3_key)
                logger.info(f"📤 Uploaded to S3: {approved_s3_key}")

            except IndexError:
                logger.warning(f"❌ No match for pg{pg_label} variant {variant_index} (only {len(sorted_pg_keys)} found)")

        
        # --- DB fetch ---
        user = user_details_collection.find_one({"job_id": job_id})
        if not user:
            raise Exception("User record not found for PDF step")

       
        # --- Interior PDF ---
        interior_pdf_path = str(approved_dir / f"{job_id}_interior.pdf")
        create_interior_pdf(
            source_folder=str(approved_dir),
            output_pdf=interior_pdf_path,
            selectedSlides=interior_selected,
            job_id=job_id
        )

        pdf_filename = f"{job_id}_interior.pdf"
        s3_key = f"{job_id}/{pdf_filename}"
        s3.upload_file(interior_pdf_path, "storyprints", s3_key)
        logger.info(f"📤 Uploaded interior PDF to s3://storyprints/{s3_key}")
        interior_url = f"https://storyprints.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{s3_key}"

        
        # --- Cover Page Upload from S3 ---
        exterior_index = selected[0]  # 0 for first image, 1 for second, etc.
        book_id = user.get("book_id")
        book_style = user.get("book_style")

        s3_exterior_prefix = f"output/{job_id}/exterior/"
        s3_exterior_result = s3.list_objects_v2(Bucket="replicacomfy", Prefix=s3_exterior_prefix)

        if "Contents" not in s3_exterior_result:
            raise Exception(f"No exterior images found for job_id={job_id} in S3")

        # Extract all keys matching the pattern and extract timestamps
        timestamped_keys = []
        pattern = re.compile(rf"{re.escape(job_id)}_pg0_(\d+)_001\.png$")

        for obj in s3_exterior_result["Contents"]:
            key = obj["Key"]
            match = pattern.search(key)
            if match:
                timestamp = int(match.group(1))
                timestamped_keys.append((timestamp, key))

        # Sort by timestamp
        timestamped_keys.sort(key=lambda x: x[0])

        # Select the desired variant by index
        try:
            _, matched_exterior_key = timestamped_keys[exterior_index]
        except IndexError:
            raise Exception(f"❌ Only {len(timestamped_keys)} exterior images found; no match for index {exterior_index}")

        # Download from S3 to local cover_inputs/
        cover_input_dir = Path(INPUT_FOLDER) / "cover_inputs" / job_id
        cover_input_dir.mkdir(parents=True, exist_ok=True)
        cover_input_filename = Path(matched_exterior_key).name
        cover_dest = cover_input_dir / cover_input_filename

        s3.download_file("replicacomfy", matched_exterior_key, str(cover_dest))
        logger.info(f"✅ Downloaded exterior image from S3: {matched_exterior_key} → {cover_dest}")


        # --- Kick off cover workflow ---
        run_coverpage_workflow_in_background(
            job_id=job_id,
            book_id=book_id,
            book_style=book_style,
            cover_input_filename=cover_input_filename
        )
        # --- DB update ---
        approved_at = datetime.now(timezone.utc)
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "approved": True,
                "approved_at": approved_at,
                "book_url": interior_url,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"✅ Marked job_id={job_id} as approved")

    
        # --- Email ---
        try:
            username = user.get("user_name") or user.get("name", "").capitalize()
            child_name = user.get("name", "").capitalize()
            email = user.get("email") or user.get("shopify_email")

            if username and child_name and email:
                approval_confirmation_email(
                    username=username, child_name=child_name, email=email)
                logger.info(f"📧 Email sent to {email}")
                
            else:
                logger.warning("⚠️ Missing user data for email")
                
        except Exception as e:
            logger.error(f"❌ Email error: {e}")
            

    except Exception as e:
        logger.exception("❌ Approval background task failed")

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
    book_id: str,
    workflow_filename: str
):
    name = name.capitalize()
    try:
        logger.info(
            f"🚀 Running workflow {workflow_filename} for job_id={job_id}")

        gender_folder = gender.lower()

        # 🔢 Extract pg number from filename like 'pg1.json' or '1.json'
        match = re.match(r'^(?:pg)?(\d+)', workflow_filename)
        if not match:
            raise HTTPException(
                status_code=400, detail="Invalid workflow filename format")

        page_num = int(match.group(1))
        is_preview_workflow = page_num < 10
        expected_filename = f"{page_num:02d}_{book_id}_{gender}.json"

        workflow_path = os.path.join(
            INPUT_FOLDER, "stories", book_id, gender_folder, f"pg{page_num}", expected_filename
        )

        if not os.path.exists(workflow_path):
            logger.error(f"❌ Workflow file not found: {workflow_path}")
            raise HTTPException(
                status_code=404, detail=f"Workflow not found: {workflow_filename}")

        # 🧠 Load and parse workflow
        workflow_data = load_workflow(workflow_path)
        if isinstance(workflow_data, list):
            workflow_data = workflow_data[0] if workflow_data else {}

        allowed_values = workflow_data["4"].get(
            "inputs", {}).get("instantid_file", [])
        logger.info(f"📋 Allowed instantid_file values: {allowed_values}")
        print(IP_ADAPTER, "IP_ADApTER", PYTORCH_MODEL, "pytorchmodel")

        if "4" in workflow_data and "inputs" in workflow_data["4"]:
            instantid_file_path = IP_ADAPTER
            print(IP_ADAPTER, "IP_ADAPTER",
                  instantid_file_path, "instantid_file_path")
            workflow_data["4"]["inputs"]["instantid_file"] = instantid_file_path
            logger.info(
                f"🧠 Injected instantid_file into node 4: {instantid_file_path}")

        if "6" in workflow_data and "inputs" in workflow_data["4"]:
            control_net_file_path = PYTORCH_MODEL
            workflow_data["6"]["inputs"]["control_net_name"] = control_net_file_path
            logger.info(
                f"🧠 Injected control_net_name into node 6: {control_net_file_path}")

        # 🖼️ Inject images into nodes 12, 13, 14
        for i, node_id in enumerate(["12", "13", "14"][:len(saved_filenames)]):
            if node_id in workflow_data and "inputs" in workflow_data[node_id]:
                workflow_data[node_id]["inputs"]["image"] = os.path.join(
                    INPUT_FOLDER, saved_filenames[i])
                logger.info(f"🖼️ Injected image into node {node_id}")

        # ✍️ Inject name into node 46
        if "46" in workflow_data and "inputs" in workflow_data["46"]:
            workflow_data["46"]["inputs"]["value"] = name
            logger.info("📝 Injected name into node 46")

        # 🆔 Inject job_id into string node
        known_job_id = "e44054af-f0ce-4413-8b37-853e1cc680aa"
        job_id_node = find_job_id_node(workflow_data, known_job_id)
        if job_id_node and "inputs" in workflow_data[job_id_node]:
            workflow_data[job_id_node]["inputs"]["strings"] = job_id
            logger.info(f"🆔 Replaced job_id in node {job_id_node}")
        else:
            logger.warning("⚠️ Could not update job_id — node not found")

        # 🎲 Inject random seed into node 1
        if "1" in workflow_data and "inputs" in workflow_data["1"]:
            workflow_data["1"]["inputs"]["seed"] = generate_random_seed()
            logger.info("🎲 Injected random seed into node 1")

        # 📡 Run via WebSocket
        client_id = f"{job_id}_workflow_{workflow_filename.replace('.json', '')}"
        ws = websocket.WebSocket()
        try:
            ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={client_id}")
            get_images(ws, workflow_data, job_id,
                       workflow_filename.replace(".json", ""), client_id)
        finally:
            ws.close()

        # ✅ Mark as completed in DB
        workflow_key = f"workflow_pg{page_num}"
        update_result = user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "completed"}}
        )
        
        logger.info(f"✅ Updated workflow status for {workflow_key} in DB")
        
        # Get the current state of all workflows
        user = user_details_collection.find_one({"job_id": job_id})
        if not user:
            logger.error(f"❌ User record not found for job_id={job_id}")
            return

        workflows = user.get("workflows", {})
        logger.info(f"📊 Current workflows status: {workflows}")

        # Check if all first 10 workflows are completed AND email hasn't been sent yet
        all_completed = True
        for i in range(10):  # Check pg0 to pg9
            workflow_key = f"workflow_pg{i}"
            if workflows.get(workflow_key, {}).get("status") != "completed":
                all_completed = False
                logger.info(f"⏳ Workflow {workflow_key} not completed yet")
                break

        if all_completed and not user.get("preview_email_sent", False):
            logger.info("🎉 All 10 workflows completed and email not sent yet!")
            
            preview_url = user.get("preview_url", "")
            email = user.get("email")
            
            if not email:
                logger.error("❌ No email found in user record")
                return
                
            if not preview_url:
                logger.error("❌ No preview_url found in user record")
                return
                
            try:
                logger.info(f"📧 Preparing to send preview email to {email}")
                preview_email_lock(
                    name=user.get("name", ""),
                    email=email,
                    preview_url=preview_url
                )
                logger.info("✅ Preview email sent successfully")
                
                # Mark that email was sent to prevent duplicates
                user_details_collection.update_one(
                    {"job_id": job_id},
                    {"$set": {"preview_email_sent": True}}
                )
                
            except Exception as e:
                logger.error(f"❌ Failed to send preview email: {str(e)}")
                raise
                
        elif all_completed and user.get("preview_email_sent", False):
            logger.info("ℹ️ All workflows completed but email already sent")
        else:
            logger.info("🔄 Not all workflows completed yet")
            
    except Exception as e:
        logger.exception(f"🔥 Workflow {workflow_filename} failed for job_id={job_id}: {e}")
        workflow_key = f"workflow_{workflow_filename.replace('.json', '')}"
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "failed"}}
        )
        raise HTTPException(
            status_code=500, detail=f"Workflow {workflow_filename} failed: {str(e)}")

def run_workflow_in_background_lock(
    job_id: str,
    name: str,
    gender: str,
    saved_filenames: List[str],
    book_id: str,
    workflow_filename: str
):
    name = name.capitalize()
    try:
        logger.info(
            f"🚀 Running workflow {workflow_filename} for job_id={job_id}")

        gender_folder = gender.lower()

        # 🔢 Extract pg number from filename like 'pg1.json' or '1.json'
        match = re.match(r'^(?:pg)?(\d+)', workflow_filename)
        if not match:
            raise HTTPException(
                status_code=400, detail="Invalid workflow filename format")

        page_num = int(match.group(1))
        is_preview_workflow = page_num < 10 
        expected_filename = f"{page_num:02d}_{book_id}_{gender}.json"

        workflow_path = os.path.join(
            INPUT_FOLDER, "stories", book_id, gender_folder, f"pg{page_num}", expected_filename
        )

        if not os.path.exists(workflow_path):
            logger.error(f"❌ Workflow file not found: {workflow_path}")
            raise HTTPException(
                status_code=404, detail=f"Workflow not found: {workflow_filename}")

        # 🧠 Load and parse workflow
        workflow_data = load_workflow(workflow_path)
        if isinstance(workflow_data, list):
            workflow_data = workflow_data[0] if workflow_data else {}

        allowed_values = workflow_data["4"].get(
            "inputs", {}).get("instantid_file", [])
        logger.info(f"📋 Allowed instantid_file values: {allowed_values}")
        print(IP_ADAPTER, "IP_ADApTER", PYTORCH_MODEL, "pytorchmodel")

        if "4" in workflow_data and "inputs" in workflow_data["4"]:
            instantid_file_path = IP_ADAPTER
            print(IP_ADAPTER, "IP_ADAPTER",
                  instantid_file_path, "instantid_file_path")
            workflow_data["4"]["inputs"]["instantid_file"] = instantid_file_path
            logger.info(
                f"🧠 Injected instantid_file into node 4: {instantid_file_path}")

        if "6" in workflow_data and "inputs" in workflow_data["4"]:
            control_net_file_path = PYTORCH_MODEL
            workflow_data["6"]["inputs"]["control_net_name"] = control_net_file_path
            logger.info(
                f"🧠 Injected control_net_name into node 6: {control_net_file_path}")

        # 🖼️ Inject images into nodes 12, 13, 14
        for i, node_id in enumerate(["12", "13", "14"][:len(saved_filenames)]):
            if node_id in workflow_data and "inputs" in workflow_data[node_id]:
                workflow_data[node_id]["inputs"]["image"] = os.path.join(
                    INPUT_FOLDER, saved_filenames[i])
                logger.info(f"🖼️ Injected image into node {node_id}")

        # ✍️ Inject name into node 46
        if "46" in workflow_data and "inputs" in workflow_data["46"]:
            workflow_data["46"]["inputs"]["value"] = name
            logger.info("📝 Injected name into node 46")

        # 🆔 Inject job_id into string node
        known_job_id = "e44054af-f0ce-4413-8b37-853e1cc680aa"
        job_id_node = find_job_id_node(workflow_data, known_job_id)
        if job_id_node and "inputs" in workflow_data[job_id_node]:
            workflow_data[job_id_node]["inputs"]["strings"] = job_id
            logger.info(f"🆔 Replaced job_id in node {job_id_node}")
        else:
            logger.warning("⚠️ Could not update job_id — node not found")

        # 🎲 Inject random seed into node 1
        if "1" in workflow_data and "inputs" in workflow_data["1"]:
            workflow_data["1"]["inputs"]["seed"] = generate_random_seed()
            logger.info("🎲 Injected random seed into node 1")

        # 📡 Run via WebSocket
        client_id = f"{job_id}_workflow_{workflow_filename.replace('.json', '')}"
        ws = websocket.WebSocket()
        try:
            ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={client_id}")
            get_images(ws, workflow_data, job_id,
                       workflow_filename.replace(".json", ""), client_id)
        finally:
            ws.close()

       # ✅ Mark as completed in DB
        workflow_key = f"workflow_pg{page_num}"
        update_result = user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "completed"}}
        )
        
        logger.info(f"✅ Updated workflow status for {workflow_key} in DB")
        
        # Only check for preview completion if this is a preview workflow
        if is_preview_workflow:
            # Get the current state of all workflows
            user = user_details_collection.find_one({"job_id": job_id})
            if not user:
                logger.error(f"❌ User record not found for job_id={job_id}")
                return

            workflows = user.get("workflows", {})
            logger.info(f"📊 Current workflows status: {workflows}")

            # Check if all first 10 workflows are completed AND email hasn't been sent
            all_preview_completed = True
            for i in range(10):  # Check pg0 to pg9
                workflow_key = f"workflow_pg{i}"
                if workflows.get(workflow_key, {}).get("status") != "completed":
                    all_preview_completed = False
                    logger.info(f"⏳ Workflow {workflow_key} not completed yet")
                    break

            if all_preview_completed and not user.get("preview_email_sent", False):
                logger.info("🎉 All 10 preview workflows completed!")
                
                preview_url = user.get("preview_url", "")
                email = user.get("email")
                
                if not email:
                    logger.error("❌ No email found in user record")
                    return
                    
                if not preview_url:
                    logger.error("❌ No preview_url found in user record")
                    return
                    
                try:
                    logger.info(f"📧 Preparing to send preview email to {email}")
                    preview_email_lock(
                        name=user.get("name", ""),
                        email=email,
                        preview_url=preview_url
                    )
                    logger.info("✅ Preview email sent successfully")
                    
                    # Mark that email was sent to prevent duplicates
                    user_details_collection.update_one(
                        {"job_id": job_id},
                        {
                            "$set": {
                                "preview_email_sent": True,
                                "preview_email_sent_at": datetime.utcnow()
                            }
                        }
                    )
                    
                except Exception as e:
                    logger.error(f"❌ Failed to send preview email: {str(e)}")
                    raise
            elif all_preview_completed:
                logger.info("ℹ️ All preview workflows completed but email already sent")
            else:
                logger.info("🔄 Not all preview workflows completed yet")
        else:
            logger.info(f"ℹ️ Workflow pg{page_num} completed (not a preview workflow)")
            
    except Exception as e:
        logger.exception(f"🔥 Workflow {workflow_filename} failed for job_id={job_id}: {e}")
        workflow_key = f"workflow_{workflow_filename.replace('.json', '')}"
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.{workflow_key}.status": "failed"}}
        )
        raise HTTPException(
            status_code=500, detail=f"Workflow {workflow_filename} failed: {str(e)}")

@app.get("/get-country")
def get_country(request: Request):
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    client_ip = client_ip.split(",")[0].strip()
    print(f"Client IP: {client_ip}")

    try:
        response = requests.get(
            f"https://ipinfo.io/{client_ip}/json?token={GEO}")
        response.raise_for_status()
        data = response.json()
        locale = data.get("country")
        print(f"Geo detection result: {locale}")
    except Exception as e:
        print(f"Geo detection failed: {e}")
        locale = ""

    return {"locale": locale}

@app.post("/update-country")
async def update_country(data: dict):
    job_id = data.get("job_id")
    locale = data.get("locale", "").upper()

    if locale == "UK":
        locale = "GB"

    job = user_details_collection.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.get("locale") or job["locale"] == "":
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"locale": locale}}
        )
        print(f"✅ Saved locale={locale} for job_id={job_id}")
    else:
        print(f"ℹ️ Locale already set ({job['locale']}), not updating.")

    return {"status": "ok"}

def execute_remaining_workflows(job_id: str, start_from_pg: int = 10):
    user = user_details_collection.find_one({"job_id": job_id})
    if not user:
        logger.error(f"❌ Job not found: {job_id}")
        return

    name = user.get("name", "Friend")
    gender = user.get("gender", "female")
    book_id = user.get("book_id", "storybook")
    saved_filenames = user.get("saved_filenames", [])

    if not saved_filenames:
        # 🧠 Fall back to checking input folder directly
        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]
        if not saved_filenames:
            logger.error(f"❌ No input images found for job_id: {job_id}")
            return

    total = user.get("total_workflows", 20)

    for page_index in range(start_from_pg, total):
        workflow_filename = f"{page_index:02d}_{book_id}_{gender}.json"
        logger.info(f"⚙️ Starting pg{page_index} -> {workflow_filename}")

        try:
            run_workflow_in_background_lock(
                job_id, name, gender, saved_filenames, book_id, workflow_filename
            )
        except Exception as e:
            logger.exception(f"❌ Failed to start workflow {workflow_filename}: {e}")

async def run_remaining_workflows_async(job_id: str, start_from_pg: int = 10):
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            executor,
            execute_remaining_workflows,
            job_id,
            start_from_pg 
        )
        logger.info(f"✅ Background processing completed for {job_id}")
    except Exception as e:
        logger.error(f"❌ Background processing failed for {job_id}: {e}")

@app.post("/execute-workflow")
async def execute_workflow(
    job_id: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    force: str = Form("false"),
    book_id: str = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    logger.info("📩 Received request to execute workflow: job_id=%s", job_id)

    name = name.strip().lower().capitalize()
    gender = gender.lower()
    force_flag = force.lower() == "true"
    book_id = (book_id or "story1").lower()

    try:
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            logger.info(
                "👤 No user record found for job_id=%s. Creating new entry.", job_id)
            user_details_collection.insert_one({
                "job_id": job_id,
                "name": name,
                "gender": gender,
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
            raise HTTPException(
                status_code=400, detail="Uploaded images not found.")

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"workflows": {}}}
        )

        workflow_files = get_sorted_workflow_files(book_id, gender)

        if not workflow_files:
            raise HTTPException(
                status_code=404, detail="No valid story workflow files found.")

        for page_num, file_name in workflow_files:
            workflow_key = f"workflow_pg{page_num}"
            user_details_collection.update_one(
                {"job_id": job_id},
                {"$set": {f"workflows.{workflow_key}.status": "processing"}}
            )

            background_tasks.add_task(
                run_workflow_in_background,
                job_id, name, gender, saved_filenames,
                 book_id, file_name
            )

        return {
            "status": "processing",
            "job_id": job_id,
            "workflows_started": [f"pg{page}" for page, _ in workflow_files]
        }

    except Exception as e:
        logger.exception("❌ Error during workflow execution")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/execute-workflow-lock")
async def execute_workflow_lock(
    job_id: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    force: str = Form("false"),
    book_id: str = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    logger.info("📩 [EXECUTE] Request received for job_id=%s", job_id)

    name = name.strip().split()[0].capitalize()
    gender = gender.lower()
    force_flag = force.lower() == "true"
    book_id = (book_id or "story1").lower()

    try:
        # Step 1: Ensure user record exists
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            logger.info("👤 No user found for job_id=%s. Creating entry.", job_id)
            user_details_collection.insert_one({
                "job_id": job_id,
                "name": name,
                "gender": gender,
                "book_id": book_id,
                "preview_url": "",
                "user_name": None,
                "phone_number": None,
                "email": None,
                "paid": False,
                "approved": False,
                "print_approval": False,
                "workflows": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

        # Step 2: Validate uploaded input images
        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]

        if not (1 <= len(saved_filenames) <= 3):
            logger.warning(f"⚠️ No input images found locally for job_id={job_id}. Trying S3 fallback...")

            for i in range(1, 4):
                s3_key = f"input/{job_id}_{i:02d}.jpg"
                local_path = os.path.join(INPUT_FOLDER, f"{job_id}_{i:02d}.jpg")

                try:
                    logger.info(f"⬇️ Downloading {s3_key} to {local_path}")
                    s3.download_file("replicacomfy", s3_key, local_path)
                    logger.info(f"✅ Downloaded {s3_key}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not download {s3_key}: {e}")

            saved_filenames =[
                file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
            ]

        if not (1 <= len(saved_filenames) <= 3):
            logger.error(f"❌ Uploaded images not found locally or on S3 for job_id={job_id}")
            raise HTTPException(
                status_code=404, detail="Uploaded images not found."
            )

        # Step 3: Reset workflows before starting
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"workflows": {}}}
        )

        # Step 4: Load and sort story workflows (pgX)
        all_workflows = get_sorted_workflow_files(book_id, gender)
        total_workflows = len(all_workflows)
        workflows_to_run = all_workflows[:10]

        if not workflows_to_run:
            logger.error("❌ No valid story workflow files found in pg0–pg9.")
            raise HTTPException(
                status_code=404, detail="No valid story workflow files found.")

        # Step 5: Save total_workflows to DB for frontend lock logic
        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {
                "total_workflows": total_workflows,
            }}
        )

        logger.info("🔢 Found %d total workflows, executing first 10...", total_workflows)

        # Step 6: Launch each workflow (pg0–pg9)
        for page_num, file_name in workflows_to_run:
            workflow_key = f"workflow_pg{page_num}"
            user_details_collection.update_one(
                {"job_id": job_id},
                {"$set": {f"workflows.{workflow_key}.status": "processing"}}
            )

            background_tasks.add_task(
                run_workflow_in_background_lock,
                job_id, name, gender, saved_filenames, book_id, file_name
            )
            logger.info("🚀 Launched workflow_pg%d for job_id=%s", page_num, job_id)

        return {
            "status": "processing",
            "job_id": job_id,
            "workflows_started": [f"pg{page}" for page, _ in workflows_to_run],
            "total_workflows": total_workflows
        }

    except Exception as e:
        logger.exception("❌ Error during workflow execution for job_id=%s", job_id)
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
            raise HTTPException(
                status_code=404, detail="No input images found.")

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
                job_id, name, gender, saved_filenames, book_id, workflow_filename
            ))
            thread.start()
        else:
            background_tasks.add_task(
                run_workflow_in_background,
                job_id, name, gender, saved_filenames, book_id, workflow_filename
            )

        return {"status": "regenerating", "workflow": workflow_number}

    except Exception as e:
        logger.exception("🔥 Error during workflow regeneration")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/regenerate-workflow-lock")
def regenerate_workflow_lock(
    job_id: str = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    workflow_number: str = Form(...),
    book_id: str = Form("story1"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]

        if not saved_filenames: 
        # S3 download logic
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
                region_name=os.getenv("AWS_REGION")
            )

            for i in range(1, 4):
                s3_key = f"input/{job_id}_{i:02d}.jpg"
                local_path = os.path.join(INPUT_FOLDER, f"{job_id}_{i:02d}.jpg")

                try:
                    logger.info(f"⬇️ Downloading {s3_key} to {local_path}")
                    s3_client.download_file("replicacomfy", s3_key, local_path)
                    logger.info(f"✅ Downloaded {s3_key}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not download {s3_key}: {e}")

        # Reload saved_filenames after download attempt
        saved_filenames = [
            file for file in os.listdir(INPUT_FOLDER) if file.startswith(job_id)
        ]

        if not saved_filenames:
            logger.error(f"❌ Failed to download any input images for job_id={job_id}")
            raise HTTPException(
                status_code=404, detail="No input images found locally or on S3.")
    

        user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {f"workflows.workflow_{workflow_number}.status": "processing"}}
        )

        workflow_filename = f"{workflow_number}.json"

        background_tasks.add_task(
            run_workflow_in_background_lock,
            job_id, name, gender, saved_filenames, book_id, workflow_filename
        )

        return {"status": "regenerating", "workflow": workflow_number}

    except Exception as e:
        logger.exception("🔥 Error during workflow regeneration")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/poll-images")
async def poll_images(job_id: str = Query(...)):
    # logger.info("🔍 Handling /poll-images request for job_id=%s", job_id)
    workflow_groups = {}

    try:
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            raise HTTPException(
                status_code=404, detail="User not found for job ID.")

        workflows = user_details.get("workflows", {})
        expected_keys = list(workflows.keys())
        expected_suffixes = [
            key.replace("workflow_", "")
            for key in expected_keys
            if re.match(r"^workflow_pg\d+$", key)
        ]

        # logger.debug(f"🧠 Expecting workflows: {expected_suffixes}")

        response = s3.list_objects_v2(
            Bucket=S3_DIFFRUN_GENERATIONS, Prefix=f"{S3_JPG_PREFIX}/{job_id}_")
        s3_files = response.get("Contents", [])

        for obj in s3_files:
            key = obj["Key"]
            file = os.path.basename(key)

            if (
                not file.startswith(job_id)
                or not file.lower().endswith(".jpg")
                or "collage" in file.lower()
            ):
                continue

            match = re.match(
                rf"{re.escape(job_id)}_(pg\d+|\d+)_\d+_\d+\.jpg", file)
            if not match:
                # logger.debug("⚠️ Skipping unmatched filename: %s", file)
                continue

            workflow_id = match.group(1)
            if workflow_id not in expected_suffixes:
                logger.debug(
                    "🛑 Skipping non-expected workflow ID: %s", workflow_id)
                continue

            try:
                image_url = f"https://{S3_DIFFRUN_GENERATIONS}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
                workflow_groups.setdefault(workflow_id, []).append({
                    "filename": file,
                    "url": image_url
                })
            except Exception as e:
                logger.warning(
                    "❌ Could not construct image URL for file %s: %s", file, str(e))

        carousels = []
        for workflow_id in sorted(expected_suffixes, key=lambda x: int(re.sub(r"\D", "", x))):
            images = sorted(workflow_groups.get(
                workflow_id, []), key=lambda x: x["filename"])
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
                    {"$set": {"workflow_status": "completed",
                              "updated_at": datetime.now(timezone.utc)}}
                )
                logger.info(
                    "🎉 Workflow marked as COMPLETED for job_id=%s", job_id)
                                # ✅ Attempt to send preview email
                name = user_details.get("name")
                email = user_details.get("email")
                preview_url = user_details.get("preview_url")

                if name and email and preview_url:
                    try:
                        logger.info(f"📧 Triggering preview email for job_id={job_id}")
                        preview_email(name, email, preview_url)
                    except Exception as e:
                        logger.exception(f"📨 Failed to send preview email for job_id={job_id}")

        return {
            "carousels": carousels,
            "completed": completed
        }

    except Exception as e:
        logger.exception("❌ Error while polling images for job_id=%s", job_id)
        raise HTTPException(
            status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/poll-images-lock")
async def poll_images_lock(job_id: str = Query(...)):
    workflow_groups = {}

    try:
        user_details = user_details_collection.find_one({"job_id": job_id})
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found for job ID.")

        total = user_details.get("total_workflows", 20)
        expected_suffixes = [f"pg{i}" for i in range(total)]
        logger.debug(f"🧠 Expecting workflows: {expected_suffixes}")

        response = s3.list_objects_v2(
            Bucket=S3_DIFFRUN_GENERATIONS,
            Prefix=f"{S3_JPG_PREFIX}/{job_id}_"
        )
        s3_files = response.get("Contents", [])

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
            normalized_workflow_id = f"pg{int(re.sub(r'\D', '', workflow_id))}"

            if normalized_workflow_id not in expected_suffixes:
                logger.debug("🛑 Skipping non-expected workflow ID: %s", normalized_workflow_id)
                continue

            try:
                image_url = f"https://{S3_DIFFRUN_GENERATIONS}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
                workflow_groups.setdefault(normalized_workflow_id, []).append({
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

        return {
            "carousels": carousels,
            "completed": completed,
            "job_id": job_id,
            "total_generated": sum(len(c["images"]) for c in carousels),
            "total_workflows": total
        }

    except Exception as e:
        logger.exception("❌ Error while polling images for job_id=%s", job_id)
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

def run_coverpage_workflow_in_background(
    job_id: str,
    book_id: str,
    book_style: str,
    cover_input_filename: str
):
    try:
        logger.info("🚀 Running coverpage workflow for job_id=%s", job_id)

        workflow_filename = f"{book_style}_{book_id}.json"
        workflow_path = os.path.join(
            INPUT_FOLDER, "stories", "coverpage_wide", workflow_filename)

        if not os.path.exists(workflow_path):
            raise HTTPException(
                status_code=404, detail=f"Workflow not found: {workflow_path}")

        workflow_data = load_workflow(workflow_path)
        if isinstance(workflow_data, list):
            workflow_data = workflow_data[0] if workflow_data else {}

        # ✅ Fetch user's name from DB
        user = user_details_collection.find_one({"job_id": job_id})
        if not user:
            raise HTTPException(
                status_code=404, detail="User record not found")
        name = user.get("name", "").capitalize()

        # ✅ Step 1: Inject user-uploaded images into nodes 91, 92, 93
        user_images = sorted([
            f for f in os.listdir(INPUT_FOLDER)
            if f.startswith(job_id) and f.lower().endswith(".jpg")
        ])
        if not user_images:
            raise HTTPException(
                status_code=400, detail="User images not found")

        for idx, node_id in enumerate(["91", "92", "93"][:len(user_images)]):
            full_path = os.path.join(INPUT_FOLDER, user_images[idx])
            if node_id in workflow_data and "inputs" in workflow_data[node_id]:
                workflow_data[node_id]["inputs"]["image"] = full_path
                logger.info(
                    f"🖼️ Injected {user_images[idx]} into node {node_id}")

        # ✅ Step 2: Inject cover image into node 6
        cover_path = Path(INPUT_FOLDER) / "cover_inputs" / \
            job_id / cover_input_filename
        if not cover_path.exists():
            raise FileNotFoundError(
                f"No matching cover image found at: {cover_path}")

        if "6" in workflow_data and "inputs" in workflow_data["6"]:
            workflow_data["6"]["inputs"]["image"] = str(cover_path)
            logger.info("🧾 Injected cover image into node 6")

        # ✅ Step 3: Inject child name into node 95
        if "95" in workflow_data and "inputs" in workflow_data["95"]:
            workflow_data["95"]["inputs"]["value"] = name
            logger.info(f"📝 Injected name '{name}' into node 95")

        # ✅ Step 4: Inject job_id
        known_job_id = "e44054af-f0ce-4413-8b37-853e1cc680aa"
        job_id_node = find_job_id_node(workflow_data, known_job_id)
        if job_id_node and "inputs" in workflow_data[job_id_node]:
            workflow_data[job_id_node]["inputs"]["strings"] = job_id
            logger.info(f"🆔 Replaced job_id in node {job_id_node}")

        # ✅ Step 5: Execute via WebSocket
        client_id = f"{job_id}_coverpage_{workflow_filename.replace('.json', '')}"
        ws = websocket.WebSocket()
        try:
            ws.connect(f"ws://{SERVER_ADDRESS}/ws?clientId={client_id}")
            get_images(ws, workflow_data, job_id, "coverpage", client_id)
        finally:
            ws.close()

        logger.info(f"✅ Coverpage workflow completed for job_id={job_id}")

         # ✅ Upload final PNG to S3 replicacomfy/output/{job_id}/finalcoverpage/
        final_png_dir = Path(OUTPUT_FOLDER) / job_id / "final_coverpage"
        final_png_candidates = list(final_png_dir.glob(f"{job_id}_final_coverpage*.png"))
        if final_png_candidates:
            final_png_path = final_png_candidates[0]
            s3_key = f"output/{job_id}/final_coverpage/{final_png_path.name}"
            s3.upload_file(str(final_png_path), "replicacomfy", s3_key)
            logger.info(f"📤 Uploaded final PNG to S3: s3://replicacomfy/{s3_key}")
        else:
            logger.warning("⚠️ Final coverpage PNG not found for upload to S3")

        # ✅ Generate cover PDF
        pdf_path = create_front_cover_pdf(job_id, book_style, book_id)
        logger.info(f"📄 Cover PDF generated: {pdf_path}")

        try:
            s3_key = f"{APPROVED_OUTPUT_PREFIX}/{job_id}_coverpage.pdf"
            s3.upload_file(pdf_path, APPROVED_OUTPUT_BUCKET, s3_key)
            logger.info(
                f"📤 Uploaded cover PDF to S3: s3://{APPROVED_OUTPUT_BUCKET}/{s3_key}")
            cover_url = f"https://{APPROVED_OUTPUT_BUCKET}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{s3_key}"

            user_details_collection.update_one(
                {"job_id": job_id},
                {"$set": {"cover_url": cover_url,
                          "updated_at": datetime.now(timezone.utc)}}
            )
        except Exception as e:
            logger.error(f"❌ Failed to upload cover PDF to S3: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to upload cover PDF: {str(e)}")

    except Exception as e:
        logger.exception(
            "🔥 Coverpage workflow failed for job_id=%s: %s", job_id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Coverpage workflow failed: {str(e)}")
    
@app.post("/preview-email")
async def preview_email(name: str, email: str, preview_url: str):
    try:
        name = name.capitalize()
        preview_url = preview_url
        email = email

        # ✅ Log all the critical values
        print("📩 Sending Preview Email:")
        print(f" - To: {email}")
        print(f" - Name: {name}")
        print(f" - Preview URL: {preview_url}")

        print("🔗 Email Link Block:\n",
              f'<a href="{preview_url}">Refine {name}’s Book</a>')

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hey there,</p>

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
              View {name}’s Book
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

        return {"status": "success", "message": f"Email sent to {email}"}

    except Exception as e:
        print("❌ Email sending error:", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to send preview email.")

def preview_email_lock(name: str, email: str, preview_url: str):
    try:
        name = name.title()
        preview_url = preview_url
        email = email

        print("📩 Sending Preview Email:")
        print(f" - To: {email}")
        print(f" - Name: {name}")
        print(f" - Preview URL: {preview_url}")

        print("🔗 Email Link Block:\n",
              f'<a href="{preview_url}">View {name}’s Book</a>')

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hey there,</p>

            <p>Thank you for taking the first step toward creating a magical, personalized storybook for <strong>{name}</strong> with <strong>Diffrun</strong>! 🌈</p>

            <p>We are sure <strong>{name}</strong> will love the personalized storybook with all the beautiful illustrations.</p>

            <p>You can preview {name}'s personalized storybook and continue building the book.</p>

            <a href="{preview_url}" 
              style="display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #6366F1; 
                    color: white; 
                    text-decoration: none; 
                    font-weight: bold; 
                    border-radius: 6px;
                    margin: 16px 0;">
              View {name}’s Book
            </a>

            <p>You can unlock the full preview by purchasing the book. A high quality print will be delivered to your doorstep within 7 working days.</p>

            <p>With excitement,<br><strong>The Diffrun Team</strong></p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = f"{name}'s Diffrun Storybook Preview is here!"
        msg["From"] = "Team Diffrun <support@diffrun.com>"
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        return {"status": "success", "message": f"Email sent to {email}"}

    except Exception as e:
        print("❌ Email sending error:", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to send preview email.")

def preview_email(name: str, email: str, preview_url: str):
    try:
        name = name.capitalize()
        username = username.capitalize()
        preview_url = preview_url
        email = email

        # ✅ Log all the critical values
        print("📩 Sending Preview Email:")
        print(f" - To: {email}")
        print(f" - Username: {username}")
        print(f" - Name: {name}")
        print(f" - Preview URL: {preview_url}")

        print("🔗 Email Link Block:\n",
              f'<a href="{preview_url}">Refine {name}’s Book</a>')

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
        msg["From"] = "Team Diffrun <support@diffrun.com>"
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        return {"status": "success", "message": f"Email sent to {email}"}

    except Exception as e:
        print("❌ Email sending error:", str(e))
        raise HTTPException(
            status_code=500, detail="Failed to send preview email.")

async def payment_done_email(username: str, child_name: str, email: str, preview_url: str,
                       order_id: str, total_price: float, currency_code: str,
                       discount_code: str, payment_id: str,
                       shipping_price: float, taxes: float,
                       discount_amount: float, shipping_info: dict, actual_price: float):
    try:
        username = escape(username)
        child_name = escape(child_name)
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: auto;">
            <h2 style="color: #333;">Order {order_id}</h2>
            <p>Hi <strong>{username}</strong>,</p>

            <p>Thank you for your order! <strong>{child_name}</strong>'s magical storybook is now ready for your review. ✨</p>

            <p>You still have 12 hours to make refinements before the book is sent for printing. If there are any pages you'd like to adjust, you can regenerate specific images directly within the preview.</p>

            <a href="{preview_url}" style="display:inline-block;padding:12px 24px;background-color:#28a745;color:white;text-decoration:none;border-radius:5px;margin-top:15px;">View & Refine Storybook</a>

            <hr style="margin: 30px 0;">

            <h3>Order Summary</h3>
                <table width="50%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; max-width: 600px;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <td width="30%">Product</td>
                    <td width="30%" align="right">Personalised Storybook × 1</td>
                </tr>
                <tr>
                    <td>Original Price</td>
                    <td align="right"><del>{currency_code} {actual_price:.2f}</del></td>
                </tr>
                <tr>
                    <td>Discount {f"({discount_code})" if discount_code else ""}</td>
                    <td align="right">-{currency_code} {discount_amount:.2f}</td>
                </tr>
                <tr>
                    <td>Subtotal</td>
                    <td align="right">{currency_code} {(total_price + shipping_price + taxes):.2f}</td>
                </tr>
                <tr>
                    <td>Shipping</td>
                    <td align="right">{currency_code} {shipping_price:.2f}</td>
                </tr>
                <tr>
                    <td>Taxes</td>
                    <td align="right">{currency_code} {taxes:.2f}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd; font-weight: bold;">
                    <td>Total</td>
                    <td align="right">{currency_code} {total_price:.2f}</td>
                </tr>
                </table>

            <h3>Customer Information</h3>
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td valign="top">
                  <strong>Shipping Address</strong><br>
                  {shipping_info.get('name', '')}<br>
                  {shipping_info.get('address1', '')} {shipping_info.get('address2', '')}<br>
                  {shipping_info.get('city', '')}, {shipping_info.get('province', '')} {shipping_info.get('zip', '')}<br>
                  {shipping_info.get('country', '')}
                </td>
                <td valign="top">
                  <strong>Billing Address</strong><br>
                  {shipping_info.get('name', '')}<br>
                  {shipping_info.get('address1', '')} {shipping_info.get('address2', '')}<br>
                  {shipping_info.get('city', '')}, {shipping_info.get('province', '')} {shipping_info.get('zip', '')}<br>
                  {shipping_info.get('country', '')}
                </td>
              </tr>
            </table>

            <p><strong>Payment Method:</strong> {payment_id}</p>
            <p><strong>Shipping Method:</strong> Standard</p>

            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #777;">If you have any questions, reply to this email or contact us at <a href="mailto:support@diffrun.com">support@diffrun.com</a>.</p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = str(Header(f"{child_name}'s Storybook Order Confirmation ✨", 'utf-8'))
        msg["From"] = "Team Diffrun <support@diffrun.com>"
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        logger.info(f"📧 Order confirmation email sent to {email}")
    except Exception as e:
        logger.error(f"❌ Failed to send order confirmation email: {e}")

async def payment_done_email_lock(username: str, child_name: str, email: str, preview_url: str,
                       order_id: str, total_price: float, currency_code: str,
                       discount_code: str, payment_id: str,
                       shipping_price: float, taxes: float,
                       discount_amount: float, shipping_info: dict, actual_price: float):
    try:
        child_name = child_name.title()
        actual_price = float(actual_price or 0)
        discount_amount = float(discount_amount or 0)
        shipping_price = float(shipping_price or 0)
        taxes = float(taxes or 0)
        total_price = float(total_price or 0)
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: auto;">
            <h2 style="color: #333;">Order {order_id}</h2>
            <p>Hi <strong>{username}</strong>,</p>

            <p>Thank you for your order! ✨
                <br/><br/> You can now preview <strong>{child_name}</strong>'s full storybook and make refinements using the link below.
            </p>

            <a href="{preview_url}" style="display:inline-block;padding:12px 24px;background-color:#5784ba;color:white;text-decoration:none;border-radius:16px;margin:10px 0;">View & Refine Full Storybook</a>

            <p>You still have 12 hours to make refinements before the book is sent for printing. If there are any pages you'd like to adjust, you can regenerate specific images directly within the preview.</p>

            <hr style="margin: 30px 0;">

            <h3>Order Summary</h3>
                <table width="60%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; max-width: 600px;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <td width="30%">Product</td>
                    <td width="30%" align="right">Personalised Storybook × 1</td>
                </tr>
                <tr>
                    <td>Original Price</td>
                    <td align="right">{currency_code} {actual_price:.2f}</td>
                </tr>
                <tr>
                    <td>Discount {f"({discount_code})" if discount_code else ""}</td>
                    <td align="right">-{currency_code} {discount_amount:.2f}</td>
                </tr>
                <tr>
                    <td>Subtotal</td>
                    <td align="right">{currency_code} {(total_price + shipping_price + taxes):.2f}</td>
                </tr>
                <tr>
                    <td>Shipping</td>
                    <td align="right">{currency_code} {shipping_price:.2f}</td>
                </tr>
                <tr>
                    <td>Taxes</td>
                    <td align="right">{currency_code} {taxes:.2f}</td>
                </tr>
                <tr style="border-top: 1px solid #ddd; font-weight: bold;">
                    <td>Total</td>
                    <td align="right">{currency_code} {total_price:.2f}</td>
                </tr>
                </table>

            <h3>Customer Information</h3>
            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
              <tr>
                <td valign="top">
                  <strong>Shipping Address</strong><br>
                  {shipping_info.get('name', '')}<br>
                  {shipping_info.get('address1', '')} {shipping_info.get('address2', '')}<br>
                  {shipping_info.get('city', '')}, {shipping_info.get('province', '')} {shipping_info.get('zip', '')}<br>
                  {shipping_info.get('country', '')}
                </td>
                <td valign="top">
                  <strong>Billing Address</strong><br>
                  {shipping_info.get('name', '')}<br>
                  {shipping_info.get('address1', '')} {shipping_info.get('address2', '')}<br>
                  {shipping_info.get('city', '')}, {shipping_info.get('province', '')} {shipping_info.get('zip', '')}<br>
                  {shipping_info.get('country', '')}
                </td>
              </tr>
            </table>

            <p><strong>Payment Method:</strong> {payment_id}</p>
            <p><strong>Shipping Method:</strong> Standard</p>

            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #555;">If you have any questions, reply to this email or contact us at <a href="mailto:support@diffrun.com">support@diffrun.com</a>.</p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = f"{child_name}'s Storybook Order Confirmation ✨"
        msg["From"] = "Team Diffrun <support@diffrun.com>"
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        logger.info(f"📧 Order confirmation email sent to {email}")
    except Exception as e:
        logger.error(f"❌ Failed to send order confirmation email: {e}")

def approval_confirmation_email(username: str, child_name: str, email: str):
    child_name = child_name.title()
    try:
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Hi <strong>{username}</strong>,</p>

            <p><strong>{child_name}</strong>'s magical storybook has been finalized and sent for printing. It will soon be on its way to you. 🚀📚</p>

            <p>Please allow us <strong>7–8 working days</strong> as all books are custom made to order.</p>

            <p>In case the approval wasn't submitted manually, our system automatically finalizes the book <strong>12 hours after payment</strong> to avoid any delays in printing.</p>

            <p>We can't wait for you and {child_name} to enjoy this keepsake together. 💖</p>

            <p>Warm wishes,<br><strong>The Diffrun Team</strong></p>
          </body>
        </html>
        """

        msg = EmailMessage()
        msg["Subject"] = f"{child_name}'s Storybook Is Now Being Printed! 🎉"
        msg["From"] = "Team Diffrun <support@diffrun.com>"
        msg["To"] = email
        msg.set_content("This email contains HTML content.")
        msg.add_alternative(html_content, subtype="html")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(EMAIL_USER, EMAIL_PASS)
            smtp.send_message(msg)

        logger.info(f"📦 Delivery confirmation email sent to {email}")

    except Exception as e:
        logger.error(f"❌ Failed to send delivery email: {e}")

@app.post("/api/update-print-approval")
async def update_print_approval(request: Request):
    try:
        data = await request.json()
        job_id = data.get("job_id")
        
        if not job_id:
            raise HTTPException(status_code=400, detail="Job ID is required")
       
        result = user_details_collection.update_one(
            {"job_id": job_id},
            {"$set": {"print_approval": True}}
        )
        
        if result.modified_count == 0:
            logger.warning(f"No document found with job_id={job_id}")
            return {"status": "not_found", "message": "Job ID not found"}
            
        logger.info(f"✅ Updated print_approval for job_id={job_id}")
        return {"status": "success", "message": "Print approval updated"}
        
    except Exception as e:
        logger.error(f"❌ Error updating print approval: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/about")
async def serve_about():
    return FileResponse("frontend/out/about.html")

@app.get("/books")
async def serve_about():
    return FileResponse("frontend/out/books.html")

@app.get("/child-details")
async def serve_child_details():
    return FileResponse("frontend/out/child-details.html")

@app.get("/contact")
async def serve_contact():
    return FileResponse("frontend/out/contact.html")

@app.get("/checkout")
async def serve_contact():
    return FileResponse("frontend/out/checkout.html")

@app.get("/confirmation")
async def serve_contact():
    return FileResponse("frontend/out/confirmation.html")

@app.get("/preview")
async def serve_preview():
    return FileResponse("frontend/out/preview.html")

@app.get("/purchase")
async def serve_purchase():
    return FileResponse("frontend/out/purchase.html")

@app.get("/user-details")
async def serve_user_details():
    return FileResponse("frontend/out/user-details.html")

@app.get("/faq")
async def serve_user_details():
    return FileResponse("frontend/out/faq.html")

@app.get("/email-preview-request")
async def serve_email_preview_request():
    return FileResponse("frontend/out/email-preview-request.html")

@app.get("/thankyou")
def thankyou():
    return FileResponse("frontend/out/thankyou.html")

@app.get("/approved")
async def serve_about():
    return FileResponse("frontend/out/approved.html")

@app.get("/after-payment")
async def after_payment():
    return FileResponse("frontend/out/after-payment.html")

@app.get("/healthcheck")
def healthcheck():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="frontend/out", html=True), name="static")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)