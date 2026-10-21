from app.database.database import SessionLocal
from app.models.hospital import Hospital

db = SessionLocal()

sample_hospitals = [

    {
        "hospital_name": "Apollo Hospital",
        "specialization": "Cardiology",
        "address": "Bannerghatta Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "phone": "08012345678",
        "maps_url": "https://maps.google.com"
    },

    {
        "hospital_name": "Manipal Hospital",
        "specialization": "Neurology",
        "address": "Old Airport Road",
        "city": "Bangalore",
        "state": "Karnataka",
        "phone": "08087654321",
        "maps_url": "https://maps.google.com"
    },

    {
        "hospital_name": "Aster CMI",
        "specialization": "Endocrinology",
        "address": "Hebbal",
        "city": "Bangalore",
        "state": "Karnataka",
        "phone": "08022223333",
        "maps_url": "https://maps.google.com"
    }

]

for hospital in sample_hospitals:

    exists = db.query(Hospital).filter(
        Hospital.hospital_name == hospital["hospital_name"]
    ).first()

    if not exists:

        db.add(Hospital(**hospital))

db.commit()

print("Hospital data inserted successfully.")