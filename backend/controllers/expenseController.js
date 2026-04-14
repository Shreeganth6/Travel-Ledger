const expenseService = require('../services/expenseService');
const notificationService = require('../services/notificationService');
const { indexTripById, getPredictionForTrip } = require('./aiController');
const db = require('../config/db');

exports.createExpense = async (req, res) => {
  try {
    const tripId = Number(req.params.tripId);
    const actorUserId = req.user.user_id;

    const result = await expenseService.createExpenseService(req.body, tripId);

    // Fire-and-forget: re-index trip in ChromaDB with new expense data
    indexTripById(tripId);

    // Get AI budget prediction (non-blocking — returns null on failure)
    const totalAmount = parseFloat(req.body.total_amount) || 0;
    const aiInsight = await getPredictionForTrip(tripId, totalAmount);

    // Send notification to all other trip members
    const [actorRows] = await db.query(
      `SELECT full_name FROM Users WHERE user_id = ?`,
      [actorUserId]
    );
    const actorName = actorRows.length > 0 ? actorRows[0].full_name : 'Someone';
    const expenseName = req.body.expense_name || 'an expense';

    notificationService.createNotificationsForTrip(
      tripId,
      'expense_added',
      `${actorName} added expense "${expenseName}" – ₹${totalAmount}`,
      actorUserId
    );

    res.status(201).json({
      success: true,
      data: result,
      aiInsight: aiInsight,
      message: "Expense created successfully"
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


exports.getTripExpenses = async (req, res) => {
  try {
    const data = await expenseService.getTripExpensesService(
      req.params.tripId
    );

    res.json({ success: true, data });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getExpenseById = async (req, res) => {
  try {
    const expenseId = Number(req.params.expenseId);
    const data = await expenseService.getExpenseByIdService(expenseId);

    res.json({ 
      success: true, 
      data,
      userRole: req.user ? req.user.role : null
    });

  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};


exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.expenseId);
    const actorUserId = req.user.user_id;

    // deleteExpenseService returns { expense_name, trip_id }
    const { expense_name, trip_id } = await expenseService.deleteExpenseService(expenseId);

    // Fire-and-forget: re-index trip after deletion
    indexTripById(trip_id);

    // Notify all other trip members about the deletion
    const [actorRows] = await db.query(
      `SELECT full_name FROM Users WHERE user_id = ?`,
      [actorUserId]
    );
    const actorName = actorRows.length > 0 ? actorRows[0].full_name : 'Admin';

    notificationService.createNotificationsForTrip(
      trip_id,
      'expense_deleted',
      `${actorName} deleted expense "${expense_name}"`,
      actorUserId
    );

    res.json({ success: true, message: 'Expense deleted successfully' });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
