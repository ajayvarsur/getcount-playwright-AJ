import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { createInvoiceData } from "../../src/data/invoice-data";
import { createBillData } from "../../src/data/bill-data";
import { entityRegistry } from "../../src/api/CountApiClient";

/**
 * SMOKE: Payment Recording
 *
 * Verifies that payments can be recorded for both invoices and bills,
 * and that the status correctly transitions to Paid with $0.00 balance.
 *
 * @smoke @p0
 */
test.describe("Payment Smoke", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @destructive should record a full payment on an invoice and verify Paid status", async ({
    invoicePage,
    transactionPage,
  }) => {
    const invoiceData = createInvoiceData();
    const invoiceNumber = invoiceData.invoiceNumber;

    let customerName: string;

    await test.step("Create an approved invoice", async () => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");
      await invoicePage.page.waitForLoadState("domcontentloaded");

      await invoicePage.fillTitle(`Payment Smoke Invoice ${invoiceNumber}`);
      await invoicePage.fillInvoiceNumber(invoiceNumber);
      customerName = await invoicePage.selectRandomCustomer();
      const item = invoiceData.lineItems[0];
      await invoicePage.addCustomLineItem(
        item.description,
        item.quantity,
        item.rate,
      );

      await invoicePage.saveAndApprove();
      entityRegistry.track({ type: "invoice", reference: invoiceNumber });
    });

    await test.step("Record payment on invoice", async () => {
      await invoicePage.goto();
      await invoicePage.recordPayment(invoiceNumber);
    });

    await test.step("Verify invoice shows Paid status and $0.00 balance", async () => {
      await invoicePage.goto();
      const row = invoicePage.page
        .getByRole("row")
        .filter({ hasText: invoiceNumber })
        .first();
      if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
        const searchInput = invoicePage.page
          .getByPlaceholder(/Search/i)
          .or(invoicePage.page.locator('input[type="search"]'))
          .first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill(invoiceNumber);
          await invoicePage.page.keyboard.press("Enter");
        }
      }
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(row).toContainText(/paid/i);
      await expect(row).toContainText("$0.00");
    });
  });

  test("@smoke @destructive should record a full payment on a bill and verify Paid status", async ({
    billPage,
    transactionPage,
  }) => {
    const billData = createBillData();
    const billNumber = billData.billNumber;
    let vendorName: string;
    const expectedTotal = billData.lineItems[0].amount;

    await test.step("Create an approved bill", async () => {
      await billPage.goto();
      await billPage.openCreateBillForm();
      vendorName = await billPage.selectRandomVendor();
      await billPage.fillBillNumber(billNumber);
      await billPage.fillMemo(billData.notes);
      await billPage.fillLineItem(
        0,
        billData.lineItems[0].description,
        expectedTotal,
      );
      await billPage.createAndApprove();
      entityRegistry.track({ type: "bill", reference: billNumber });
    });

    await test.step("Create a matching payment transaction", async () => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Outgoing");
      await transactionPage.fillDescription(`Payment for ${billNumber}`);
      await transactionPage.selectVendor(vendorName);
      await transactionPage.selectAccount();
      await transactionPage.fillAmount(expectedTotal);
      await transactionPage.selectCategory("Office Expense");
      await transactionPage.clickAdd();
    });

    await test.step("Record payment on bill", async () => {
      await billPage.goto();
      await billPage.recordPayment(billNumber, `Payment for ${billNumber}`);
    });

    await test.step("Verify bill shows Paid status and $0.00 balance", async () => {
      await billPage.goto();
      const row = billPage.page
        .getByRole("row")
        .filter({ hasText: billNumber })
        .first();
      if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
        const searchInput = billPage.page
          .getByPlaceholder(/Search/i)
          .or(billPage.page.locator('input[type="search"]'))
          .first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill(billNumber);
          await billPage.page.keyboard.press("Enter");
        }
      }
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(row).toContainText(/paid/i);
      await expect(row).toContainText("$0.00");
    });
  });
});
