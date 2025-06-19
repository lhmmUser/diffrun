import os
import shutil
from dotenv import load_dotenv
from pathlib import Path

dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)


INPUT_FOLDER = os.path.normpath(os.getenv("INPUT_FOLDER"))
OUTPUT_FOLDER = os.path.normpath(os.getenv("OUTPUT_FOLDER"))

def prepare_cover_inputs_from_selected_indices(job_id: str, selected_indices: list[int]):
    source_dir = os.path.join(OUTPUT_FOLDER, job_id, "exterior")
    dest_dir = os.path.join(INPUT_FOLDER, "cover_inputs")
    os.makedirs(dest_dir, exist_ok=True)

    if not os.path.exists(source_dir):
        raise FileNotFoundError(f"Cover image folder not found: {source_dir}")

    all_images = sorted([
        f for f in os.listdir(source_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ])

    if not selected_indices or selected_indices[0] >= len(all_images):
        raise ValueError("Invalid or empty selected slide indices.")

    selected_cover = all_images[selected_indices[0]]

    # Extract main book key from selected cover
    book_key = None
    parts = selected_cover.split("_")
    for part in parts:
        if part.lower() in {"abc", "astro", "wigu"}:
            book_key = part.lower()
            break

    if not book_key:
        raise ValueError(f"Could not extract book key from: {selected_cover}")

    other_books = {"abc", "astro", "wigu"} - {book_key}
    files_to_copy = [(selected_cover, book_key)]

    # Find matching covers for the other books
    for book in other_books:
        match_prefix = f"_{job_id}_{book}_00001"
        for f in all_images:
            if f.startswith(match_prefix):
                files_to_copy.append((f, book))
                break

    # Copy and rename all files to expected format
    for original_filename, book in files_to_copy:
        src_path = os.path.join(source_dir, original_filename)
        new_filename = f"{job_id}_{book}_00001_.png"
        dst_path = os.path.join(dest_dir, new_filename)
        shutil.copy(src_path, dst_path)

    print(f"✅ Prepared cover images in: {dest_dir}")
    return dest_dir