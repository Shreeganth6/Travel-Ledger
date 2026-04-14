const axios = require('axios');
const tripService = require('../services/tripService');
const expenseService = require('../services/expenseService');
const { generateTripSummary } = require('../services/tripSummaryService');
const FormData = require('form-data');
const fs = require('fs');

// FastAPI AI Microservice (RAG chatbot + Budget prediction + OCR)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5002';
const AI_CHAT_URL = `${AI_SERVICE_URL}/chat`;
const AI_INDEX_URL = `${AI_SERVICE_URL}/index-trip`;
const AI_REINDEX_URL = `${AI_SERVICE_URL}/reindex-all`;
const AI_HEALTH_URL = `${AI_SERVICE_URL}/health`;
const AI_PREDICT_URL = `${AI_SERVICE_URL}/predict`;
const AI_OCR_URL = `${AI_SERVICE_URL}/extract-receipt`;

// ---------------------------------------------------------------------------
// Internal helper: index a single trip (fire-and-forget safe)
// ---------------------------------------------------------------------------
async function indexTripById(tripId) {
    try {
        const summary = await generateTripSummary(tripId);

        await axios.post(AI_INDEX_URL, {
            trip_id: summary.trip_id,
            trip_name: summary.trip_name,
            summary_text: summary.summary_text
        }, { timeout: 15000 });

        console.log(`[AI] Indexed trip ${tripId} for RAG`);
    } catch (err) {
        // Non-fatal — don't crash the main request if AI service is down
        console.error(`[AI] Failed to index trip ${tripId}:`, err.message);
    }
}

// ---------------------------------------------------------------------------
// POST /api/ai/chat — RAG-powered chat
// Body: { message: "user question" }
// ---------------------------------------------------------------------------
exports.generateInsight = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Step 1: Health check
    try {
        await axios.get(AI_HEALTH_URL, { timeout: 5000 });
    } catch (err) {
        console.error('[AI] Health check failed:', err.message);
        return res.status(500).json({
            success: false,
            message: 'AI service is offline. Please run: python main.py in the ai-service folder (port 5002).'
        });
    }

    // Step 2: Call RAG /chat endpoint
    try {
        const aiResponse = await axios.post(AI_CHAT_URL, {
            query: message
        }, { timeout: 25000 });

        if (aiResponse.data.status === 'success') {
            return res.json({
                success: true,
                message: aiResponse.data.insight,
                sources: aiResponse.data.sources || []
            });
        }

        throw new Error(aiResponse.data.message || 'AI service returned unknown error.');
    } catch (err) {
        console.error('[AI] /chat error:', err.message);
        const aiMsg = err.response?.data?.message || err.message;
        return res.status(500).json({
            success: false,
            message: `AI generation failed: ${aiMsg}`
        });
    }
};

// ---------------------------------------------------------------------------
// POST /api/ai/index-trip — Manually trigger indexing for a trip
// Body: { tripId: number }
// ---------------------------------------------------------------------------
exports.indexTrip = async (req, res) => {
    const { tripId } = req.body;

    if (!tripId) {
        return res.status(400).json({ success: false, message: 'tripId is required.' });
    }

    try {
        const summary = await generateTripSummary(tripId);

        const aiResponse = await axios.post(AI_INDEX_URL, {
            trip_id: summary.trip_id,
            trip_name: summary.trip_name,
            summary_text: summary.summary_text
        }, { timeout: 15000 });

        return res.json({
            success: true,
            message: `Trip ${tripId} indexed successfully`,
            ai_response: aiResponse.data
        });
    } catch (err) {
        console.error('[AI] index-trip error:', err.message);
        return res.status(500).json({
            success: false,
            message: `Indexing failed: ${err.message}`
        });
    }
};

// ---------------------------------------------------------------------------
// POST /api/ai/reindex-all — Reindex all trips for the logged-in user
// ---------------------------------------------------------------------------
exports.reindexAll = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const allTrips = await tripService.getTripsService(userId);

        if (allTrips.length === 0) {
            return res.json({ success: true, message: 'No trips to index', count: 0 });
        }

        // Generate summaries for all trips
        const summaries = [];
        for (const trip of allTrips) {
            try {
                const summary = await generateTripSummary(trip.trip_id);
                summaries.push(summary);
            } catch (err) {
                console.error(`[AI] Skipping trip ${trip.trip_id}: ${err.message}`);
            }
        }

        if (summaries.length === 0) {
            return res.json({ success: true, message: 'No valid summaries generated', count: 0 });
        }

        // Bulk send to AI service
        const aiResponse = await axios.post(AI_REINDEX_URL, {
            trips: summaries.map(s => ({
                trip_id: s.trip_id,
                trip_name: s.trip_name,
                summary_text: s.summary_text
            }))
        }, { timeout: 60000 });

        return res.json({
            success: true,
            message: `${summaries.length} trips reindexed`,
            count: summaries.length,
            ai_response: aiResponse.data
        });

    } catch (err) {
        console.error('[AI] reindex-all error:', err.message);
        return res.status(500).json({
            success: false,
            message: `Reindex failed: ${err.message}`
        });
    }
};

