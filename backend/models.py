from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
import uuid
from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    roasts = relationship("Roast", back_populates="owner", cascade="all, delete-orphan")

class Roast(Base):
    __tablename__ = "roasts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    github_username = Column(String, nullable=False)
    roast_text = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=False) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="roasts")