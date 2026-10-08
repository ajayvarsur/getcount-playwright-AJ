import { test, expect } from "../../src/fixtures/test-fixtures";
import { createBillData } from "../../src/data/bill-data";
import { selectActiveWorkspace } from "../../src/utils/helpers";
import { ENV } from "../../src/utils/env";

test.describe("E2E Bill Lifecycle", () => {
  test.setTimeout(180_000); // Allow more time for full UI flow (including P&L reports)

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("should create bill, verify journal entry, record payment, and verify final status", async ({
    billPage,
    journalEntriesPage,
    transactionPage,
    reportsPage,
  }) => {
    const data = createBillData();
    let vendorName: string;
    const expectedTotal = data.lineItems[0].amount;
    const formattedTotal = `$${expectedTotal.toFixed(2)}`;
    const billNumber = data.billNumber;

    // 1. Create a new bill
    await test.step("Create a new bill", async () => {
      await billPage.goto();
      await billPage.openCreateBillForm();

      vendorName = await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billNumber);
      await billPage.fillMemo(data.notes);
      await billPage.fillLineItem(
        0,
        data.lineItems[0].description,
        expectedTotal,
      );

      await billPage.createAndApprove();

      // Wait to be back on the listing page
      await billPage.page.waitForTimeout(3000);
    });

    // 2. Verify the Journal Entry
    await test.step("Verify journal entry created for the bill", async () => {
      await journalEntriesPage.goto();
      await billPage.page.waitForTimeout(3000); // Give it time to load

      // Search for the bill number and verify it exists with the correct amount
      await journalEntriesPage.verifyDebitsEqualCredits(
        billNumber,
        formattedTotal,
      );
    });

    // 2.5 Verify Profit & Loss Statement immediately after creation
    await test.step("Verify Profit & Loss Statement after creation", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      // Verify that the report renders successfully
      await expect(
        reportsPage.page
          .getByRole("heading", { name: "Profit & Loss Statement" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        reportsPage.page.locator("text=Net Profit").first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    // 3. Create a matching transaction to pay the bill
    await test.step("Create matching transaction", async () => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Outgoing");
      await transactionPage.fillDescription(`Payment for ${billNumber}`);
      await transactionPage.selectVendor(vendorName);
      await transactionPage.selectAccount(); // Selects default '1000: Cash on Hand'
      await transactionPage.fillAmount(expectedTotal);
      await transactionPage.selectCategory("Office Expense");
      // Wait for networkidle after Add
      await transactionPage.clickAdd();
      await transactionPage.page.waitForTimeout(2000);
    });

    // 4. Record a payment
    await test.step("Record payment", async () => {
      await billPage.goto();
      // Pass the billNumber to find the row, and the description to find the transaction
      await billPage.recordPayment(billNumber, `Payment for ${billNumber}`);
    });

    // 4. Verify Final State
    await test.step("Verify bill is Paid and balance is $0.00", async () => {
      await billPage.goto();
      await billPage.page.waitForTimeout(3000);

      // Find the specific bill row by its bill number
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
      await expect(billRow).toBeVisible({ timeout: 10_000 });
      await expect(billRow).toContainText(/paid/i);
      await expect(billRow).toContainText("$0.00");
    });

    // 5. Verify Profit & Loss Statement
    await test.step("Verify Profit & Loss Statement", async () => {
      // The ReportsPage is provided via fixtures, but wait, is it in the test signature?
      // Let's assume we need to inject it. I will fix the signature next.
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
      await reportsPage.generateReport();

      // Verify that the report renders successfully
      await expect(
        reportsPage.page
          .getByRole("heading", { name: "Profit & Loss Statement" })
          .first(),
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        reportsPage.page.locator("text=Net Profit").first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
