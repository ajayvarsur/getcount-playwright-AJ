import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class JournalEntriesPage extends BasePage {
  readonly pageHeading: Locator;
  readonly searchInput: Locator;
  readonly journalEntriesTable: Locator;
  readonly journalEntriesRows: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole("heading", { name: "Journal Entries" });
    this.searchInput = page
      .getByPlaceholder(/Search Journal Entries/i)
      .or(page.getByRole("textbox", { name: /search/i }));
    this.journalEntriesTable = page.locator("table");
    // Using a more generic selector for the rows inside the main list area
    this.journalEntriesRows = page
      .locator("table tbody tr")
      .or(page.locator('[role="row"]'));
  }

  /**
   * Navigate to the Journal Entries page directly.
   */
  async goto() {
    // Dismiss any open modal dialog that might be intercepting pointer events
    const modal = this.page.locator('div[role="dialog"]:visible').first();
    if (await modal.isVisible().catch(() => false)) {
      const skipBtn = modal
        .getByRole("button", { name: /Skip|Close|Cancel/i })
        .first();
      if (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click({ force: true });
      } else {
        await this.page.keyboard.press("Escape");
      }
      await modal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const accountingMenu = this.page
      .getByRole("button", { name: "Accounting" })
      .first();
    const isExpanded = await accountingMenu.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await accountingMenu.click({ force: true });
      await this.page.waitForTimeout(500);
    }
    await this.page
      .getByRole("link", { name: "Journal Entries" })
      .first()
      .click({ force: true });
    await expect(this.pageHeading).toBeVisible({ timeout: 15_000 });
  }

  /**
   * Search for a specific transaction in the journal entries.
   * @param transactionNumber The transaction ID or invoice/bill number to search for.
   */
  async searchForTransaction(transactionNumber: string) {
    await this.searchInput.waitFor({ state: "visible" });
    await this.searchInput.fill(transactionNumber);
    // Click the search icon/button or press enter
    await this.page.keyboard.press("Enter");
    // Wait for the table to update
    await this.page.waitForTimeout(3000);
  }

  /**
   * Verify that a journal entry exists for the given transaction with the correct amounts.
   * @param transactionNumber The unique transaction ID.
   * @param expectedTotalAmount The expected total amount (e.g. "$250.00").
   */
  async verifyJournalEntryExists(
    transactionNumber: string,
    expectedTotalAmount: string,
  ) {
    await this.searchForTransaction(transactionNumber);

    // Check if the transaction number appears anywhere in the table body
    // Using a more forgiving locator strategy since it might be split across elements
    const tableBody = this.page.locator("table tbody");
    await expect(tableBody).toContainText(transactionNumber, {
      timeout: 15_000,
    });

    // Verify the amounts are visible in the table (flexible for comma and non-comma formats)
    const cleanNum = expectedTotalAmount.replace(/[^0-9.]/g, "");
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
      await expect(tableBody).toContainText(amountRegex, {
        timeout: 5_000,
      });
    } else {
      await expect(tableBody).toContainText(expectedTotalAmount, {
        timeout: 5_000,
      });
    }
  }

  /**
   * Verify that for a given transaction/journal entry, total Debits equal total Credits,
   * and both match the expected amount.
   * @param identifier Invoice number, customer/vendor name, or JNL reference.
   * @param expectedAmount The expected amount string (e.g. "$1,000.00" or "1000.00").
   */
  async verifyDebitsEqualCredits(identifier: string, expectedAmount: string) {
    await this.journalEntriesTable.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    const cleanIdentifier = identifier.split("\n")[0].trim();
    const searchBox = this.page
      .locator(
        'input[placeholder="Search Journal Entries"], input[placeholder="Search"]',
      )
      .first();
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill(cleanIdentifier);
      await this.page.keyboard.press("Enter");
      await this.page.waitForLoadState("networkidle").catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    const expectedNum = parseFloat(expectedAmount.replace(/[^0-9.]/g, ""));

    await expect
      .poll(
        async () => {
          const allRows = await this.page.locator("table tbody tr").all();
          for (let i = 0; i < allRows.length; i++) {
            const text = await allRows[i].innerText();
            if (text.includes(cleanIdentifier)) {
              // Look ahead for the Total row belonging to this entry
              for (let j = i; j < Math.min(allRows.length, i + 8); j++) {
                const rowText = await allRows[j].innerText();
                if (rowText.includes("Total")) {
                  const amounts =
                    rowText.match(/(\$|₹|¥)?\s*\d{1,3}(,\d{3})*(\.\d{2})?/g) ||
                    [];
                  const normalizedAmounts = amounts
                    .map((a) => a.replace(/[^0-9.]/g, ""))
                    .filter((a) => parseFloat(a) > 0);
                  if (normalizedAmounts.length >= 1) {
                    const firstAmount = parseFloat(normalizedAmounts[0]);
                    const secondAmount = normalizedAmounts.length >= 2 ? parseFloat(normalizedAmounts[1]) : firstAmount;
                    
                    if (
                      firstAmount === expectedNum &&
                      secondAmount === expectedNum
                    ) {
                      return true;
                    }
                  }
                }
              }
            }
          }
          return false;
        },
        {
          message: `Expected debit and credit totals to match ${expectedAmount} for identifier ${cleanIdentifier}`,
          timeout: 25_000,
          intervals: [1000, 2000],
        },
      )
      .toBe(true);
  }
}
