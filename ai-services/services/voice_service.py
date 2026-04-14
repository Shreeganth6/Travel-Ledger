import os
import json
import io
import time
from groq import Groq, APIStatusError
from schemas.responses import VoiceExpenseResponse

VALID_CATEGORIES = ['food', 'transport', 'accommodation', 'shopping', 'entertainment', 'other']

class VoiceService:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def transcribe(self, audio_bytes: bytes, filename: str = "audio.m4a") -> str:
        """
        Use Groq Whisper (whisper-large-v3) to transcribe audio bytes to text.
        Retries up to 3 times on 503 Service Unavailable with exponential backoff.
        """
        max_retries = 3
        retry_delay = 2  # seconds

        for attempt in range(1, max_retries + 1):
            try:
                transcription = self.groq_client.audio.transcriptions.create(
                    file=(filename, audio_bytes),
                    model="whisper-large-v3",
                    language="en",
                    response_format="text",
                )
                return transcription.strip()

            except APIStatusError as e:
                if e.status_code == 503 and attempt < max_retries:
                    print(f"[VoiceService] Groq 503 on attempt {attempt}, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # exponential backoff
                elif e.status_code == 503:
                    raise RuntimeError(
                        "Groq Whisper is temporarily unavailable (503). "
                        "Please try again in a minute or check https://groqstatus.com"
                    ) from e
                else:
                    raise

    def extract_expense(self, transcript: str, members: list[str]) -> VoiceExpenseResponse:
        """
        Use Groq LLM to extract structured expense data from a transcript.
        Supports multiple payers and specific participant isolation.
        """
        members_str = ", ".join(members) if members else "unknown"

        system_prompt = f"""You are an expense parsing assistant.
Extract expense details from a natural language sentence spoken by a user about a shared expense.

Trip members available: [{members_str}]

Return ONLY a valid JSON object with these exact keys:
- "expense_name": (string or null) Short descriptive name of the expense (e.g. "Dinner", "Hotel Stay").
- "amount": (number or null) The TOTAL monetary amount. No currency symbols.
- "category": (string) ONE of EXACTLY: food, transport, accommodation, shopping, entertainment, other.
- "payers": (array of objects) The people who paid. Each object must have:
    - "payer_name": (string) The name of the person who paid.
    - "amount_paid": (number) The specific amount they paid. If only one person paid and no specific amount is given, use the total "amount".
- "participant_names": (array of strings) Names of people sharing this expense. 
    - VERY IMPORTANT: If specific names are mentioned (e.g. "where Hari and Ram shares"), YOU MUST ONLY INCLUDE THOSE SPECIFIC NAMES. Do not include anyone else.
    - If "all" or "everyone" is mentioned, or no specific participants are mentioned, return all trip members.
- "date_mentioned": (boolean) true if a specific date was mentioned in the sentence, false otherwise.

IMPORTANT:
- Do NOT add any extra keys or explanation.
- Match names case-insensitively against the trip members list provided.
- If a name is not in the members list, still include it as-is.
"""

        response = self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Expense sentence: \"{transcript}\""},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        data = json.loads(response.choices[0].message.content)

        # Sanitize total amount
        raw_amount = data.get("amount")
        if isinstance(raw_amount, str):
            raw_amount = raw_amount.replace(",", "").replace("₹", "").replace("$", "")
            try:
                raw_amount = float(raw_amount)
            except ValueError:
                raw_amount = None

        # Sanitize Category
        category = data.get("category", "other")
        if category not in VALID_CATEGORIES:
            category = "other"

        # Sanitize Payers
        payers = data.get("payers", [])
        if not isinstance(payers, list):
            payers = []
        for p in payers:
            # Ensure numbers
            paid_val = p.get("amount_paid")
            if isinstance(paid_val, str):
                try: p["amount_paid"] = float(paid_val.replace(",", "").replace("₹", "").replace("$", ""))
                except: p["amount_paid"] = 0

        # Participant names — ensure it's a list
        participant_names = data.get("participant_names", [])
        if not isinstance(participant_names, list):
            participant_names = []

        # Default fallback to all members only if the array is completely empty
        if not participant_names and members:
            participant_names = members

        return VoiceExpenseResponse(
            expense_name=data.get("expense_name"),
            amount=raw_amount,
            category=category,
            payers=payers,
            participant_names=participant_names,
            transcript=transcript,
            date_missing=not data.get("date_mentioned", False),
        )

voice_service = VoiceService()
