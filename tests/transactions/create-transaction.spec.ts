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

test.describe("Transaction Management", () => {
  // Ensure we are inside the workspace before running tests
  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test.describe("Transactions Page", () => {
    test("@crud @prod-safe should load the transactions page", async ({
      transactionPage,
    }) => {
      // Navigate via sidebar
      await transactionPage.page.getByText("Banking", { exact: true }).click();
      await transactionPage.page
        .getByText("Transactions", { exact: true })
        .click();
      await transactionPage.page.waitForLoadState("networkidle");

      // Verify the page loaded
      await expect(transactionPage.page).toHaveURL(/transactions/i);
    });

    test("@crud @prod-safe should display action buttons on transactions page", async ({
      transactionPage,
    }) => {
      await transactionPage.page.getByText("Banking", { exact: true }).click();
      await transactionPage.page
        .getByText("Transactions", { exact: true })
        .click();
      await transactionPage.page.waitForLoadState("networkidle");

      // Verify main actions are available
      await expect(transactionPage.addTransactionButton).toBeVisible();
    });
  });

  test.describe("Add Transaction", () => {
    test("@crud @destructive should create an outgoing transaction", async ({
      transactionPage,
    }) => {
      const data = createExpenseTransaction();
      await transactionPage.goto();

      await transactionPage.openAddTransactionModal("Outgoing");

      // Fill the form
      await transactionPage.fillDescription(data.description);
      await transactionPage.selectAccount();
      await transactionPage.selectVendor();
      await transactionPage.fillAmount(data.amount);
      await transactionPage.selectCategory("Advertising & Marketing");
      await transactionPage.fillNote(`Automated test - ${data.description}`);

      // Listen for the save API response to see if it succeeds or fails on the backend
      const responsePromise = transactionPage.page
        .waitForResponse(
          (response) =>
            response.url().includes("/transactions") &&
            response.request().method() === "POST",
          { timeout: 20_000 },
        )
        .catch(() => null);

      // Submit
      await transactionPage.clickAdd();

      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
        entityRegistry.track({
          type: "transaction",
          reference: `Outgoing: ${data.description}`,
        });
      } else {
        throw new Error(
          "Form submission blocked by frontend validation or API timeout.",
        );
      }
    });

    test("@crud @destructive should create an incoming transaction", async ({
      transactionPage,
    }) => {
      const data = createIncomeTransaction();
      await transactionPage.goto();

      await transactionPage.openAddTransactionModal("Incoming");

      // Fill the form
      await transactionPage.fillDescription(data.description);
      await transactionPage.selectAccount();
      await transactionPage.selectCustomer();
      await transactionPage.fillAmount(data.amount);
      await transactionPage.selectCategory("Service Revenue");
      await transactionPage.fillNote(`Automated test - ${data.description}`);

      // Listen for the save API response to see if it succeeds or fails on the backend
      const responsePromise = transactionPage.page
        .waitForResponse(
          (response) =>
            response.url().includes("/transactions") &&
            response.request().method() === "POST",
          { timeout: 20_000 },
        )
        .catch(() => null);

      // Submit
      await transactionPage.clickAdd();

      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
        entityRegistry.track({
          type: "transaction",
          reference: `Incoming: ${data.description}`,
        });
      } else {
        throw new Error("Form submission blocked by frontend validation.");
      }
    });
  });
});
