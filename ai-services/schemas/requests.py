from pydantic import BaseModel

class IndexTripRequest(BaseModel):
    trip_id: int
    summary_text: str
    trip_name: str | None = None

class ReindexTrip(BaseModel):
    trip_id: int
    summary_text: str
    trip_name: str | None = None

class ReindexAllRequest(BaseModel):
    trips: list[ReindexTrip]

class ChatRequest(BaseModel):
    query: str

class BudgetData(BaseModel):
    daily_totals: list[float]
    new_expense: float
    total_budget: float
    trip_duration: int = 10

class VoiceExpenseRequest(BaseModel):
    text: str
    members: list[str] = []
