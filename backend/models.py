import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Text
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)

class UserAiModels(Base):
    __tablename__ = "user_ai_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)
    model_id = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    api_key = Column(Text, nullable=False)

class UserSelectedAiModel(Base):
    __tablename__ = "user_selected_ai_model"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)
    model_id = Column(Text, nullable=False)