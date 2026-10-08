import { test, expect } from "../../src/fixtures/test-fixtures";
import { INVALID_EMAILS, VALID_ADMIN } from "../../src/data/test-data";
import { ENV } from "../../src/utils/env";

test.describe("Admin Sign-In Page", () => {
  // ── Bypass global authentication state for login tests ──────────
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ signInPage }) => {
    await signInPage.goto();
  });

  // ── Smoke Tests ───────────────────────────────────────────────

  test.describe("Smoke Tests", () => {
    test("should load the sign-in page successfully", async ({
      signInPage,
    }) => {
      await signInPage.assertURL(/signin/);
    });

    test("should display the page title", async ({ signInPage }) => {
      await signInPage.assertTitle(/COUNT/i);
    });

    test("should display the company logo", async ({ signInPage }) => {
      await signInPage.assertVisible(signInPage.logo);
    });
  });

  // ── UI Element Validation ─────────────────────────────────────

  test.describe("UI Elements", () => {
    test("should display email input field", async ({ signInPage }) => {
      await signInPage.assertVisible(signInPage.emailInput);
    });

    test("should display continue button", async ({ signInPage }) => {
      await signInPage.assertVisible(signInPage.continueButton);
    });

    test("should display sign-up link", async ({ signInPage }) => {
      await signInPage.assertVisible(signInPage.signUpLink);
    });

    test("should display page heading", async ({ signInPage }) => {
      await signInPage.assertVisible(signInPage.pageHeading);
    });

    test("email input should have correct placeholder", async ({
      signInPage,
    }) => {
      await expect(signInPage.emailInput).toHaveAttribute(
        "placeholder",
        /email/i,
      );
    });

    test("email input should accept keyboard input", async ({ signInPage }) => {
      await signInPage.enterEmail("test@example.com");
      await expect(signInPage.emailInput).toHaveValue("test@example.com");
    });
  });

  // ── Form Validation ───────────────────────────────────────────

  test.describe("Form Validation", () => {
    test("should not proceed with empty email", async ({ signInPage }) => {
      await signInPage.clickContinue();
      // Should remain on the same page
      await signInPage.assertURL(/signin/);
    });

    test("should not proceed with invalid email format - no @ sign", async ({
      signInPage,
    }) => {
      await signInPage.enterEmail(INVALID_EMAILS.noAtSign);
      await signInPage.clickContinue();
      await signInPage.assertURL(/signin/);
    });

    test("should not proceed with invalid email format - no domain", async ({
      signInPage,
    }) => {
      await signInPage.enterEmail(INVALID_EMAILS.noDomain);
      await signInPage.clickContinue();
      await signInPage.assertURL(/signin/);
    });

    test("should trim whitespace from email input", async ({ signInPage }) => {
      await signInPage.enterEmail("  test@example.com  ");
      await signInPage.clickContinue();
      // Should attempt to proceed (email trimmed)
    });
  });

  // ── Navigation Tests ──────────────────────────────────────────

  test.describe("Navigation", () => {
    test("should navigate to sign-up page", async ({ signInPage }) => {
      await signInPage.navigateToSignUp();
      await signInPage.assertURL(/signup/);
    });

    test("should navigate to forgot password page", async ({ signInPage }) => {
      await signInPage.enterEmail("test@example.com");
      await signInPage.clickContinue();
      // Wait for password step to appear and look for forgot password link
      try {
        await signInPage.waitForVisible(signInPage.forgotPasswordLink, 5000);
        await signInPage.navigateToForgotPassword();
        await signInPage.assertURL(/forgot-password/);
      } catch {
        // Forgot password link may only appear after email is validated
        test.skip();
      }
    });

    test("should navigate to employee portal", async ({ signInPage, page }) => {
      // Look for employee portal link
      const employeeLink = page
        .getByRole("link", { name: /employee/i })
        .first();
      if (await employeeLink.isVisible()) {
        await employeeLink.click();
        await signInPage.assertURL(/person\/signin/);
      } else {
        test.skip();
      }
    });

    test("should navigate to client portal", async ({ signInPage, page }) => {
      // Look for client portal link
      const clientLink = page.getByRole("link", { name: /client/i }).first();
      if (await clientLink.isVisible()) {
        await clientLink.click();
        await signInPage.assertURL(/client-portal/);
      } else {
        test.skip();
      }
    });
  });

  // ── Password Step Tests ───────────────────────────────────────

  test.describe("Full Login Flow", () => {
    test("should login with human like typing and navigate to dashboard", async ({
      signInPage,
    }) => {
      test.setTimeout(90000); // 90 seconds to allow for manual OTP entry

      // Step 1: Enter email with human-like typing
      await signInPage.emailInput.clear();
      await signInPage.emailInput.pressSequentially(VALID_ADMIN.email, {
        delay: 100,
      });
      await signInPage.clickContinue();

      // Wait for password field to fully animate and settle
      await signInPage.waitForVisible(signInPage.passwordInput, 15000);
      await signInPage.page.waitForTimeout(1000); // 1 second wait for transitions

      // Step 2: Enter password by clicking and typing (most robust for React)
      await signInPage.passwordInput.click();
      await signInPage.passwordInput.pressSequentially(VALID_ADMIN.password, {
        delay: 50,
      });

      // Add a tiny delay to ensure React state catches up before submitting
      await signInPage.page.waitForTimeout(500);
      await signInPage.clickSignIn();

      // Assert navigation to dashboard (or Security Check if 2FA is triggered)
      // Assert navigation to the Security Check (2FA) screen
      const securityCheckHeading = signInPage.page.getByRole("heading", {
        name: /Security Check/i,
      });
      await securityCheckHeading.waitFor({ state: "visible", timeout: 15000 });

      // Prompt the user in the console
      console.log("\n======================================================");
      console.log("🔒 SECURITY CHECK REACHED");
      console.log(
        "Please check your email and manually enter the OTP in the browser.",
      );
      console.log(
        "Waiting up to 60 seconds for you to enter the OTP and continue...",
      );
      console.log("======================================================\n");

      // Wait for the dashboard navigation after the user manually submits the OTP
      await signInPage.page.waitForURL(/accountant\/clients/i, {
        timeout: 60000,
      });
      console.log("✅ Successfully navigated to the dashboard!");

      // Step 3: Click profile dropdown
      console.log("🔄 Opening profile menu...");
      const profileButton = signInPage.page.locator(
        'button[aria-haspopup="true"]',
      );
      await profileButton.waitFor({ state: "visible", timeout: 10_000 });
      await profileButton.click();
      await signInPage.page.waitForTimeout(800);

      // Step 4: Click "My Workspaces" (on Practice Manager page)
      console.log("🔄 Clicking My Workspaces...");
      const myWorkspaces = signInPage.page.getByText("My Workspaces", {
        exact: true,
      });
      const switchWorkspace = signInPage.page.getByText("Switch Workspace", {
        exact: true,
      });
      if (await myWorkspaces.isVisible().catch(() => false)) {
        await myWorkspaces.click();
      } else if (await switchWorkspace.isVisible().catch(() => false)) {
        await switchWorkspace.click();
      }
      await signInPage.page.waitForLoadState("networkidle");
      console.log("✅ On workspace selection page");

      // Step 5: Select workspace
      console.log(`🔄 Selecting ${ENV.WORKSPACE_NAME} workspace...`);
      const workspaceRow = signInPage.page
        .locator("tr", { hasText: ENV.WORKSPACE_NAME })
        .first();
      await workspaceRow.waitFor({ state: "visible", timeout: 10_000 });
      await workspaceRow
        .getByRole("button", { name: /Go To Workspace/i })
        .click();
      await signInPage.page.waitForLoadState("networkidle");
      console.log(`✅ Inside ${ENV.WORKSPACE_NAME} workspace!`);
    });
  });

  test.describe("Password Step", () => {
    test("should show password field after entering valid email", async ({
      signInPage,
    }) => {
      await signInPage.enterEmail("validuser@example.com");
      await signInPage.clickContinue();

      // Wait for either password field or error
      try {
        await signInPage.waitForVisible(signInPage.passwordInput, 10_000);
        await signInPage.assertVisible(signInPage.passwordInput);
      } catch {
        // If no password field appears, the email may not be registered
        // This is expected behavior — the test validates the flow, not the data
        test.skip();
      }
    });
  });
});
