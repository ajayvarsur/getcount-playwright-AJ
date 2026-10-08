import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createBillData } from "../../src/data/bill-data";
import { entityRegistry } from "../../src/api/CountApiClient";

test.describe("Bill Management", () => {
  // Ensure we are inside the workspace before running tests
  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test.describe("Create Bill", () => {
    test("@crud @prod-safe should navigate to bills page and open create form", async ({
      billPage,
    }) => {
      // Use sidebar to safely navigate to bills
      await billPage.goto();

      await billPage.openCreateBillForm();

      // Verify the bill form is open
      await expect(billPage.billNumberInput).toBeVisible();
      await expect(billPage.saveAsDraftButton).toBeVisible();
    });

    test("@crud @prod-safe should display all required fields on bill form", async ({
      billPage,
    }) => {
      await billPage.goto();

      await billPage.openCreateBillForm();

      // Verify key form elements are visible
      await expect(billPage.vendorDropdown).toBeVisible();
      await expect(billPage.billNumberInput).toBeVisible();
      await expect(billPage.saveAsDraftButton).toBeVisible();
      await expect(billPage.createAndSubmitButton).toBeVisible();
      await expect(billPage.createAndApproveButton).toBeVisible();
    });

    test("@crud @destructive should create and approve a bill with a single line item", async ({
      billPage,
    }) => {
      const data = createBillData();
      await billPage.goto();

      await billPage.openCreateBillForm();

      // Select a Vendor
      await billPage.selectRandomVendor();

      // Fill in the bill form
      await billPage.fillBillNumber(data.billNumber);
      await billPage.fillMemo(data.notes);

      // Fill the first line item
      await billPage.fillLineItem(
        0,
        data.lineItems[0].description,
        data.lineItems[0].amount,
      );

      // Save and approve
      await billPage.createAndApprove();

      // Verify the bill appears in the list (indicates successful creation)
      await expect(
        billPage.page.getByText(data.billNumber).first(),
      ).toBeVisible({ timeout: 15_000 });
      entityRegistry.track({ type: "bill", reference: data.billNumber });
    });
  });
});
