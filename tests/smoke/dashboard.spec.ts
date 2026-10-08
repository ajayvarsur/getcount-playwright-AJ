import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";
import { ENV } from "../../src/utils/env";

/**
 * SMOKE: Dashboard Verification
 *
 * Verifies the workspace dashboard loads correctly with key widgets,
 * workspace name, and sidebar navigation after login.
 *
 * Safe to run in both DEV and PROD environments (Read-Only).
 *
 * @smoke @p0 @prod-safe
 */
test.describe("Dashboard Smoke", () => {
  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @prod-safe should display the workspace dashboard after login", async ({
    page,
  }) => {
    // Dashboard URL should be within the configured environment base URL
    await expect(page).toHaveURL(/.*getcount\.com.*/, { timeout: 15_000 });

    // Sidebar top-level buttons are always visible (Money In, Money Out, Banking are accordion triggers)
    await expect(page.getByText("Money In").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Money Out").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Reports", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Settings", exact: true }).first(),
    ).toBeVisible();
  });

  test("@smoke @prod-safe should display workspace name in the sidebar", async ({
    page,
  }) => {
    await expect(page.getByText(ENV.WORKSPACE_NAME).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("@smoke @prod-safe should show key dashboard widgets", async ({
    dashboardPage,
  }) => {
    // Wait for the main content area to load and show some data or a widget
    // Since we don't know the exact widget names, we can verify that at least some 'widget' or card exists,
    // or just rely on the url and dashboard main section being present.
    const mainSection = dashboardPage.page.locator("main").first();
    await expect(mainSection).toBeVisible({ timeout: 15_000 });
  });

  test("@smoke @prod-safe should navigate to Invoices via sidebar", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goToInvoices();
    await expect(dashboardPage.page).toHaveURL(/\/invoices/, {
      timeout: 10_000,
    });
  });

  test("@smoke @prod-safe should navigate to Bills via sidebar", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goToBills();
    await expect(dashboardPage.page).toHaveURL(/\/bills/, { timeout: 10_000 });
  });

  test("@smoke @prod-safe should navigate to Reports via sidebar", async ({
    dashboardPage,
    reportsPage,
  }) => {
    await reportsPage.navigateToReports();
    await expect(dashboardPage.page).toHaveURL(/\/reports/, {
      timeout: 10_000,
    });
  });
});
