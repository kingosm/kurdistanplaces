from PIL import Image

def crop_transparent(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    # Get alpha channel
    a = img.split()[-1]
    # Get bounding box of non-transparent areas
    bbox = a.getbbox()
    if bbox:
        # Crop to the bounding box
        img = img.crop(bbox)
        img.save(output_path, "PNG")
        print(f"Successfully cropped logo to bbox: {bbox}")
    else:
        print("Image is entirely transparent, could not crop.")

input_path = r"c:\Users\Kingosm\Downloads\kurdistan-bites-main\public\images\logo.png"
crop_transparent(input_path, input_path)
