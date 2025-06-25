from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch

clip_model_name = "openai/clip-vit-base-patch32"
clip_model = CLIPModel.from_pretrained(clip_model_name)
clip_processor = CLIPProcessor.from_pretrained(clip_model_name)

def is_tomato_leaf(input_image: Image.Image, confidence_threshold: float = 0.65) -> bool:
    candidate_labels = [
        "a photo of a healthy tomato leaf",
        "a photo of a diseased tomato leaf",
        "a photo of a tomato leaf",
        "not a tomato leaf"
    ]

    # Preprocess the image and text
    inputs = clip_processor(text=candidate_labels, images=input_image, return_tensors="pt", padding=True)

    # Run inference
    with torch.no_grad():
        outputs = clip_model(**inputs)
        image_logits = outputs.logits_per_image
        probs = image_logits.softmax(dim=1)

    first_image_probs = probs[0]  # tensor with 4 elements
    
    # Sum probabilities of any "tomato leaf" related labels
    tomato_related_prob = first_image_probs[:3].sum().item()

    return tomato_related_prob >= confidence_threshold
