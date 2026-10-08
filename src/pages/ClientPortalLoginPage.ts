import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ClientPortalLoginPage — Page Object for the Client Portal Login (/client-portal/login).
 *
 * Handles the OTP-based login flow:
 *   Enter email → Send code → (OTP verification handled externally)
 */
export class ClientPortalLoginPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/client-portal/login";

  // ── Page Elements ───────────────────────────────────────────
  readonly pageHeading: Locator;
  readonly description: Locator;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;

  // ── OTP Verification (after code sent) ──────────────────────
  readonly otpInput: Locator;
  readonly verifyButton: Locator;
  readonly resendLink: Locator;

  // ── Links ───────────────────────────────────────────────────
  readonly adminPortalLink: Locator;

  // ── Feedback ────────────────────────────────────────────────
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  // ── Logo ────────────────────────────────────────────────────
  readonly logo: Locator;

  constructor(page: Page) {
    super(page);

    // Elements
    this.pageHeading = page
      .getByRole("heading", { name: /client portal|sign in/i })
      .first();
    this.description = page
      .getByText(/access code|one-time|otp|enter your email/i)
      .first();
    this.emailInput = page
      .getByPlaceholder(/email/i)
      .or(page.locator('input[type="email"]'))
      .first();
    this.sendCodeButton = page
      .getByRole("button", { name: /send code|get code|continue|submit/i })
      .first();

    // OTP Verification
    this.otpInput = page
      .locator(
        'input[type="tel"], input[inputmode="numeric"], input[maxlength="1"]',
      )
      .first();
    this.verifyButton = page
      .getByRole("button", { name: /verify|confirm|submit/i })
      .first();
    this.resendLink = page.getByText(/resend|send again/i).first();

    // Links
    this.adminPortalLink = page
      .getByRole("link", { name: /admin|sign in as admin|back/i })
      .first();

    // Feedback
    this.errorMessage = page
      .locator('.text-red-500, .error-message, [role="alert"]')
      .first();
    this.successMessage = page
      .locator('.text-green-500, .success-message, [role="status"]')
      .first();

    // Branding
    this.logo = page.locator('img[alt*="count" i], img[alt*="logo" i]').first();
  }

  // ── Actions ─────────────────────────────────────────────────

  /**
   * Navigate to the Client Portal Login page.
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
   * Click the Send Code button.
   */
  async sendCode(): Promise<void> {
    await this.sendCodeButton.click();
  }

  /**
   * Complete the email submission step.
   */
  async submitEmail(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.sendCode();
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

  /**
   * Check if OTP input section is visible (code was sent).
   */
  async isOTPSectionVisible(): Promise<boolean> {
    return this.otpInput.isVisible();
  }
}
