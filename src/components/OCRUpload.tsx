import { useRef, useState } from "react";
import axios from "axios";
import { Button } from '@/components/ui/button';
import { Plus } from "lucide-react";

type OCRUploadProps = {
  onResult: (data: any) => void;
};

const OCRUpload = ({ onResult }: OCRUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(
        "http://127.0.0.1:8000/api/v1/ocr/extract-text",
        formData
      );

      // 🔥 PUSH DIRECTLY INTO STATE
      onResult(res.data);

      // optional (keep if you want persistence)
      localStorage.setItem("ocrResult", JSON.stringify(res.data));

    } catch (err) {
      alert("OCR failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <Button className="gradient-primary" onClick={openFilePicker}>
        <Plus className="h-4 w-4 mr-2" />
        Upload Prescription
      </Button>

      {loading && "Processing..."}
    </div>
  );
};

export default OCRUpload;