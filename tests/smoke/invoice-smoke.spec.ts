import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * SMOKE: Invoice Creation
 *
 * Verifies the core invoice creation happy path — the most critical
 * revenue-side flow in the accounting app.
 *
 * @smoke @p0
 */
test.describe("Invoice Smoke", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @destructive should create an invoice and verify it appears in the list", async ({
    invoicePage,
  }) => {
    const invoiceData = createInvoiceData();
    let customerName: string;

    await test.step("Navigate to Create Invoice", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("domcontentloaded");
    });

    await test.step("Fill invoice form", async () => {
      await invoicePage.fillTitle(`Smoke Invoice ${invoiceData.invoiceNumber}`);
      customerName = await invoicePage.selectRandomCustomer();
      const item = invoiceData.lineItems[0];
      await invoicePage.addCustomLineItem(
        item.description,
        item.quantity,
        item.rate,
      );
    });

    await test.step("Save and approve invoice", async () => {
      await invoicePage.saveAndApprove();
      entityRegistry.track({
        type: "invoice",
        reference: invoiceData.invoiceNumber,
      });
    });

    await test.step("Verify invoice appears in listing", async () => {
      await invoicePage.goto();

      const invoiceRow = invoicePage.page
        .getByRole("row")
        .filter({ hasText: customerName })
        .first();
      await expect(invoiceRow).toBeVisible({ timeout: 15_000 });
      await expect(invoiceRow).toContainText(/approved|paid/i);
    });
  });

  test("@smoke @destructive should create a multi-line invoice and verify total on form", async ({
    invoicePage,
  }) => {
    const invoiceData = createInvoiceData();
    const line1 = { description: "Service A", qty: 2, rate: 100 }; // $200
    const line2 = { description: "Service B", qty: 1, rate: 150 }; // $150
    const expectedTotal = 350;

    await test.step("Navigate and create invoice", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("domcontentloaded");

      await invoicePage.fillTitle(
        `Multi-Line Smoke ${invoiceData.invoiceNumber}`,
      );
      await invoicePage.selectRandomCustomer();

      await invoicePage.addCustomLineItem(
        line1.description,
        line1.qty,
        line1.rate,
      );
      await invoicePage.addCustomLineItem(
        line2.description,
        line2.qty,
        line2.rate,
      );
    });

    await test.step("Verify total is $350.00 on the form", async () => {
      const formContent = await invoicePage.page
        .locator("main")
        .first()
        .innerText();
      expect(formContent).toContain(`$${expectedTotal.toFixed(2)}`);
    });
  });
});
