import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SignInPage — Page Object for the Admin Sign-In page (/signin).
 *
 * Handles the two-step login flow:
 *   Step 1: Enter work email → Click Continue
 *   Step 2: Enter password → Click Sign In
 */
export class SignInPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/signin";

  // ── Step 1: Email Entry ─────────────────────────────────────
  readonly pageHeading: Locator;
  readonly emailInput: Locator;
  readonly continueButton: Locator;

  // ── Step 2: Password Entry ──────────────────────────────────
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly showPasswordToggle: Locator;

  // ── Links ───────────────────────────────────────────────────
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly employeePortalLink: Locator;
  readonly clientPortalLink: Locator;

  // ── Error Messages ──────────────────────────────────────────
  readonly errorMessage: Locator;

  // ── Logo & Branding ─────────────────────────────────────────
  readonly logo: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1
    this.pageHeading = page.getByRole("heading", { name: /sign in/i }).first();
    this.emailInput = page
      .getByPlaceholder(/work email/i)
      .or(page.locator('input[type="email"]'))
      .first();
    this.continueButton = page
      .getByRole("button", { name: /continue/i })
      .first();

    // Step 2
    this.passwordInput = page
      .getByPlaceholder(/password/i)
      .or(page.locator('input[type="password"]'))
      .first();
    this.signInButton = page.getByRole("button", { name: /sign in/i }).first();
    this.showPasswordToggle = page
      .locator(
        '[data-testid="toggle-password"], button:has(svg):near(input[type="password"])',
      )
      .first();

    // Links
    this.signUpLink = page.getByRole("link", { name: /sign up/i }).first();
    this.forgotPasswordLink = page
      .getByRole("link", { name: /forgot password/i })
      .first();
    this.employeePortalLink = page
      .getByRole("link", { name: /employee/i })
      .first();
    this.clientPortalLink = page
      .getByRole("link", { name: /client portal/i })
      .first();

    // Error messages
    this.errorMessage = page
      .locator('.text-red-500, .error-message, [role="alert"]')
      .first();

    // Branding
    this.logo = page.locator('img[alt*="count" i], img[alt*="logo" i]').first();
  }

  // ── Actions ─────────────────────────────────────────────────

  /**
   * Navigate to the Sign In page.
   */
  async goto(): Promise<void> {
    await this.navigateTo(this.path);
  }

  /**
   * Enter work email address.
   */
  async enterEmail(email: string): Promise<void> {
    await this.clearAndType(this.emailInput, email);
  }

  /**
   * Click the Continue button (step 1 → step 2).
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Enter password in step 2.
   */
  async enterPassword(password: string): Promise<void> {
    await this.clearAndType(this.passwordInput, password);
  }

  /**
   * Click Sign In button to submit credentials.
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Complete full login flow: email → continue → password → sign in.
   */
  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.clickContinue();
    await this.waitForVisible(this.passwordInput);
    await this.enterPassword(password);
    await this.clickSignIn();
  }

  /**
   * Navigate to the Sign Up page via link.
   */
  async navigateToSignUp(): Promise<void> {
    await this.clickAndWait(this.signUpLink, true);
  }

  /**
   * Navigate to the Forgot Password page via link.
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.clickAndWait(this.forgotPasswordLink, true);
  }

  /**
   * Navigate to the Employee Portal via link.
   */
  async navigateToEmployeePortal(): Promise<void> {
    await this.clickAndWait(this.employeePortalLink, true);
  }

  /**
   * Navigate to the Client Portal via link.
   */
  async navigateToClientPortal(): Promise<void> {
    await this.clickAndWait(this.clientPortalLink, true);
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
