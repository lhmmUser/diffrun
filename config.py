import os

SERVER_ADDRESS = "127.0.0.1:8188"

INPUT_FOLDER = r"D:\ComfyUI_windows_portable\ComfyUI\input"
OUTPUT_FOLDER = r"D:\ComfyUI_windows_portable\ComfyUI\output"
JPG_OUTPUT = r"D:\ComfyUI_windows_portable\ComfyUI\JPG-Output"
FINAL_IMAGES = r"D:\ComfyUI_windows_portable\ComfyUI\final-images"
WATERMARK_PATH = r"D:\Kush/Diffrun\images\Watermark.png"
STORIES_FOLDER = r"D:\ComfyUI_windows_portable\ComfyUI\input\stories"

os.makedirs(FINAL_IMAGES, exist_ok=True)
os.makedirs(INPUT_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(JPG_OUTPUT, exist_ok=True)