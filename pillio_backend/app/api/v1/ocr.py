from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.services.ocr import extract_text_from_image
from app.services.extractor import extract_text_from_file
from app.config import settings

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid image type")

    os.makedirs(settings.upload_dir, exist_ok=True)

    file_path = os.path.join(settings.upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        extracted_text = await extract_text_from_file(file)
        return {
            "filename": file.filename,
            "extracted_text": extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
