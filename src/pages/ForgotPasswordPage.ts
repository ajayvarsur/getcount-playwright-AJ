import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ForgotPasswordPage — Page Object for the Forgot Password page (/forgot-password).
 *
 * Handles the password reset request flow:
 *   Enter email → Request password reset link
 */
export class ForgotPasswordPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/forgot-password";

  // ── Page Elements ───────────────────────────────────────────
  readonly pageHeading: Locator;
  readonly description: Locator;
  readonly emailInput: Locator;
  readonly requestButton: Locator;

  // ── Links ───────────────────────────────────────────────────
  readonly signInLink: Locator;
  readonly backToSignInLink: Locator;

  // ── Feedback ────────────────────────────────────────────────
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Elements
    this.pageHeading = page
      .getByRole("heading", { name: /forgot password|reset password/i })
      .first();
    this.description = page.getByText(/enter your email|we'll send/i).first();
    this.emailInput = page
      .getByPlaceholder(/email/i)
      .or(page.locator('input[type="email"]'))
      .first();
    this.requestButton = page
      .getByRole("button", { name: /request|reset|send|submit/i })
      .first();

    // Links
    this.signInLink = page
      .getByRole("link", { name: /sign in|back to login/i })
      .first();
    this.backToSignInLink = page
      .getByRole("link", { name: /back|return/i })
      .first();

    // Feedback
    this.successMessage = page
      .locator('.text-green-500, .success-message, [role="status"]')
      .first();
    this.errorMessage = page
      .locator('.text-red-500, .error-message, [role="alert"]')
      .first();
  }

  // ── Actions ─────────────────────────────────────────────────

  /**
   * Navigate to the Forgot Password page.
   */
  async goto(): Promise<void> {
    await this.navigateTo(this.path);
  }

  /**
   * Enter email address for password reset.
   */
  async enterEmail(email: string): Promise<void> {
    await this.clearAndType(this.emailInput, email);
  }

  /**
   * Click the request/reset button.
   */
  async submitRequest(): Promise<void> {
    await this.requestButton.click();
  }

  /**
   * Complete the forgot password flow: enter email → submit.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.submitRequest();
  }

  /**
   * Navigate back to sign in.
   */
  async navigateToSignIn(): Promise<void> {
    const link = this.signInLink.or(this.backToSignInLink);
    await this.clickAndWait(link.first(), true);
  }

  /**
   * Check if a success message is displayed.
   */
  async hasSuccess(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  /**
   * Check if an error message is displayed.
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }
}
