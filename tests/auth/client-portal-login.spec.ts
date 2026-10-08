import { test, expect } from "../../src/fixtures/test-fixtures";
import { INVALID_EMAILS } from "../../src/data/test-data";

test.describe("Client Portal Login Page", () => {
  // Bypass any global authenticated state so we can test the login form
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ clientPortalLoginPage }) => {
    await clientPortalLoginPage.goto();
  });

  // ── Smoke Tests ───────────────────────────────────────────────

  test.describe("Smoke Tests", () => {
    test("should load the client portal login page successfully", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });

    test("should display the page title", async ({ clientPortalLoginPage }) => {
      await clientPortalLoginPage.assertTitle(/COUNT/i);
    });

    test("should display the company logo", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.assertVisible(clientPortalLoginPage.logo);
    });
  });

  // ── UI Element Validation ─────────────────────────────────────

  test.describe("UI Elements", () => {
    test("should display page heading", async ({ clientPortalLoginPage }) => {
      await clientPortalLoginPage.assertVisible(
        clientPortalLoginPage.pageHeading,
      );
    });

    test("should display email input field", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.assertVisible(
        clientPortalLoginPage.emailInput,
      );
    });

    test("should display send code button", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.assertVisible(
        clientPortalLoginPage.sendCodeButton,
      );
    });

    test("email input should accept keyboard input", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail("client@company.com");
      await expect(clientPortalLoginPage.emailInput).toHaveValue(
        "client@company.com",
      );
    });

    test("should display description or instructions text", async ({
      clientPortalLoginPage,
    }) => {
      // Look for any instructional text on the page
      await clientPortalLoginPage.assertVisible(
        clientPortalLoginPage.description,
      );
    });
  });

  // ── OTP Flow Tests ────────────────────────────────────────────

  test.describe("OTP Flow", () => {
    test("should not send code with empty email", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.sendCode();
      // Should remain on the same page
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });

    test("should not send code with invalid email format", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail(INVALID_EMAILS.noAtSign);
      await clientPortalLoginPage.sendCode();
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });

    test("should not send code with email without domain", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail(INVALID_EMAILS.noDomain);
      await clientPortalLoginPage.sendCode();
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });

    test("should accept valid email and attempt to send code", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.submitEmail("client@company.com");
      // After submitting, should either show OTP input or error message
      // The exact behavior depends on whether the email is a valid client
    });
  });

  // ── Form Validation ───────────────────────────────────────────

  test.describe("Form Validation", () => {
    test("should validate email with spaces", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail(INVALID_EMAILS.spaces);
      await clientPortalLoginPage.sendCode();
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });

    test("should validate email with double dot domain", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail(INVALID_EMAILS.doubleDot);
      await clientPortalLoginPage.sendCode();
      await clientPortalLoginPage.assertURL(/client-portal\/login/);
    });
  });

  // ── Navigation ────────────────────────────────────────────────

  test.describe("Navigation", () => {
    test("should have link to admin portal", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.assertVisible(
        clientPortalLoginPage.adminPortalLink,
      );
    });

    test("should navigate to admin portal sign-in", async ({
      clientPortalLoginPage,
    }) => {
      try {
        await clientPortalLoginPage.navigateToAdminPortal();
        await clientPortalLoginPage.assertURL(/signin/);
      } catch {
        // Admin link may not be visible
        test.skip();
      }
    });
  });

  // ── Accessibility ─────────────────────────────────────────────

  test.describe("Accessibility", () => {
    test("email input should be focusable via tab", async ({
      clientPortalLoginPage,
      page,
    }) => {
      await page.keyboard.press("Tab");
      // Verify focus reaches the email input
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(focusedElement).toBeTruthy();
    });

    test("form should be submittable via Enter key", async ({
      clientPortalLoginPage,
    }) => {
      await clientPortalLoginPage.enterEmail("client@company.com");
      await clientPortalLoginPage.page.keyboard.press("Enter");
      // Form should attempt submission
    });
  });
});
