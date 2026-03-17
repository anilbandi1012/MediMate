# app/jobs/notifications_scheduler.py

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.medicine import Medicine
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.schemas.notification import NotificationType
from app.services.notification_service import NotificationService
from app.models.prescription_medicine import PrescriptionMedicine


# Main entry point for scheduler
async def run_notification_checks():
    async for db in get_db():
        service = NotificationService(db)

        await check_reminders(db, service)
        await check_low_stock(db, service)
        await check_refills(db, service)
        # await check_prescription_expiry(db, service)


# ---------------- CHECKS ---------------- #

async def check_reminders(db: AsyncSession, service: NotificationService):
    now = datetime.now().strftime("%H:%M")

    result = await db.execute(
        select(Reminder).where(Reminder.is_active == True)
    )
    reminders = result.scalars().all()

    for r in reminders:
        if r.reminder_time == now:
            await service.create_reminder_notification(
                user_id=r.user_id,
                medicine_name=r.medicine_name,
                dosage=r.dosage,
                reminder_id=r.id
            )


async def check_low_stock(db: AsyncSession, service: NotificationService):
    result = await db.execute(select(Medicine))
    medicines = result.scalars().all()

    for med in medicines:
        if med.current_stock <= med.min_stock_alert:

            existing = await db.execute(
                select(Notification).where(
                    Notification.user_id == med.user_id,
                    Notification.type == NotificationType.LOW_STOCK.value,
                    Notification.reference_id == med.id
                )
            )

            if existing.scalar():
                continue

            await service.create_low_stock_notification(
                user_id=med.user_id,
                medicine_name=med.name,
                remaining_quantity=med.current_stock,
                medicine_id=med.id
            )


async def check_refills(db: AsyncSession, service: NotificationService):
    result = await db.execute(select(Medicine))
    medicines = result.scalars().all()

    for m in medicines:
        if not m.dosage == 0:
            continue

        days_left = m.current_stock // m.dosage

        if days_left <= 3:

            existing = await db.execute(
                select(Notification).where(
                    Notification.user_id == m.user_id,
                    Notification.type == NotificationType.REFILL.value,
                    Notification.reference_id == m.id
                )
            )

            if existing.scalar():
                continue

            await service.create_refill_notification(
                user_id=m.user_id,
                medicine_name=m.name,
                days_until_empty=days_left,
                medicine_id=m.id
            )


# async def check_prescription_expiry(db: AsyncSession, service: NotificationService):
#     result = await db.execute(select(Medicine))
#     medicines = result.scalars().all()

#     for m in medicines:
#         result = await db.execute(
#             select(PrescriptionMedicine).where(PrescriptionMedicine.medicine_id == m.id)
#         )
#         prescriptions = result.scalars().all()

#         if not prescriptions:
#             continue

#         days_left = (m.prescription_medicines - datetime.utcnow().date()).days

#         if days_left == 3:

#             existing = await db.execute(
#                 select(Notification).where(
#                     Notification.user_id == m.user_id,
#                     Notification.type == NotificationType.PRESCRIPTION_EXPIRY.value,
#                     Notification.reference_id == m.prescription_id
#                 )
#             )

#             if existing.scalar():
#                 continue

#             await service.create_prescription_expiry_notification(
#                 user_id=m.user_id,
#                 doctor_name=m.doctor_name,
#                 days_until_expiry=days_left,
#                 prescription_id=m.prescription_id
#             )
