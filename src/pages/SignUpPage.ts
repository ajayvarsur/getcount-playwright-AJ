import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SignUpPage — Page Object for the Admin Sign-Up page (/signup).
 *
 * Handles the two-step registration flow:
 *   Step 1: Select account type (Business Owner / Accountant)
 *   Step 2: Fill in registration details
 */
export class SignUpPage extends BasePage {
  // ── Page URL ────────────────────────────────────────────────
  readonly path = "/signup";

  // ── Step 1: Account Type Selection ──────────────────────────
  readonly pageHeading: Locator;
  readonly businessOwnerOption: Locator;
  readonly accountantOption: Locator;
  readonly continueButton: Locator;

  // ── Step 2: Registration Form ───────────────────────────────
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  // ── Links ───────────────────────────────────────────────────
  readonly signInLink: Locator;
  readonly backButton: Locator;

  // ── Error Messages ──────────────────────────────────────────
  readonly errorMessage: Locator;
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1
    this.pageHeading = page.getByRole("heading", { name: /sign up/i }).first();
    this.businessOwnerOption = page.getByText(/business/i).first();
    this.accountantOption = page.getByText(/accountant/i).first();
    this.continueButton = page
      .getByRole("button", { name: /continue/i })
      .first();

    // Step 2
    this.firstNameInput = page
      .getByPlaceholder(/first name/i)
      .or(page.locator('input[name="firstName"]'))
      .first();
    this.lastNameInput = page
      .getByPlaceholder(/last name/i)
      .or(page.locator('input[name="lastName"]'))
      .first();
    this.emailInput = page
      .getByPlaceholder(/email/i)
      .or(page.locator('input[type="email"]'))
      .first();
    this.passwordInput = page
      .getByPlaceholder(/^password/i)
      .or(page.locator('input[name="password"]'))
      .first();
    this.confirmPasswordInput = page
      .getByPlaceholder(/confirm password/i)
      .or(page.locator('input[name="confirmPassword"]'))
      .first();
    this.submitButton = page
      .getByRole("button", { name: /sign up|create account|register/i })
      .first();

    // Links
    this.signInLink = page.getByRole("link", { name: /sign in/i }).first();
    this.backButton = page
      .getByRole("button", { name: /back/i })
      .or(page.locator('[data-testid="back-button"]'))
      .first();

    // Errors
    this.errorMessage = page
      .locator('.text-red-500, .error-message, [role="alert"]')
      .first();
    this.fieldErrors = page.locator(
      ".text-red-500, .field-error, .text-destructive",
    );
  }

  // ── Actions ─────────────────────────────────────────────────

  /**
   * Navigate to the Sign Up page.
   */
  async goto(): Promise<void> {
    await this.navigateTo(this.path);
  }

  /**
   * Select "Business Owner" account type.
   */
  async selectBusinessOwner(): Promise<void> {
    await this.businessOwnerOption.click();
  }

  /**
   * Select "Accountant" account type.
   */
  async selectAccountant(): Promise<void> {
    await this.accountantOption.click();
  }

  /**
   * Click Continue to move from Step 1 to Step 2.
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Fill the registration form in Step 2.
   */
  async fillRegistrationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.clearAndType(this.firstNameInput, data.firstName);
    await this.clearAndType(this.lastNameInput, data.lastName);
    await this.clearAndType(this.emailInput, data.email);
    await this.clearAndType(this.passwordInput, data.password);
    await this.clearAndType(this.confirmPasswordInput, data.confirmPassword);
  }

  /**
   * Submit the registration form.
   */
  async submitRegistration(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration: select type → continue → fill form → submit.
   */
  async register(
    accountType: "business" | "accountant",
    data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    },
  ): Promise<void> {
    if (accountType === "business") {
      await this.selectBusinessOwner();
    } else {
      await this.selectAccountant();
    }
    await this.clickContinue();
    await this.fillRegistrationForm(data);
    await this.submitRegistration();
  }

  /**
   * Navigate to Sign In page.
   */
  async navigateToSignIn(): Promise<void> {
    await this.clickAndWait(this.signInLink, true);
  }

  /**
   * Get the number of visible field errors.
   */
  async getFieldErrorCount(): Promise<number> {
    return this.fieldErrors.count();
  }
}
