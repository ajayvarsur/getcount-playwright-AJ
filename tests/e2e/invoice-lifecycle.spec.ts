import { test, expect } from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { selectActiveWorkspace } from "../../src/utils/helpers";
import { ENV } from "../../src/utils/env";

test.describe("E2E Invoice Lifecycle", () => {
  test.setTimeout(180_000); // Allow more time for full UI flow (including P&L reports)

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("should create invoice, verify journal entry, record payment, and verify final status", async ({
    invoicePage,
    journalEntriesPage,
    reportsPage,
  }) => {
    const invoiceData = createInvoiceData();
    let customerName: string;
    const expectedTotal =
      invoiceData.lineItems[0].quantity * invoiceData.lineItems[0].rate;
    const formattedTotal = `$${expectedTotal.toFixed(2)}`;

    // 1. Create a new invoice
    await test.step("Create a new invoice", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();

      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("networkidle");

      await invoicePage.fillTitle(
        `Lifecycle Invoice ${invoiceData.invoiceNumber}`,
      );
      await invoicePage.fillInvoiceNumber(invoiceData.invoiceNumber);
      customerName = await invoicePage.selectRandomCustomer();

      const item = invoiceData.lineItems[0];
      await invoicePage.addCustomLineItem(
        item.description,
        item.quantity,
        item.rate,
      );

      await invoicePage.saveAndApprove();

      // Wait to be back on the listing page or detail page
      await invoicePage.page.waitForTimeout(2000);

      // Handle the "ONLINE PAYMENTS" popup that sometimes appears after creating an invoice
      try {
        const skipButton = invoicePage.page
          .getByRole("button", { name: "Skip" })
          .first();
        await skipButton.waitFor({ state: "visible", timeout: 5000 });
        await skipButton.click({ force: true });
        await invoicePage.page.waitForTimeout(1000);
      } catch (e) {
        // Modal didn't appear within 5 seconds, proceed
      }
    });

    // 2. Verify the Journal Entry
    await test.step("Verify corresponding Journal Entry", async () => {
      await journalEntriesPage.goto();
      await invoicePage.page.waitForTimeout(3000);

      await journalEntriesPage.verifyDebitsEqualCredits(
        invoiceData.invoiceNumber,
        formattedTotal,
      );
    });

    // 3. Verify Profit & Loss Statement after creation
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

    // 4. Record Payment
    await test.step("Record Payment for the invoice", async () => {
      // Go back to invoices listing page
      await invoicePage.goto();

      // Pay the specific invoice created in step 1
      await invoicePage.recordPayment(invoiceData.invoiceNumber);
    });

    // 4. Verify Final State
    await test.step("Verify invoice is Paid and balance is $0.00", async () => {
      await invoicePage.goto();
      await invoicePage.page.waitForTimeout(2000);

      // Find the specific invoice row by its unique invoice number
      const invoiceRow = invoicePage.page
        .getByRole("row")
        .filter({ hasText: invoiceData.invoiceNumber })
        .first();
      await expect(invoiceRow).toBeVisible({ timeout: 15_000 });
      await expect(invoiceRow).toContainText(/paid/i);
      await expect(invoiceRow).toContainText("$0.00");
    });

    // 5. Verify Profit & Loss Statement
    await test.step("Verify Profit & Loss Statement", async () => {
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
