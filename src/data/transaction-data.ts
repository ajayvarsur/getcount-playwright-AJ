/**
 * Transaction test data factory.
 *
 * Generates unique, non-colliding transaction data for each test run.
 */

export interface TransactionData {
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
  payee: string;
}

/**
 * Create unique transaction test data.
 */
export function createTransactionData(
  overrides: Partial<TransactionData> = {},
): TransactionData {
  const timestamp = Date.now();
  return {
    description: `Test Transaction - ${timestamp}`,
    amount: 500.0,
    date: getTodayDate(),
    category: "General",
    type: "expense",
    payee: "Test Payee",
    ...overrides,
  };
}

/**
 * Create an income transaction.
 */
export function createIncomeTransaction(
  overrides: Partial<TransactionData> = {},
): TransactionData {
  return createTransactionData({
    type: "income",
    description: `Income - ${Date.now()}`,
    amount: 1000.0,
    category: "Revenue",
    payee: "Test Client",
    ...overrides,
  });
}

/**
 * Create an expense transaction.
 */
export function createExpenseTransaction(
  overrides: Partial<TransactionData> = {},
): TransactionData {
  return createTransactionData({
    type: "expense",
    description: `Expense - ${Date.now()}`,
    amount: 200.0,
    category: "Office Supplies",
    payee: "Test Vendor",
    ...overrides,
  });
}

// ── Helpers ─────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}
