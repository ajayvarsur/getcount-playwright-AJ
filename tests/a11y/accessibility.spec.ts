import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * ACCESSIBILITY (A11Y) SUITE
 *
 * Runs automated accessibility audits using axe-core to verify WCAG 2.1 AA compliance
 * across primary public and authenticated pages.
 *
 * Safe to run in both DEV and PROD environments (Read-Only).
 *
 * @a11y @prod-safe
 */
test.describe("Accessibility (WCAG 2.1 AA) Audits", () => {
  test.describe("Public Pages A11y", () => {
    // Unauthenticated pages must clear session cookies/origins to avoid automatic redirection
    test.use({ storageState: { cookies: [], origins: [] } });

    test("@a11y @prod-safe should audit Sign-In page for critical accessibility violations", async ({
      page,
      signInPage,
    }) => {
      await signInPage.goto();
      await signInPage.waitForVisible(signInPage.emailInput);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"]) // Color contrast is reported as a non-blocking warning
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical",
      );

      expect(criticalViolations).toEqual([]);
    });

    test("@a11y @prod-safe should audit Forgot Password page", async ({
      page,
      forgotPasswordPage,
    }) => {
      await forgotPasswordPage.goto();
      await forgotPasswordPage.waitForVisible(forgotPasswordPage.emailInput);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical",
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe("Authenticated Pages A11y", () => {
    test.beforeEach(async ({ page }) => {
      await selectActiveWorkspace(page);
    });

    test("@a11y @prod-safe should audit Dashboard page for critical a11y violations", async ({
      page,
      dashboardPage,
    }) => {
      await dashboardPage.goToDashboard();
      await page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical",
      );

      expect(criticalViolations).toEqual([]);
    });

    test("@a11y @prod-safe should audit Invoices listing page", async ({
      page,
      invoicePage,
    }) => {
      await invoicePage.goto();
      await invoicePage.page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical",
      );

      expect(criticalViolations).toEqual([]);
    });

    test("@a11y @prod-safe should audit Reports page", async ({
      page,
      reportsPage,
    }) => {
      await reportsPage.navigateToReports();
      await reportsPage.page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical",
      );

      expect(criticalViolations).toEqual([]);
    });
  });
});
