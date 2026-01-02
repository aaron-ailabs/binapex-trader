import sys
from PIL import Image

try:
    img_path = r"C:/Users/user/.gemini/antigravity/brain/b1904308-442b-4311-9143-f7102313d6f4/uploaded_image_1767372325372.png"
    with Image.open(img_path) as img:
        print(f"Dimensions: {img.size}")
        print(f"Format: {img.format}")
except Exception as e:
    print(f"Error: {e}")
