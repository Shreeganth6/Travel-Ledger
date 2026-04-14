/**
 * expenseModel.js
 * Standardized data structures for Expenses and AI Insights
 */

// 1. Define the structure of an AI Insight
export const AIInsightInitialState = {
    forecast_total: 0,
    is_over_budget: false,
    anomaly_detected: false,
    status: "NORMAL", // Options: "NORMAL", "WARNING", "CRITICAL"
};

// 2. Define the structure for a New Expense Request
// Use this to ensure your frontend keys match your Node.js backend keys
export const createEmptyExpense = () => ({
    expense_name: "",
    total_amount: 0,
    expense_date: new Date().toISOString().split('T')[0], // Defaults to today (YYYY-MM-DD)
    category: "",
    description: "",
    split_type: "equal",
    payers: [], // Array of { user_id, amount_paid }
    participants: [] // Array of { user_id }
});

// 3. Define the structure of the Backend Response
export const ExpenseResponseModel = {
    success: false,
    data: {
        expense_id: null
    },
    aiInsight: AIInsightInitialState,
    message: ""
};