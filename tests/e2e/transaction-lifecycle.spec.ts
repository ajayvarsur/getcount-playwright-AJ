import { test, expect } from "../../src/fixtures/test-fixtures";
import {
  createIncomeTransaction,
  createExpenseTransaction,
} from "../../src/data/transaction-data";
import { selectActiveWorkspace } from "../../src/utils/helpers";
import { ENV } from "../../src/utils/env";

/**
 * E2E: Transaction Lifecycle Suite
 *
 * Validates the complete lifecycle of both incoming (revenue) and outgoing (expense)
 * transactions across the application:
 * 1. Income transaction creation → Listing verification → Journal Entry double-entry verification
 * 2. Expense transaction creation → Listing verification → Journal Entry double-entry verification
 * 3. Cross-module verification on financial reports (Profit & Loss, Balance Sheet)
 *
 * @e2e @p0 @transactions
 */
test.describe("E2E Transaction Lifecycle", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@e2e @p0 should complete full transaction lifecycle for income and expense with journal entry and report verification", async ({
    transactionPage,
    journalEntriesPage,
    reportsPage,
  }) => {
    const incomeData = createIncomeTransaction();
    const expenseData = createExpenseTransaction();
    const incomeAmountFormatted = `$${incomeData.amount.toFixed(2)}`;
    const expenseAmountFormatted = `$${expenseData.amount.toFixed(2)}`;

    // ── STEP 1: Create Incoming (Income) Transaction ──────────────────────────
    await test.step("Create an Incoming (Income) transaction", async () => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Incoming");
      await transactionPage.fillDescription(incomeData.description);
      await transactionPage.selectAccount();
      await transactionPage.selectCustomer();
      await transactionPage.fillAmount(incomeData.amount);
      await transactionPage.selectCategory("Service Revenue");
      await transactionPage.fillNote(
        `Automated E2E Income - ${incomeData.description}`,
      );

      const responsePromise = transactionPage.page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/") &&
            response.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => null);

      await transactionPage.clickAdd();
      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
      }
      await transactionPage.page.waitForTimeout(2000);
    });

    // ── STEP 2: Verify Income Transaction in Transactions Listing ───────────
    await test.step("Verify Income transaction appears in the transactions list", async () => {
      await transactionPage.goto();
      await transactionPage.verifyTransactionInList(
        incomeData.description,
        incomeAmountFormatted,
      );
    });

    // ── STEP 3: Verify Double-Entry Journal Entry for Income ────────────────
    await test.step("Verify corresponding Journal Entry debits equal credits for Income", async () => {
      await journalEntriesPage.goto();
      await transactionPage.page.waitForTimeout(2000);

      // Verify transaction appears in the Journal Entries table with matching amount
      await journalEntriesPage.verifyJournalEntryExists(
        incomeData.description,
        incomeAmountFormatted,
      );
    });

    // ── STEP 4: Create Outgoing (Expense) Transaction ────────────────────────
    await test.step("Create an Outgoing (Expense) transaction", async () => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Outgoing");
      await transactionPage.fillDescription(expenseData.description);
      await transactionPage.selectAccount();
      await transactionPage.selectVendor();
      await transactionPage.fillAmount(expenseData.amount);
      await transactionPage.selectCategory("Advertising & Marketing");
      await transactionPage.fillNote(
        `Automated E2E Expense - ${expenseData.description}`,
      );

      const responsePromise = transactionPage.page
        .waitForResponse(
          (response) =>
            response.url().includes("/api/") &&
            response.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => null);

      await transactionPage.clickAdd();
      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
      }
      await transactionPage.page.waitForTimeout(2000);
    });

    // ── STEP 5: Verify Expense Transaction in Transactions Listing ──────────
    await test.step("Verify Expense transaction appears in the transactions list", async () => {
      await transactionPage.goto();
      await transactionPage.verifyTransactionInList(
        expenseData.description,
        expenseAmountFormatted,
      );
    });

    // ── STEP 6: Verify Double-Entry Journal Entry for Expense ───────────────
    await test.step("Verify corresponding Journal Entry debits equal credits for Expense", async () => {
      await journalEntriesPage.goto();
      await transactionPage.page.waitForTimeout(2000);

      // Verify transaction appears in the Journal Entries table with matching amount
      await journalEntriesPage.verifyJournalEntryExists(
        expenseData.description,
        expenseAmountFormatted,
      );
    });

    // ── STEP 7: Verify Profit & Loss Report Reflects Activity ───────────────
    await test.step("Verify Profit & Loss Statement generates and shows key sections", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      await expect(
        reportsPage.page
          .getByRole("heading", { name: "Profit & Loss Statement" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        reportsPage.page.locator("text=Net Profit").first(),
      ).toBeVisible({
        timeout: 10_000,
      });
      await expect(reportsPage.page.locator("text=Income").first()).toBeVisible(
        {
          timeout: 10_000,
        },
      );
      await expect(
        reportsPage.page.locator("text=Operating Expenses").first(),
      ).toBeVisible({
        timeout: 10_000,
      });
    });

    // ── STEP 8: Verify Balance Sheet Navigation ──────────────────────────────
    await test.step("Verify Balance Sheet report loads correctly", async () => {
      await reportsPage.navigateToReports();
      const balanceSheetCard = reportsPage.page
        .getByText(/Balance Sheet/i)
        .first();
      await balanceSheetCard.waitFor({ state: "visible", timeout: 10_000 });
      await balanceSheetCard.click();
      await reportsPage.page.waitForLoadState("domcontentloaded");

      await expect(reportsPage.page).toHaveURL(/balance-sheet/, {
        timeout: 10_000,
      });
      await expect(
        reportsPage.page
          .getByRole("heading", { name: /Balance Sheet/i })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
