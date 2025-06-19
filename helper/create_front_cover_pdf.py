import os
import fitz                       
from PIL import Image
from dotenv import load_dotenv

load_dotenv(dotenv_path="./.env")

OUTPUT_FOLDER = os.path.normpath(os.getenv("OUTPUT_FOLDER"))

TEMP_JPEG = "cover_temp_image.jpg"


def create_front_cover_pdf(job_id: str, book_style: str, book_id: str) -> str:
    source_folder = os.path.join(OUTPUT_FOLDER, job_id, "final_coverpage")
    output_pdf_path = os.path.join(source_folder, f"{job_id}_coverpage.pdf")

    if not os.path.exists(source_folder):
        raise FileNotFoundError(f"Cover image folder not found: {source_folder}")

    # grab the single cover image
    image_paths = [
        os.path.join(source_folder, f)
        for f in os.listdir(source_folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]
    if not image_paths:
        raise FileNotFoundError(f"No images found in {source_folder}")
    if len(image_paths) > 1:
        raise ValueError(f"Expected one image, found {len(image_paths)}")

    # choose page & target sizes
    if book_style == "hardcover":
        if book_id == "wigu":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1377, 731
            TARGET_SIZE_PX = (5737, 3047)    
        elif book_id == "abcd":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1379, 731
            TARGET_SIZE_PX = (5746, 3047)
        elif book_id == "astro":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1381, 731
            TARGET_SIZE_PX = (5756, 3047)    
    elif book_style == "paperback":
        # PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1156, 578
        # TARGET_SIZE_PX = (4811, 2405)
        if book_id == "wigu":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1218, 612
            TARGET_SIZE_PX = (5076, 2551)    
        elif book_id == "abcd":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1217, 612
            TARGET_SIZE_PX = (5073, 2551)
        elif book_id == "astro":
            PAGE_WIDTH_PT, PAGE_HEIGHT_PT = 1220, 612
            TARGET_SIZE_PX = (5082, 2551)
    else:
        raise ValueError(f"Unknown book_style: {book_style}")

    img_path = image_paths[0]

    # ---- fixes start here ----
    with Image.open(img_path) as im:          # context manager just for the file
        im = im.convert("RGB")                # convert *after* opening
        im_resized = im.resize(TARGET_SIZE_PX, Image.LANCZOS)

        temp_path = os.path.join(source_folder, TEMP_JPEG)
        im_resized.save(temp_path, format="JPEG", quality=95)
    # ---- fixes end here ----

    # build the one-page PDF
    doc = fitz.open()
    page = doc.new_page(width=PAGE_WIDTH_PT, height=PAGE_HEIGHT_PT)
    page.insert_image(fitz.Rect(0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT), filename=temp_path)
    doc.save(output_pdf_path)
    doc.close()
    os.remove(temp_path)

    print(f"✅ Cover PDF created at: {output_pdf_path}")
    return output_pdf_path