/**
 * Invoice test data factory.
 *
 * Generates unique, non-colliding invoice data for each test run
 * using timestamps to prevent duplicates.
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  customerName: string;
  invoiceNumber: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  notes: string;
  memo: string;
}

/**
 * Create unique invoice test data.
 * Override any field by passing an object with the desired values.
 */
export function createInvoiceData(
  overrides: Partial<InvoiceData> = {},
): InvoiceData {
  const timestamp = Date.now();
  return {
    customerName: "Test Customer",
    invoiceNumber: `INV-${timestamp}`,
    dueDate: getFutureDate(30),
    lineItems: [
      {
        description: `Consulting Service - ${timestamp}`,
        quantity: 1,
        rate: 250.0,
        amount: 250.0,
      },
    ],
    notes: `Automated test invoice created at ${new Date().toISOString()}`,
    memo: "Test memo",
    ...overrides,
  };
}

/**
 * Create invoice data with multiple line items.
 */
export function createMultiLineInvoiceData(lineCount: number = 3): InvoiceData {
  const timestamp = Date.now();
  const lineItems: InvoiceLineItem[] = [];

  for (let i = 1; i <= lineCount; i++) {
    lineItems.push({
      description: `Service Line ${i} - ${timestamp}`,
      quantity: i,
      rate: 100.0 * i,
      amount: 100.0 * i * i,
    });
  }

  return createInvoiceData({ lineItems });
}

// ── Helpers ─────────────────────────────────────────────────────

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}
