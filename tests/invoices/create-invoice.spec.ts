import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { entityRegistry } from "../../src/api/CountApiClient";

test.describe("Invoice Management", () => {
  // Ensure we are inside the workspace before running tests
  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test.describe("Create Invoice", () => {
    test("@crud @prod-safe should navigate to invoice creation page", async ({
      invoicePage,
    }) => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await expect(invoicePage.page).toHaveURL(/invoices/i);
    });

    test("@crud @prod-safe should display all required fields on invoice form", async ({
      invoicePage,
    }) => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();

      // Verify key form elements are visible
      await expect(invoicePage.invoiceTitleInput).toBeVisible();
      await expect(invoicePage.invoiceNumberInput).toBeVisible();
      await expect(invoicePage.addCustomerButton).toBeVisible();
      await expect(invoicePage.saveAsDraftButton).toBeVisible();
      await expect(invoicePage.saveAndApproveButton).toBeVisible();
      await expect(invoicePage.cancelButton).toBeVisible();
    });

    test("@crud @destructive should create and approve an invoice with a single line item", async ({
      invoicePage,
    }) => {
      const data = createInvoiceData();
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();

      // Fill in the form
      await invoicePage.fillTitle(`Test Invoice ${data.invoiceNumber}`);
      await invoicePage.fillInvoiceNumber(data.invoiceNumber);
      await invoicePage.fillMemo(data.notes);

      // Select a Customer (otherwise line items might be disabled)
      await invoicePage.selectRandomCustomer();

      // Add a line item
      await invoicePage.addCustomLineItem(
        data.lineItems[0].description,
        data.lineItems[0].quantity,
        data.lineItems[0].rate,
      );

      // Listen for the save API response to see if it succeeds or fails on the backend
      const responsePromise = invoicePage.page
        .waitForResponse(
          (response) =>
            response.url().includes("/invoices") &&
            response.request().method() === "POST",
          { timeout: 20_000 },
        )
        .catch(() => null);

      // Save and approve the invoice
      await invoicePage.saveAndApprove();

      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
        entityRegistry.track({
          type: "invoice",
          reference: data.invoiceNumber,
        });
      } else {
        throw new Error(
          "Form submission blocked by frontend validation or API timeout.",
        );
      }
    });
  });
});
