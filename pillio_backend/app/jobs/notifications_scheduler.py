# app/jobs/notifications_scheduler.py
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.medicine import Medicine
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.schemas.notification import NotificationType
from app.services.notification_service import NotificationService
from app.models.prescription_medicine import PrescriptionMedicine

# 🔔 Firebase Push
from app.services.firebase_service import send_push_notification
from app.api.users import user_tokens


# ---------------- MAIN ENTRY ---------------- #

async def run_notification_checks():
    # print("Scheduler running...")
    async for db in get_db():
        service = NotificationService(db)

        await check_reminders(db, service)
        await check_low_stock(db, service)
        await check_refills(db, service)
        # await check_prescription_expiry(db, service)


# ---------------- REMINDER CHECK ---------------- #

async def check_reminders(db: AsyncSession, service: NotificationService):

    now = datetime.now()

    result = await db.execute(
        select(Reminder).where(Reminder.is_active == True)
    )

    reminders = result.scalars().all()

    for r in reminders:

        try:
            reminder_time = datetime.strptime(r.reminder_time[:5], "%H:%M").time()
        except:
            continue

        reminder_datetime = datetime.combine(now.date(), reminder_time)

        if now - timedelta(minutes=10) <= reminder_datetime <= now:

            # print("Reminder triggered:", r.medicine_name)

            await service.create_reminder_notification(
                user_id=r.user_id,
                medicine_name=r.medicine_name,
                dosage=r.dosage,
                reminder_id=r.id
            )

            token = user_tokens.get(r.user_id)

            if token:
                send_push_notification(
                    token,
                    "Medicine Reminder 💊",
                    f"Time to take {r.medicine_name}"
                )


# ---------------- LOW STOCK CHECK ---------------- #

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

            # Save notification
            await service.create_low_stock_notification(
                user_id=med.user_id,
                medicine_name=med.name,
                remaining_quantity=med.current_stock,
                medicine_id=med.id
            )

            # 🔔 Send Firebase Push
            token = user_tokens.get(med.user_id)

            if token:
                send_push_notification(
                    token,
                    "Low Stock Alert ⚠️",
                    f"{med.name} is running low ({med.current_stock} left)"
                )


# ---------------- REFILL CHECK ---------------- #

async def check_refills(db: AsyncSession, service: NotificationService):

    result = await db.execute(select(Medicine))
    medicines = result.scalars().all()

    for m in medicines:

        dosage = (m.dosage)
        if not dosage:
            continue

        days_left = m.current_stock

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

            # Save notification
            await service.create_refill_notification(
                user_id=m.user_id,
                medicine_name=m.name,
                days_until_empty=days_left,
                medicine_id=m.id
            )

            # 🔔 Send Firebase Push
            token = user_tokens.get(m.user_id)

            if token:
                send_push_notification(
                    token,
                    "Refill Reminder 💊",
                    f"{m.name} will run out in {days_left} days"
                )


# ---------------- PRESCRIPTION EXPIRY (OPTIONAL) ---------------- #

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