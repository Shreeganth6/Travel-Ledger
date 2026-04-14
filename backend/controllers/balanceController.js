const { calculateTripBalances } = require('../services/balanceService');
const {
  generateSettlementSuggestions,
  recordSettlement,
  getTripSettlements
} = require('../services/settlementService');
const { getTripSummary } = require('../services/tripService');
const { indexTripById } = require('./aiController');

/**
 * GET /api/trips/:tripId/balances
 */
exports.getTripBalances = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const userId = req.user.user_id; // from auth middleware

    const balances = await calculateTripBalances(tripId, userId);

    res.status(200).json({
      success: true,
      data: balances
    });

  } catch (error) {
    console.error('Balance Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * GET /api/trips/:tripId/settlement-suggestions
 */
exports.getSettlementSuggestions = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const userId = req.user.user_id;

    const balances = await calculateTripBalances(tripId, userId);
    const suggestions = generateSettlementSuggestions(balances);

    res.status(200).json({
      success: true,
      data: {
        balances,
        settlements: suggestions,
        total_transactions: suggestions.length
      }
    });

  } catch (error) {
    console.error('Settlement Suggestion Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * POST /api/trips/:tripId/settlements
 */
exports.createSettlement = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const { payer_user_id, receiver_user_id, amount, payment_method, paid_currency, paid_amount } = req.body;

    // 1. Check Trip Status first
    const trip = await getTripSummary(tripId);
    if (trip.status !== 'done') {
      return res.status(403).json({
        success: false,
        message: 'Settlements can only be recorded after the trip has ended.'
      });
    }

    if (!payer_user_id || !receiver_user_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'payer_user_id, receiver_user_id and amount are required'
      });
    }

    const settlement = await recordSettlement(
      tripId,
      Number(payer_user_id),
      Number(receiver_user_id),
      Number(amount),
      payment_method || 'upi',
      paid_currency,
      paid_amount ? Number(paid_amount) : null
    );

    // Fire-and-forget: re-index trip with updated settlement data
    indexTripById(tripId);

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: settlement
    });

  } catch (error) {
    console.error('Create Settlement Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * GET /api/trips/:tripId/settlements
 */
exports.getTripSettlementsHistory = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const settlements = await getTripSettlements(tripId);

    res.status(200).json({
      success: true,
      data: settlements
    });

  } catch (error) {
    console.error('Settlement History Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * GET /api/trips/:tripId/summary
 */
exports.getCompleteTripSummary = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const userId = req.user.user_id;

    const summary = await getTripSummary(tripId);
    const balances = await calculateTripBalances(tripId, userId);
    const suggestions = generateSettlementSuggestions(balances);
    const settlements = await getTripSettlements(tripId);

    res.status(200).json({
      success: true,
      data: {
        trip: summary,
        user_role: req.user.role,
        balances,
        settlement_suggestions: suggestions,
        settlement_history: settlements
      }
    });

  } catch (error) {
    console.error('Trip Summary Error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
