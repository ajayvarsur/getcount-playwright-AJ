import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { createBillData } from "../../src/data/bill-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * REGRESSION: Report Reconciliation Suite
 *
 * Verifies that financial reports accurately reflect domain transactions:
 * 1. P&L Internal Balance: Income - COGS - Operating Expenses = Net Profit
 * 2. Revenue Reconciliation: Approved Invoices increase Income & Net Profit on P&L
 * 3. Expense Reconciliation: Approved Bills increase Operating Expenses & decrease Net Profit on P&L
 *
 * @regression @p1 @reports
 */
test.describe("Report Reconciliation Suite", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression @prod-safe should verify P&L mathematical formula consistency (Income - COGS - Expenses = Net Profit)", async ({
    reportsPage,
  }) => {
    await test.step("Navigate to Reports and generate Profit & Loss Statement", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();
    });

    await test.step("Verify mathematical balance of summary KPIs", async () => {
      const summary = await reportsPage.getProfitAndLossSummary();

      // Basic sanity: numbers are valid non-negative figures
      expect(summary.income).toBeGreaterThan(0);
      expect(summary.expenses).toBeGreaterThan(0);

      // Formula: Net Profit = Income - Cost of Goods Sold - Operating Expenses
      const calculatedNetProfit =
        summary.income - summary.cogs - summary.expenses;
      expect(
        Math.abs(summary.netProfit - calculatedNetProfit),
      ).toBeLessThanOrEqual(0.05);

      // Verify report actions are present
      await expect(
        reportsPage.page
          .getByRole("button", { name: /Export as CSV/i })
          .first(),
      ).toBeVisible();
      await expect(
        reportsPage.page
          .getByRole("button", { name: /Export as PDF/i })
          .first(),
      ).toBeVisible();
      await expect(
        reportsPage.page.getByRole("button", { name: /Save Report/i }).first(),
      ).toBeVisible();
    });
  });

  test("@regression @destructive should reconcile P&L Income and Net Profit after creating an Invoice", async ({
    reportsPage,
    invoicePage,
  }) => {
    let baselineIncome = 0;
    let baselineNetProfit = 0;
    const invoiceAmount = 1000;

    await test.step("Record baseline P&L values", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      const baseline = await reportsPage.getProfitAndLossSummary();
      baselineIncome = baseline.income;
      baselineNetProfit = baseline.netProfit;
    });

    await test.step("Create and approve a new invoice for $1,000", async () => {
      const invoiceData = createInvoiceData();
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");

      await invoicePage.fillTitle(
        `P&L Reconcile Invoice ${invoiceData.invoiceNumber}`,
      );
      await invoicePage.fillInvoiceNumber(invoiceData.invoiceNumber);
      await invoicePage.selectRandomCustomer();
      await invoicePage.addCustomLineItem(
        "Reconciliation Consulting",
        1,
        invoiceAmount,
      );

      await invoicePage.saveAndApprove();
      entityRegistry.track({
        type: "invoice",
        reference: invoiceData.invoiceNumber,
      });

      // Dismiss Online Payments modal if it pops up
      const skipButton = invoicePage.page
        .getByRole("button", { name: "Skip" })
        .first();
      await skipButton
        .waitFor({ state: "visible", timeout: 8_000 })
        .catch(() => {});
      if (await skipButton.isVisible().catch(() => false)) {
        await skipButton.click({ force: true });
      }
    });

    await test.step("Re-generate P&L and verify Income & Net Profit increased by $1,000", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      const updated = await reportsPage.getProfitAndLossSummary();

      // Income must increase by exactly the invoice amount
      expect(
        Math.abs(updated.income - (baselineIncome + invoiceAmount)),
      ).toBeLessThanOrEqual(0.05);

      // Net Profit must increase by the invoice amount
      expect(
        Math.abs(updated.netProfit - (baselineNetProfit + invoiceAmount)),
      ).toBeLessThanOrEqual(0.05);
    });
  });

  test("@regression @destructive should reconcile P&L Operating Expenses and Net Profit after creating a Bill", async ({
    reportsPage,
    billPage,
  }) => {
    let baselineExpenses = 0;
    let baselineNetProfit = 0;
    const billAmount = 500;

    await test.step("Record baseline P&L values", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      const baseline = await reportsPage.getProfitAndLossSummary();
      baselineExpenses = baseline.expenses;
      baselineNetProfit = baseline.netProfit;
    });

    await test.step("Create and approve a new bill for $500", async () => {
      const billData = createBillData();
      await billPage.goto();
      await billPage.openCreateBillForm();

      await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billData.billNumber);
      await billPage.fillMemo(billData.notes);
      await billPage.fillLineItem(
        0,
        "Reconciliation Office Expense",
        billAmount,
      );

      await billPage.createAndApprove();
      entityRegistry.track({ type: "bill", reference: billData.billNumber });
    });

    await test.step("Re-generate P&L and verify Expenses increased & Net Profit decreased by $500", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      const updated = await reportsPage.getProfitAndLossSummary();

      // Expenses must increase by the bill amount
      expect(
        Math.abs(updated.expenses - (baselineExpenses + billAmount)),
      ).toBeLessThanOrEqual(0.05);

      // Net Profit must decrease by the bill amount
      expect(
        Math.abs(updated.netProfit - (baselineNetProfit - billAmount)),
      ).toBeLessThanOrEqual(0.05);
    });
  });
});
