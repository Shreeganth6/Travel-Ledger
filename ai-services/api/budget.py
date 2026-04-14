from fastapi import APIRouter, HTTPException

from schemas.requests import BudgetData
from services.budget_service import budget_service

router = APIRouter(tags=["Budget Prediction"])

@router.post("/predict")
async def predict_budget(data: BudgetData):
    try:
        prediction = budget_service.predict(
            history_list=data.daily_totals,
            new_expense=data.new_expense,
            total_budget=data.total_budget,
            trip_duration=data.trip_duration
        )
        return {"aiproperty": prediction}
    except Exception as e:
        print(f"DEBUG Error: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))
