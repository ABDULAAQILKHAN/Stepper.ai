from fastapi import FastAPI, Depends, Security, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, engine
from models import Base, User, UserAiModels, UserSelectedAiModel
from supabase import validate_supabase_token
from schema import CreateModelRequest, ModelResponse, UserSelectedAiModelResponse, SelectModelRequest
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
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]
    email = user_data.get("email")

    # Check if user exists, else create
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        new_user = User(id=user_id, email=email)
        db.add(new_user)
        db.commit()

    return {"success": True}

@app.post("/ai-models", response_model=ModelResponse)
async def create_model(
    data: CreateModelRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]

    # 🔍 Check if model with same model_id and api_key already exists for the user
    existing_model = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == data.model_id,
        UserAiModels.api_key == data.api_key
    ).first()

    if existing_model:
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "error": "Model with the same API key already exists"
            }
        )

    new_model = UserAiModels(
        user_id=user_id,
        model_id=data.model_id,
        name=data.name,
        model=data.model,
        api_key=data.api_key
    )

    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    return new_model


@app.get("/ai-models", response_model=list[ModelResponse])
async def get_user_models(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]
    models = db.query(UserAiModels).filter(UserAiModels.user_id == user_id).all()
    return models

from fastapi import Path
from pydantic import BaseModel

class UpdateModelRequest(BaseModel):
    name: str | None = None
    model: str | None = None
    api_key: str | None = None

@app.patch("/ai-models/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: str = Path(...),
    data: UpdateModelRequest = None,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]
    model_entry = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == model_id
    ).first()

    if not model_entry:
        return JSONResponse(status_code=404, content={"success": False, "error": "Model not found"})

    if data.name is not None:
        model_entry.name = data.name
    if data.model is not None:
        model_entry.model = data.model
    if data.api_key is not None:
        model_entry.api_key = data.api_key

    db.commit()
    db.refresh(model_entry)
    return model_entry



@app.delete("/models/{id}")
async def delete_model(
    id: str = Path(...),
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]

    model_entry = db.query(UserAiModels).filter(
        UserAiModels.id == id,
        UserAiModels.user_id == user_id
    ).first()

    if not model_entry:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Model not found or access denied"}
        )

    db.delete(model_entry)
    db.commit()

    return {"success": True, "message": "Model deleted successfully"}

@app.put("/models/selected", response_model=UserSelectedAiModelResponse)
async def set_selected_model(
    data: SelectModelRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Invalid token"}
        )

    user_id = user_data["sub"]

    existing_selection = db.query(UserSelectedAiModel).filter(
        UserSelectedAiModel.user_id == user_id
    ).first()

    if existing_selection:
        existing_selection.model_id = data.model_id
        db.commit()
        db.refresh(existing_selection)
        return existing_selection

    new_selection = UserSelectedAiModel(
        user_id=user_id,
        model_id=data.model_id
    )

    db.add(new_selection)
    db.commit()
    db.refresh(new_selection)

    return new_selection

@app.get("/models/selected/details", response_model=ModelResponse)
async def get_selected_model_details(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Invalid token"}
        )

    user_id = user_data["sub"]

    # Step 1: Fetch the selected model_id
    selection = db.query(UserSelectedAiModel).filter(
        UserSelectedAiModel.user_id == user_id
    ).first()

    if not selection:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "No selected model found"}
        )

    # Step 2: Fetch full model details
    model_entry = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == selection.model_id
    ).first()

    if not model_entry:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Model not found"}
        )

    return model_entry
