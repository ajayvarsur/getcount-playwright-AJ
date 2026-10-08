import { test, expect } from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { createBillData } from "../../src/data/bill-data";
import { selectActiveWorkspace } from "../../src/utils/helpers";
import { ENV } from "../../src/utils/env";

/**
 * E2E: Cross-Module Data Integrity Suite
 *
 * Verifies financial data integrity across all system touchpoints:
 * 1. Invoice -> Journal Entry -> Payment Recording -> Balance Zeroing -> P&L Reconciliation
 * 2. Bill -> Journal Entry -> Matching Transaction -> Payment Recording -> Balance Zeroing -> P&L Reconciliation
 *
 * @e2e @p0 @data-integrity @accounting
 */
test.describe("Cross-Module Data Integrity Suite", () => {
  test.setTimeout(240_000); // Extended timeout for multi-step accounting flows

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@e2e @p0 should maintain strict data integrity throughout full Invoice lifecycle to Reports", async ({
    invoicePage,
    journalEntriesPage,
    reportsPage,
  }) => {
    const invoiceData = createInvoiceData();
    let customerName: string = "";
    const invoiceAmount = 500;
    const formattedAmount = `$${invoiceAmount.toFixed(2)}`;

    // ── STEP 1: Create and Approve Invoice ────────────────────────────────────
    await test.step("Create and approve an invoice for $500.00", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("networkidle");

      await invoicePage.fillTitle(
        `Integrity Invoice ${invoiceData.invoiceNumber}`,
      );
      await invoicePage.fillInvoiceNumber(invoiceData.invoiceNumber);
      customerName = await invoicePage.selectRandomCustomer();
      await invoicePage.addCustomLineItem(
        "Integrity Consulting Services",
        1,
        invoiceAmount,
      );

      await invoicePage.saveAndApprove();
      await invoicePage.page.waitForTimeout(2000);

      // Dismiss Online Payments modal if it appears
      await invoicePage.dismissOnlinePaymentsModal();
    });

    // ── STEP 2: Verify Journal Entry Debits Equal Credits ─────────────────────
    await test.step("Verify Invoice generates balanced Journal Entry (Debits = Credits)", async () => {
      await journalEntriesPage.goto();
      await invoicePage.page.waitForTimeout(2000);

      await journalEntriesPage.verifyDebitsEqualCredits(
        invoiceData.invoiceNumber,
        formattedAmount,
      );
    });

    // ── STEP 3: Record Payment on Invoice ─────────────────────────────────────
    await test.step("Record payment on the created invoice", async () => {
      await invoicePage.goto();
      await invoicePage.page.waitForTimeout(1500);
      await invoicePage.recordPayment(invoiceData.invoiceNumber);
    });

    // ── STEP 4: Verify Invoice Status is Paid and Balance is $0.00 ───────────
    await test.step("Verify Invoice status transitions to Paid with $0.00 balance", async () => {
      await invoicePage.goto();
      await invoicePage.page.waitForTimeout(2000);

      const invoiceRow = invoicePage.page
        .getByRole("row")
        .filter({ hasText: invoiceData.invoiceNumber })
        .first();
      await expect(invoiceRow).toBeVisible({ timeout: 15_000 });
      await expect(invoiceRow).toContainText(/paid/i);
      await expect(invoiceRow).toContainText("$0.00");
    });

    // ── STEP 5: Verify Reports Consistency ────────────────────────────────────
    await test.step("Verify Profit & Loss Statement mathematical integrity", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();
      await reportsPage.page.waitForTimeout(2000);

      const summary = await reportsPage.getProfitAndLossSummary();
      expect(summary.income).toBeGreaterThan(0);
      const calculatedNet = summary.income - summary.cogs - summary.expenses;
      expect(Math.abs(summary.netProfit - calculatedNet)).toBeLessThanOrEqual(
        0.05,
      );
    });
  });

  test("@e2e @p0 should maintain strict data integrity throughout full Bill lifecycle to Reports", async ({
    billPage,
    transactionPage,
    journalEntriesPage,
    reportsPage,
  }) => {
    const billData = createBillData();
    const billNumber = billData.billNumber;
    let vendorName: string = "";
    const billAmount = 350;
    const formattedAmount = `$${billAmount.toFixed(2)}`;

    // ── STEP 1: Create and Approve Bill ───────────────────────────────────────
    await test.step("Create and approve a bill for $350.00", async () => {
      await billPage.goto();
      await billPage.openCreateBillForm();

      vendorName = await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billNumber);
      await billPage.fillMemo(billData.notes);
      await billPage.fillLineItem(0, "Integrity Office Supplies", billAmount);

      await billPage.createAndApprove();
      await billPage.page.waitForTimeout(3000);
    });

    // ── STEP 2: Verify Bill Journal Entry ─────────────────────────────────────
    await test.step("Verify Bill generates balanced Journal Entry (Debits = Credits)", async () => {
      await journalEntriesPage.goto();
      await billPage.page.waitForTimeout(2000);

      await journalEntriesPage.verifyDebitsEqualCredits(
        billNumber,
        formattedAmount,
      );
    });

    // ── STEP 3: Create Matching Outgoing Transaction ──────────────────────────
    await test.step("Create matching payment transaction in Banking", async () => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Outgoing");
      await transactionPage.fillDescription(`Payment for ${billNumber}`);
      await transactionPage.selectVendor(vendorName);
      await transactionPage.selectAccount();
      await transactionPage.fillAmount(billAmount);
      await transactionPage.selectCategory("Office Expense");
      await transactionPage.clickAdd();
      await transactionPage.page.waitForTimeout(2000);
    });

    // ── STEP 4: Record Payment on Bill ────────────────────────────────────────
    await test.step("Record payment on the bill using matching transaction", async () => {
      await billPage.goto();
      await billPage.recordPayment(billNumber, `Payment for ${billNumber}`);
    });

    // ── STEP 5: Verify Bill Status is Paid and Balance is $0.00 ──────────────
    await test.step("Verify Bill status transitions to Paid with $0.00 balance", async () => {
      await billPage.goto();
      await billPage.page.waitForTimeout(2000);

      const billRow = billPage.page
        .getByRole("row")
        .filter({ hasText: billNumber })
        .first();

      if (!(await billRow.isVisible({ timeout: 3000 }).catch(() => false))) {
        const searchInput = billPage.page
          .getByPlaceholder(/Search/i)
          .or(billPage.page.locator('input[type="search"]'))
          .first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill(billNumber);
          await billPage.page.keyboard.press("Enter");
          await billPage.page.waitForTimeout(1000);
        }
      }

      await expect(billRow).toBeVisible({ timeout: 15_000 });
      await expect(billRow).toContainText(/paid/i);
      await expect(billRow).toContainText("$0.00");
    });

    // ── STEP 6: Verify Reports Consistency ────────────────────────────────────
    await test.step("Verify Profit & Loss Statement reflects Operating Expenses and Net Profit consistency", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();
      await reportsPage.page.waitForTimeout(2000);

      const summary = await reportsPage.getProfitAndLossSummary();
      expect(summary.expenses).toBeGreaterThan(0);
      const calculatedNet = summary.income - summary.cogs - summary.expenses;
      expect(Math.abs(summary.netProfit - calculatedNet)).toBeLessThanOrEqual(
        0.05,
      );
    });
  });
});
