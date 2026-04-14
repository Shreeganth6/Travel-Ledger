from fastapi import APIRouter, HTTPException, File, UploadFile
from services.ocr_service import ocr_service
from schemas.responses import OCRResponse

router = APIRouter(tags=["Document OCR"])

@router.post("/extract-receipt", response_model=OCRResponse)
async def extract_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        contents = await file.read()
        response = ocr_service.extract_receipt(contents)
        return response
    except Exception as e:
        print(f"[/extract-receipt Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
