import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { randomString } from "../../src/utils/helpers";

/**
 * REGRESSION: Tax Calculation Suite
 *
 * Verifies tax-exclusive and tax-inclusive calculations on invoices.
 *
 * @regression @p1
 */
test.describe("Tax Calculation Suite", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression should calculate tax-exclusive pricing correctly", async ({
    page,
    invoicePage,
  }) => {
    await invoicePage.clickCreateInvoice();

    // Select a random customer to satisfy required fields
    await invoicePage.selectRandomCustomer();

    // Add a custom line item
    await invoicePage.addCustomLineItemButton.click({
      force: true,
      noWaitAfter: true,
    });

    const row = page
      .getByRole("row")
      .filter({
        has: page.getByRole("textbox", { name: "Description", exact: true }),
      })
      .first();
    await row
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Consulting Services");
    const qtyField = row
      .getByRole("textbox", { name: "0", exact: true })
      .first();
    await qtyField.clear();
    await qtyField.fill("1");

    const priceField = row.getByRole("textbox", { name: "0.00" }).first();
    await priceField.clear();
    await priceField.fill("100");
    await priceField.press("Enter");

    // Create a new Tax 10%
    const taxDropdown = row.locator('button[role="combobox"]').last();
    await taxDropdown.click();

    const addTaxBtn = page.getByRole("button", { name: "Add A New Tax" });
    await addTaxBtn.waitFor({ state: "visible", timeout: 5000 });
    await addTaxBtn.click();

    const taxName = `Tax10-${randomString(4)}`;
    const taxDialog = page.getByRole("dialog").last();
    await taxDialog.waitFor({ state: "visible", timeout: 5000 });
    await taxDialog.locator('input[placeholder="Name "]').fill(taxName);
    await taxDialog.locator('input[placeholder="Percentage "]').fill("10");
    await taxDialog.getByRole("button", { name: "Add", exact: true }).click();
    await taxDialog
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});

    // Ensure Tax Exclusive mode
    await invoicePage.setTaxSetting("Tax Exclusive");

    // Verify subtotal, tax, and total
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toContainText("Subtotal:");
    await expect(totalsTable).toContainText("$100.00");
    await expect(totalsTable).toContainText("(Exclusive):");
    await expect(totalsTable).toContainText("$10.00");
    await expect(totalsTable).toContainText("Total (USD):");
    await expect(totalsTable).toContainText("$110.00");
  });

  test("@regression should calculate tax-inclusive pricing correctly", async ({
    page,
    invoicePage,
  }) => {
    await invoicePage.clickCreateInvoice();
    await invoicePage.selectRandomCustomer();

    await invoicePage.addCustomLineItemButton.click({
      force: true,
      noWaitAfter: true,
    });

    const row = page
      .getByRole("row")
      .filter({
        has: page.getByRole("textbox", { name: "Description", exact: true }),
      })
      .first();
    await row
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Product Sales");

    const qtyField = row
      .getByRole("textbox", { name: "0", exact: true })
      .first();
    await qtyField.clear();
    await qtyField.fill("1");

    const priceField = row.getByRole("textbox", { name: "0.00" }).first();
    await priceField.clear();
    await priceField.fill("110"); // 110 inclusive of 10% tax means base = 100, tax = 10
    await priceField.press("Enter");

    // Create a new Tax 10%
    const taxDropdown = row.locator('button[role="combobox"]').last();
    await taxDropdown.click();

    const addTaxBtn = page.getByRole("button", { name: "Add A New Tax" });
    await addTaxBtn.waitFor({ state: "visible", timeout: 5000 });
    await addTaxBtn.click();

    const taxName = `Tax10-${randomString(4)}`;
    const taxDialog = page.getByRole("dialog").last();
    await taxDialog.waitFor({ state: "visible", timeout: 5000 });
    await taxDialog.locator('input[placeholder="Name "]').fill(taxName);
    await taxDialog.locator('input[placeholder="Percentage "]').fill("10");
    await taxDialog.getByRole("button", { name: "Add", exact: true }).click();
    await taxDialog
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});

    // Ensure Tax Inclusive mode
    await invoicePage.setTaxSetting("Tax Inclusive");

    // Verify subtotal, tax, and total
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toContainText("Subtotal:");
    await expect(totalsTable).toContainText("(Inclusive):");
    await expect(totalsTable).toContainText("$10.00");
    await expect(totalsTable).toContainText("Total (USD):");
    await expect(totalsTable).toContainText("$110.00");
  });
});
