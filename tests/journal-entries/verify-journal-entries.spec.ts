import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { entityRegistry } from "../../src/api/CountApiClient";

test.describe("Journal Entries Verification", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000); // Allow more time for full UI flow

  // Ensure we are inside the workspace before running tests
  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression @p1 @accounting @destructive should create a journal entry when an invoice is created", async ({
    invoicePage,
    journalEntriesPage,
  }) => {
    // We don't generate customerName upfront anymore.
    const invoiceData = createInvoiceData();
    let customerName: string;

    // 1. Create a new invoice
    await test.step("Create a new invoice", async () => {
      // Use sidebar to safely navigate to invoices
      await invoicePage.page
        .getByText("Money In", { exact: true })
        .first()
        .click();
      await invoicePage.page.getByText("Invoices & Estimates").click();

      // Wait for the URL to change to the invoices page to ensure we're not on the dashboard
      await invoicePage.page.waitForURL("**/invoices*");
      await invoicePage.page.waitForLoadState("domcontentloaded");

      // Explicitly click the Create Invoice button on the invoices page, not the dashboard Quick Link
      await invoicePage.page
        .getByRole("button", { name: /Create Invoice/i, exact: false })
        .filter({ hasNotText: "Quick Links" })
        .first()
        .click();

      // Wait for the Creating An Invoice page to load
      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("networkidle");

      // Fill in the form
      await invoicePage.fillTitle(`Test Invoice ${invoiceData.invoiceNumber}`);

      customerName = await invoicePage.selectRandomCustomer();

      // Add a line item
      const item = invoiceData.lineItems[0];
      await invoicePage.addCustomLineItem(
        item.description,
        item.quantity,
        item.rate,
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

      await invoicePage.saveAndApprove();

      const response = await responsePromise;
      if (response) {
        expect([200, 201]).toContain(response.status());
        entityRegistry.track({
          type: "invoice",
          reference: invoiceData.invoiceNumber,
        });
      }
    });

    // 2. Verify the Journal Entry was created
    await test.step("Verify corresponding Journal Entry", async () => {
      await journalEntriesPage.goto();

      // Calculate the expected total based on the line item
      const expectedTotal =
        invoiceData.lineItems[0].quantity * invoiceData.lineItems[0].rate;
      const formattedTotal = `$${expectedTotal.toFixed(2)}`;

      // The journal entry description contains the customer name
      await journalEntriesPage.verifyJournalEntryExists(
        customerName,
        formattedTotal,
      );
    });
  });
});
