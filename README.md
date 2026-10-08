# COUNT — Enterprise Playwright Automation Framework

> Production-ready, TypeScript-based QA automation framework for [COUNT](https://dev-app.getcount.com) and [COUNT Production](https://app.getcount.com).

[![Playwright Tests](https://github.com/your-org/count-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/your-org/count-playwright/actions/workflows/playwright.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.52-green.svg)](https://playwright.dev/)
[![A11y](https://img.shields.io/badge/A11y-Axe--Core-purple.svg)](https://www.deque.com/axe/)
[![License: UNLICENSED](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

---

## 🌟 Framework Highlights

- **Dual-Environment Architecture**: Seamless execution across **DEV** (`dev-app.getcount.com`) and **PROD** (`app.getcount.com`).
- **Zero Flakiness (0 Hardcoded Waits)**: 100% deterministic waits via Playwright locator state, network-idle events, and table render lifecycle.
- **Automated Production Guard**: Built-in test runner interceptor (`prodSafetyGuard`) automatically aborts and skips any `@destructive` test when targeted against Production.
- **Cross-Worker Entity Tracking**: File-backed `EntityRegistry` tracks all dynamically created test records (invoices, bills, transactions) across concurrent worker processes and logs an audit summary at teardown.
- **Accessibility (A11y) & Visual Regression**: Automated WCAG 2.1 AA audits via `@axe-core/playwright` and pixel-level snapshot testing via `toHaveScreenshot()`.
- **Quality Gates**: ESLint 9 Flat Config (`eslint-plugin-playwright`) and TypeScript strict compilation enforced in CI before test execution.
- **Interactive Reports & GitHub Pages**: Real-time test result deployment to GitHub Pages (`gh-pages`), HTML reports, Allure dashboards, and executive PDF summaries.

---

## 📁 Repository Structure

```
getcount-playwright-AJ/
├── .github/
│   └── workflows/
│       └── playwright.yml             # Enterprise CI/CD pipeline (Lint, Typecheck, Dual-Env, Pages)
├── src/
│   ├── api/
│   │   └── CountApiClient.ts          # Authenticated API client & cross-worker EntityRegistry
│   ├── data/
│   │   ├── bill-data.ts               # Dynamic bill test data generator
│   │   ├── invoice-data.ts            # Dynamic invoice & line-item test data generator
│   │   ├── test-data.ts               # Centralized credentials, constants, and URLs
│   │   └── transaction-data.ts        # Income/Expense transaction data factories
│   ├── fixtures/
│   │   └── test-fixtures.ts           # Injected POM fixtures, workspace page, & prodSafetyGuard
│   ├── pages/                         # Page Object Model (POM)
│   │   ├── BasePage.ts                # Abstract base page with shared navigation & waits
│   │   ├── BillPage.ts                # Bill management & approval POM
│   │   ├── ClientPortalLoginPage.ts   # Client portal (OTP) POM
│   │   ├── CustomerPage.ts            # Customer creation & listing POM
│   │   ├── DashboardPage.ts           # Dashboard navigation & quick actions POM
│   │   ├── EmployeeSignInPage.ts      # Employee portal sign-in POM
│   │   ├── ForgotPasswordPage.ts      # Password reset POM
│   │   ├── InvoicePage.ts             # Invoice lifecycle & line items POM
│   │   ├── JournalEntriesPage.ts      # Double-entry ledger verification POM
│   │   ├── ReportsPage.ts             # Profit & Loss / Balance Sheet POM
│   │   ├── SettingsPage.ts            # Organization settings POM
│   │   ├── SignInPage.ts              # Admin sign-in & 2FA POM
│   │   ├── SignUpPage.ts              # Organization onboarding POM
│   │   ├── TransactionPage.ts         # Banking incoming/outgoing transactions POM
│   │   ├── VendorPage.ts              # Vendor management POM
│   │   └── index.ts                   # POM barrel export
│   └── utils/
│       ├── env.ts                     # Multi-environment variable loader
│       └── helpers.ts                 # Workspace selector & early session-expiry detector
├── tests/
│   ├── a11y/
│   │   └── accessibility.spec.ts      # Axe-Core WCAG 2.1 accessibility audits
│   ├── auth/
│   │   ├── client-portal-login.spec.ts# Client portal OTP authentication
│   │   ├── employee-signin.spec.ts    # Employee sign-in tests
│   │   ├── forgot-password.spec.ts    # Password recovery tests
│   │   ├── signin.spec.ts             # Admin sign-in suite
│   │   └── signup.spec.ts             # New account creation tests
│   ├── bills/
│   │   └── create-bill.spec.ts        # Bill creation & verification
│   ├── e2e/
│   │   ├── bill-lifecycle.spec.ts     # End-to-end bill creation → payment → P&L
│   │   ├── data-integrity.spec.ts     # Cross-module financial reconciliation
│   │   ├── invoice-lifecycle.spec.ts  # End-to-end invoice creation → payment → P&L
│   │   └── transaction-lifecycle.spec.ts # End-to-end banking → ledger → reports
│   ├── invoices/
│   │   └── create-invoice.spec.ts     # Invoice creation & approval
│   ├── journal-entries/
│   │   └── verify-journal-entries.spec.ts # Double-entry ledger verification
│   ├── regression/
│   │   ├── input-validation.spec.ts   # Form boundary & constraint validation
│   │   ├── ledger-balance.spec.ts     # Debits = Credits verification suite
│   │   ├── multi-currency.spec.ts     # Multi-currency (USD, INR, JPY) transactions
│   │   ├── payment-states.spec.ts     # Partial, full, and draft payment states
│   │   ├── report-reconciliation.spec.ts # Mathematical report reconciliation
│   │   └── tax-calculation.spec.ts    # Sales tax calculation accuracy
│   ├── reports/
│   │   └── profit-loss-report.spec.ts # P&L report generation
│   ├── smoke/
│   │   ├── bill-smoke.spec.ts         # Core bill smoke tests
│   │   ├── dashboard.spec.ts          # Core dashboard smoke tests
│   │   ├── invoice-smoke.spec.ts      # Core invoice smoke tests
│   │   ├── payment-smoke.spec.ts      # Payment flow smoke tests
│   │   ├── report-smoke.spec.ts       # Report generation smoke tests
│   │   └── transaction-smoke.spec.ts  # Transaction creation smoke tests
│   ├── transactions/
│   │   └── create-transaction.spec.ts # Incoming and outgoing banking tests
│   └── visual/
│       └── visual-regression.spec.ts  # Snapshot regression (Desktop & Tablet)
├── scripts/
│   ├── generate-pdf-report.js         # Executive PDF summary report builder
│   ├── refresh-auth.js                # Token expiry check & refresh utility
│   └── export-auth.js                 # CI base64 secret exporter
├── .env.dev.example                   # DEV environment variables template
├── .env.prod.example                  # PROD environment variables template
├── eslint.config.mjs                  # ESLint 9 Flat Config with Playwright plugin
├── global-setup.ts                    # Global setup (session validation & auth caching)
├── global-teardown.ts                 # Global teardown (entity tracking summary & reports)
├── playwright.config.ts               # Core Playwright configuration
├── tsconfig.json                      # Strict TypeScript configuration
└── package.json                       # Scripts and dependencies
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or newer

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/count-playwright.git
cd count-playwright

# Install dependencies
npm install

# Install Playwright browser binaries and OS dependencies
npx playwright install --with-deps
```

### 3. Environment Configuration

The framework supports dual environments (`dev` and `prod`). Configure your local `.env.dev` and `.env.prod` files:

```bash
# Setup DEV configuration
cp .env.dev.example .env.dev

# Setup PROD configuration
cp .env.prod.example .env.prod
```

Configure your credentials inside `.env.dev` and `.env.prod`:
```ini
BASE_URL=https://dev-app.getcount.com
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
WORKSPACE_NAME="Default Organization"
AUTH_FILE=storage-state.dev.json
```

---

## 🔐 2FA / Session Authentication

COUNT enforces Two-Factor Authentication (OTP). The framework bypasses OTP during test runs by saving your authenticated browser storage state (`storage-state.dev.json` and `storage-state.prod.json`).

### Initial Login (Headed Mode)

Run the one-time interactive login:

```bash
# Authenticate on DEV
npm run auth:dev

# Authenticate on PROD
npm run auth:prod
```

1. A Chromium browser window will open.
2. Enter your credentials and complete the 2FA/OTP prompt in the browser.
3. Once you arrive at your workspace, the session is saved to `storage-state.dev.json` (or `storage-state.prod.json`).
4. All subsequent test runs will automatically reuse this session without prompting for 2FA.

### Session Auto-Check & Early Expiry Detection

- [global-setup.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/global-setup.ts) decodes your JWT token and validates expiration before tests begin.
- The shared `selectActiveWorkspace()` helper automatically detects session expiry or login redirects and provides clear troubleshooting instructions.
- To check or refresh your token programmatically:
  ```bash
  npm run auth:dev:refresh
  npm run auth:prod:refresh
  ```

---

## 🛡️ Production Safety & Tagging Standard

The framework enforces strict dual-environment safety rules to guarantee that **no production data is mutated, created, or destroyed**.

| Tag | Purpose | Safety Level | Target Environments |
|---|---|---|---|
| `@prod-safe` | Read-only operations, UI layout checks, navigation, reports viewing, form boundary checks | **Safe** | DEV & PROD |
| `@destructive` | Creates, modifies, or records transactions, invoices, bills, or settings | **Mutating** | **DEV ONLY** |
| `@smoke` | Fast critical-path sanity checks (< 3 mins) | Mixed | DEV & PROD (Filtered) |
| `@regression` | Comprehensive financial, currency, tax, and ledger checks | Mixed | DEV & PROD (Filtered) |
| `@e2e` | End-to-end lifecycle flows spanning multiple modules | Mutating | **DEV ONLY** |
| `@crud` | Direct creation and field validation tests | Mutating | **DEV ONLY** |
| `@a11y` | Axe-Core WCAG 2.1 AA accessibility scans | **Safe** | DEV & PROD |
| `@visual` | Pixel-level visual regression comparisons | **Safe** | DEV & PROD |

### Automated Production Interceptor (`prodSafetyGuard`)

Even if a developer executes a test with an incorrect filter against Production, the framework's `prodSafetyGuard` auto-fixture in [test-fixtures.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/src/fixtures/test-fixtures.ts) intercepts the execution:

```typescript
// Automatically skips any mutating test when TEST_ENV=prod
if (ENV.IS_PROD && testInfo.tags.includes('@destructive')) {
  test.skip(true, '🛡️ SKIPPED ON PRODUCTION: Test tagged @destructive.');
}
```

---

## 🧪 Test Execution Matrix

### Development Environment (DEV)

```bash
# Run smoke tests on DEV
npm run test:dev:smoke

# Run full regression suite on DEV
npm run test:dev:regression

# Run end-to-end lifecycles on DEV
npm run test:dev:e2e

# Run CRUD suites on DEV
npm run test:dev:crud

# Run accessibility audits on DEV
npm run test:dev:a11y

# Run visual regression suite on DEV
npm run test:dev:visual

# Run all DEV tests across 4 parallel workers
npm run test:dev
```

### Production Environment (PROD — Safe Mode)

```bash
# Run production-safe smoke tests
npm run test:prod:smoke

# Run production-safe regression tests
npm run test:prod:regression

# Run production accessibility audits
npm run test:prod:a11y

# Run production visual checks
npm run test:prod:visual
```

### Interactive & Debugging Modes

```bash
# Run with browser UI visible
npm run test:headed

# Open Playwright interactive UI runner
npm run test:ui

# Run with Playwright step debugger & inspector
npm run test:debug

# Update visual regression baseline screenshots
npm run test:visual:update
```

---

## ♿ Accessibility & 👁️ Visual Regression

### Accessibility Auditing (`@axe-core/playwright`)

The accessibility suite in [accessibility.spec.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/tests/a11y/accessibility.spec.ts) runs WCAG 2.1 Level A & AA automated scans across critical routes:
- Dashboard Page
- Invoices & Estimates Listing
- Bills & Expenses Listing
- Banking Transactions View
- Profit & Loss Reports View

```bash
npm run test:dev:a11y
```

### Visual Snapshot Testing (`toHaveScreenshot`)

The visual suite in [visual-regression.spec.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/tests/visual/visual-regression.spec.ts) ensures CSS stability across Desktop (1280x800) and Tablet (768x1024) viewports:

```bash
# Run visual comparison against baselines
npm run test:dev:visual

# Accept changed UI and update baselines
npm run test:visual:update
```

---

## 📋 Cross-Worker Test Entity Tracking & Teardown

To avoid polluting development environments with untracked records, the framework provides an in-memory and disk-backed `EntityRegistry` in [CountApiClient.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/src/api/CountApiClient.ts):

1. Whenever an invoice, bill, or transaction is created, it calls:
   ```typescript
   entityRegistry.track({ type: 'invoice', reference: invoiceNumber });
   ```
2. The record is persisted to `.test-entities.json`, ensuring synchronization across all Playwright worker threads.
3. When tests conclude, [global-teardown.ts](file:///c:/Users/Dev/Desktop/AJ%20Work/getcount-playwright-AJ/global-teardown.ts) prints an audit summary and clears the registry:

```text
╔══════════════════════════════════════════════════════╗
║   COUNT Automation Framework — Global Teardown      ║
╚══════════════════════════════════════════════════════╝

📋 Test Entities Created in this run (6):
   - [INVOICE] INV-1727782942000 (at 2026-10-01T15:42:25.000Z)
   - [BILL] BILL-1727782984000 (at 2026-10-01T15:42:35.000Z)
   - [TRANSACTION] Payment for BILL-1727782984000 (at 2026-10-01T15:42:45.000Z)
```

---

## 📊 Reports & CI/CD Pipeline

### 1. View Local Reports

```bash
# Playwright HTML Report
npm run report

# Allure Dashboard (Requires Allure CLI)
npm run report:generate
npm run report:open

# Executive PDF Report
npm run report:pdf
```

### 2. GitHub Actions Pipeline ([playwright.yml](.github/workflows/playwright.yml))

- **Quality Gate**: Every build runs `npm run lint` and `npx tsc --noEmit`. Tests will not run if there are linting or type errors.
- **Triggers**:
  - `push` / `pull_request` to `main` & `develop` → Smoke tests against DEV.
  - `schedule` (Mon–Fri at 02:00 UTC) → Nightly health checks.
  - `schedule` (Sunday at 03:00 UTC) → Weekly full regression.
  - `workflow_dispatch` → Manual runs with target environment (`dev`/`prod`), browser selection, and test suite filtering.
- **2FA in CI**: Stored `DEV_STORAGE_STATE` / `PROD_STORAGE_STATE` secrets restore pre-authenticated sessions, bypassing OTP.
- **GitHub Pages Deployment**: The `deploy-report` job publishes the HTML report directly to GitHub Pages (`gh-pages`).

---

## 🛠️ Code Quality & Formatting

```bash
# Run linter
npm run lint

# Automatically fix linter problems
npm run lint -- --fix

# Type check TypeScript codebase
npx tsc --noEmit

# Format code with Prettier
npm run format
```

---

## ✍️ Writing New Tests

Follow these conventions when adding new tests:

1. **Page Objects**: Add or extend page classes in `src/pages/` inheriting from `BasePage`.
2. **Fixtures**: Expose your page object in `src/fixtures/test-fixtures.ts`.
3. **Workspace Navigation**: Use the shared `workspacePage` fixture or `selectActiveWorkspace(page)` in `beforeEach`.
4. **Tagging**: Always tag your tests:
   - Use `@prod-safe` for read-only checks.
   - Use `@destructive` for write operations.
   - Combine with suite tags: `@smoke`, `@regression`, `@e2e`, `@crud`.
5. **No Hardcoded Timeouts**: Never call `page.waitForTimeout()`. Rely on Playwright assertions:
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(2000);

   // ✅ Good
   await expect(page.getByRole('row')).toBeVisible({ timeout: 10_000 });
   await page.waitForLoadState('networkidle');
   ```
6. **Track Created Entities**:
   ```typescript
   entityRegistry.track({ type: 'invoice', reference: data.invoiceNumber });
   ```

---

## 📄 License

Proprietary — COUNT QA Automation Team.
