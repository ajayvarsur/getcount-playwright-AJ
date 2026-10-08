/**
 * Bill test data factory.
 *
 * Generates unique, non-colliding bill data for each test run
 * using timestamps to prevent duplicates.
 */

export interface BillLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BillData {
  vendorName: string;
  billNumber: string;
  dueDate: string;
  lineItems: BillLineItem[];
  notes: string;
  memo: string;
}

/**
 * Create unique bill test data.
 * Override any field by passing an object with the desired values.
 */
export function createBillData(overrides: Partial<BillData> = {}): BillData {
  const timestamp = Date.now();
  return {
    vendorName: "Test Vendor",
    billNumber: `BILL-${timestamp}`,
    dueDate: getFutureDate(30),
    lineItems: [
      {
        description: `Office Supplies - ${timestamp}`,
        quantity: 1,
        rate: 150.0,
        amount: 150.0,
      },
    ],
    notes: `Automated test bill created at ${new Date().toISOString()}`,
    memo: "Test memo",
    ...overrides,
  };
}

/**
 * Create bill data with multiple line items.
 */
export function createMultiLineBillData(lineCount: number = 3): BillData {
  const timestamp = Date.now();
  const lineItems: BillLineItem[] = [];

  for (let i = 1; i <= lineCount; i++) {
    lineItems.push({
      description: `Expense Line ${i} - ${timestamp}`,
      quantity: i,
      rate: 75.0 * i,
      amount: 75.0 * i * i,
    });
  }

  return createBillData({ lineItems });
}

// ── Helpers ─────────────────────────────────────────────────────

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
