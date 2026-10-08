import { test as base, Page } from "@playwright/test";
import { SignInPage } from "../pages/SignInPage";
import { SignUpPage } from "../pages/SignUpPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { EmployeeSignInPage } from "../pages/EmployeeSignInPage";
import { ClientPortalLoginPage } from "../pages/ClientPortalLoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { InvoicePage } from "../pages/InvoicePage";
import { BillPage } from "../pages/BillPage";
import { TransactionPage } from "../pages/TransactionPage";
import { ReportsPage } from "../pages/ReportsPage";
import { JournalEntriesPage } from "../pages/JournalEntriesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { selectActiveWorkspace } from "../utils/helpers";
import { ENV } from "../utils/env";
import { assertNotProd, isProd } from "../utils/prod-guard";

/**
 * Extended test fixtures that provide pre-instantiated Page Objects.
 *
 * Usage:
 *   import { test, expect } from '../src/fixtures/test-fixtures';
 *
 *   test('example', async ({ signInPage }) => {
 *     await signInPage.goto();
 *     // ...
 *   });
 */

// Define custom fixture types
type CountFixtures = {
  workspacePage: Page;
  signInPage: SignInPage;
  signUpPage: SignUpPage;
  forgotPasswordPage: ForgotPasswordPage;
  employeeSignInPage: EmployeeSignInPage;
  clientPortalLoginPage: ClientPortalLoginPage;
  dashboardPage: DashboardPage;
  invoicePage: InvoicePage;
  billPage: BillPage;
  transactionPage: TransactionPage;
  reportsPage: ReportsPage;
  journalEntriesPage: JournalEntriesPage;
  settingsPage: SettingsPage;
  prodSafetyGuard: void;
};

// Extend Playwright's base test with our fixtures
export const test = base.extend<CountFixtures>({
  prodSafetyGuard: [
    async ({}, use, testInfo) => {
      if (ENV.IS_PROD) {
        const titleMatch = testInfo.title.includes("@destructive");
        const tagMatch = testInfo.tags
          ? testInfo.tags.includes("@destructive")
          : false;
        if (titleMatch || tagMatch) {
          test.skip(
            true,
            `⛔ Skipped on PRODUCTION: "${testInfo.title}" is marked as destructive.`,
          );
        }
      }
      await use();
    },
    { auto: true },
  ],

  workspacePage: async ({ page }, use) => {
    await selectActiveWorkspace(page);
    await use(page);
  },
  signInPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await use(signInPage);
  },

  signUpPage: async ({ page }, use) => {
    const signUpPage = new SignUpPage(page);
    await use(signUpPage);
  },

  forgotPasswordPage: async ({ page }, use) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);
    await use(forgotPasswordPage);
  },

  employeeSignInPage: async ({ page }, use) => {
    const employeeSignInPage = new EmployeeSignInPage(page);
    await use(employeeSignInPage);
  },

  clientPortalLoginPage: async ({ page }, use) => {
    const clientPortalLoginPage = new ClientPortalLoginPage(page);
    await use(clientPortalLoginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  invoicePage: async ({ page }, use) => {
    const invoicePage = new InvoicePage(page);
    await use(invoicePage);
  },

  billPage: async ({ page }, use) => {
    const billPage = new BillPage(page);
    await use(billPage);
  },

  transactionPage: async ({ page }, use) => {
    const transactionPage = new TransactionPage(page);
    await use(transactionPage);
  },

  reportsPage: async ({ page }, use) => {
    const reportsPage = new ReportsPage(page);
    await use(reportsPage);
  },

  journalEntriesPage: async ({ page }, use) => {
    const journalEntriesPage = new JournalEntriesPage(page);
    await use(journalEntriesPage);
  },

  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await use(settingsPage);
  },
});

// Re-export expect from Playwright and helper utilities
export { expect } from "@playwright/test";
export { selectActiveWorkspace } from "../utils/helpers";
export { assertNotProd, isProd } from "../utils/prod-guard";
