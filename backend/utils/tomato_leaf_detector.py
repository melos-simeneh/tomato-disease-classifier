from transformers import CLIPProcessor, CLIPModel, VisionEncoderDecoderModel,ViTImageProcessor,AutoTokenizer
from PIL import Image
import torch

clip_model_name = "openai/clip-vit-base-patch32"
clip_model = CLIPModel.from_pretrained(clip_model_name)
clip_processor = CLIPProcessor.from_pretrained(clip_model_name)


caption_model = VisionEncoderDecoderModel.from_pretrained("nlpconnect/vit-gpt2-image-captioning")
caption_processor = ViTImageProcessor.from_pretrained("nlpconnect/vit-gpt2-image-captioning")
caption_tokenizer = AutoTokenizer.from_pretrained("nlpconnect/vit-gpt2-image-captioning")


def generate_caption(image):
    if image.mode != "RGB":
        image = image.convert(mode="RGB")
    pixel_values = caption_processor(images=image, return_tensors="pt").pixel_values
    output_ids = caption_model.generate(pixel_values, max_length=16, num_beams=1)
    caption = caption_tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return caption


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
    
    caption = generate_caption(input_image)

    return tomato_related_prob >= confidence_threshold and any(phrase in caption for phrase in ["green plant", "green leaf"])
