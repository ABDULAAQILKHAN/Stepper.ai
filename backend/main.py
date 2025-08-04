from fastapi import FastAPI, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, engine
from models import Base, User
# If you want to skip validation: comment out the next line
from supabase import validate_supabase_token

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <- Change this in production! Set your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()

# Create all tables
Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/sync")
async def sync_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    # 👇 If skipping token verification, comment the next 5 lines and use dummy ID/email
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]
    email = user_data.get("email")

    # 👇 Uncomment if skipping verification
    # user_id = token
    # email = f"{token}@example.com"

    # Check if user exists, else create
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        new_user = User(id=user_id, email=email)
        db.add(new_user)
        db.commit()

    return {"success": True}
