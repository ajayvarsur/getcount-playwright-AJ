import { test as setup, expect } from "@playwright/test";
import { ENV } from "../utils/env";

/**
 * Auth Setup — Runs once per environment when storage-state.{env}.json doesn't exist.
 *
 * Flow: Login → OTP → Profile Menu → My Workspaces → [ENV.WORKSPACE_NAME] → Save Session
 *
 * DEV:  Selects "Playwright AJ" and saves to storage-state.dev.json
 * PROD: Selects "Playwright AJ PRO" and saves to storage-state.prod.json
 */
setup(
  `authenticate and save session [${ENV.TEST_ENV.toUpperCase()}] @prod-safe`,
  async ({ page }) => {
    setup.setTimeout(600_000); // 10 minutes for OTP entry

    const adminEmail = ENV.ADMIN_EMAIL;
    const adminPassword = ENV.ADMIN_PASSWORD;
    const workspaceName = ENV.WORKSPACE_NAME;
    const authFile = ENV.AUTH_FILE;

    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log(`║   AUTH SETUP: ${ENV.TEST_ENV.toUpperCase().padEnd(39)}║`);
    console.log(`║   Base URL  : ${ENV.BASE_URL.padEnd(39)}║`);
    console.log(`║   Workspace : ${workspaceName.padEnd(39)}║`);
    console.log(`║   Target    : ${authFile.padEnd(39)}║`);
    console.log("╚══════════════════════════════════════════════════════╝\n");

    if (!adminEmail || !adminPassword) {
      throw new Error(
        `Missing admin credentials for [${ENV.TEST_ENV.toUpperCase()}]. Check .env.${ENV.TEST_ENV}`,
      );
    }

    // ─── Step 1: Navigate to sign-in ──────────────────────────────
    await page.goto("/signin", { waitUntil: "domcontentloaded" });

    // ─── Step 2: Enter credentials ────────────────────────────────
    const emailInput = page.locator("#signin-email");
    await emailInput.waitFor({ state: "visible", timeout: 30_000 });
    await emailInput.clear();
    await emailInput.pressSequentially(adminEmail, { delay: 50 });

    const passwordInput = page.locator("#signin-password");
    await passwordInput.focus();
    await passwordInput.pressSequentially(adminPassword, { delay: 50 });
    await page.waitForTimeout(500);

    // ─── Step 3: Click Sign In ────────────────────────────────────
    await page
      .getByRole("button", { name: /sign in/i })
      .first()
      .click();

    // ─── Step 4: Handle 2FA — auto-fetch from Gmail or manual entry ───
    const securityCheckHeading = page.getByRole("heading", {
      name: /Security Check/i,
    });
    await securityCheckHeading.waitFor({ state: "visible", timeout: 15_000 });

    const fs = require("fs");
    const path = require("path");
    const otpFilePath = path.resolve(process.cwd(), "scratch", "otp.txt");

    // Record the timestamp just before we need the OTP — only consider emails after this
    const otpRequestTime = new Date(Date.now() - 10_000); // 10s grace window

    // ── Strategy A: Auto-fetch OTP from Gmail ──
    if (ENV.GMAIL_APP_PASSWORD) {
      console.log("\n======================================================");
      console.log(
        `🔒 AUTH SETUP [${ENV.TEST_ENV.toUpperCase()}] — AUTO OTP`,
      );
      console.log(
        `   Polling Gmail for OTP email sent to ${ENV.ADMIN_EMAIL}...`,
      );
      console.log("   Timeout: 90 seconds");
      console.log("======================================================\n");

      const { fetchOtpFromGmail } = await import("../utils/gmail-otp");

      const otp = await fetchOtpFromGmail({
        email: ENV.ADMIN_EMAIL,
        appPassword: ENV.GMAIL_APP_PASSWORD,
        timeoutMs: 90_000,
        pollIntervalMs: 3_000,
        sinceDate: otpRequestTime,
        senderFilter: "getcount",
      });

      if (otp) {
        console.log(`📥 Auto-fetched OTP: ${otp}. Entering digits...`);
        await enterOtpDigits(page, otp);
      } else {
        console.warn(
          "⚠️  Could not auto-fetch OTP from Gmail. Falling back to manual entry...",
        );
        await waitForManualOtp(page, otpFilePath);
      }
    } else {
      // ── Strategy B: Manual OTP entry (original behavior) ──
      console.log("\n======================================================");
      console.log(
        `🔒 AUTH SETUP [${ENV.TEST_ENV.toUpperCase()}] — SECURITY CHECK`,
      );
      console.log(
        "   ℹ️  GMAIL_APP_PASSWORD not set — using manual OTP mode.",
      );
      console.log(
        "   Enter the OTP in the browser OR write it to scratch/otp.txt.",
      );
      console.log("   Waiting up to 8 minutes...");
      console.log(
        "   💡 Tip: Set GMAIL_APP_PASSWORD in .env.dev for auto OTP!",
      );
      console.log("======================================================\n");

      await waitForManualOtp(page, otpFilePath);
    }

    // ─── Step 5: Wait for post-login landing page ──────────────
    await page.waitForURL(/accountant\/clients|manage-workspaces|dashboard/i, {
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle");
    console.log(
      `✅ Logged in successfully [${ENV.TEST_ENV.toUpperCase()}] — URL: ${page.url()}`,
    );

    // ─── Step 6 & 7: Navigate to Workspaces (if not already on manage-workspaces)
    if (!page.url().includes("manage-workspaces")) {
      console.log("🔄 Navigating directly to /manage-workspaces...");
      await page.goto("/manage-workspaces", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
    }
    console.log("✅ On workspace selection page");

    // ─── Step 8: Select target workspace ──────────────────────────
    console.log(`🔄 Selecting workspace: "${workspaceName}"...`);

    // Wait for the workspace table to render
    await page
      .locator("table")
      .first()
      .waitFor({ state: "visible", timeout: 45_000 })
      .catch(() => {});

    const workspaceRow = page.locator("tr", { hasText: workspaceName }).first();
    await workspaceRow.waitFor({ state: "visible", timeout: 45_000 });

    const goToButton = workspaceRow
      .getByRole("button", { name: /Go To Workspace/i })
      .first();
    await goToButton.waitFor({ state: "visible", timeout: 15_000 });
    await goToButton.click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000); // Wait for workspace to fully initialize
    console.log(`✅ Workspace "${workspaceName}" selected!`);

    // ─── Step 9: Verify we're inside the workspace ────────────────
    await expect(page.getByText(workspaceName).first()).toBeVisible({
      timeout: 30_000,
    });
    console.log(`✅ Inside workspace "${workspaceName}" — verified!`);

    // ─── Step 10: Save the authenticated session state ─────────────
    await page.context().storageState({ path: authFile });
    console.log(`\n✅ Session saved to ${authFile}`);
    console.log(
      `   Future [${ENV.TEST_ENV.toUpperCase()}] test runs will skip login entirely!\n`,
    );
  },
);

// ── Helper: Enter a 6-digit OTP into the Security Check form ──
import { Page } from "@playwright/test";

async function enterOtpDigits(page: Page, otp: string): Promise<void> {
  for (let i = 0; i < 6; i++) {
    const charInput = page.getByRole("textbox", {
      name: `Please enter OTP character ${i + 1}`,
    });
    if (await charInput.isVisible().catch(() => false)) {
      await charInput.fill(otp[i]);
    }
  }
  await page.waitForTimeout(500);
  const continueBtn = page
    .getByRole("button", { name: /Continue/i })
    .first();
  if (await continueBtn.isEnabled().catch(() => false)) {
    await continueBtn.click();
  }
}

// ── Helper: Poll for manual OTP entry via browser or scratch/otp.txt ──
async function waitForManualOtp(
  page: Page,
  otpFilePath: string,
): Promise<void> {
  const fs = require("fs");
  const startTime = Date.now();
  const maxWait = 480_000; // 8 minutes

  while (Date.now() - startTime < maxWait) {
    // Check if user already authenticated manually in the browser
    const currentUrl = page.url();
    if (/accountant\/clients|manage-workspaces|dashboard/i.test(currentUrl)) {
      break;
    }

    // Check if OTP was supplied via scratch/otp.txt
    if (fs.existsSync(otpFilePath)) {
      try {
        const rawOtp = fs
          .readFileSync(otpFilePath, "utf-8")
          .trim()
          .replace(/\D/g, "");
        if (rawOtp.length === 6) {
          console.log(
            `📥 Read 6-digit OTP from ${otpFilePath}. Entering digits...`,
          );
          fs.unlinkSync(otpFilePath);
          await enterOtpDigits(page, rawOtp);
        }
      } catch (err) {
        console.warn("Error reading or entering OTP:", err);
      }
    }

    await page.waitForTimeout(1000);
  }
}
