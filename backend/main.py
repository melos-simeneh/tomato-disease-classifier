from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from PIL import Image
import io
import numpy as np
import tensorflow as tf

from utils.tomato_leaf_detector import is_tomato_leaf  
from utils.validate_image import validate_image_file


app = FastAPI(title="Tomato Disease Classifier API")

MODEL_PATH =  "model/tomato_disease_classifier.keras"
MODEL= tf.keras.models.load_model(MODEL_PATH, compile=False)
CLASS_NAMES = ['Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold','Tomato_healthy']

def get_normalized_image(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert('RGB')
    image = image.resize((256, 256))
    return np.array(image) / 255.0

@app.post("/classify")
async def classify_tomato_leaf(file: UploadFile = File(...), request: Request = None):
    # Validate the uploaded file
    validate_image_file(file)

    # Read and open image
    raw_data = await file.read()
    image_pil = Image.open(io.BytesIO(raw_data)).convert("RGB")

    # Check if it's a tomato leaf
    is_leaf = is_tomato_leaf(image_pil)

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