// ---------------------------------------------------------------------------
// GET /api/ai/debug — Quick diagnostic
// ---------------------------------------------------------------------------
exports.debugAI = async (req, res) => {
    const report = { ai_service: false, chroma: false, db_trips: false };

    // Test FastAPI + ChromaDB
    try {
        const healthRes = await axios.get(AI_HEALTH_URL, { timeout: 4000 });
        report.ai_service = true;
        report.chroma = healthRes.data.chroma === 'ready';
        report.indexed_trips = healthRes.data.indexed_trips || 0;
        report.embedding_model = healthRes.data.embedding_model;
    } catch (e) {
        report.ai_service_error = e.message;
    }

    // Test DB
    try {
        const userId = req.user?.user_id || 1;
        const trips = await tripService.getTripsService(userId);
        report.db_trips = true;
        report.trip_count = trips.length;
    } catch (e) {
        report.db_trips_error = e.message;
    }

    return res.json({ success: true, report });
};

// ---------------------------------------------------------------------------
// POST /api/ai/predict — Budget prediction using Linear Regression + K-Means
// Body: { tripId: number, new_expense: number }
// ---------------------------------------------------------------------------
exports.predictBudget = async (req, res) => {
    const { tripId, new_expense } = req.body;

    if (!tripId || new_expense === undefined) {
        return res.status(400).json({ success: false, message: 'tripId and new_expense are required.' });
    }

    try {
        const insight = await getPredictionForTrip(tripId, new_expense);
        return res.json({ success: true, aiInsight: insight });
    } catch (err) {
        console.error('[AI] /predict error:', err.message);
        return res.status(500).json({ success: false, message: `Prediction failed: ${err.message}` });
    }
};

// ---------------------------------------------------------------------------
// Internal helper: get prediction for a trip (used by expense creation too)
// ---------------------------------------------------------------------------
async function getPredictionForTrip(tripId, newExpenseAmount) {
    try {
        // 1. Get trip details for budget and duration
        const tripData = await tripService.getTripByIdService(tripId);
        const trip = tripData.trip;

        const startDate = new Date(trip.start_date);
        const endDate = new Date(trip.end_date);
        const tripDuration = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

        // 2. Get daily spending totals
        const dailyTotals = await expenseService.getDailyTotalsService(tripId);

        // 3. Call FastAPI prediction service
        const aiResponse = await axios.post(AI_PREDICT_URL, {
            daily_totals: dailyTotals,
            new_expense: parseFloat(newExpenseAmount),
            total_budget: parseFloat(trip.budget) || 0,
            trip_duration: tripDuration
        }, { timeout: 10000 });

        return aiResponse.data.aiproperty;
    } catch (err) {
        console.error(`[AI] Prediction failed for trip ${tripId}:`, err.message);
        // Return a safe default so expense creation isn't blocked
        return null;
    }
}

// Expose helpers so controllers can fire-and-forget
exports.indexTripById = indexTripById;
exports.getPredictionForTrip = getPredictionForTrip;

// ---------------------------------------------------------------------------
// POST /api/ai/extract-receipt — Extract data from receipt image using OCR
// ---------------------------------------------------------------------------
exports.extractReceipt = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    try {
        // We will forward the file to the FastAPI service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path), {
            filename: req.file.originalname || 'receipt.jpg',
            contentType: req.file.mimetype || 'image/jpeg'
        });

        const aiResponse = await axios.post(AI_OCR_URL, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000 // OCR might take a little longer
        });

        // Clean up the temp file created by multer
        fs.unlinkSync(req.file.path);

        return res.json({ success: true, data: aiResponse.data });
    } catch (err) {
        // Clean up file if there is an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('[AI] /extract-receipt error:', err.message);
        return res.status(500).json({ success: false, message: `OCR extraction failed: ${err.message}` });
    }
};

// ---------------------------------------------------------------------------
// POST /api/ai/voice-expense — Transcribe audio + extract expense via Groq
// Body: multipart form with audio file + members (JSON string list of member names)
// ---------------------------------------------------------------------------
const AI_VOICE_URL = `${AI_SERVICE_URL}/voice-expense`;

exports.extractVoiceExpense = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No audio file provided' });
    }

    try {
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(req.file.path), {
            filename: req.file.originalname || 'recording.m4a',
            contentType: req.file.mimetype || 'audio/m4a',
        });

        // Pass member names as a JSON string
        const members = req.body.members || '[]';
        formData.append('members', members);

        const aiResponse = await axios.post(AI_VOICE_URL, formData, {
            headers: { ...formData.getHeaders() },
            timeout: 60000,
        });

        fs.unlinkSync(req.file.path);

        return res.json({ success: true, data: aiResponse.data });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('[AI] /voice-expense error:', err.message);
        const detail = err.response?.data?.detail || err.message;
        return res.status(500).json({ success: false, message: `Voice expense failed: ${detail}` });
    }
};
