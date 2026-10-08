import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { createBillData } from "../../src/data/bill-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * REGRESSION: Ledger Balance / Double-Entry Suite
 *
 * Verifies that the fundamental accounting principle (Debits = Credits)
 * is maintained across all financial transactions in COUNT:
 * 1. Invoice creation: Accounts Receivable (Debit) = Revenue (Credit)
 * 2. Bill creation: Expense (Debit) = Accounts Payable (Credit)
 * 3. Payment recording: Undeposited Funds/Cash (Debit) = Accounts Receivable (Credit)
 *
 * @regression @p0 @accounting
 */
test.describe("Ledger Balance / Double-Entry Suite", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression @p0 @accounting @destructive should verify debits equal credits after Invoice creation", async ({
    invoicePage,
    journalEntriesPage,
  }) => {
    const invoiceData = createInvoiceData();
    let customerName = "";
    const rate = 1000;
    const qty = 1;
    const expectedTotal = rate * qty;
    const formattedTotal = `$${expectedTotal.toFixed(2)}`;
    const invoiceNumber = `INV-${Date.now()}`;

    await test.step("Create and approve an invoice for $1,000", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");

      await invoicePage.fillTitle(`Ledger Invoice ${invoiceNumber}`);
      customerName = await invoicePage.selectRandomCustomer();

      await invoicePage.fillInvoiceNumber(invoiceNumber);
      await invoicePage.addCustomLineItem("Double Entry Consulting", qty, rate);

      await invoicePage.saveAndApprove();
      entityRegistry.track({ type: "invoice", reference: invoiceNumber });

      // Dismiss Online Payments modal if it pops up
      try {
        const skipBtn = invoicePage.page
          .getByRole("button", { name: "Skip" })
          .first();
        await skipBtn.waitFor({ state: "visible", timeout: 5000 });
        await skipBtn.click({ force: true });
      } catch {
        // Modal didn't appear, proceed
      }
    });

    await test.step("Verify journal entry debits equal credits", async () => {
      await journalEntriesPage.goto();

      // Verify that total Debits = total Credits = $1,000.00
      await journalEntriesPage.verifyDebitsEqualCredits(
        invoiceNumber,
        formattedTotal,
      );
    });
  });

  test("@regression @p0 @accounting @destructive should verify debits equal credits after Bill creation", async ({
    billPage,
    journalEntriesPage,
  }) => {
    const billData = createBillData();
    const billNumber = billData.billNumber;
    const expectedTotal = 500;
    const formattedTotal = `$${expectedTotal.toFixed(2)}`;

    await test.step("Create and approve a bill for $500", async () => {
      await billPage.goto();
      await billPage.openCreateBillForm();

      await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billNumber);
      await billPage.fillMemo(billData.notes);
      await billPage.fillLineItem(0, "Ledger Office Supplies", expectedTotal);

      await billPage.createAndApprove();
      entityRegistry.track({ type: "bill", reference: billNumber });
    });

    await test.step("Verify journal entry debits equal credits for bill", async () => {
      await journalEntriesPage.goto();

      // Verify that total Debits = total Credits = $500.00
      await journalEntriesPage.verifyDebitsEqualCredits(
        billNumber,
        formattedTotal,
      );
    });
  });

  test("@regression @p0 @accounting @destructive should verify debits equal credits after Payment recording", async ({
    invoicePage,
    journalEntriesPage,
  }) => {
    const invoiceData = createInvoiceData();
    let customerName = "";
    const paymentAmount = 400;
    const formattedAmount = `$${paymentAmount.toFixed(2)}`;
    const invoiceNumber = `INV-${Date.now()}`;

    await test.step("Create and approve an invoice", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");

      await invoicePage.fillTitle(
        `Payment Ledger Invoice ${invoiceData.invoiceNumber}`,
      );
      customerName = await invoicePage.selectRandomCustomer();

      await invoicePage.fillInvoiceNumber(invoiceNumber);

      await invoicePage.addCustomLineItem("Service Retainer", 1, 400);

      await invoicePage.saveAndApprove();
      entityRegistry.track({ type: "invoice", reference: invoiceNumber });

      try {
        const skipBtn = invoicePage.page
          .getByRole("button", { name: "Skip" })
          .first();
        await skipBtn.waitFor({ state: "visible", timeout: 5000 });
        await skipBtn.click({ force: true });
      } catch {
        // Modal didn't appear, proceed
      }
    });

    await test.step("Record full payment for the invoice", async () => {
      await invoicePage.goto();
      await invoicePage.recordPayment(invoiceNumber);
    });

    await test.step("Verify payment journal entry debits equal credits", async () => {
      await journalEntriesPage.goto();

      await journalEntriesPage.verifyDebitsEqualCredits(
        invoiceNumber,
        formattedAmount,
      );
    });
  });
});
