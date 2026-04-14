import os
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables FIRST before importing routers that rely on them
load_dotenv()

from api import rag, budget, ocr, voice

app = FastAPI(title="AI Service — Modular Architecture (RAG, Budget, OCR, Voice)")

# Include Routers
app.include_router(rag.router)
app.include_router(budget.router)
app.include_router(ocr.router)
app.include_router(voice.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    print(f"[AI Service] Starting modular FastAPI on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)