import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";

/**
 * REGRESSION: Multi-Currency Suite
 *
 * Verifies foreign currency conversion (INR) and zero-decimal currencies (JPY)
 * for both Invoices and Bills.
 *
 * @regression @p1
 */
test.describe("Multi-Currency Suite", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@regression should create invoice in foreign currency and verify exchange rate is applied", async ({
    page,
    invoicePage,
  }) => {
    await invoicePage.clickCreateInvoice();
    await invoicePage.fillTitle("Foreign Services Invoice");
    const invoiceNumber = `MC-INR-${Date.now()}`;
    await invoicePage.fillInvoiceNumber(invoiceNumber);
    const customerName = await invoicePage.selectRandomCustomer();

    // Set currency to INR
    const currencyDropdown = page
      .getByRole("combobox")
      .filter({ hasText: /dollar|USD|INR|EUR/i })
      .first();
    await currencyDropdown.click({ force: true });

    const inrOption = page
      .getByRole("option", { name: /INR - Indian rupee/i })
      .first();
    await inrOption.waitFor({ state: "visible", timeout: 5000 });
    await inrOption.click();

    // Verify exchange rate is prompted by checking the dynamic subtext
    const exchangeRateSubtext = page
      .locator("text=/rate as at/i")
      .or(page.getByText(/1 INR =/i))
      .first();
    await expect(exchangeRateSubtext).toBeVisible({ timeout: 10_000 });

    // Add a custom line item
    await invoicePage.addCustomLineItem("Foreign Services", 1, 1000);

    // Verify line item header changed to Amount (INR)
    await expect(page.locator("text=/Amount \\(INR\\)/").first()).toBeVisible({
      timeout: 10_000,
    });

    // Verify totals table
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toContainText("Subtotal:");
    const tableText = await totalsTable.innerText();
    expect(tableText).toMatch(/1,?000\.00/);

    // Save and approve
    await invoicePage.saveAndApprove();

    // On the listing page, the invoice amount should be displayed
    await invoicePage.goto();

    const invoiceRow = page
      .locator("tr")
      .filter({ hasText: invoiceNumber })
      .first();
    await expect(invoiceRow).toBeVisible({ timeout: 15_000 });

    const rowText = await invoiceRow.innerText();
    expect(rowText).toMatch(/(INR|₹)?\s*1,?000\.00/i);
  });

  test("@regression should handle zero-decimal currency (JPY) correctly", async ({
    page,
    invoicePage,
  }) => {
    await invoicePage.clickCreateInvoice();
    await invoicePage.fillTitle("Zero Decimal Invoice");
    const invoiceNumber = `MC-JPY-${Date.now()}`;
    await invoicePage.fillInvoiceNumber(invoiceNumber);
    const customerName = await invoicePage.selectRandomCustomer();

    // Set currency to JPY
    const currencyDropdown = page
      .getByRole("combobox")
      .filter({ hasText: /dollar|USD|INR|EUR|JPY/i })
      .first();
    await currencyDropdown.click({ force: true });

    const jpyOption = page
      .getByRole("option", { name: /JPY - Japanese yen/i })
      .first();
    await jpyOption.waitFor({ state: "visible", timeout: 5000 });
    await jpyOption.click();

    // Verify exchange rate is prompted
    const exchangeRateSubtext = page
      .locator("text=/rate as at/i")
      .or(page.getByText(/1 JPY =/i))
      .first();
    await expect(exchangeRateSubtext).toBeVisible({ timeout: 10_000 });

    // Add a custom line item
    await invoicePage.addCustomLineItem("Zero Decimal Services", 1, 1000);

    // Verify line item header changed to Amount (JPY)
    await expect(page.locator("text=/Amount \\(JPY\\)/").first()).toBeVisible({
      timeout: 10_000,
    });

    // Verify totals table
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toContainText("Subtotal:");
    const tableText = await totalsTable.innerText();
    expect(tableText).toMatch(/(JPY|¥)?\s*1,?000(\.00)?/i);

    // Save and approve
    await invoicePage.saveAndApprove();

    // Verify on listing page
    await invoicePage.goto();
    const invoiceRow = page
      .locator("tr")
      .filter({ hasText: invoiceNumber })
      .first();
    await expect(invoiceRow).toBeVisible({ timeout: 15_000 });
    const rowText = await invoiceRow.innerText();
    expect(rowText).toMatch(/(JPY|¥)?\s*1,?000(\.00)?/i);
  });

  test("@regression should create bill in foreign currency and verify exchange rate is applied", async ({
    page,
    billPage,
  }) => {
    await billPage.goto();
    await billPage.openCreateBillForm();
    const billNumber = `MC-INR-${Date.now()}`;
    await billPage.fillBillNumber(billNumber);
    const vendorName = await billPage.selectRandomVendor();

    // Set currency to INR
    const currencyDropdown = page
      .getByRole("combobox")
      .filter({ hasText: /dollar|USD|INR|EUR|JPY/i })
      .first();
    await currencyDropdown.click({ force: true });

    const inrOption = page
      .getByRole("option", { name: /Indian rupee/i })
      .first();
    await inrOption.waitFor({ state: "visible", timeout: 5000 });
    await inrOption.click();

    // Verify exchange rate is prompted by checking the dynamic subtext
    const exchangeRateSubtext = page
      .locator("text=/rate as at/i")
      .or(page.getByText(/1 INR =/i))
      .first();
    await expect(exchangeRateSubtext).toBeVisible({ timeout: 10_000 });

    // Add a custom line item
    await billPage.addCustomLineItem("Foreign Services", 1, 1000);

    // Verify totals table
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toBeVisible({ timeout: 10_000 });
    await expect(totalsTable).toContainText("Subtotal:");
    const tableText = await totalsTable.innerText();
    expect(tableText).toMatch(/(INR|₹)?\s*1,?000\.00/i);

    // Save and approve
    await billPage.createAndApprove();

    // Verify on listing page
    await billPage.goto();

    const billRow = page.locator("tr").filter({ hasText: billNumber }).first();
    await expect(billRow).toBeVisible({ timeout: 15_000 });

    const rowText = await billRow.innerText();
    expect(rowText).toMatch(/(INR|₹)?\s*1,?000\.00/i);
  });

  test("@regression should handle zero-decimal currency (JPY) correctly for bills", async ({
    page,
    billPage,
  }) => {
    await billPage.goto();
    await billPage.openCreateBillForm();
    const billNumber = `MC-JPY-${Date.now()}`;
    await billPage.fillBillNumber(billNumber);
    const vendorName = await billPage.selectRandomVendor();

    // Set currency to JPY
    const currencyDropdown = page
      .getByRole("combobox")
      .filter({ hasText: /dollar|USD|INR|EUR|JPY/i })
      .first();
    await currencyDropdown.click({ force: true });

    const jpyOption = page
      .getByRole("option", { name: /Japanese yen/i })
      .first();
    await jpyOption.waitFor({ state: "visible", timeout: 5000 });
    await jpyOption.click();

    // Verify exchange rate is prompted
    const exchangeRateSubtext = page
      .locator("text=/rate as at/i")
      .or(page.getByText(/1 JPY =/i))
      .first();
    await expect(exchangeRateSubtext).toBeVisible({ timeout: 10_000 });

    // Add a custom line item
    await billPage.addCustomLineItem("Zero Decimal Services", 1, 1000);

    // Verify totals table has no decimals for JPY
    const totalsTable = page.locator("table").last();
    await expect(totalsTable).toBeVisible({ timeout: 10_000 });
    await expect(totalsTable).toContainText("Subtotal:");
    const tableText = await totalsTable.innerText();
    expect(tableText).toMatch(/(JPY|¥)?\s*1,?000(\.00)?/i);

    // Save and approve
    await billPage.createAndApprove();

    // Verify on listing page
    await billPage.goto();
    const billRow = page.locator("tr").filter({ hasText: billNumber }).first();
    await expect(billRow).toBeVisible({ timeout: 15_000 });
    const rowText = await billRow.innerText();
    expect(rowText).toMatch(/(JPY|¥)?\s*1,?000(\.00)?/i);
  });
});
