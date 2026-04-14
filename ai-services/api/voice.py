import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services.voice_service import voice_service
from schemas.responses import VoiceExpenseResponse

router = APIRouter(tags=["Voice Expense"])


@router.post("/voice-expense", response_model=VoiceExpenseResponse)
async def voice_expense(
    audio: UploadFile = File(...),
    members: str = Form(default="[]"),
):
    """
    Accepts an audio file and list of trip member names.
    1. Transcribes the audio with Groq Whisper (free).
    2. Extracts structured expense fields with Groq LLM.
    Returns a JSON object ready to auto-fill the expense form.
    """
    # Validate audio content type
    if not audio.content_type or not (
        audio.content_type.startswith("audio/") or
        audio.content_type in ["application/octet-stream", "video/mp4"]
    ):
        # m4a files are sometimes sent as video/mp4 by mobile apps
        # We allow octet-stream as a fallback too
        pass  # Be lenient — Whisper handles most formats

    try:
        members_list: list[str] = json.loads(members)
    except (json.JSONDecodeError, ValueError):
        members_list = []

    try:
        audio_bytes = await audio.read()
        filename = audio.filename or "recording.m4a"

        # Step 1: Transcribe
        transcript = voice_service.transcribe(audio_bytes, filename)
        if not transcript:
            raise HTTPException(status_code=422, detail="Could not transcribe audio. Please speak clearly and try again.")

        # Step 2: Extract expense fields from transcript
        result = voice_service.extract_expense(transcript, members_list)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[/voice-expense Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Voice processing failed: {str(e)}")
