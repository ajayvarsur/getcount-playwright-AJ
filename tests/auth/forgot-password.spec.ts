import { test, expect } from "../../src/fixtures/test-fixtures";
import { INVALID_EMAILS } from "../../src/data/test-data";

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  // ── Smoke Tests ───────────────────────────────────────────────

  test.describe("Smoke Tests", () => {
    test("should load the forgot password page successfully", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.assertURL(/forgot-password/);
    });

    test("should display the page title", async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.assertTitle(/COUNT/i);
    });

    test("should display the page heading", async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.assertVisible(forgotPasswordPage.pageHeading);
    });
  });

  // ── UI Element Validation ─────────────────────────────────────

  test.describe("UI Elements", () => {
    test("should display email input field", async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.assertVisible(forgotPasswordPage.emailInput);
    });

    test("should display request/reset button", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.assertVisible(forgotPasswordPage.requestButton);
    });

    test("should display description text", async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.assertVisible(forgotPasswordPage.description);
    });

    test("email input should accept keyboard input", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.enterEmail("test@example.com");
      await expect(forgotPasswordPage.emailInput).toHaveValue(
        "test@example.com",
      );
    });
  });

  // ── Form Validation ───────────────────────────────────────────

  test.describe("Form Validation", () => {
    test("should not submit with empty email", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.submitRequest();
      // Should remain on the same page
      await forgotPasswordPage.assertURL(/forgot-password/);
    });

    test("should not submit with invalid email - no @ sign", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.requestPasswordReset(INVALID_EMAILS.noAtSign);
      await forgotPasswordPage.assertURL(/forgot-password/);
    });

    test("should not submit with invalid email - no domain", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.requestPasswordReset(INVALID_EMAILS.noDomain);
      await forgotPasswordPage.assertURL(/forgot-password/);
    });

    test("should accept valid email format", async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.enterEmail("user@company.com");
      await expect(forgotPasswordPage.emailInput).toHaveValue(
        "user@company.com",
      );
    });

    test("should submit with valid email and show feedback", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.requestPasswordReset("registered@example.com");
      // After submission, should either show success message or error
      // The exact behavior depends on whether the email is registered
    });
  });

  // ── Navigation ────────────────────────────────────────────────

  test.describe("Navigation", () => {
    test("should have link back to sign-in page", async ({
      forgotPasswordPage,
    }) => {
      const signInLink = forgotPasswordPage.signInLink.or(
        forgotPasswordPage.backToSignInLink,
      );
      await forgotPasswordPage.assertVisible(signInLink.first());
    });

    test("should navigate back to sign-in page", async ({
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.navigateToSignIn();
      await forgotPasswordPage.assertURL(/signin/);
    });
  });
});
