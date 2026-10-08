import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { InvoicePage } from "../../src/pages/InvoicePage";

/**
 * REGRESSION: Payment States Suite
 *
 * Verifies partial payments, balance updates, and final Paid state transitions.
 *
 * @regression @p1
 */
test.describe("Payment States Suite", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression should handle partial payments and full payments", async ({
    page,
    invoicePage,
  }) => {
    await invoicePage.clickCreateInvoice();
    await invoicePage.fillTitle("Payment Test Invoice");
    const customerName = await invoicePage.selectRandomCustomer();

    // Add a custom line item for $1000
    await invoicePage.addCustomLineItem("Consulting", 1, 1000);

    // Generate and fill an explicit unique invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    await invoicePage.fillInvoiceNumber(invoiceNumber);

    const responsePromise = invoicePage.page
      .waitForResponse(
        (response) =>
          response.url().includes("/invoices") &&
          response.request().method() === "POST",
        { timeout: 20_000 },
      )
      .catch(() => null);

    // Save and approve (handles online payments popup automatically)
    await invoicePage.saveAndApprove();
    await responsePromise;
    await invoicePage.page.waitForTimeout(2000);

    await invoicePage.goto();

    const searchAndGetRow = async () => {
      const tableSearch = page
        .locator('input[placeholder="Search Invoices"]:visible')
        .first();
      await tableSearch.waitFor({ state: "visible", timeout: 20_000 });
      const currentVal = await tableSearch.inputValue().catch(() => "");
      if (currentVal !== invoiceNumber) {
        const searchResponse = page
          .waitForResponse(
            (r) =>
              r.url().includes("/invoices?") && r.request().method() === "GET",
            { timeout: 10_000 },
          )
          .catch(() => null);
        await tableSearch.fill(invoiceNumber);
        await page.keyboard.press("Enter");
        await searchResponse;
        await page.waitForTimeout(1000);
      }
      const row = page
        .locator("table tbody tr")
        .filter({ hasText: invoiceNumber })
        .first();
      await row.waitFor({ state: "visible", timeout: 20_000 });
      return row;
    };

    let invoiceRow = await searchAndGetRow();
    await expect(invoiceRow).toBeVisible();

    // Partial Payment ($400)
    await recordPayment(page, invoicePage, invoiceRow, "400");

    // Verify Status is Partially Paid and Balance is $600.00
    await expect(async () => {
      invoiceRow = await searchAndGetRow();
      await expect(invoiceRow).toBeVisible({ timeout: 5000 });
      const text = await invoiceRow.textContent();
      if (!text?.match(/partial/i) || !text?.includes("600.00")) {
        await invoicePage.goto();
        invoiceRow = await searchAndGetRow();
      }
      await expect(invoiceRow).toContainText(/partial/i);
      await expect(invoiceRow).toContainText("600.00");
    }).toPass({ timeout: 25_000, intervals: [2000, 3000] });

    // Full Payment (Remaining $600)
    invoiceRow = await searchAndGetRow();
    await recordPayment(page, invoicePage, invoiceRow, "600");

    // Verify Status is Paid (and not partial) and Balance is $0.00
    await expect(async () => {
      invoiceRow = await searchAndGetRow();
      await expect(invoiceRow).toBeVisible({ timeout: 5000 });
      const text = await invoiceRow.textContent();
      if (
        text?.match(/partial/i) ||
        !text?.match(/paid/i) ||
        !text?.includes("0.00")
      ) {
        await invoicePage.goto();
        invoiceRow = await searchAndGetRow();
      }
      await expect(invoiceRow).not.toContainText(/partial/i);
      await expect(invoiceRow).toContainText(/paid/i);
      await expect(invoiceRow).toContainText("0.00");
    }).toPass({ timeout: 25_000, intervals: [2000, 3000] });
  });
});

async function recordPayment(
  page: any,
  invoicePage: InvoicePage,
  invoiceRow: any,
  amount?: string,
) {
  let assignBtn = invoiceRow
    .getByRole("button", { name: "Assign Payment" })
    .first();
  if (!(await assignBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
    const firstRowMenuBtn = invoiceRow
      .getByRole("button", { name: "Menu" })
      .first();
    await firstRowMenuBtn.waitFor({ state: "visible", timeout: 10_000 });
    await firstRowMenuBtn.click({ force: true });
    await page.waitForTimeout(500);
    assignBtn = page
      .getByRole("menuitem", { name: /Assign Payment/i })
      .or(page.getByRole("button", { name: /Assign Payment/i }))
      .first();
  }
  await assignBtn.waitFor({ state: "visible", timeout: 10_000 });
  await assignBtn.click();

  const firstModal = page
    .locator('div[role="dialog"]')
    .filter({ visible: true })
    .first();
  await firstModal.waitFor({ state: "visible", timeout: 5000 });

  await firstModal
    .getByRole("button", { name: /Record Cash Payment/i })
    .click();

  // Target the active Record Cash Payment modal containing the #amount field
  const paymentModal = page
    .locator('div[role="dialog"]')
    .filter({ hasText: "Record Cash Payment" })
    .filter({ has: page.locator("#amount") })
    .filter({ visible: true })
    .first();
  await paymentModal.waitFor({ state: "visible", timeout: 10000 });

  if (amount) {
    const amountInput = paymentModal.locator("#amount");
    await amountInput.waitFor({ state: "visible", timeout: 5000 });
    await amountInput.clear();
    await amountInput.fill(amount);
  }

  // Set up response listener for the PATCH request that links transaction to the invoice
  const patchPromise = page
    .waitForResponse(
      (res: any) =>
        res.url().includes("add-transactions") &&
        res.request().method() === "PATCH",
      { timeout: 25_000 },
    )
    .catch(() => null);

  const savePaymentBtn = paymentModal
    .getByRole("button", { name: "Create & Assign" })
    .first();
  await savePaymentBtn.click();

  // Wait for the backend patch to finish writing to DB
  await patchPromise;

  // Wait for success toast or modal to close
  await Promise.race([
    page
      .getByText(/Transaction assigned successfully/i)
      .waitFor({ state: "visible", timeout: 15000 }),
    paymentModal.waitFor({ state: "hidden", timeout: 15000 }),
  ]).catch(() => {});

  // Reload listing to ensure the latest state is rendered
  await invoicePage.goto();
}
