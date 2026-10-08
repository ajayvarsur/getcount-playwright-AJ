import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InvoicePage — Page Object for the Invoice creation and management pages.
 *
 * Covers the "Creating An Invoice" form with all fields,
 * line items, and action buttons.
 */
export class InvoicePage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/invoices?tab=invoices";

  // ── Header & Metadata Fields ──────────────────────────────
  readonly invoiceTitleInput: Locator;
  readonly addCustomerButton: Locator;
  readonly invoiceNumberInput: Locator;
  readonly poSoNumberInput: Locator;
  readonly invoiceDateInput: Locator;
  readonly invoiceDueDateDropdown: Locator;
  readonly amountsAreDropdown: Locator;
  readonly currencyDropdown: Locator;

  // ── Line Items ────────────────────────────────────────────
  readonly addProductsButton: Locator;
  readonly addCustomLineItemButton: Locator;

  // ── Footer Fields ─────────────────────────────────────────
  readonly memoInput: Locator;
  readonly addAttachmentsButton: Locator;

  // ── Additional Options ────────────────────────────────────
  readonly attachToProjectDropdown: Locator;
  readonly salesRepDropdown: Locator;
  readonly useTagsDropdown: Locator;
  readonly recurringToggle: Locator;
  readonly milestonePaymentsToggle: Locator;

  // ── Action Buttons ────────────────────────────────────────
  readonly cancelButton: Locator;
  readonly saveAsDraftButton: Locator;
  readonly saveAndApproveButton: Locator;

  // ── Create Invoice Button (on the listing page) ───────────
  readonly createInvoiceButton: Locator;

  // ── Page Heading ──────────────────────────────────────────
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Header & Metadata
    this.invoiceTitleInput = page.getByPlaceholder("Invoice Title").last();
    this.addCustomerButton = page.getByText("Add Customer").first();
    this.invoiceNumberInput = page.getByPlaceholder("Invoice Number").last();
    this.poSoNumberInput = page.getByPlaceholder("P.O./S.O. Number").last();
    this.invoiceDateInput = page.getByPlaceholder("Invoice Date").last();
    this.invoiceDueDateDropdown = page
      .getByRole("combobox", { name: /Invoice Due Date/i })
      .first();
    this.amountsAreDropdown = page
      .getByRole("combobox", { name: /Amounts are/i })
      .first();
    this.currencyDropdown = page
      .getByRole("combobox", { name: /Currency/i })
      .first();

    // Line Items
    this.addProductsButton = page.getByText("Add products & services").first();
    this.addCustomLineItemButton = page
      .getByRole("button", { name: "Add custom line item", exact: false })
      .filter({ visible: true })
      .first();

    // Footer
    this.memoInput = page.getByPlaceholder("Memo").first();
    this.addAttachmentsButton = page.getByText("Add Attachments").first();

    // Additional Options
    this.attachToProjectDropdown = page
      .getByRole("combobox", { name: /Attach to Project/i })
      .first();
    this.salesRepDropdown = page
      .getByRole("combobox", { name: /Assign to Sales Representative/i })
      .first();
    this.useTagsDropdown = page
      .getByRole("combobox", { name: /Use Tags/i })
      .first();
    this.recurringToggle = page.getByText("Recurring").first();
    this.milestonePaymentsToggle = page.getByText("Milestone Payments").first();

    // Action Buttons
    this.cancelButton = page.getByRole("button", { name: /^Cancel$/i }).first();
    this.saveAsDraftButton = page
      .getByRole("button", { name: /Save As Draft/i })
      .first();
    this.saveAndApproveButton = page
      .getByRole("button", { name: /Save & Approve Invoice/i })
      .first();

    // Listing page
    this.createInvoiceButton = page
      .getByRole("button", { name: /Create Invoice/i })
      .first();
    this.pageHeading = page
      .getByRole("heading", { name: /Invoices|Creating An Invoice/i })
      .first();
  }

  // ── Navigation ──────────────────────────────────────────────

  /**
   * Navigate to the Invoices listing page.
   */
  async goto(): Promise<void> {
    // Dismiss any open modal dialog that might intercept pointer events
    const modal = this.page.locator('div[role="dialog"]:visible').first();
    if (await modal.isVisible().catch(() => false)) {
      const skipBtn = modal
        .getByRole("button", { name: /Skip|Close|Cancel/i })
        .first();
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click({ force: true }).catch(() => {});
      } else {
        await this.page.keyboard.press("Escape").catch(() => {});
      }
      await modal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const sellMenu = this.page
      .getByRole("button", { name: "Money In" })
      .first();
    const isExpanded = await sellMenu.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await sellMenu.click();
      await this.page.waitForTimeout(500);
    }
    await this.page
      .getByRole("link", { name: "Invoices & Estimates" })
      .first()
      .click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.createInvoiceButton
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});
  }

  /**
   * Click the "Create Invoice" button on the listing page.
   */
  async clickCreateInvoice(): Promise<void> {
    if (
      !this.page.url().includes("/invoices") ||
      !(await this.createInvoiceButton.isVisible().catch(() => false))
    ) {
      await this.goto();
    }
    await this.createInvoiceButton.waitFor({
      state: "visible",
      timeout: 30_000,
    });
    await this.createInvoiceButton.click({ force: true, noWaitAfter: true });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .waitForSelector("text=Creating An Invoice", { timeout: 15_000 })
      .catch(() => {});
  }

  // ── Form Actions ────────────────────────────────────────────

  /**
   * Fill the invoice title.
   */
  async fillTitle(title: string): Promise<void> {
    await this.invoiceTitleInput.clear();
    await this.invoiceTitleInput.fill(title);
  }

  /**
   * Fill the invoice number.
   */
  async fillInvoiceNumber(invoiceNumber: string): Promise<void> {
    await this.invoiceNumberInput.clear();
    await this.invoiceNumberInput.fill(invoiceNumber);
  }

  /**
   * Fill the P.O./S.O. number.
   */
  async fillPoSoNumber(poSoNumber: string): Promise<void> {
    await this.poSoNumberInput.clear();
    await this.poSoNumberInput.fill(poSoNumber);
  }

  /**
   * Fill the memo field.
   */
  async fillMemo(memo: string): Promise<void> {
    await this.memoInput.clear();
    await this.memoInput.fill(memo);
  }

  /**
   * Select a currency for the invoice (Multi-Currency).
   */
  async setCurrency(currencyName: string): Promise<void> {
    // Click the currency dropdown
    await this.currencyDropdown.click({ force: true });
    await this.page.waitForTimeout(500);
    // Select the specified currency from the list
    await this.page
      .getByRole("option", { name: new RegExp(currencyName, "i") })
      .first()
      .click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the exchange rate displayed after selecting a foreign currency.
   */
  async getExchangeRate(): Promise<string> {
    const rateInput = this.page
      .locator("#documentExchangeRate")
      .or(this.page.getByPlaceholder("Automatic"))
      .first();
    return await rateInput.inputValue();
  }

  /**
   * Select an existing customer or create a new one if none exist.
   * This is required before adding line items.
   */
  async selectRandomCustomer(): Promise<string> {
    await this.addCustomerButton.click({ force: true });
    await this.page.waitForTimeout(1000);

    // The customers are rendered as buttons in the overlay.
    const options = this.page
      .getByRole("button")
      .filter({ hasText: /Customer/i })
      .filter({ hasNotText: /Create/i })
      .filter({ hasNotText: "Add Customer" });
    await options
      .first()
      .waitFor({ state: "visible", timeout: 3000 })
      .catch(() => {});

    const count = await options.count();
    let selectedName = "";

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).innerText();
      if (
        text &&
        !text.toLowerCase().includes("create") &&
        text.trim() !== ""
      ) {
        selectedName = text.split("\n")[0].trim();
        await options.nth(i).evaluate((node) => (node as HTMLElement).click());
        await this.page.waitForTimeout(1000);
        return selectedName;
      }
    }

    // Fallback: If no existing customers, auto-create one
    const createNewCustomerBtn = this.page
      .getByText(/Create A New Customer/i)
      .first();
    if (await createNewCustomerBtn.isVisible().catch(() => false)) {
      console.log("🔄 No existing customers found. Creating a new customer...");
      await createNewCustomerBtn.click({ force: true });
      await this.page.waitForTimeout(1000);

      const addCustomerDialog = this.page
        .locator('div[role="dialog"]')
        .filter({ hasText: /Add Customer|New Customer/i })
        .first();
      await addCustomerDialog
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      const newCustomerName = `Test Customer ${Date.now()}`;

      // Attempt to fill out customer name
      const nameInput = addCustomerDialog
        .getByPlaceholder(/Individual or Business/i)
        .or(addCustomerDialog.getByLabel(/Customer Name/i))
        .or(
          addCustomerDialog.locator(
            'input[name="customerName"], input[name="name"], #customerName',
          ),
        )
        .or(addCustomerDialog.locator('input[type="text"]').first())
        .first();

      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(newCustomerName);
      }

      const addBtn = addCustomerDialog
        .getByRole("button", { name: /^Add$/i })
        .or(
          addCustomerDialog.getByRole("button", { name: /Save|Add Customer/i }),
        )
        .first();

      if (await addBtn.isVisible().catch(() => false)) {
        await addBtn.scrollIntoViewIfNeeded().catch(() => {});
        await addBtn.click({ force: true });
        await addCustomerDialog
          .waitFor({ state: "hidden", timeout: 10_000 })
          .catch(() => {});
        await this.page.waitForTimeout(2000);
      } else {
        // If no add button found, maybe the dialog is completely different, try escape to unblock
        await this.page.keyboard.press("Escape");
        await this.page.waitForTimeout(500);
      }

      return newCustomerName;
    }

    return "Unknown Customer";
  }

  /**
   * Add a custom line item with description, quantity, and price.
   *
   * Uses role-based locators scoped to the editable line-item row
   * to avoid hitting hidden duplicate textareas in the preview panel.
   */
  async addCustomLineItem(
    description: string,
    qty: number,
    price: number,
    accountName?: string,
    taxName?: string,
  ): Promise<void> {
    // Check how many rows currently exist
    const rows = this.page.getByRole("row").filter({
      has: this.page.getByRole("textbox", { name: "Description", exact: true }),
    });
    const currentCount = await rows.count();

    // Scroll the button into view first
    await this.addCustomLineItemButton.scrollIntoViewIfNeeded();
    await this.addCustomLineItemButton.evaluate((node) =>
      (node as HTMLElement).click(),
    );

    // Wait for the new row to appear
    await rows.nth(currentCount).waitFor({ state: "visible", timeout: 5000 });

    await this.fillLineItem(
      currentCount,
      description,
      qty,
      price,
      accountName,
      taxName,
    );
  }

  /**
   * Fill a specific line item row by index (0-based).
   */
  async fillLineItem(
    rowIndex: number,
    description: string,
    qty: number,
    price: number,
    accountName?: string,
    taxName?: string,
  ): Promise<void> {
    const rows = this.page.getByRole("row").filter({
      has: this.page.getByRole("textbox", {
        name: "Description",
        exact: true,
      }),
    });
    const row = rows.nth(rowIndex);

    await row.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    // Click Select Account Button
    const selectAccountBtn = row
      .getByRole("button", { name: "Select Account" })
      .first();

    // It's possible the account is already selected (it won't say "Select Account")
    if (await selectAccountBtn.isVisible().catch(() => false)) {
      await selectAccountBtn.evaluate((node) => (node as HTMLElement).click());
      await this.page.waitForTimeout(500); // Wait for dropdown to open

      if (accountName) {
        // Find the option by text
        const option = this.page.getByRole("menuitemradio", {
          name: accountName,
          exact: true,
        });
        await option.evaluate((node) => (node as HTMLElement).click());
      } else {
        // Just pick the first available option if no specific account is provided
        await this.page
          .getByRole("menuitemradio")
          .first()
          .evaluate((node) => (node as HTMLElement).click());
      }
      await this.page.waitForTimeout(500);
    }

    // Fill Description
    const descField = row.getByRole("textbox", {
      name: "Description",
      exact: true,
    });
    await descField.scrollIntoViewIfNeeded();
    await descField.click();
    await descField.fill(description);

    // Fill Qty — the qty textbox has accessible name "0" (it might be a placeholder or label)
    const qtyField = row
      .getByRole("textbox", { name: "0", exact: true })
      .first();
    await qtyField.clear();
    await qtyField.fill(qty.toString());

    // Fill Price — the price textbox has accessible name "0.00"
    const priceField = row.getByRole("textbox", { name: "0.00" }).first();
    await priceField.clear();
    await priceField.fill(price.toString());
    await priceField.press("Enter");
    await this.page.waitForTimeout(500);

    // Select Tax if provided
    if (taxName) {
      // The tax dropdown is typically the second combobox in the row, or accessible by current value e.g. "No Taxes"
      const taxDropdown = row.locator('button[role="combobox"]').last(); // It's the last combobox in the row
      await taxDropdown.click();
      await this.page.waitForTimeout(500);

      const taxOption = this.page.getByRole("option", {
        name: taxName,
        exact: true,
      });
      await taxOption.evaluate((node) => (node as HTMLElement).click());
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Set the invoice tax calculation mode (Tax Exclusive, Tax Inclusive, No Tax)
   */
  async setTaxSetting(
    setting: "Tax Exclusive" | "Tax Inclusive" | "No Tax",
  ): Promise<void> {
    // It's the first combobox on the page near "Amounts are"
    const taxSettingDropdown = this.page
      .locator("label", { hasText: "Amounts are" })
      .locator("..") // parent div
      .locator('button[role="combobox"]');

    // If it's already set, do nothing
    const currentText = await taxSettingDropdown.innerText();
    if (currentText.includes(setting)) return;

    await taxSettingDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.getByRole("option", { name: setting, exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Ensure invoice number is populated. If empty (e.g. because auto-increment
   * was interrupted or blank), fills a clean numeric sequential number.
   */
  async ensureInvoiceNumber(): Promise<string> {
    try {
      const currentVal = await this.invoiceNumberInput.inputValue();
      if (!currentVal || !currentVal.trim()) {
        const nextNum = Math.floor(100000 + Math.random() * 900000).toString();
        await this.fillInvoiceNumber(nextNum);
        return nextNum;
      }
      return currentVal.trim();
    } catch {
      return "";
    }
  }

  /**
   * Save the invoice as a draft.
   */
  async saveAsDraft(): Promise<void> {
    await this.ensureInvoiceNumber();
    await this.saveAsDraftButton.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Dismiss the "ONLINE PAYMENTS" modal dialog if it appears.
   */
  async dismissOnlinePaymentsModal(): Promise<void> {
    const skipButton = this.page.getByRole("button", { name: "Skip" }).first();
    const dialog = this.page
      .locator('div[role="dialog"]')
      .filter({ hasText: /Online Payments/i })
      .first();

    try {
      const appeared = await Promise.race([
        skipButton
          .waitFor({ state: "visible", timeout: 6000 })
          .then(() => true)
          .catch(() => false),
        dialog
          .waitFor({ state: "visible", timeout: 6000 })
          .then(() => true)
          .catch(() => false),
      ]);

      if (appeared) {
        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click({ force: true });
        } else {
          await this.page.keyboard.press("Escape");
        }
        await dialog
          .waitFor({ state: "hidden", timeout: 5000 })
          .catch(() => {});
        await this.page.waitForTimeout(500);
      }
    } catch {
      // Modal didn't appear
    }
  }

  /**
   * Save and approve the invoice.
   */
  async saveAndApprove(): Promise<void> {
    await this.ensureInvoiceNumber();
    await this.saveAndApproveButton.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1000);
    await this.dismissOnlinePaymentsModal();
  }

  /**
   * Cancel invoice creation.
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ── Payment Actions ─────────────────────────────────────────

  /**
   * Record payment using the grid bulk action "Set to Paid"
   */
  async recordPayment(
    invoiceNumber?: string,
    transactionDescription?: string,
  ): Promise<void> {
    await this.goto();

    let firstRow = this.page.getByRole("row").nth(1);
    if (invoiceNumber) {
      const isVisible = await this.page
        .getByRole("row")
        .filter({ hasText: invoiceNumber })
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (!isVisible) {
        const searchInput = this.page
          .getByPlaceholder(/Search/i)
          .or(this.page.locator('input[type="search"]'))
          .first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill(invoiceNumber);
          await this.page.keyboard.press("Enter");
          await this.page.waitForTimeout(1000);
        }
      }

      firstRow = this.page
        .getByRole("row")
        .filter({ hasText: invoiceNumber })
        .first();
    }

    // Check the checkbox of the row to enable bulk actions
    const checkbox = firstRow
      .locator("input[type='checkbox'], [role='checkbox']")
      .first();
    await checkbox.waitFor({ state: "visible", timeout: 20_000 });
    await checkbox.check({ force: true });

    // Wait for the bulk action bar to appear and the button to be enabled
    const bulkActionBtn = this.page
      .getByRole("button", { name: "Set to Paid, Awaiting Deposit" })
      .first();
    await bulkActionBtn.waitFor({ state: "visible", timeout: 10_000 });
    await bulkActionBtn.click();

    // Wait for the confirmation modal
    const dialog = this.page
      .locator('div[role="dialog"]')
      .filter({ visible: true })
      .first();
    await dialog.waitFor({ state: "visible", timeout: 5000 });

    // Click 'Mark as Paid'
    const confirmBtn = dialog
      .getByRole("button", { name: "Mark as Paid" })
      .first();
    await confirmBtn.waitFor({ state: "visible", timeout: 3000 });
    await confirmBtn.click();

    // Wait for the network requests to finish
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000); // Give it time to update the UI status
  }
}
