import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";

/**
 * VISUAL REGRESSION SUITE
 *
 * Verifies visual integrity and catches unexpected CSS/layout shifts
 * using Playwright pixel-matching snapshot assertions.
 *
 * Dynamic text (dates, timestamps, avatars) are masked to avoid false positives.
 * Safe to run in both DEV and PROD environments (Read-Only).
 *
 * @visual @prod-safe
 */
test.describe("Visual Regression Suite", () => {
  test.describe.configure({ mode: "parallel" });

  test("@visual @prod-safe should match SignIn page layout", async ({
    page,
    signInPage,
  }) => {
    await signInPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("signin-page.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("@visual @prod-safe should match Forgot Password page layout", async ({
    page,
    forgotPasswordPage,
  }) => {
    await forgotPasswordPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("forgot-password-page.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test.describe("Authenticated Visuals", () => {
    test.beforeEach(async ({ page }) => {
      await selectActiveWorkspace(page);
    });

    test("@visual @prod-safe should match Dashboard layout", async ({
      page,
    }) => {
      await page.waitForLoadState("networkidle");

      // Mask dynamic timestamp widgets or live balances
      const dynamicWidgets = page.locator('time, [data-dynamic="true"]');

      await expect(page).toHaveScreenshot("dashboard-layout.png", {
        maxDiffPixelRatio: 0.08,
        animations: "disabled",
        mask: [dynamicWidgets],
      });
    });

    test("@visual @prod-safe should match Reports hub layout", async ({
      page,
      reportsPage,
    }) => {
      await reportsPage.navigateToReports();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("reports-hub.png", {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
      });
    });
  });
});
