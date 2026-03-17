from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from app.schemas.common import FileUploadResponse


# Prescription medicine item for creating/updating
class PrescriptionMedicineCreate(BaseModel):
    medicine_name: Optional[str] = Field(None, description="Name of the medicine")
    dosage: Optional[str] = Field(None, description="Dosage amount, e.g., '500mg'")
    form: Optional[str] = Field(None, description="Form of the medicine, e.g., 'tablet', 'syrup'")
    frequency: Optional[str] = Field(None, description="Frequency of intake, e.g., 'twice a day'")
    duration_days: Optional[int] = Field(None, description="Duration in days")
    instructions: Optional[str] = Field(None, description="Additional instructions")


# Prescription medicine item in response
class PrescriptionMedicineResponse(BaseModel):
    """Schema for prescription medicine in responses"""
    id: int
    prescription_id: int
    medicine_id: Optional[int] = None
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int
    instructions: Optional[str] = None
    
    class Config:
        from_attributes = True


# Base prescription schema
class PrescriptionBase(BaseModel):
    doctor_name: str = Field(..., min_length=1, max_length=255)
    hospital_clinic: Optional[str] = None
    prescription_date: date
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool = True


# Prescription creation schema
class PrescriptionCreate(BaseModel):
    doctor_name: str = Field(..., description="Name of the prescribing doctor")
    hospital_clinic: Optional[str] = Field(None, description="Hospital or clinic name")
    prescription_date: Optional[str] = Field(None, description="Date of prescription (YYYY-MM-DD)")
    valid_until: Optional[str] = Field(None, description="Expiry date of prescription (YYYY-MM-DD)")
    notes: Optional[str] = Field(None, description="Additional notes")
    medicines: Optional[List[PrescriptionMedicineCreate]] = Field(
        None, description="List of medicines (can be empty or partial)"
    )


# Prescription update schema
class PrescriptionUpdate(BaseModel):
    doctor_name: Optional[str] = None
    hospital_clinic: Optional[str] = None
    prescription_date: Optional[date] = None
    valid_until: Optional[date] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    # For updating medicines, use separate endpoints


# Prescription update with medicines
class PrescriptionUpdateWithMedicines(BaseModel):
    doctor_name: Optional[str] = Field(None, description="Name of the prescribing doctor")
    hospital_clinic: Optional[str] = Field(None, description="Hospital or clinic name")
    prescription_date: Optional[str] = Field(None, description="Date of prescription (YYYY-MM-DD)")
    valid_until: Optional[str] = Field(None, description="Expiry date of prescription (YYYY-MM-DD)")
    notes: Optional[str] = Field(None, description="Additional notes")
    medicines: Optional[List[PrescriptionMedicineCreate]] = Field(
        None, description="List of medicines (can be empty or partial)"
    )


# Prescription response schema (base)
class Prescription(PrescriptionBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Prescription with medicines list
class PrescriptionWithMedicines(Prescription):
    """Full prescription response with all medicines"""
    prescription_medicines: List[PrescriptionMedicineResponse] = []
    is_expired: bool = False
    days_until_expiry: int = 0
    
    class Config:
        from_attributes = True


# Prescription file upload response
class PrescriptionUploadResponse(BaseModel):
    prescription: PrescriptionWithMedicines
    file: FileUploadResponse


# Prescription filter
class PrescriptionFilter(BaseModel):
    is_active: Optional[bool] = None
    is_expired: Optional[bool] = None
    doctor_name: Optional[str] = None
    search: Optional[str] = None  # Search in doctor name or medicine names
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


# Prescription search
class PrescriptionSearch(BaseModel):
    query: str
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
