import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SettingsPage — Page Object for workspace Settings navigation and configuration.
 *
 * Covers currency settings, workspace profile, and tax configuration.
 */
export class SettingsPage extends BasePage {
  readonly sidebarSettingsLink: Locator;

  // ── Settings sub-navigation links ─────────────────────────────
  readonly currencyLink: Locator;
  readonly workspaceProfileLink: Locator;
  readonly taxSettingsLink: Locator;

  // ── Currency page ──────────────────────────────────────────────
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.sidebarSettingsLink = page
      .getByRole("link", { name: "Settings", exact: true })
      .first();
    this.currencyLink = page.getByRole("link", { name: /Currency/i }).first();
    this.workspaceProfileLink = page
      .getByRole("link", { name: /Workspace Profile|Profile/i })
      .first();
    this.taxSettingsLink = page.getByRole("link", { name: /Tax/i }).first();
    this.pageHeading = page.getByRole("heading", { level: 1 }).first();
  }

  /**
   * Navigate to the Settings page via the sidebar.
   */
  async goto(): Promise<void> {
    await this.sidebarSettingsLink.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to Settings > Currency.
   */
  async goToCurrency(): Promise<void> {
    await this.goto();
    await this.currencyLink.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Navigate to Settings > Tax.
   */
  async goToTaxSettings(): Promise<void> {
    await this.goto();
    await this.taxSettingsLink.click();
    await this.page.waitForLoadState("networkidle");
  }
}
