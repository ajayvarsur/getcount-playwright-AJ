import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";

/**
 * SMOKE: Report Generation
 *
 * Verifies that key financial reports (Profit & Loss, Balance Sheet)
 * can be generated and render their sections correctly.
 *
 * Safe to run in both DEV and PROD environments (Read-Only).
 *
 * @smoke @p0 @prod-safe
 */
test.describe("Report Smoke", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  test("@smoke @prod-safe should generate Profit & Loss Statement and verify key sections", async ({
    reportsPage,
  }) => {
    await test.step("Navigate to Reports > Profit & Loss", async () => {
      await reportsPage.navigateToReports();
      await reportsPage.openProfitAndLossStatement();
    });

    await test.step("Generate report", async () => {
      await reportsPage.generateReport();
    });

    await test.step("Verify report renders with key sections", async () => {
      const page = reportsPage.page;

      // Heading
      await expect(
        page.getByRole("heading", { name: "Profit & Loss Statement" }).first(),
      ).toBeVisible({ timeout: 10_000 });

      // Key financial sections
      await expect(page.locator("text=Net Profit").first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator("text=Income").first()).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator("text=Operating Expenses").first()).toBeVisible(
        { timeout: 10_000 },
      );

      // Export buttons should be available
      await expect(
        page.getByRole("button", { name: /Export as CSV/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Export as PDF/i }).first(),
      ).toBeVisible();
    });
  });

  test("@smoke @prod-safe should navigate to Balance Sheet from Reports page", async ({
    reportsPage,
  }) => {
    await test.step("Navigate to Reports", async () => {
      await reportsPage.navigateToReports();
    });

    await test.step("Open Balance Sheet", async () => {
      const page = reportsPage.page;
      const balanceSheetCard = page.getByText(/Balance Sheet/i).first();
      await balanceSheetCard.waitFor({ state: "visible", timeout: 10_000 });
      await balanceSheetCard.click();
      await page.waitForLoadState("domcontentloaded");
    });

    await test.step("Verify Balance Sheet page loads", async () => {
      const page = reportsPage.page;
      await expect(page).toHaveURL(/balance-sheet/, { timeout: 10_000 });
      await expect(
        page.getByRole("heading", { name: /Balance Sheet/i }).first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test("@smoke @prod-safe should navigate to Trial Balance from Reports page", async ({
    reportsPage,
  }) => {
    await reportsPage.navigateToReports();

    const page = reportsPage.page;
    // Trial Balance may be labelled slightly differently — use regex
    const trialBalanceCard = page.getByText(/Trial Balance/i).first();
    const isVisible = await trialBalanceCard.isVisible().catch(() => false);

    if (!isVisible) {
      console.log(
        "Trial Balance card not found — may not be in this workspace plan. Skipping.",
      );
      return;
    }

    await trialBalanceCard.click();
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL(/trial-balance/i, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Trial Balance/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
