FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# 🔥 move directly into backend folder
WORKDIR /app/pillio_backend

COPY . .

RUN pip install --no-cache-dir -r pillio_backend/requirements.txt

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]