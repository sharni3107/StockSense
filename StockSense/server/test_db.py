import uuid
import json
from sqlalchemy import create_engine, text

url = "postgresql://postgres.oqeasntprdnwvveeyeoe:%23Swetha2425@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(url)

with engine.connect() as conn:
    print("Testing pgcrypto:")
    # Check extensions
    exts = conn.execute(text("SELECT extname, extnamespace::regnamespace::text FROM pg_extension")).fetchall()
    print("Installed extensions:", exts)
