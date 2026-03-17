from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user_device import UserDevice

router = APIRouter(prefix="/devices")

@router.post("/register")
async def register_device(user_id: int, token: str, db: AsyncSession = Depends(get_db)):
    device = UserDevice(user_id=user_id, fcm_token=token)
    db.add(device)
    await db.commit()
    return {"status": "registered"}
