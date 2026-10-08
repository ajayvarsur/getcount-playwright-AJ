import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { ENV } from "./env";

/**
 * Utility helpers for the COUNT Automation Framework.
 */

/**
 * Navigates to manage-workspaces and enters the active environment workspace
 * (Playwright AJ for DEV, Playwright AJ PRO for PROD).
 */
export async function selectActiveWorkspace(
  page: Page,
  workspaceName: string = ENV.WORKSPACE_NAME,
): Promise<void> {
  const authFilePath = path.resolve(process.cwd(), ENV.AUTH_FILE);
  if (!fs.existsSync(authFilePath)) {
    throw new Error(
      `\n❌ Authentication required: No valid session found for [${ENV.TEST_ENV.toUpperCase()}].\n` +
        `   Auth file missing: ${ENV.AUTH_FILE}\n` +
        `   👉 Please authenticate by running:\n\n` +
        `      npm run auth:${ENV.TEST_ENV}\n`,
    );
  }

  // If already inside the workspace, skip redundant navigation
  const currentUrl = page.url();
  if (
    currentUrl.includes("wsId=") &&
    (await page
      .getByText(workspaceName)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false))
  ) {
    return;
  }

  await page.goto("/manage-workspaces", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded");

  // Check if session has expired or redirected to signin
  const isSignIn = await page
    .getByText(
      /You’ve Been Signed Out|Your session has expired|Sign in to COUNT/i,
    )
    .first()
    .isVisible({ timeout: 4000 })
    .catch(() => false);

  if (isSignIn || page.url().includes("/signin")) {
    throw new Error(
      `\n❌ Authentication required: No valid session found for [${ENV.TEST_ENV.toUpperCase()}].\n` +
        `   Browser was redirected to the sign-in page (${page.url()}).\n` +
        `   👉 Please authenticate by running:\n\n` +
        `      npm run auth:${ENV.TEST_ENV}\n`,
    );
  }

  await page
    .locator("table")
    .first()
    .waitFor({ state: "visible", timeout: 15_000 })
    .catch(() => {});
  const workspaceRow = page.locator("tr", { hasText: workspaceName }).first();
  await workspaceRow.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {
    throw new Error(
      `\n❌ Workspace navigation failed: Could not find workspace "${workspaceName}".\n` +
        `   Session might be expired or invalid. Please re-authenticate:\n\n` +
        `      npm run auth:${ENV.TEST_ENV}\n`
    );
  });
  await workspaceRow.getByRole("button", { name: /Go To Workspace/i }).click();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);
}

/**
 * Generate a unique email address for test registration.
 */
export function generateTestEmail(
  domain: string = "test.getcount.com",
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `qa.auto+${timestamp}.${random}@${domain}`;
}

/**
 * Generate a strong test password.
 */
export function generateTestPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "Test!"; // Ensure minimum requirements
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate a random string of given length.
 */
export function randomString(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Wait for a specific amount of time (use sparingly — prefer locator waits).
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current timestamp as ISO string.
 */
export function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a number as USD currency with commas (e.g. 1000 -> "$1,000.00").
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get formatted date string for reports.
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Wait for all network requests to settle.
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000,
): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // Network idle timeout is not critical, continue
  }
}

/**
 * Scroll to the bottom of the page.
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * Scroll to the top of the page.
 */
export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * Check if an element exists in the DOM (may or may not be visible).
 */
export async function elementExists(
  page: Page,
  selector: string,
): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Get all console errors from the page.
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}
