# AI Trip Expense Tracker

Welcome to the AI Trip Expense Tracker! This project consists of three main parts:
1. **Frontend (Mobile App)** built with React Native and Expo
2. **Backend (Node.js API)** built with Express
3. **AI Service (Python)** built with FastAPI (Handles OCR, Chat, and Budget Predictions)

Before running the application, please make sure you have the following installed on your machine:
- **Node.js** (v18 or newer recommended)
- **Python** (v3.10 or newer recommended)
- **Tesseract OCR** (Required for receipt scanning; must be installed on your operating system: e.g. `C:\Program Files\Tesseract-OCR\tesseract.exe` on Windows)

---

## Step-by-Step Installation & Setup

You will need to run these three services in **three separate terminal windows**.

### 1. Setup the Database and Backend (Node.js)

Open your first terminal window and navigate to the `backend` folder:
```bash
cd backend

# Install all required Node.js packages
npm install

# Start the Node.js API server
npm run dev
# (The server usually runs on http://localhost:8000 or whatever is set in backend/.env)
```

> **Note:** Ensure your database (MySQL/PostgreSQL/MongoDB depending on your config) is running and the `backend/.env` file has the correct database credentials!

---

### 2. Setup the AI Service (Python FastAPI)

This service manages the LLaMA 3.1 AI parsing, Budget prediction, and RAG Chatbot. 

Open a second terminal window and navigate to the `ai-service` folder:
```bash
cd ai-service

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install all required Python packages (FastAPI, Groq, OpenCV, Pytesseract, etc.)
pip install -r requirements.txt

# Download the required spaCy Natural Language Processing model for English
python -m spacy download en_core_web_sm

# Start the FastAPI server
python main.py
# (The AI server runs on http://localhost:5002)
```

> **Important:** The AI service requires a `GROQ_API_KEY` to function. Ensure you have a valid `.env` file in the `ai-service` directory with your Groq API key.

---

### 3. Setup the Mobile App (React Native / Expo)

Open a third terminal window and navigate to the `mobile` folder:
```bash
cd mobile

# Install all required React Native & Expo packages
npm install

# Start the Expo Metro Bundler
npx expo start
```

Once the Expo server starts, you can:
- Press `a` in the terminal to run it on a connected Android emulator.
- Press `i` to run it on an iOS simulator (Mac only).
- Scan the QR code shown in the terminal using the **Expo Go** app on your physical smartphone to test the camera/receipt scanner!

---

### Troubleshooting

- **OCR Timeout or Tesseract Error**: Make sure Tesseract-OCR is installed on your computer. If you are on Windows, ensure it is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe` or update the path in `ai-service/services/ocr_service.py`.
- **Groq/LLaMA Error**: Ensure your `GROQ_API_KEY` in `ai-service/.env` is valid and hasn't exceeded its rate limits.
- **Network Errors on Mobile**: If running on a physical device, make sure your phone and your computer are on the exact same Wi-Fi network. You may need to change the `API_URL` in `mobile/src/constants/api.js` (or similar network config) from `localhost` to your computer's local IP address (e.g. `http://192.168.1.5:8000`).
