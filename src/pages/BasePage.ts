import { Page, Locator, expect } from "@playwright/test";

/**
 * BasePage — Abstract base class for all Page Objects.
 *
 * Provides common navigation, waiting, and assertion helpers
 * that all page objects can inherit.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────

  /**
   * Navigate to a URL path relative to baseURL.
   */
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  /**
   * Get the current page URL.
   */
  get currentURL(): string {
    return this.page.url();
  }

  /**
   * Get the current page title.
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // ── Waiting Helpers ─────────────────────────────────────────

  /**
   * Wait for a specific URL pattern.
   */
  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: 15_000 });
  }

  /**
   * Wait for the page to reach a specific load state.
   */
  async waitForLoadState(
    state: "load" | "domcontentloaded" | "networkidle" = "domcontentloaded",
  ): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  /**
   * Wait for a locator to be visible.
   */
  async waitForVisible(
    locator: Locator,
    timeout: number = 10_000,
  ): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for a locator to be hidden.
   */
  async waitForHidden(
    locator: Locator,
    timeout: number = 10_000,
  ): Promise<void> {
    await locator.waitFor({ state: "hidden", timeout });
  }

  // ── Interaction Helpers ─────────────────────────────────────

  /**
   * Click an element and optionally wait for navigation.
   */
  async clickAndWait(
    locator: Locator,
    waitForNav: boolean = false,
  ): Promise<void> {
    if (waitForNav) {
      await Promise.all([
        this.page.waitForLoadState("domcontentloaded"),
        locator.click(),
      ]);
    } else {
      await locator.click();
    }
  }

  /**
   * Clear an input field and type new text.
   */
  async clearAndType(locator: Locator, text: string): Promise<void> {
    await locator.clear();
    await locator.fill(text);
  }

  // ── Assertion Helpers ───────────────────────────────────────

  /**
   * Assert the page URL matches a pattern.
   */
  async assertURL(urlPattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlPattern);
  }

  /**
   * Assert the page title matches.
   */
  async assertTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }

  /**
   * Assert an element is visible.
   */
  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Assert an element contains specific text.
   */
  async assertText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /**
   * Assert an element has specific attribute value.
   */
  async assertAttribute(
    locator: Locator,
    attribute: string,
    value: string | RegExp,
  ): Promise<void> {
    await expect(locator).toHaveAttribute(attribute, value);
  }

  // ── Screenshot Helpers ──────────────────────────────────────

  /**
   * Take a full-page screenshot.
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Take a screenshot of a specific element.
   */
  async takeElementScreenshot(locator: Locator, name: string): Promise<Buffer> {
    return locator.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }

  // ── Authentication Actions ───────────────────────────────────

  /**
   * Sign out of the application.
   */
  async signOut(): Promise<void> {
    // Attempt to click the user profile dropdown in the header.
    // The profile button usually contains the user's initials or name.
    const profileButton = this.page
      .locator("header button")
      .filter({ hasText: /./ })
      .last();
    await profileButton.evaluate((node) => (node as HTMLElement).click());
    await this.page.waitForTimeout(500);

    // Click the "Sign Out" menu item.
    const signOutButton = this.page.locator("text=Sign Out").first();
    await signOutButton.evaluate((node) => (node as HTMLElement).click());

    // Wait for navigation back to sign-in or home
    await this.page.waitForLoadState("networkidle");
  }
}
