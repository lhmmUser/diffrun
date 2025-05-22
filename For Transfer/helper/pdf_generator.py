import os
import fitz  # PyMuPDF
from PIL import Image
from typing import List

PAGE_WIDTH_PT = 612   # 8.5 inches * 72 = 612
PAGE_HEIGHT_PT = 612  # Square format (8.5 x 8.5)
TARGET_SIZE_PX = (2550, 2550)  # 8.5" x 300 DPI
TEMP_JPEG = "temp_resized_image.jpg"

def create_interior_pdf(source_folder: str, output_pdf: str, selectedSlides: List[int], job_id: str):
    temp_path = os.path.join(source_folder, TEMP_JPEG)

    with fitz.open() as doc:
        for idx, variant_index in enumerate(selectedSlides):
            if variant_index is None:
                continue

            page_num = idx + 1  # Match filenames that start from 01
            variant_num = variant_index + 1

            filename = f"_{job_id}_{page_num:02d}_{variant_num:05d}_.png"
            img_path = os.path.join(source_folder, filename)

            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image not found for PDF: {img_path}")

            with Image.open(img_path).convert("RGB") as im:
                im_resized = im.resize(TARGET_SIZE_PX, Image.LANCZOS)
                im_resized.save(temp_path, format="JPEG", quality=95, dpi=(300, 300))

                page = doc.new_page(width=PAGE_WIDTH_PT, height=PAGE_HEIGHT_PT)
                insert_rect = fitz.Rect(0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT)
                page.insert_image(insert_rect, filename=temp_path)

        doc.save(output_pdf)

    if os.path.exists(temp_path):
        os.remove(temp_path)

    print(f"✅ Interior PDF saved to: {output_pdf}")