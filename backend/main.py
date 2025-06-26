from fastapi import FastAPI, File, UploadFile, HTTPException, Request,Query
from PIL import Image
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import io
import numpy as np
import tensorflow as tf
import io
from pathlib import Path

from utils.tomato_leaf_detector import is_tomato_leaf  
from utils.validate_image import validate_image_file


app = FastAPI(title="Tomato Disease Classifier API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

MODEL_PATH = BASE_DIR / "model" / "tomato_disease_classifier.keras"
MODEL= tf.keras.models.load_model(MODEL_PATH, compile=False)

CLASS_NAMES = ['Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold','Tomato_healthy']

# Serve React frontend only if built files exist
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/")
    async def serve_spa():
        return FileResponse(FRONTEND_DIST / "index.html")
    
    @app.get("/favicon.png")
    async def favicon():
        return FileResponse(FRONTEND_DIST / "favicon.png")


def get_normalized_image(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert('RGB')
    image = image.resize((256, 256))
    return np.array(image) / 255.0

@app.post("/classify")
async def classify_tomato_leaf(file: UploadFile = File(...)
                                ,use_binary_for_filter: bool = Query(True, description="Use binary classifier with CLIP for filtering"), 
                                    request: Request = None):
    # Validate the uploaded file
    validate_image_file(file)

    # Read and open image
    raw_data = await file.read()
    image_pil = Image.open(io.BytesIO(raw_data)).convert("RGB")

    # Check if it's a tomato leaf
    is_leaf = is_tomato_leaf(image_pil,use_binary_for_filter)

    if not is_leaf:
        raise HTTPException(
            status_code=400,
            detail="Image is not a tomato leaf. Please upload a valid tomato leaf image."
        )

    # Predict disease using the CNN model 
    image_np = get_normalized_image(raw_data)
    img_batch = np.expand_dims(image_np, axis=0)
    predictions = MODEL.predict(img_batch, verbose=0)
    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = float(np.max(predictions[0]))

    return {
        "class": predicted_class,
        "confidence": confidence
    }
