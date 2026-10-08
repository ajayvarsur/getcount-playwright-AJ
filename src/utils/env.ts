import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Determine target environment: 'dev' (default) or 'prod'
export type TestEnvironment = "dev" | "prod";

const rawEnv = (process.env.TEST_ENV || "dev").toLowerCase().trim();
export const currentEnv: TestEnvironment = rawEnv === "prod" ? "prod" : "dev";

// Project root directory
const projectRoot = path.resolve(__dirname, "../../");

// Try loading environment-specific file: .env.prod or .env.dev
const envFileName = currentEnv === "prod" ? ".env.prod" : ".env.dev";
const envFilePath = path.join(projectRoot, envFileName);
const fallbackEnvPath = path.join(projectRoot, ".env");

if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath, override: true });
} else if (fs.existsSync(fallbackEnvPath)) {
  dotenv.config({ path: fallbackEnvPath, override: true });
}

// Storage state filename and absolute path per environment
const authFileName = `storage-state.${currentEnv}.json`;
const authFilePath = path.join(projectRoot, authFileName);

/**
 * Type-safe environment configuration.
 *
 * Automatically selects .env.dev or .env.prod depending on TEST_ENV.
 */
export const ENV = {
  // Target environment flag
  TEST_ENV: currentEnv,
  IS_PROD: currentEnv === "prod",
  IS_DEV: currentEnv === "dev",

  // Target environment base URL & workspace
  BASE_URL:
    process.env.BASE_URL ||
    (currentEnv === "prod"
      ? "https://app.getcount.com"
      : "https://dev-app.getcount.com"),
  WORKSPACE_NAME:
    process.env.WORKSPACE_NAME ||
    (currentEnv === "prod" ? "Playwright AJ PRO" : "Playwright AJ"),

  // Environment-specific auth storage state
  AUTH_FILE: authFileName,
  STORAGE_STATE_PATH: authFilePath,

  // Admin credentials
  ADMIN_EMAIL:
    (currentEnv === "prod"
      ? process.env.PROD_ADMIN_EMAIL
      : process.env.DEV_ADMIN_EMAIL) ||
    process.env.ADMIN_EMAIL ||
    "",
  ADMIN_PASSWORD:
    (currentEnv === "prod"
      ? process.env.PROD_ADMIN_PASSWORD
      : process.env.DEV_ADMIN_PASSWORD) ||
    process.env.ADMIN_PASSWORD ||
    "",

  // Employee credentials
  EMPLOYEE_EMAIL: process.env.EMPLOYEE_EMAIL || "",
  EMPLOYEE_PASSWORD: process.env.EMPLOYEE_PASSWORD || "",

  // Test data defaults
  TEST_FIRST_NAME: process.env.TEST_FIRST_NAME || "TestByAjay",
  TEST_LAST_NAME: process.env.TEST_LAST_NAME || "AutomationByAjay",
  TEST_EMAIL_DOMAIN: process.env.TEST_EMAIL_DOMAIN || "company.com",

  // Browser config
  BROWSER: process.env.BROWSER || "chromium",
  HEADLESS: process.env.HEADLESS !== "false",

  // Gmail OTP Auto-fill
  // Generate at: https://myaccount.google.com/apppasswords (requires 2-Step Verification)
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",

  // CI/CD & execution
  CI: !!process.env.CI,
  RETRIES: parseInt(
    process.env.RETRIES || (currentEnv === "prod" ? "2" : "1"),
    10,
  ),
  WORKERS: parseInt(process.env.WORKERS || "1", 10),
} as const;

/**
 * Validate that required environment variables are set.
 * Call this at the beginning of test suites that need authentication.
 */
export function validateAuthEnv(): void {
  const required = ["ADMIN_EMAIL", "ADMIN_PASSWORD"] as const;
  const missing = required.filter((key) => !ENV[key]);

  if (missing.length > 0) {
    const missingKeys = missing.map((key) => {
      if (key === "ADMIN_EMAIL")
        return currentEnv === "prod" ? "PROD_ADMIN_EMAIL" : "DEV_ADMIN_EMAIL";
      if (key === "ADMIN_PASSWORD")
        return currentEnv === "prod"
          ? "PROD_ADMIN_PASSWORD"
          : "DEV_ADMIN_PASSWORD";
      return key;
    });

    throw new Error(
      `Missing required environment variables for [${currentEnv.toUpperCase()}]: ${missingKeys.join(", ")}\n` +
        `Check your ${envFileName} file and ensure credentials are set.`,
    );
  }
}

/**
 * Validate employee credentials are set.
 */
export function validateEmployeeAuthEnv(): void {
  const required = ["EMPLOYEE_EMAIL", "EMPLOYEE_PASSWORD"] as const;
  const missing = required.filter((key) => !ENV[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing employee environment variables: ${missing.join(", ")}\n` +
        `Add EMPLOYEE_EMAIL and EMPLOYEE_PASSWORD to your ${envFileName} file.`,
    );
  }
}
