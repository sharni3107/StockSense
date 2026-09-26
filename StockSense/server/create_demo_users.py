import uuid
import json
from sqlalchemy import create_engine, text

url = "postgresql://postgres.oqeasntprdnwvveeyeoe:%23Swetha2425@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(url)

users_to_add = [
    {
        "email": "manager@stocksense.demo",
        "password": "StockSense123!",
        "name": "Priya Manager",
        "role": "INVENTORY_MANAGER"
    },
    {
        "email": "staff@stocksense.demo",
        "password": "StockSense123!",
        "name": "Arun Staff",
        "role": "WAREHOUSE_STAFF"
    }
]

with engine.begin() as conn:
    for u in users_to_add:
        # Check if user already exists in auth.users
        existing = conn.execute(
            text("SELECT id FROM auth.users WHERE email = :email"),
            {"email": u["email"]}
        ).fetchone()

        if existing:
            user_id = existing[0]
            print(f"User {u['email']} already in auth.users with id {user_id}")
            # Update password just in case
            conn.execute(
                text("""
                    UPDATE auth.users 
                    SET encrypted_password = extensions.crypt(:password, extensions.gen_salt('bf')),
                        email_confirmed_at = NOW(),
                        updated_at = NOW()
                    WHERE id = :id
                """),
                {"password": u["password"], "id": user_id}
            )
        else:
            user_id = str(uuid.uuid4())
            app_meta = json.dumps({"provider": "email", "providers": ["email"]})
            user_meta = json.dumps({
                "sub": user_id,
                "email": u["email"],
                "email_verified": True,
                "phone_verified": False
            })
            conn.execute(
                text("""
                    INSERT INTO auth.users (
                        instance_id, id, aud, role, email,
                        encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at
                    ) VALUES (
                        '00000000-0000-0000-0000-000000000000',
                        :id, 'authenticated', 'authenticated', :email,
                        extensions.crypt(:password, extensions.gen_salt('bf')),
                        NOW(),
                        CAST(:app_meta AS jsonb),
                        CAST(:user_meta AS jsonb),
                        NOW(),
                        NOW()
                    )
                """),
                {
                    "id": user_id,
                    "email": u["email"],
                    "password": u["password"],
                    "app_meta": app_meta,
                    "user_meta": user_meta
                }
            )
            print(f"Inserted {u['email']} into auth.users with id {user_id}")

        # Ensure profile exists in public.profiles
        profile = conn.execute(
            text("SELECT id FROM profiles WHERE user_id = :uid"),
            {"uid": user_id}
        ).fetchone()

        if not profile:
            conn.execute(
                text("""
                    INSERT INTO profiles (id, user_id, email, name, role, created_at, updated_at)
                    VALUES (gen_random_uuid(), :uid, :email, :name, :role, NOW(), NOW())
                """),
                {
                    "uid": user_id,
                    "email": u["email"],
                    "name": u["name"],
                    "role": u["role"]
                }
            )
            print(f"Created profile for {u['email']} as {u['role']}")
        else:
            print(f"Profile for {u['email']} already exists")

    # Also make sure existing users like swetharavi2425@gmail.com have a profile
    other_users = conn.execute(text("SELECT id, email FROM auth.users")).fetchall()
    for uid, uemail in other_users:
        prof = conn.execute(text("SELECT id FROM profiles WHERE user_id = :uid"), {"uid": uid}).fetchone()
        if not prof:
            conn.execute(
                text("""
                    INSERT INTO profiles (id, user_id, email, name, role, created_at, updated_at)
                    VALUES (gen_random_uuid(), :uid, :email, :name, 'INVENTORY_MANAGER', NOW(), NOW())
                """),
                {"uid": uid, "email": uemail, "name": (uemail or "User").split("@")[0]}
            )
            print(f"Auto-created profile for existing auth user {uemail} as INVENTORY_MANAGER")

print("Done setting up users!")
