import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ReportsPage extends BasePage {
  readonly reportsSidebarLink: Locator;
  readonly profitAndLossCard: Locator;

  // Profit & Loss Form Locators
  readonly generateReportButton: Locator;

  constructor(page: Page) {
    super(page);

    // Sidebar link to Reports
    this.reportsSidebarLink = page.getByRole("link", {
      name: "Reports",
      exact: true,
    });

    // Profit & Loss card on the main reports page
    this.profitAndLossCard = page
      .locator("text=Profit & Loss Statement")
      .first();

    // Form buttons
    this.generateReportButton = page.getByRole("button", {
      name: "Generate Report",
    });
  }

  /**
   * Navigates to the Reports page via the sidebar.
   */
  async navigateToReports(): Promise<void> {
    await this.reportsSidebarLink.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Opens the Profit & Loss Statement report form.
   */
  async openProfitAndLossStatement(): Promise<void> {
    await this.profitAndLossCard.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Generates the report with default or pre-filled form values.
   */
  async generateReport(): Promise<void> {
    await this.generateReportButton.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator("#profitAndLossReport")
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await this.page
      .locator("text=Net Profit")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  /**
   * Retrieves the numeric summary values from the generated P&L report.
   */
  async getProfitAndLossSummary(): Promise<{
    income: number;
    cogs: number;
    expenses: number;
    netProfit: number;
  }> {
    await this.page
      .locator("text=Net Profit")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    const parseAmount = (txt: string): number => {
      if (!txt) return 0;
      const isNegative =
        txt.includes("(") || txt.includes("-") || txt.includes("−");
      const match = txt.match(/\$?\s*([0-9,]+(\.[0-9]+)?)/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        return isNegative ? -val : val;
      }
      const num = parseFloat(txt.replace(/[^0-9.-]/g, ""));
      return isNaN(num) ? 0 : num;
    };

    const extractMetric = async (label: string): Promise<number> => {
      // 1. Try finding element containing the label and inspect parent/siblings
      const labelLoc = this.page.locator(`text="${label}"`).first();
      if (await labelLoc.isVisible().catch(() => false)) {
        const parent = labelLoc.locator("..");
        const parentText = await parent.innerText().catch(() => "");
        const parentAmt = parseAmount(parentText.replace(label, ""));
        if (parentAmt !== 0) return parentAmt;

        const sibling = labelLoc.locator("xpath=following-sibling::*").first();
        if (await sibling.isVisible().catch(() => false)) {
          const sibText = await sibling.innerText().catch(() => "");
          const sibAmt = parseAmount(sibText);
          if (sibAmt !== 0) return sibAmt;
        }
      }

      // 2. Fallback: Search the full page text around the label
      const bodyText = await this.page
        .locator("main")
        .innerText()
        .catch(() => "");
      const regex = new RegExp(
        `${label}[^$0-9−-]*([−-]?\\$?[0-9,]+(\\.[0-9]+)?)`,
        "i",
      );
      const match = bodyText.match(regex);
      if (match) {
        const isNeg = match[1].includes("-") || match[1].includes("−");
        const clean = match[1].replace(/[$,−-]/g, "");
        const val = parseFloat(clean);
        return isNeg ? -val : val;
      }

      return 0;
    };

    const income = await extractMetric("Income");
    const cogs = await extractMetric("Cost of Goods Sold");
    const expenses = await extractMetric("Operating Expenses");
    const netProfit = await extractMetric("Net Profit");

    return {
      income,
      cogs,
      expenses,
      netProfit,
    };
  }
}
