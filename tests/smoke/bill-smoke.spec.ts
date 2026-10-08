import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createBillData } from "../../src/data/bill-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * SMOKE: Bill Creation
 *
 * Verifies the core bill creation happy path — the most critical
 * expense-side flow in the accounting app.
 *
 * @smoke @p0
 */
test.describe("Bill Smoke", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @destructive should create a bill and verify it appears in the list", async ({
    billPage,
  }) => {
    const billData = createBillData();
    const billNumber = billData.billNumber;

    await test.step("Navigate to Create Bill", async () => {
      await billPage.goto();
      await billPage.openCreateBillForm();
    });

    await test.step("Fill bill form", async () => {
      await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billNumber);
      await billPage.fillMemo(billData.notes);
      await billPage.fillLineItem(
        0,
        billData.lineItems[0].description,
        billData.lineItems[0].amount,
      );
    });

    await test.step("Save and approve bill", async () => {
      await billPage.createAndApprove();
      entityRegistry.track({ type: "bill", reference: billNumber });
    });

    await test.step("Verify bill appears in listing", async () => {
      await billPage.goto();

      // The bill row should appear with the bill number
      const billRow = billPage.page
        .getByRole("row")
        .filter({ hasText: billNumber })
        .first();
      await expect(billRow).toBeVisible({ timeout: 10_000 });
      await expect(billRow).toContainText(/approved|unpaid|outstanding/i);
    });
  });

  test("@smoke @prod-safe should show correct amount on bill form", async ({
    billPage,
  }) => {
    const billData = createBillData();
    const expectedAmount = billData.lineItems[0].amount; // $150.00

    await billPage.goto();
    await billPage.openCreateBillForm();
    await billPage.selectRandomVendor();
    await billPage.fillBillNumber(billData.billNumber);
    await billPage.fillLineItem(
      0,
      billData.lineItems[0].description,
      expectedAmount,
    );

    // Verify the amount appears on the form
    const formContent = await billPage.page.locator("main").first().innerText();
    expect(formContent).toContain(`$${expectedAmount.toFixed(2)}`);
  });
});
