import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * BillPage — Page Object for the Bill creation and management pages.
 *
 * Covers the "Add a Bill" form with all fields,
 * line items, and action buttons.
 */
export class BillPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/bills";

  // ── Header & Metadata Fields ──────────────────────────────
  readonly vendorDropdown: Locator;
  readonly billDateInput: Locator;
  readonly dueDateInput: Locator;
  readonly billNumberInput: Locator;
  readonly poSoNumberInput: Locator;
  readonly currencyDropdown: Locator;
  readonly projectDropdown: Locator;
  readonly customerDropdown: Locator;
  readonly tagsDropdown: Locator;

  // ── Line Items ────────────────────────────────────────────
  readonly addLineButton: Locator;

  // ── Footer Fields ─────────────────────────────────────────
  readonly memoInput: Locator;
  readonly attachmentsButton: Locator;

  // ── Totals ────────────────────────────────────────────────
  readonly subtotalDisplay: Locator;
  readonly totalDisplay: Locator;

  // ── Action Buttons ────────────────────────────────────────
  readonly saveAsDraftButton: Locator;
  readonly createAndSubmitButton: Locator;
  readonly createAndApproveButton: Locator;
  readonly closeButton: Locator;

  // ── Listing Page ──────────────────────────────────────────
  readonly addBillButton: Locator;
  readonly createBillManuallyButton: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Header & Metadata
    this.vendorDropdown = page
      .getByRole("combobox", { name: /Vendor/i })
      .first();
    this.billDateInput = page
      .locator("#billDate")
      .or(page.getByLabel(/Bill Date/i))
      .first();
    this.dueDateInput = page
      .locator("#dueDate")
      .or(page.getByLabel(/Due Date/i))
      .first();
    this.billNumberInput = page
      .locator("#billNumber")
      .or(page.getByRole("textbox", { name: /Bill Number/i }))
      .or(page.locator('input[name="billNumber"]'))
      .first();
    this.poSoNumberInput = page
      .locator("#purchaseOrderNumber")
      .or(page.getByPlaceholder("P.O./S.O. Number"))
      .first();
    this.currencyDropdown = page
      .getByRole("combobox", { name: /Currency/i })
      .first();
    this.projectDropdown = page
      .getByRole("combobox", { name: /Project/i })
      .first();
    this.customerDropdown = page
      .getByRole("combobox", { name: /Customer/i })
      .first();
    this.tagsDropdown = page.getByRole("combobox", { name: /Tags/i }).first();

    // Line Items
    this.addLineButton = page.getByText("Add a line").first();

    // Footer
    this.memoInput = page
      .locator("#notes")
      .or(page.getByPlaceholder("Memo"))
      .first();
    this.attachmentsButton = page.getByText(/Attachments/i).first();

    // Totals
    this.subtotalDisplay = page.getByText(/Subtotal/i).first();
    this.totalDisplay = page.getByText(/Total \(USD\)/i).first();

    // Action Buttons
    this.saveAsDraftButton = page
      .getByRole("button", { name: /Save As Draft/i })
      .first();
    this.createAndSubmitButton = page
      .getByRole("button", { name: /Create & Submit/i })
      .first();
    this.createAndApproveButton = page
      .getByRole("button", { name: /Create & Approve/i })
      .first();
    this.closeButton = page
      .getByRole("button", { name: /^Close$|^X$/i })
      .or(page.locator('button[aria-label="Close"]'))
      .or(page.locator('button[aria-label="close"]'))
      .first();

    // Listing page
    this.addBillButton = page
      .getByRole("button", { name: /Add a Bill/i })
      .first();
    this.createBillManuallyButton = page
      .getByText("Create a Bill Manually")
      .first();
    this.pageHeading = page
      .getByRole("heading", { name: /Bills|Add a Bill/i })
      .first();
  }

  // ── Navigation ──────────────────────────────────────────────

  /**
   * Close the bill form / modal if open.
   */
  async closeForm(): Promise<void> {
    if (
      await this.closeButton.isVisible({ timeout: 1500 }).catch(() => false)
    ) {
      await this.closeButton.click({ force: true }).catch(() => {});
    } else {
      await this.page.keyboard.press("Escape").catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to the Bills listing page.
   */
  async goto(): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.keyboard.press("Escape").catch(() => {});
      await this.page.waitForTimeout(500);
    }
    if (
      await this.closeButton.isVisible({ timeout: 1000 }).catch(() => false)
    ) {
      await this.closeButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
    const spendMenu = this.page
      .getByRole("button", { name: "Money Out" })
      .first();
    const isExpanded = await spendMenu.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await spendMenu.click();
      await this.page.waitForTimeout(500);
    }
    await this.page
      .getByRole("link", { name: "Bills to Pay" })
      .first()
      .click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
    await this.addBillButton
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});
  }

  /**
   * Open the "Add a Bill" form via the listing page.
   * Clicks "Add a Bill" → "Create a Bill Manually".
   */
  async openCreateBillForm(): Promise<void> {
    await this.addBillButton.waitFor({ state: "visible", timeout: 30_000 });
    await this.addBillButton.click({ force: true });
    await this.createBillManuallyButton.waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await this.createBillManuallyButton.click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
    await this.billNumberInput
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ── Form Actions ────────────────────────────────────────────

  /**
   * Select a random existing vendor from the dropdown.
   */
  async selectRandomVendor(): Promise<string> {
    await this.vendorDropdown.click();
    await this.page.waitForTimeout(1000);

    // Wait for dropdown list to appear
    const options = this.page.locator('[role="option"], .p-dropdown-item');
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
        await options.nth(i).click({ force: true });
        await this.page.waitForTimeout(1000);
        return selectedName;
      }
    }

    // Fallback: If no existing vendors, auto-create one
    const createNewVendorBtn = this.page
      .getByText(/Create A New Vendor/i)
      .first();
    if (await createNewVendorBtn.isVisible().catch(() => false)) {
      console.log("🔄 No existing vendors found. Creating a new vendor...");
      await createNewVendorBtn.click();
      await this.page.waitForTimeout(1000);

      const addVendorDialog = this.page
        .locator('div[role="dialog"]')
        .filter({ hasText: /Add Vendor|New Vendor/i })
        .first();
      await addVendorDialog.waitFor({ state: "visible", timeout: 5000 });

      const newVendorName = `Test Vendor ${Date.now()}`;
      const nameInput = addVendorDialog
        .getByPlaceholder(/Individual or Business/i)
        .or(addVendorDialog.getByLabel(/Vendor Name/i))
        .or(
          addVendorDialog.locator(
            'input[name="vendorName"], input[name="name"], #vendorName',
          ),
        )
        .first();

      await nameInput.waitFor({ state: "visible", timeout: 10_000 });
      await nameInput.fill(newVendorName);

      const addBtn = addVendorDialog
        .getByRole("button", { name: /^Add$/i })
        .or(addVendorDialog.getByRole("button", { name: /Save|Add Vendor/i }))
        .first();

      await addBtn.scrollIntoViewIfNeeded().catch(() => {});
      await addBtn.click({ force: true });
      await addVendorDialog
        .waitFor({ state: "hidden", timeout: 10_000 })
        .catch(() => {});
      await this.page.waitForTimeout(2000);

      // Verify vendor is selected in the bill form; if not, select it explicitly
      const currentVendorText = await this.vendorDropdown
        .innerText()
        .catch(() => "");
      if (!currentVendorText || currentVendorText.includes("Select Vendor")) {
        await this.vendorDropdown.click();
        await this.page.waitForTimeout(500);
        const option = this.page
          .locator('[role="option"], .p-dropdown-item, li')
          .filter({ hasText: newVendorName })
          .first();
        if (await option.isVisible().catch(() => false)) {
          await option.click({ force: true });
        } else {
          await this.page.keyboard.press("ArrowDown");
          await this.page.keyboard.press("Enter");
        }
        await this.page.waitForTimeout(1000);
      }

      return newVendorName;
    }

    // Fallback: Press ArrowDown twice then Enter
    await this.page.keyboard.press("ArrowDown");
    await this.page.waitForTimeout(200);
    await this.page.keyboard.press("ArrowDown");
    await this.page.waitForTimeout(200);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(1000);

    return "Unknown Vendor";
  }

  /**
   * Fill the bill number.
   */
  async fillBillNumber(billNumber: string): Promise<void> {
    await this.billNumberInput.clear();
    await this.billNumberInput.fill(billNumber);
  }

  /**
   * Fill the P.O./S.O. number.
   */
  async fillPoSoNumber(poSoNumber: string): Promise<void> {
    await this.poSoNumberInput.clear();
    await this.poSoNumberInput.fill(poSoNumber);
  }

  /**
   * Fill the memo/notes field.
   */
  async fillMemo(memo: string): Promise<void> {
    await this.memoInput.clear();
    await this.memoInput.fill(memo);
  }

  /**
   * Fill a line item row. Row index is 0-based.
   */
  async fillLineItem(
    rowIndex: number,
    description: string,
    amount: number,
    accountName?: string,
  ): Promise<void> {
    const rows = this.page
      .getByRole("row")
      .filter({ has: this.page.getByRole("textbox", { name: "0.00" }) });
    const row = rows.nth(rowIndex);

    // Select Account (Required field)
    // Find the account button by checking for a button that opens the account dropdown (it initially says Select Account)
    const selectAccountBtn = row
      .getByRole("button")
      .filter({ hasText: /Select Account/i })
      .first();
    // Only click if it still says Select Account (meaning it hasn't been set yet)
    if (await selectAccountBtn.isVisible()) {
      await selectAccountBtn.click();
      await this.page.waitForTimeout(500); // Wait for dropdown to open
      // Wait for at least one option to appear
      const optionLocator = this.page.getByRole("menuitemradio");
      await optionLocator
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});

      if (accountName) {
        await optionLocator
          .filter({ hasText: accountName })
          .first()
          .click({ force: true });
      } else {
        await optionLocator.first().click({ force: true });
      }
      await this.page.waitForTimeout(500);
    }

    // Fill description
    const descInput = row
      .getByRole("textbox", { name: /Description/i })
      .first();
    await descInput.fill(description);

    // Fill amount
    const amountInput = row.getByRole("textbox", { name: "0.00" }).first();
    await amountInput.clear();
    await amountInput.fill(amount.toString());
  }

  /**
   * Add a new line item.
   */
  async addLine(): Promise<void> {
    await this.addLineButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Add and fill a custom line item (convenience helper matching InvoicePage API).
   */
  async addCustomLineItem(
    description: string,
    quantity: number,
    amount: number,
    accountName?: string,
  ): Promise<void> {
    await this.fillLineItem(0, description, amount, accountName);
  }

  /**
   * Save the bill as a draft.
   */
  async saveAsDraft(): Promise<void> {
    await this.saveAsDraftButton.click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Create and submit the bill.
   */
  async createAndSubmit(): Promise<void> {
    await this.createAndSubmitButton.click({ force: true });
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Create and approve the bill.
   */
  async createAndApprove(): Promise<void> {
    await this.createAndApproveButton.click({ force: true });
    await this.page.waitForTimeout(1000);

    // If validation errors appeared on the form, throw an error immediately
    const errorMsg = this.page
      .locator("text=/Please Select Vendor Name|This field is required/i")
      .first();
    if (await errorMsg.isVisible().catch(() => false)) {
      const msg = await errorMsg.innerText();
      throw new Error(`Bill creation failed with validation error: "${msg}"`);
    }

    await this.page.waitForLoadState("domcontentloaded");
  }

  // ── Payment Actions ─────────────────────────────────────────

  /**
   * Record a payment for a specific bill in the list.
   * If transactionDescription is provided, it uses the search box in the
   * "Select Transaction(s)" modal to find the matching transaction.
   */
  async recordPayment(
    billNumber?: string,
    transactionDescription?: string,
  ): Promise<void> {
    if (billNumber) {
      const isVisible = await this.page
        .getByRole("row")
        .filter({ hasText: billNumber })
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (!isVisible) {
        const searchInput = this.page
          .getByPlaceholder(/Search/i)
          .or(this.page.locator('input[type="search"]'))
          .first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchInput.fill(billNumber);
          await this.page.keyboard.press("Enter");
          await this.page.waitForTimeout(1000);
        }
      }
      await this.page
        .getByText(billNumber)
        .first()
        .waitFor({ state: "visible", timeout: 15_000 });
    } else {
      await this.page.waitForSelector(".p-datatable-tbody > tr, tbody > tr");
      await this.page.waitForTimeout(1000);
    }

    let firstRow;
    if (billNumber) {
      firstRow = this.page
        .getByRole("row")
        .filter({ hasText: billNumber })
        .first();
    } else {
      firstRow = this.page.getByRole("row").nth(1);
    }

    const payBtn = firstRow
      .getByRole("button", { name: /Record Payment|Pay/i })
      .first();
    await payBtn.waitFor({ state: "visible", timeout: 10_000 });
    await payBtn.click({ force: true });

    await this.page.waitForTimeout(1000);

    // Wait for the modal dialog to appear
    const paymentModal = this.page
      .getByRole("dialog")
      .filter({ hasText: /Record a payment|Select Transaction/i })
      .first();
    await paymentModal.waitFor({ state: "attached", timeout: 5000 });

    // Click "Select Transaction(s)" if present
    const selectTransactionBtn = paymentModal
      .getByRole("button", { name: /Select Transaction/i })
      .or(paymentModal.getByText("Select Transaction(s)"))
      .first();
    if (
      await selectTransactionBtn.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await selectTransactionBtn.click({ force: true });
      await this.page.waitForTimeout(1000);
    }

    // Now we should be in the Select Transaction(s) modal
    const transactionModal = this.page
      .getByRole("dialog")
      .filter({ hasText: /Select Transaction/i })
      .first();

    // Find and select the target transaction
    if (transactionDescription) {
      const targetRow = transactionModal
        .getByRole("row")
        .filter({
          has: this.page
            .locator(`img[alt*="${transactionDescription}"]`)
            .or(this.page.getByText(transactionDescription)),
        })
        .or(
          transactionModal
            .getByRole("row")
            .filter({ hasText: transactionDescription }),
        )
        .first();

      const isRowVisible = await targetRow
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (isRowVisible) {
        const checkbox = targetRow
          .locator(".p-checkbox, input[type='checkbox'], [role='checkbox']")
          .first();
        await checkbox.click({ force: true });
      } else {
        // Fallback: just click the first data row's checkbox (newest transaction is first)
        const firstCheckbox = transactionModal
          .locator(
            ".p-checkbox, table tbody tr input[type='checkbox'], [role='rowgroup'] [role='row'] input[type='checkbox'], [role='row'] [role='checkbox']",
          )
          .first();
        await firstCheckbox.waitFor({ state: "attached", timeout: 20_000 });
        await firstCheckbox.click({ force: true });
      }
    } else {
      // No description provided — just click the first checkbox
      const firstCheckbox = transactionModal
        .locator(
          ".p-checkbox, table tbody tr input[type='checkbox'], [role='rowgroup'] [role='row'] input[type='checkbox'], [role='row'] [role='checkbox']",
        )
        .first();
      await firstCheckbox.waitFor({ state: "attached", timeout: 10_000 });
      await firstCheckbox.click({ force: true });
    }
    await this.page.waitForTimeout(500);

    // Click the confirmation button
    const confirmBtn = transactionModal
      .getByRole("button", { name: /Assign|Save|Add|Submit/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
    }

    await this.page.waitForTimeout(2000);

    // If paymentModal is still visible (outer modal), click Save/Submit on it
    if (await paymentModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      const finalSaveBtn = paymentModal
        .getByRole("button", { name: /Save|Record Payment|Submit|Add/i })
        .first();
      if (await finalSaveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await finalSaveBtn.click({ force: true });
      }
    }

    await this.page.waitForTimeout(2000); // Allow time for the status text to update
  }
}
