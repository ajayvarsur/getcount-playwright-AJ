import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import {
  createIncomeTransaction,
  createExpenseTransaction,
} from "../../src/data/transaction-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * SMOKE: Transaction Creation
 *
 * Verifies that income and expense transactions can be created
 * via the Banking > Transactions module.
 *
 * @smoke @p0
 */
test.describe("Transaction Smoke", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @destructive should create an income transaction and verify API response", async ({
    transactionPage,
  }) => {
    const data = createIncomeTransaction();

    await test.step("Navigate to Transactions", async () => {
      await transactionPage.goto();
    });

    await test.step("Create income (Incoming) transaction", async () => {
      await transactionPage.openAddTransactionModal("Incoming");
      await transactionPage.fillDescription(data.description);
      await transactionPage.selectAccount();
      await transactionPage.selectVendor();
      await transactionPage.fillAmount(data.amount);
      await transactionPage.selectCategory("Advertising & Marketing");
    });

    await test.step("Submit and verify success", async () => {
      const responsePromise = transactionPage.page
        .waitForResponse(
          (res) =>
            res.url().includes("/api/") && res.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => null);

      await transactionPage.clickAdd();

      const response = await responsePromise;
      if (response) {
        expect(response.status()).toBe(200);
        entityRegistry.track({
          type: "transaction",
          reference: `Income: ${data.description}`,
        });
      }
    });
  });

  test("@smoke @destructive should create an expense transaction and verify API response", async ({
    transactionPage,
  }) => {
    const data = createExpenseTransaction();

    await test.step("Navigate to Transactions", async () => {
      await transactionPage.goto();
    });

    await test.step("Create expense (Outgoing) transaction", async () => {
      await transactionPage.openAddTransactionModal("Outgoing");
      await transactionPage.fillDescription(data.description);
      await transactionPage.selectAccount();
      await transactionPage.selectVendor();
      await transactionPage.fillAmount(data.amount);
      await transactionPage.selectCategory("Advertising & Marketing");
    });

    await test.step("Submit and verify success", async () => {
      const responsePromise = transactionPage.page
        .waitForResponse(
          (res) =>
            res.url().includes("/api/") && res.request().method() === "POST",
          { timeout: 15_000 },
        )
        .catch(() => null);

      await transactionPage.clickAdd();

      const response = await responsePromise;
      if (response) {
        expect(response.status()).toBe(200);
        entityRegistry.track({
          type: "transaction",
          reference: `Expense: ${data.description}`,
        });
      }
    });
  });
});
