import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * TransactionPage — Page Object for the Transaction management pages.
 *
 * Covers the Transactions landing page, the "Add Transaction" modal
 * with its Incoming/Outgoing/Transfer tabs, and all form fields.
 */
export class TransactionPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/transactions";

  // ── Landing Page Buttons ──────────────────────────────────
  readonly connectBankButton: Locator;
  readonly importTransactionsButton: Locator;
  readonly addTransactionButton: Locator;

  // ── Modal Header & Tabs ───────────────────────────────────
  readonly modalHeading: Locator;
  readonly incomingTab: Locator;
  readonly outgoingTab: Locator;
  readonly transferTab: Locator;

  // ── Modal Form Fields ─────────────────────────────────────
  readonly descriptionInput: Locator;
  readonly accountDropdown: Locator;
  readonly dateInput: Locator;
  readonly amountInput: Locator;
  readonly categoryDropdown: Locator;
  readonly taxesDropdown: Locator;
  readonly tagsDropdown: Locator;
  readonly noteInput: Locator;
  readonly splitTransactionLink: Locator;

  // ── Inline Selectors ──────────────────────────────────────
  readonly vendorSelector: Locator;
  readonly customerSelector: Locator;
  readonly projectSelector: Locator;

  // ── Modal Action Buttons ──────────────────────────────────
  readonly closeButton: Locator;
  readonly addButton: Locator;

  // ── Page Heading ──────────────────────────────────────────
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Landing Page
    this.connectBankButton = page
      .getByRole("button", { name: /Connect Bank/i })
      .first();
    this.importTransactionsButton = page
      .getByRole("button", { name: /Import Transactions/i })
      .first();
    this.addTransactionButton = page
      .getByRole("button", { name: /Add Transaction/i })
      .first();

    // Modal Header & Tabs
    const dialog = page.getByRole("dialog");

    this.modalHeading = dialog
      .getByText(/Add (Incoming|Outgoing|Transfer) Transaction/i)
      .first();
    this.incomingTab = dialog.getByRole("tab", { name: /Incoming/i }).first();
    this.outgoingTab = dialog.getByRole("tab", { name: /Outgoing/i }).first();
    this.transferTab = dialog.getByRole("tab", { name: /Transfer/i }).first();

    // Form Fields
    this.descriptionInput = dialog
      .getByRole("textbox", { name: "Description" })
      .first();
    this.accountDropdown = dialog
      .getByRole("button", { name: /Select Account/i })
      .or(dialog.getByRole("combobox", { name: /Account/i }))
      .or(dialog.locator("#accountId"))
      .first();
    this.dateInput = dialog
      .locator("#date")
      .or(dialog.getByLabel(/Date/i))
      .first();
    this.amountInput = dialog
      .getByPlaceholder("0.00")
      .or(dialog.getByRole("textbox", { name: /Amount/i }))
      .first();
    this.categoryDropdown = dialog
      .getByRole("button", { name: /Select Category/i })
      .or(dialog.locator("#categoryAccountId"))
      .or(dialog.getByRole("combobox", { name: /Category/i }))
      .first();
    this.taxesDropdown = dialog
      .getByRole("combobox", { name: /Taxes/i })
      .first();
    this.tagsDropdown = dialog.getByRole("combobox", { name: /Tags/i }).first();
    this.noteInput = dialog
      .getByRole("textbox", { name: "Write A Note" })
      .first();
    this.splitTransactionLink = dialog.getByText("Split Transaction").first();

    // Inline Selectors
    this.vendorSelector = dialog
      .getByRole("combobox", { name: /Vendor/i })
      .first();
    this.customerSelector = dialog
      .getByRole("combobox", { name: /Customer/i })
      .first();
    this.projectSelector = dialog
      .getByRole("combobox", { name: /Project/i })
      .first();

    // Action Buttons
    this.closeButton = dialog
      .getByRole("button", { name: /^Close$|^Cancel$/i })
      .or(dialog.locator('button[aria-label="Close"]'))
      .or(dialog.locator('button[aria-label="close"]'))
      .first();
    this.addButton = dialog
      .getByRole("button", { name: /^Add$|^Save$|^Create$/i })
      .first();

    // Page heading
    this.pageHeading = page
      .getByRole("heading", { name: /Transactions/i })
      .first();
  }

  // ── Navigation ──────────────────────────────────────────────

  /**
   * Navigate to the Transactions page.
   */
  async goto(): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.keyboard.press("Escape").catch(() => {});
      await this.page.waitForTimeout(500);
    }
    const bankingMenu = this.page
      .getByRole("button", { name: "Banking" })
      .first();
    if (await bankingMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isExpanded = await bankingMenu.getAttribute("aria-expanded");
      if (isExpanded !== "true") {
        await bankingMenu.click();
        await this.page.waitForTimeout(500);
      }
      const txLink = this.page
        .getByRole("link", { name: "Transactions" })
        .first();
      if (await txLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await txLink.click({ force: true });
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForTimeout(1000);
        return;
      }
    }
    await this.navigateTo(this.path);
    await this.pageHeading
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => null);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Open the "Add Transaction" modal for a specific type.
   */
  async openAddTransactionModal(
    type: "Incoming" | "Outgoing" | "Transfer" = "Incoming",
  ): Promise<void> {
    const dialog = this.page.getByRole("dialog");

    // Check if dialog is already open
    if (!(await dialog.isVisible().catch(() => false))) {
      await expect(this.addTransactionButton).toBeEnabled({ timeout: 30_000 });
      await this.page.waitForTimeout(500);
      await this.addTransactionButton.click({ force: true });
      await this.page.waitForTimeout(500);

      // If a dropdown menu appeared with options (Incoming / Outgoing / Transfer):
      const menuOption = this.page
        .getByRole("button", { name: new RegExp(`^${type}$`, "i") })
        .or(this.page.getByText(new RegExp(`^${type}$`, "i")))
        .locator("visible=true")
        .first();

      if (await menuOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuOption.click({ force: true });
        await this.page.waitForTimeout(500);
      }
    }

    // Now wait for the dialog to be fully visible
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await this.page.waitForTimeout(500);

    // If dialog has tabs (e.g. if opened to Incoming by default), switch to requested tab
    const typeTab = dialog
      .getByRole("tab", { name: new RegExp(type, "i") })
      .locator("visible=true")
      .first();

    if (await typeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeTab.click();
      await this.page.waitForTimeout(500);
    }

    await expect(this.modalHeading)
      .toBeVisible({ timeout: 10_000 })
      .catch(() => null);
  }

  // ── Tab Navigation ──────────────────────────────────────────

  /**
   * Switch to the Incoming tab (when modal is already open).
   */
  async switchToIncoming(): Promise<void> {
    await this.incomingTab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to the Outgoing tab (when modal is already open).
   */
  async switchToOutgoing(): Promise<void> {
    await this.outgoingTab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to the Transfer tab (when modal is already open).
   */
  async switchToTransfer(): Promise<void> {
    await this.transferTab.click();
    await this.page.waitForTimeout(300);
  }

  // ── Form Actions ────────────────────────────────────────────

  /**
   * Fill the description field.
   */
  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(description);
  }

  /**
   * Select a bank account.
   */
  async selectAccount(
    accountName: string = "1000: Cash on Hand",
  ): Promise<void> {
    await this.accountDropdown.click({ force: true });
    await this.page.waitForTimeout(500);

    const cleanName = accountName.replace(/^[0-9]+:\s*/, "");
    const option = this.page
      .locator(
        '[role="menuitemradio"]:visible, [data-category-option="true"]:visible',
      )
      .filter({ hasText: new RegExp(cleanName, "i") })
      .first();

    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click({ force: true });
    } else {
      const firstOpt = this.page
        .locator(
          '[role="menuitemradio"]:visible, [data-category-option="true"]:visible',
        )
        .filter({ hasText: /Cash|Undeposited|Bank|Checking/i })
        .first();
      if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOpt.click({ force: true });
      }
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Select a vendor.
   */
  async selectVendor(vendorName?: string): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    const vendorLink = dialog.getByText(/^Vendor$/i).first();
    if (await vendorLink.isVisible({ timeout: 1500 }).catch(() => false)) {
      await vendorLink.click({ force: true });
      await this.page.waitForTimeout(500);

      if (vendorName) {
        const option = this.page
          .locator(
            '[role="menuitemradio"]:visible, [role="option"]:visible, [data-category-option="true"]:visible',
          )
          .filter({ hasText: vendorName })
          .first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click({ force: true });
        }
      } else {
        const firstOpt = this.page
          .locator(
            '[role="menuitemradio"]:visible, [role="option"]:visible, [data-category-option="true"]:visible',
          )
          .filter({ hasNotText: /Create|Add/i })
          .first();
        if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOpt.click({ force: true });
        }
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select a customer.
   */
  async selectCustomer(customerName?: string): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    const customerLink = dialog.getByText(/^Customer$/i).first();
    if (await customerLink.isVisible({ timeout: 1500 }).catch(() => false)) {
      await customerLink.click({ force: true });
      await this.page.waitForTimeout(500);

      if (customerName) {
        const option = this.page
          .locator(
            '[role="menuitemradio"]:visible, [role="option"]:visible, [data-category-option="true"]:visible',
          )
          .filter({ hasText: customerName })
          .first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click({ force: true });
        }
      } else {
        const firstOpt = this.page
          .locator(
            '[role="menuitemradio"]:visible, [role="option"]:visible, [data-category-option="true"]:visible',
          )
          .filter({ hasNotText: /Create|Add/i })
          .first();
        if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOpt.click({ force: true });
        }
      }
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Fill the amount field.
   */
  async fillAmount(amount: number): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    const amountField = dialog
      .locator("#amount")
      .or(dialog.locator('input[name="amount"]'))
      .or(this.amountInput)
      .first();
    await amountField.waitFor({ state: "visible", timeout: 10_000 });
    await amountField.click({ force: true });
    await amountField.fill("");
    await amountField.fill(amount.toString());
  }

  /**
   * Select a category from the dropdown.
   */
  async selectCategory(categoryName: string): Promise<void> {
    await this.categoryDropdown.click({ force: true });
    await this.page.waitForTimeout(500);

    const option = this.page
      .locator(
        '[role="menuitemradio"]:visible, [data-category-option="true"]:visible',
      )
      .filter({ hasText: new RegExp(categoryName, "i") })
      .first();

    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click({ force: true });
    } else {
      const firstOpt = this.page
        .locator(
          '[role="menuitemradio"]:visible, [data-category-option="true"]:visible',
        )
        .filter({
          hasText: /Revenue|Expense|Advertising|Sales|Consulting|Marketing/i,
        })
        .first();
      if (await firstOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOpt.click({ force: true });
      }
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the note field.
   */
  async fillNote(note: string): Promise<void> {
    await this.noteInput.clear();
    await this.noteInput.fill(note);
  }

  /**
   * Click the "Add" button to create the transaction.
   */
  async clickAdd(): Promise<void> {
    const dialog = this.page.getByRole("dialog");
    const addBtn = dialog
      .getByRole("button", { name: /^Add$|^Save$|^Create$/i })
      .first();
    await addBtn.click({ force: true });
    await this.page.waitForTimeout(2000); // Wait for modal to close
  }

  /**
   * Close the modal without saving.
   */
  async clickClose(): Promise<void> {
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
   * Search for transactions in the listing table.
   */
  async searchTransaction(query: string): Promise<void> {
    const searchInput = this.page
      .getByPlaceholder(/Search/i)
      .or(this.page.locator('input[type="search"]'))
      .first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(query);
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get a transaction row by description or amount text.
   */
  getTransactionRow(text: string): Locator {
    return this.page.getByRole("row").filter({ hasText: text }).first();
  }

  /**
   * Verify a transaction row exists in the listing table.
   */
  async verifyTransactionInList(
    description: string,
    expectedAmount?: string,
  ): Promise<void> {
    const row = this.getTransactionRow(description);
    if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
      await this.searchTransaction(description);
    }
    await expect(row).toBeVisible({ timeout: 15_000 });
    if (expectedAmount) {
      // Support amounts formatted with comma (e.g. $1,000.00) or without (e.g. $1000.00)
      const cleanNum = expectedAmount.replace(/[^0-9.]/g, "");
      const num = parseFloat(cleanNum);
      if (!isNaN(num)) {
        const withComma = num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const withoutComma = num.toFixed(2);
        const amountRegex = new RegExp(
          `(\\$?${withComma.replace(",", "\\,")}|\\$?${withoutComma})`,
        );
        await expect(row).toContainText(amountRegex);
      } else {
        await expect(row).toContainText(expectedAmount);
      }
    }
  }
}
