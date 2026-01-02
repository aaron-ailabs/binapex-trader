from PIL import Image
import os

source_path = r"C:/Users/user/.gemini/antigravity/brain/b1904308-442b-4311-9143-f7102313d6f4/uploaded_image_1767372325372.png"
output_dir = r"c:\DEVGINE - WORKSPACE\Binapex-dec\public"

try:
    with Image.open(source_path) as img:
        # The image is 1024x1024. 
        # Visual check: Icon is roughly the top 70-75%. Text is at bottom.
        # Let's crop the icon square-ish.
        # Assuming centered icon.
        
        # Crop for Icon Only (removing text at bottom)
        # Try cropping top 750 pixels.
        icon_img = img.crop((100, 100, 924, 750)) 
        # Actually, let's keep it simpler/safer first. 
        # Let's inspect the image via analysis? No, just strict crop guess is risky.
        # Better: Crop top 700px.
        
        # Let's try to be smart. Convert to grayscale, find bbox of non-transparent/non-white pixels?
        # Assuming transparent background? If black background, might be harder.
        # User image looked like gold on transparent or white? 
        # Let's just crop top 75% for now as a safe bet for "Icon".
        
        icon_crop = img.crop((0, 0, 1024, 750))
        
        # Save
        icon_path = os.path.join(output_dir, "logo-icon-only.png")
        icon_crop.save(icon_path)
        print(f"Saved cropped icon to {icon_path}")
        
        # Also copy original as logo-vertical.png
        vert_path = os.path.join(output_dir, "logo-vertical.png")
        img.save(vert_path)
        print(f"Saved full vertical logo to {vert_path}")

except Exception as e:
    print(f"Error: {e}")
