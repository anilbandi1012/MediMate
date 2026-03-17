from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.base import BaseModel
from app.models.medicine import Medicine
from app.models.user import User
from app.config import settings

# 1️⃣ Create synchronous engine for seeding
engine = create_engine(
    settings.database_url.replace("asyncpg", "psycopg2"),
    echo=True
)

# 2️⃣ Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

try:
    # 3️⃣ Add a sample user
    user = User(
        email="testuser@example.com",
        password_hash="password123"  # replace with hashed password if your auth requires it
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"✅ User created: {user.email}")

    # 4️⃣ Add sample medicines
    medicines = [
        Medicine(
            name="Paracetamol",
            generic_name="Acetaminophen",
            dosage="500mg",
            form="tablet",
            unit="pills",
            current_stock=20,
            min_stock_alert=5,
            user_id=user.id
        ),
        Medicine(
            name="Ibuprofen",
            generic_name="Ibuprofen",
            dosage="200mg",
            form="tablet",
            unit="pills",
            current_stock=15,
            min_stock_alert=5,
            user_id=user.id
        ),
        Medicine(
            name="Amoxicillin",
            generic_name="Amoxicillin",
            dosage="250mg",
            form="capsule",
            unit="pills",
            current_stock=30,
            min_stock_alert=5,
            user_id=user.id
        )
    ]

    session.add_all(medicines)
    session.commit()
    print(f"✅ {len(medicines)} medicines added")

finally:
    session.close()
