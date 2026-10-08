import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * EmployeeSignInPage — Page Object for the Employee Portal Sign-In (/person/signin).
 *
 * Handles employee login with email and password fields on a single page.
 */
export class EmployeeSignInPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/person/signin";

  // ── Page Elements ───────────────────────────────────────────
  readonly pageHeading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly showPasswordToggle: Locator;

  // ── Links ───────────────────────────────────────────────────
  readonly forgotPasswordLink: Locator;
  readonly adminPortalLink: Locator;

  // ── Error Messages ──────────────────────────────────────────
  readonly errorMessage: Locator;

  // ── Logo ────────────────────────────────────────────────────
  readonly logo: Locator;

  constructor(page: Page) {
    super(page);

    // Elements
    this.pageHeading = page
      .getByRole("heading", { name: /sign in|employee/i })
      .first();
    this.emailInput = page
      .getByPlaceholder(/email/i)
      .or(page.locator('input[type="email"]'))
      .first();
    this.passwordInput = page
      .getByPlaceholder(/password/i)
      .or(page.locator('input[type="password"]'))
      .first();
    this.signInButton = page
      .getByRole("button", { name: /sign in|log in/i })
      .first();
    this.showPasswordToggle = page
      .locator(
        '[data-testid="toggle-password"], button:has(svg):near(input[type="password"])',
      )
      .first();

    // Links
    this.forgotPasswordLink = page
      .getByRole("link", { name: /forgot password/i })
      .first();
    this.adminPortalLink = page
      .getByRole("link", { name: /admin|back to admin/i })
      .first();

    // Error
    this.errorMessage = page
      .locator('.text-red-500, .error-message, [role="alert"]')
      .first();

    // Branding
    this.logo = page.locator('img[alt*="count" i], img[alt*="logo" i]').first();
  }

  // ── Actions ─────────────────────────────────────────────────

  /**
   * Navigate to the Employee Sign In page.
   */
  async goto(): Promise<void> {
    await this.navigateTo(this.path);
  }

  /**
   * Enter email address.
   */
  async enterEmail(email: string): Promise<void> {
    await this.clearAndType(this.emailInput, email);
  }

  /**
   * Enter password.
   */
  async enterPassword(password: string): Promise<void> {
    await this.clearAndType(this.passwordInput, password);
  }

  /**
   * Click the Sign In button.
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Complete full login flow.
   */
  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  /**
   * Toggle password visibility.
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordToggle.click();
  }

  /**
   * Check the password input type (text = visible, password = hidden).
   */
  async getPasswordInputType(): Promise<string | null> {
    return this.passwordInput.getAttribute("type");
  }

  /**
   * Navigate to Forgot Password page.
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.clickAndWait(this.forgotPasswordLink, true);
  }

  /**
   * Navigate back to Admin Portal.
   */
  async navigateToAdminPortal(): Promise<void> {
    await this.clickAndWait(this.adminPortalLink, true);
  }

  /**
   * Check if an error message is displayed.
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /**
   * Get the error message text.
   */
  async getErrorText(): Promise<string> {
    return this.errorMessage.innerText();
  }
}
