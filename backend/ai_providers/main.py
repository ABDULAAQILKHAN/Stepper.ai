from fastapi import FastAPI, Depends, Security, Path, Request, Response, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from database import SessionLocal, engine
from models import Base, User, UserAiModels, UserSelectedAiModel
from supabase import validate_supabase_token
from schema import CreateModelRequest, ModelResponse, UserSelectedAiModelResponse, SelectModelRequest, ChatRequest, ChatMessage
from ai_service import ai_service

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

    # Check if model with same model_id exists for the user
    existing_model = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == data.model_id
    ).first()

    if existing_model:
        # Check if model or api_key changed
        if existing_model.model != data.model or existing_model.api_key != data.api_key:
            # Update existing model details
            existing_model.model = data.model
            existing_model.api_key = data.api_key
            existing_model.name = data.name  # optionally update the name too
            db.commit()
            db.refresh(existing_model)
        
        # Return existing or updated model
        return existing_model

    # No existing model found, create a new one
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


@app.get("/ai-providers")
async def get_available_providers():
    """Get list of available AI providers"""
    providers = ai_service.get_available_providers()
    return {"success": True, "providers": providers}


@app.post("/chat")
async def chat_endpoint_non_stream(
    request: Request,
    data: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]
    print("user_id:", user_id)
    selection = db.query(UserSelectedAiModel).filter(UserSelectedAiModel.user_id == user_id).first()
    if not selection:
        return JSONResponse(status_code=404, content={"success": False, "error": "No selected model found"})
    print("selection details")
    print(selection.model_id)
    model_entry = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == selection.model_id,
    ).first()

    if not model_entry or not model_entry.api_key:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "API key is missing for the selected model"},
        )

    try:
        # Convert messages to dict format
        messages = [{"role": msg.role, "content": msg.content} for msg in data.messages]
        print("model_entry details")
        print(model_entry.model_id, model_entry.api_key, model_entry.model)
        # Generate response using AI service
        response = await ai_service.generate_response(
            messages,
            model_entry.model      # model name
            model_entry.api_key,
            model_entry.model_id,  # provider_id (e.g., "gemini")
        )
        
        return {"success": True, "response": response}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/chats")
async def chat_endpoint_stream(
    request: Request,
    response: Response,
    data: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    user_data = await validate_supabase_token(token)
    if not user_data:
        return JSONResponse(status_code=401, content={"success": False, "error": "Invalid token"})

    user_id = user_data["sub"]

    # Fetch user's selected AI model
    selection = db.query(UserSelectedAiModel).filter(UserSelectedAiModel.user_id == user_id).first()
    if not selection:
        return JSONResponse(status_code=404, content={"success": False, "error": "No selected model found"})

    model_entry = db.query(UserAiModels).filter(
        UserAiModels.user_id == user_id,
        UserAiModels.model_id == selection.model_id,
    ).first()

    if not model_entry:
        return JSONResponse(status_code=404, content={"success": False, "error": "Model not found"})

    # Validate API key
    if not model_entry.api_key:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "API key is missing for the selected model"},
        )

    # Convert messages to dict format
    messages = [{"role": msg.role, "content": msg.content} for msg in data.messages]
    
    # Create queue for streaming
    queue = asyncio.Queue()

    # Callback to handle chunks from AI service
    def on_chunk(chunk):
        queue.put_nowait(chunk)

    # Start AI streaming in background
    async def start_ai_stream():
        await ai_service.stream_chat(
            messages,
            model_entry.model_id,  # provider_id (e.g., "gemini")
            model_entry.api_key,
            model_entry.model,     # model name
            on_chunk
        )

    # Start the AI streaming task
    asyncio.create_task(start_ai_stream())

    # Event generator for SSE
    async def event_generator():
        while True:
            chunk = await queue.get()
            
            if chunk.get("error"):
                yield f"event: error\ndata: {chunk['error']}\n\n"
                break

            if chunk["isComplete"]:
                yield "event: done\ndata: \n\n"
                break

            # Send content chunks
            yield f"data: {chunk['content']}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
