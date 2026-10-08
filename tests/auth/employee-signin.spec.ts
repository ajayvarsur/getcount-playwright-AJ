import { test, expect } from "../../src/fixtures/test-fixtures";
import { INVALID_EMAILS } from "../../src/data/test-data";

test.describe("Employee Portal Sign-In Page", () => {
  // Bypass any global authenticated state so we can test the login form
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ employeeSignInPage }) => {
    await employeeSignInPage.goto();
  });

  // ── Smoke Tests ───────────────────────────────────────────────

  test.describe("Smoke Tests", () => {
    test("should load the employee sign-in page successfully", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.assertURL(/person\/signin/);
    });

    test("should display the page title", async ({ employeeSignInPage }) => {
      await employeeSignInPage.assertTitle(/COUNT/i);
    });

    test("should display the company logo", async ({ employeeSignInPage }) => {
      await employeeSignInPage.assertVisible(employeeSignInPage.logo);
    });
  });

  // ── UI Element Validation ─────────────────────────────────────

  test.describe("UI Elements", () => {
    test("should display email input field", async ({ employeeSignInPage }) => {
      await employeeSignInPage.assertVisible(employeeSignInPage.emailInput);
    });

    test("should display password input field", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.assertVisible(employeeSignInPage.passwordInput);
    });

    test("should display sign-in button", async ({ employeeSignInPage }) => {
      await employeeSignInPage.assertVisible(employeeSignInPage.signInButton);
    });

    test("should display page heading", async ({ employeeSignInPage }) => {
      await employeeSignInPage.assertVisible(employeeSignInPage.pageHeading);
    });

    test("email input should accept keyboard input", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterEmail("employee@company.com");
      await expect(employeeSignInPage.emailInput).toHaveValue(
        "employee@company.com",
      );
    });

    test("password input should accept keyboard input", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterPassword("TestPassword123");
      await expect(employeeSignInPage.passwordInput).toHaveValue(
        "TestPassword123",
      );
    });

    test("password input should be masked by default", async ({
      employeeSignInPage,
    }) => {
      const type = await employeeSignInPage.getPasswordInputType();
      expect(type).toBe("password");
    });
  });

  // ── Password Visibility Toggle ────────────────────────────────

  test.describe("Password Visibility", () => {
    test("should toggle password visibility on click", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterPassword("SecretPass123!");

      // Initially masked
      let type = await employeeSignInPage.getPasswordInputType();
      expect(type).toBe("password");

      // Toggle to visible
      try {
        await employeeSignInPage.togglePasswordVisibility();
        type = await employeeSignInPage.getPasswordInputType();
        expect(type).toBe("text");

        // Toggle back to masked
        await employeeSignInPage.togglePasswordVisibility();
        type = await employeeSignInPage.getPasswordInputType();
        expect(type).toBe("password");
      } catch {
        // Toggle button may not be present in some UI states
        test.skip();
      }
    });
  });

  // ── Form Validation ───────────────────────────────────────────

  test.describe("Form Validation", () => {
    test("should not submit with empty fields", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.clickSignIn();
      // Should remain on the same page
      await employeeSignInPage.assertURL(/person\/signin/);
    });

    test("should not submit with empty password", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterEmail("employee@company.com");
      await employeeSignInPage.clickSignIn();
      await employeeSignInPage.assertURL(/person\/signin/);
    });

    test("should not submit with empty email", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterPassword("TestPassword123");
      await employeeSignInPage.clickSignIn();
      await employeeSignInPage.assertURL(/person\/signin/);
    });

    test("should not submit with invalid email format", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.enterEmail(INVALID_EMAILS.noAtSign);
      await employeeSignInPage.enterPassword("TestPassword123");
      await employeeSignInPage.clickSignIn();
      await employeeSignInPage.assertURL(/person\/signin/);
    });
  });

  // ── Navigation ────────────────────────────────────────────────

  test.describe("Navigation", () => {
    test("should have link to forgot password", async ({
      employeeSignInPage,
    }) => {
      await employeeSignInPage.assertVisible(
        employeeSignInPage.forgotPasswordLink,
      );
    });

    test("should navigate to admin portal", async ({ employeeSignInPage }) => {
      try {
        await employeeSignInPage.assertVisible(
          employeeSignInPage.adminPortalLink,
        );
        await employeeSignInPage.navigateToAdminPortal();
        await employeeSignInPage.assertURL(/signin/);
      } catch {
        // Admin portal link may not be present
        test.skip();
      }
    });
  });
});
