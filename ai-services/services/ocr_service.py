import re
import cv2
import numpy as np
import pytesseract
import spacy
import os
import json
from groq import Groq

# Load NLP model (NER)
nlp = spacy.load("en_core_web_sm")

from schemas.responses import OCRResponse

class OCRService:
    def __init__(self):
        # Configuration for Tesseract on Windows
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Initialize Groq client for robust text parsing
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    def extract_receipt(self, image_bytes: bytes) -> OCRResponse:
        # 1. Image Preprocessing
        img_array = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        # Resize large images to speed up OCR significantly
        max_dim = 1500
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        
        # Convert to grayscale, threshold, denoise
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

        # 2. OCR Extraction
        text = pytesseract.image_to_string(gray, lang='eng')

        # 3. Information Extraction (Attempt LLM first for best accuracy)
        try:
            return self._extract_with_llm(text)
        except Exception as e:
            print(f"[OCR] LLM extraction failed, falling back to Regex/NER: {e}")
            merchant = self._extract_merchant(text)
            date = self._extract_date(text)
            total_amount = self._extract_total(text)
            category = self._categorize_merchant(merchant, text)

            return OCRResponse(
                merchant=merchant,
                date=date,
                total_amount=total_amount,
                category=category,
                raw_text=text
            )

    def _extract_with_llm(self, text: str) -> OCRResponse:
        system_prompt = """
        You are a highly accurate receipt parsing AI. 
        Extract the following information from the raw OCR text of a receipt.
        CRITICAL RULES:
        1. Return ONLY a valid JSON object. No markdown formatting, no explanations.
        2. Expected keys:
           - "merchant": (string or null) The name of the store/vendor.
           - "date": (string or null) The date of the receipt in YYYY-MM-DD format if possible.
           - "total_amount": (float or null) The final total amount paid (the largest logical number representing the total). Do not include currency symbols.
           - "category": (string) Must be ONE of these exact categories: 'food', 'transport', 'accommodation', 'shopping', 'entertainment', 'other'.
        
        If a value cannot be found, use null.
        """
        
        # Ensure we don't send too much text and hit token limits
        truncated_text = text[:3000]

        response = self.groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Raw Receipt Text:\n{truncated_text}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result_json = response.choices[0].message.content
        data = json.loads(result_json)
        
        amount = data.get("total_amount")
        if isinstance(amount, str):
            amount = amount.replace(',', '').replace('$', '').replace('₹', '')
            try:
                amount = float(amount)
            except ValueError:
                amount = None

        return OCRResponse(
            merchant=data.get("merchant"),
            date=data.get("date"),
            total_amount=amount,
            category=data.get("category", "other"),
            raw_text=text
        )

    def _extract_merchant(self, text: str) -> str | None:
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            return None
        # Often the first or second line is the merchant name
        # We can also use NER to find ORG (Organizations)
        doc = nlp(text)
        orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        
        # Prefer the first large text (line 1 or 2) if no ORG is confidently found
        # Or just return the first reasonable text line
        if orgs:
            # Check if the org is near the top
            for line in lines[:3]:
                for org in orgs:
                    if org.lower() in line.lower():
                        return line
            return orgs[0]
        
        # Fallback to the first line that is more than 3 chars and contains letters
        for line in lines[:3]:
            if len(line) > 3 and any(c.isalpha() for c in line):
                return line
        return None

    def _extract_date(self, text: str) -> str | None:
        # Matches patterns like 12/31/2023, 12-31-2023, 2023-12-31, 12/31/23, 12.31.2023
        date_pattern = r'\b(\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4})\b'
        match = re.search(date_pattern, text)
        if match:
            return match.group(1).replace('.', '-')
            
        doc = nlp(text)
        dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
        return dates[0] if dates else None

    def _extract_total(self, text: str) -> float | None:
        lines = [line.strip().lower() for line in text.split('\n')]
        
        # 1. Look for explicit total keywords (now supporting lack of decimals)
        total_pattern = r'(?:total|amount|due|pay|usd|inr|rs).{0,15}?[$₹]?\s*(\d+(?:[.,]\d{2})?)'
        match = re.search(total_pattern, text, re.IGNORECASE)
        if match:
            try:
                val = match.group(1).replace(',', '.')
                return float(val)
            except ValueError:
                pass
                
        # 2. Extract ALL numbers on the receipt and pick the max one
        # This is a common heuristic since total is usually the largest printed number
        number_pattern = r'\b(\d{1,5}(?:[.,]\d{1,2})?)\b'
        matches = re.findall(number_pattern, text)
        if matches:
            vals = []
            for v in matches:
                try:
                    num = float(v.replace(',', '.'))
                    if num < 100000: # Sanity check to avoid phone numbers / zip codes
                        vals.append(num)
                except ValueError:
                    continue
            if vals:
                return max(vals)
                
        return None

    def _categorize_merchant(self, merchant: str | None, text: str) -> str | None:
        # Map to app categories: accommodation, food, transport, entertainment, shopping, other
        if not merchant:
            return 'other'
        
        merchant_lower = merchant.lower()
        text_lower = text.lower()
        
        food_keywords = ['restaurant', 'cafe', 'food', 'market', 'grocery', 'grill', 'pizza', 'burger', 'coffee', 'diner']
        transport_keywords = ['uber', 'lyft', 'taxi', 'airlines', 'flight', 'train', 'bus', 'fuel', 'station', 'gas']
        accommodation_keywords = ['hotel', 'motel', 'inn', 'resort', 'airbnb', 'suites']
        shopping_keywords = ['store', 'mart', 'supermarket', 'mall', 'shop', 'target', 'walmart']
        entertainment_keywords = ['cinema', 'movie', 'ticket', 'park', 'museum', 'theater', 'golf']
        
        if any(kw in merchant_lower or kw in text_lower for kw in food_keywords): return 'food'
        if any(kw in merchant_lower for kw in transport_keywords): return 'transport'
        if any(kw in merchant_lower for kw in accommodation_keywords): return 'accommodation'
        if any(kw in merchant_lower for kw in shopping_keywords): return 'shopping'
        if any(kw in merchant_lower for kw in entertainment_keywords): return 'entertainment'
        
        return 'other'

ocr_service = OCRService()
