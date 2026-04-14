const db = require('./config/db');

async function reconcileSplits() {
    console.log('--- Starting Split Reconciliation ---');
    try {
        // 1. Find mismatched expenses
        const [mismatched] = await db.query(`
            SELECT e.expense_id, e.total_amount, SUM(es.split_amount) AS sum_splits
            FROM Expenses e
            JOIN Expense_Splits es ON e.expense_id = es.expense_id
            GROUP BY e.expense_id
            HAVING ABS(e.total_amount - sum_splits) > 0.001
        `);

        console.log(`Found ${mismatched.length} expenses with rounding issues.`);

        for (const exp of mismatched) {
            const diff = Number((exp.total_amount - exp.sum_splits).toFixed(2));
            console.log(`Expense ID: ${exp.expense_id} | Total: ${exp.total_amount} | Current Sum: ${exp.sum_splits} | Adjustment: ${diff}`);

            // 2. Find the last split for this expense to adjust it
            const [splits] = await db.query(
                'SELECT split_id, split_amount FROM Expense_Splits WHERE expense_id = ? ORDER BY split_id DESC LIMIT 1',
                [exp.expense_id]
            );

            if (splits.length > 0) {
                const targetSplit = splits[0];
                const newAmount = Number((parseFloat(targetSplit.split_amount) + diff).toFixed(2));
                
                await db.query(
                    'UPDATE Expense_Splits SET split_amount = ? WHERE split_id = ?',
                    [newAmount, targetSplit.split_id]
                );
                console.log(`  Updated split_id ${targetSplit.split_id}: ${targetSplit.split_amount} -> ${newAmount}`);
            }
        }

        console.log('--- Reconciliation Finished ---');
    } catch (err) {
        console.error('Reconciliation Error:', err);
    } finally {
        process.exit();
    }
}

reconcileSplits();
