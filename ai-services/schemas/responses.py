from pydantic import BaseModel
from typing import List

class OCRResponse(BaseModel):
    merchant: str | None
    date: str | None
    total_amount: float | None
    category: str | None
    raw_text: str

class VoiceExpenseResponse(BaseModel):
    expense_name: str | None
    amount: float | None
    category: str | None
    payers: List[dict] # Expected: [{"payer_name": str, "amount_paid": float}]
    participant_names: List[str]
    transcript: str
    date_missing: bool
