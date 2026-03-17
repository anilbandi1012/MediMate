from fastapi import FastAPI,APIRouter
from pydantic import BaseModel
from typing import Dict
from pywebpush import webpush
from app.config import settings
import os

router = APIRouter(prefix="/subscription", tags=["Subscription"])

# Temporary storage (later replace with DB)
subscriptions = []

class Subscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

@router.post("/save-subscription")
async def save_subscription(subscription: Subscription):
    subscriptions.append(subscription.dict())
    return {"message": "Subscription saved successfully"}

@router.post("/send-test")
def send_test_notification():

    for sub in subscriptions:
        webpush(
            subscription_info=sub,
            data="💊 Time to take your medicine!",
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": "mailto:anil20cm050@gmail.com"
            }
        )
        print("Sending push to:", sub)
    
    print("All notifications sent:", subscriptions)
    

    return {"message": "Test notification sent"}