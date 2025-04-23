from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional

class UserDetails(BaseModel):
    job_id: str
    name: str
    gender: str
    preview_url: str
    user_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    paid: bool = False
    approved: bool = False
    order_id: Optional[str] = None
    workflow_status: str = "initiated"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))