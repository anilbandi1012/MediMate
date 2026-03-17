from app.utils.text_parser import parse_medicine_data
import pytesseract
import cv2
import numpy as np
from PIL import Image
import os

# Windows-specific Tesseract path
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if os.path.exists(TESSERACT_PATH):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from an image using Tesseract OCR
    """
    # Read image using OpenCV
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Invalid image path")

    # Convert to grayscale (important for OCR accuracy)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply thresholding
    gray = cv2.threshold(
        gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )[1]

    # OCR config
    config = "--oem 3 --psm 6"

    text = pytesseract.image_to_string(gray, config=config)

    return text.strip()

def extract_and_parse_medicine(image_path: str):
    # Step 1: OCR
    ocr_text = extract_text_from_image(image_path)

    # Step 2F: Parse OCR text
    parsed_data = parse_medicine_data(ocr_text)

    return {
        "raw_text": ocr_text,
        "parsed_data": parsed_data
    }