from pymongo import MongoClient
from dotenv import load_dotenv
import os
from models import UserDetails
from datetime import datetime, timezone

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "candyman")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
user_details_collection = db["user_details"]

def save_user_details(data: dict):
    
    try:
        user_data = UserDetails(**data)
        document = user_data.model_dump()
        document["updated_at"] = datetime.now(timezone.utc)

        user_details_collection.update_one(
            {"job_id": document["job_id"]},
            {"$set": document},
            upsert=True
        )

        print(f"✅ Saved/Updated user details for job_id: {document['job_id']}")
    except Exception as e:
        print(f"❌ Failed to save user details: {e}")
        raise ValueError("Failed to save user details to the database.")

def check_db_connection():
    try:
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return False