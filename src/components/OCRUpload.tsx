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

    console.log("FILE:", file);
    console.log("SIZE:", file.size);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(
        "https://medimate-k4yl.onrender.com/api/v1/ocr/extract-text",
        formData,
        {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
      );

      // 🔥 PUSH DIRECTLY INTO STATE
      onResult(res.data);

      // optional (keep if you want persistence)
      localStorage.setItem("ocrResult", JSON.stringify(res.data));

    } catch (err) {
       console.error(err);
      alert("OCR failed");
    } finally {
      setLoading(false);
      e.target.value = null; // reset file input
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