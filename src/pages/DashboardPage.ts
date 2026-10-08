import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DashboardPage — Page Object for the workspace dashboard.
 *
 * After login and workspace selection, this is the main hub.
 * Provides navigation to all workspace sections via the sidebar.
 */
export class DashboardPage extends BasePage {
  // ── Sidebar Navigation Categories ─────────────────────────────
  readonly sidebarDashboards: Locator;
  readonly sidebarTasks: Locator;
  readonly sidebarAI: Locator;

  // Sell
  readonly sidebarSell: Locator;
  readonly sidebarInvoices: Locator;
  readonly sidebarCustomers: Locator;
  readonly sidebarProducts: Locator;

  // Spend
  readonly sidebarSpend: Locator;
  readonly sidebarBills: Locator;
  readonly sidebarExpenseReports: Locator;
  readonly sidebarReceipts: Locator;
  readonly sidebarPrintChecks: Locator;
  readonly sidebarVendors: Locator;

  // Banking
  readonly sidebarBanking: Locator;
  readonly sidebarTransactions: Locator;
  readonly sidebarReconciliation: Locator;
  readonly sidebarAccountsConnections: Locator;

  // Other sections
  readonly sidebarPayroll: Locator;
  readonly sidebarAccounting: Locator;
  readonly sidebarPlanning: Locator;
  readonly sidebarWork: Locator;
  readonly sidebarReports: Locator;
  readonly sidebarSettings: Locator;

  // ── Dashboard Quick Actions ───────────────────────────────────
  readonly createInvoiceButton: Locator;
  readonly createBillButton: Locator;

  constructor(page: Page) {
    super(page);

    // Main sidebar categories
    this.sidebarDashboards = page
      .getByRole("link", { name: /^Dashboards$/i })
      .first();
    this.sidebarTasks = page.getByRole("link", { name: /^Tasks$/i }).first();
    this.sidebarAI = page.getByRole("link", { name: /^AI$/i }).first();

    // Sell section
    this.sidebarSell = page.getByText(/^Money In$/i).first();
    this.sidebarInvoices = page
      .getByRole("link", { name: /Invoices & Estimates/i })
      .first();
    this.sidebarCustomers = page
      .getByRole("link", { name: /^Customers$/i })
      .first();
    this.sidebarProducts = page
      .getByRole("link", { name: /Products & Services/i })
      .first();

    // Spend section
    this.sidebarSpend = page.getByText(/^Money Out$/i).first();
    this.sidebarBills = page
      .getByRole("link", { name: /Bills to Pay/i })
      .first();
    this.sidebarExpenseReports = page
      .getByRole("link", { name: /Expense Reports/i })
      .first();
    this.sidebarReceipts = page
      .getByRole("link", { name: /^Receipts$/i })
      .first();
    this.sidebarPrintChecks = page
      .getByRole("link", { name: /Print Checks/i })
      .first();
    this.sidebarVendors = page
      .getByRole("link", { name: /^Vendors$/i })
      .first();

    // Banking section
    this.sidebarBanking = page.getByText(/^Banking$/i).first();
    this.sidebarTransactions = page
      .getByRole("link", { name: /^Transactions$/i })
      .first();
    this.sidebarReconciliation = page
      .getByRole("link", { name: /^Reconciliation$/i })
      .first();
    this.sidebarAccountsConnections = page
      .getByRole("link", { name: /Accounts & Connections/i })
      .first();

    // Other sections
    this.sidebarPayroll = page
      .getByRole("link", { name: /^Payroll$/i })
      .first();
    this.sidebarAccounting = page
      .getByRole("link", { name: /^Accounting$/i })
      .first();
    this.sidebarPlanning = page
      .getByRole("link", { name: /^Planning$/i })
      .first();
    this.sidebarWork = page.getByRole("link", { name: /^Work$/i }).first();
    this.sidebarReports = page
      .getByRole("link", { name: /^Reports$/i })
      .first();
    this.sidebarSettings = page
      .getByRole("link", { name: /^Settings$/i })
      .first();

    // Dashboard quick actions
    this.createInvoiceButton = page.getByText(/Create Invoice/i).first();
    this.createBillButton = page.getByText(/Create Bill/i).first();
  }

  // ── Navigation Actions ──────────────────────────────────────

  /**
   * Navigate to the Invoices & Estimates page via sidebar.
   */
  async goToInvoices(): Promise<void> {
    await this.expandSidebarSection(this.sidebarSell);
    await this.sidebarInvoices.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to the Bills to Pay page via sidebar.
   */
  async goToBills(): Promise<void> {
    await this.expandSidebarSection(this.sidebarSpend);
    await this.sidebarBills.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to the Transactions page via sidebar.
   */
  async goToTransactions(): Promise<void> {
    await this.expandSidebarSection(this.sidebarBanking);
    await this.sidebarTransactions.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to Customers page via sidebar.
   */
  async goToCustomers(): Promise<void> {
    await this.expandSidebarSection(this.sidebarSell);
    await this.sidebarCustomers.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to Vendors page via sidebar.
   */
  async goToVendors(): Promise<void> {
    await this.expandSidebarSection(this.sidebarSpend);
    await this.sidebarVendors.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to the Dashboard page via sidebar.
   */
  async goToDashboard(): Promise<void> {
    await this.sidebarDashboards.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  // ── Helper Methods ────────────────────────────────────────────

  /**
   * Expand a sidebar section (Sell, Spend, Banking) if it is collapsed.
   * Clicks the section header to toggle it open.
   */
  private async expandSidebarSection(sectionLocator: Locator): Promise<void> {
    const isExpanded = await sectionLocator.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await sectionLocator.click();
      // Small wait for the accordion animation
      await this.page.waitForTimeout(300);
    }
  }
}
