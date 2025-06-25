from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from PIL import Image
import io

from utils.tomato_leaf_detector import is_tomato_leaf  


app = FastAPI(title="Tomato Disease Classifier API")

MAX_SIZE = 2 * 1024 * 1024  # 2MB

def validate_image_file(file: UploadFile, max_size: int = MAX_SIZE):
    allowed_types = ["image/png", "image/jpeg"]
    
    # Validate content type
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Uploaded file must be one of: {', '.join(allowed_types)}.")
    
    # Validate size
    file.file.seek(0, 2)  # Move to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to start
    
    if size > max_size:
        raise HTTPException(status_code=400, detail=f"Uploaded file must be smaller than {max_size / (1024 * 1024):.2f} MB.")
    
@app.post("/classify")
async def classify_tomato_leaf(file: UploadFile = File(...), request: Request = None):
    # Validate the uploaded file
    validate_image_file(file)

    # Read and open image
    raw_data = await file.read()
    image_pil = Image.open(io.BytesIO(raw_data)).convert("RGB")

    # Check if it's a tomato leaf
    is_leaf = is_tomato_leaf(image_pil)

        
    return {
        "is_tomato_leaf": is_leaf
    }
