from pydantic import BaseModel
from typing import List
from uuid import UUID 
class CreateModelRequest(BaseModel):
    model_id: str
    name: str
    model: str
    api_key: str

class ModelResponse(BaseModel):
    id: UUID
    model_id: str
    name: str
    model: str
    api_key: str
    class Config:
        orm_mode = True

class UserSelectedAiModelResponse(BaseModel):
    id: UUID
    user_id: str
    model_id: str

class SelectModelRequest(BaseModel):
    model_id: str

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
