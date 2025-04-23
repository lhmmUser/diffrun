import os
import fitz
from PIL import Image

PAGE_WIDTH_PT = 630
PAGE_HEIGHT_PT = 630
TARGET_SIZE_PX = (2625, 2625)
TEMP_JPEG = "temp_resized_image.jpg"

def create_pdf(source_folder: str, output_pdf: str):
    doc = fitz.open()

    image_paths = [
        os.path.join(source_folder, f)
        for f in sorted(os.listdir(source_folder))
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    if not image_paths:
        raise ValueError(f"No images found in: {source_folder}")

    for img_path in image_paths:
        with Image.open(img_path).convert("RGB") as im:
            im_resized = im.resize(TARGET_SIZE_PX, Image.LANCZOS)
            temp_path = os.path.join(source_folder, TEMP_JPEG)
            im_resized.save(temp_path, format="JPEG", quality=95)

            page = doc.new_page(width=PAGE_WIDTH_PT, height=PAGE_HEIGHT_PT)
            insert_rect = fitz.Rect(0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT)
            page.insert_image(insert_rect, filename=temp_path)

    doc.save(output_pdf)
    doc.close()

    temp_file_path = os.path.join(source_folder, TEMP_JPEG)
    if os.path.exists(temp_file_path):
        os.remove(temp_file_path)

    print(f"✅ PDF saved to: {output_pdf}")