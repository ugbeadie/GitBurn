from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    
    class Config:
        from_attributes = True

class RoastRequest(BaseModel):
    github_username: str

class RoastResponse(BaseModel):
    id: str
    github_username: str
    roast_text: str
    metrics_json: str
    created_at: datetime

    class Config:
        from_attributes = True