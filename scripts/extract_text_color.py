from PIL import Image
from collections import Counter

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

try:
    img_path = r"C:/Users/user/.gemini/antigravity/brain/b1904308-442b-4311-9143-f7102313d6f4/uploaded_image_1767372325372.png"
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    # Crop bottom part (approx text area)
    # Image is 1024x1024. Text is likely below 700px.
    text_area = img.crop((100, 600, 924, 950))
    
    pixels = []
    width, height = text_area.size
    for x in range(width):
        for y in range(height):
            r, g, b, a = text_area.getpixel((x, y))
            # Ignore transparent
            if a < 50:
                continue
            # Ignore white/black background noise if any
            if r < 20 and g < 20 and b < 20: continue
            if r > 240 and g > 240 and b > 240: continue
            
            pixels.append((r, g, b))

    if not pixels:
        print("No significant pixels found in text area.")
    else:
        # Get most common color
        counts = Counter(pixels)
        most_common = counts.most_common(5)
        print("Most common colors:")
        for color, count in most_common:
            print(f"{rgb_to_hex(color)}: {count}")
            
        # Get average color
        avg_r = sum(p[0] for p in pixels) // len(pixels)
        avg_g = sum(p[1] for p in pixels) // len(pixels)
        avg_b = sum(p[2] for p in pixels) // len(pixels)
        print(f"Average Color: {rgb_to_hex((avg_r, avg_g, avg_b))}")

except Exception as e:
    print(f"Error: {e}")
