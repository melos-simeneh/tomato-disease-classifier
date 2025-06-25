from fastapi import  UploadFile, HTTPException

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
