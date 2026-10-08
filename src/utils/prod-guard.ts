import { test } from "@playwright/test";
import { ENV } from "./env";

/**
 * Production Guard Utilities
 *
 * Provides safety mechanisms to prevent destructive write tests
 * from running on the production environment.
 */

/**
 * Returns true if the current test environment is production.
 */
export function isProd(): boolean {
  return ENV.IS_PROD;
}

/**
 * Asserts that the test is NOT running in production.
 * If running in production, skips the test immediately with an explanatory message.
 *
 * Call this at the start of any destructive/data-creating test:
 *
 * @example
 * test('should delete invoice', async ({ invoicePage }) => {
 *   assertNotProd('Deleting invoices');
 *   // ... test code
 * });
 */
export function assertNotProd(
  actionName: string = "Destructive operation",
): void {
  if (ENV.IS_PROD) {
    test.skip(
      true,
      `⛔ Skipped on PRODUCTION: "${actionName}" is not permitted in production.`,
    );
  }
}

/**
 * Generates an auditable reference prefix for test entities.
 * In prod, entities are prefixed with `[TEST-AUTO]` so they are immediately recognizable.
 */
export function getTestReferencePrefix(): string {
  const envTag = ENV.IS_PROD ? "PROD-TEST" : "DEV-TEST";
  const timestamp = Date.now().toString().slice(-6);
  return `${envTag}-${timestamp}`;
}
