import { test, expect } from "../../src/fixtures/test-fixtures";

test.describe("Sign Out Flow", () => {
  test("should successfully sign out from the dashboard", async ({
    page,
    dashboardPage,
  }) => {
    // 1. Navigate to a protected route (dashboard or manage-workspaces)
    await page.goto("/manage-workspaces");
    await page.waitForLoadState("domcontentloaded");

    // Verify we are logged in by checking the URL or page content
    await expect(page).toHaveURL(/manage-workspaces|dashboard/);

    // 2. Perform sign out using the BasePage method available on any POM
    await dashboardPage.signOut();

    // 3. Verify successful sign out
    // Typical sign out redirects to the login page or home page
    await expect(page).toHaveURL(/login|signin|\/$/i);

    // 4. Verify we cannot access protected routes anymore
    await page.goto("/manage-workspaces");
    await page.waitForLoadState("domcontentloaded");

    // We should be redirected back to the login page
    await expect(page).toHaveURL(/login|signin|\/$/i);
  });
});
