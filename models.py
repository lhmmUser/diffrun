from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone
from typing import Optional, List

class UserDetails(BaseModel):
    job_id: str
    name: str
    gender: str
    job_type: Optional[str] = None      
    book_id: Optional[str] = None       
    saved_files: List[str] = []
    preview_url: str
    user_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    paid: bool = False
    approved: bool = False
    order_id: Optional[str] = None
    workflow_status: str = "initiated"
    locale: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class PreviewEmailRequest(BaseModel):
    name: str
    email: EmailStr
    preview_url: str

class BookStylePayload(BaseModel):
    job_id: str
    book_style: str