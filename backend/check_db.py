from database import SessionLocal
import models
from dotenv import load_dotenv
import os

load_dotenv()

try:
    db = SessionLocal()
    count = db.query(models.Achievement).count()
    with open("db_count.txt", "w") as f:
        f.write(str(count))
    print(f"Count: {count}")
except Exception as e:
    with open("db_count.txt", "w") as f:
        f.write(f"Error: {e}")
