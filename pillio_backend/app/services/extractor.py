# extractor.py
import cv2
import numpy as np
import pytesseract
from fastapi import UploadFile, HTTPException
from pdf2image import convert_from_bytes
import logging
import os

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure Tesseract is installed on Linux and available in PATH
pytesseract.pytesseract.tesseract_cmd = "tesseract"  # default Linux path

# Allowed file types (same as your settings)
ALLOWED_FILE_TYPES = ["jpg", "jpeg", "png", "pdf"]
ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png"]


async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extract text from uploaded prescription (image or PDF)
    """
    filename = file.filename.lower()
    ext = filename.split(".")[-1]

    if ext not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    try:
        # --- PDF Handling ---
        if ext == "pdf":
            content = await file.read()
            images = convert_from_bytes(content)
            if not images:
                raise HTTPException(status_code=400, detail="PDF has no pages")
            
            text = ""
            for img in images:
                page_text = pytesseract.image_to_string(img)
                text += page_text + "\n"
            return text.strip()

        # --- Image Handling ---
        else:
            await file.seek(0)  # Reset file pointer to the beginning
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Empty file received")

            nparr = np.frombuffer(content, np.uint8)
    
            if nparr.size == 0:
             raise HTTPException(status_code=400, detail="Invalid image data")

            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                raise HTTPException(status_code=400, detail="Failed to decode image")

            text = pytesseract.image_to_string(img)
            return text.strip()

    except Exception as e:
        logger.error(f"OCR failed for file {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OCR processing failed")