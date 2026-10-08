import {
  test,
  expect,
  selectActiveWorkspace,
} from "../../src/fixtures/test-fixtures";

/**
 * REGRESSION: Input Validation & Boundary Testing Suite
 *
 * Verifies form validation rules, required field constraints, boundary conditions,
 * and error handling across Invoices, Bills, and Transactions.
 *
 * @regression @prod-safe @p0 @validation
 */
test.describe("Input Validation & Boundary Testing Suite", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await selectActiveWorkspace(page);
  });

  // ── INVOICE VALIDATION ──────────────────────────────────────────────────────
  test.describe("Invoice Form Validation", () => {
    test("@regression @prod-safe should prevent saving an invoice without selecting a customer", async ({
      invoicePage,
    }) => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");

      await invoicePage.fillTitle("Validation Test - No Customer");

      // Attempt to save and approve without selecting a customer:
      // The button should be disabled (form-level validation), or if clickable, saving should be blocked.
      const isSaveDisabled =
        await invoicePage.saveAndApproveButton.isDisabled();
      if (isSaveDisabled) {
        await expect(invoicePage.saveAndApproveButton).toBeDisabled();
      } else {
        await invoicePage.saveAndApproveButton.click({ force: true });
      }

      // Should still be on the create invoice page (not redirected to listing)
      await expect(
        invoicePage.page.getByText("Creating An Invoice"),
      ).toBeVisible();

      // Check for validation error indicator
      const errorIndicator = invoicePage.page
        .locator(
          "text=/Please Select Customer|Customer is required|This field is required/i",
        )
        .or(invoicePage.page.locator('[aria-invalid="true"]'))
        .first();

      const isVisible = await errorIndicator
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(
        isVisible || (await invoicePage.invoiceTitleInput.isVisible()),
      ).toBe(true);

      // Clean up: navigate away
      const goBackBtn = invoicePage.page
        .getByRole("button", { name: /Go back/i })
        .first();
      if (await goBackBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await goBackBtn.click({ force: true });
      } else {
        await invoicePage.goto();
      }
    });

    test("@regression @prod-safe should handle cancellation/navigation away without saving incomplete invoice", async ({
      invoicePage,
    }) => {
      await invoicePage.goto();
      await invoicePage.clickCreateInvoice();
      await invoicePage.page.waitForSelector("text=Creating An Invoice");

      // Navigate back using Go Back or sidebar
      const goBackBtn = invoicePage.page
        .getByRole("button", { name: /Go back/i })
        .first();
      if (await goBackBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await goBackBtn.click({ force: true });
      } else {
        await invoicePage.goto();
      }

      // Listing page should load without unhandled crashes
      await expect(invoicePage.createInvoiceButton).toBeVisible({
        timeout: 10_000,
      });
    });
  });

  // ── BILL VALIDATION ────────────────────────────────────────────────────────
  test.describe("Bill Form Validation", () => {
    test("@regression @prod-safe should prevent saving a bill without selecting a vendor", async ({
      billPage,
    }) => {
      await billPage.goto();
      await billPage.openCreateBillForm();

      // Fill bill number and line item, but intentionally skip vendor
      await billPage.fillBillNumber(`VAL-${Date.now()}`);
      await billPage.fillMemo("Validation Test - Missing Vendor");
      await billPage.fillLineItem(0, "Office Supplies", 50);

      // Click Create & Approve
      await billPage.createAndApproveButton.click({ force: true });

      // Verify validation message or form stays open
      const errorMsg = billPage.page
        .locator(
          "text=/Please Select Vendor Name|Vendor is required|This field is required/i",
        )
        .first();
      const isErrorVisible = await errorMsg
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      const isFormStillOpen = await billPage.billNumberInput
        .isVisible()
        .catch(() => false);

      expect(isErrorVisible || isFormStillOpen).toBe(true);

      // Teardown: close bill form
      await billPage.closeForm();
    });

    test("@regression @prod-safe should prevent saving a bill without a bill number", async ({
      billPage,
    }) => {
      await billPage.goto();
      await billPage.openCreateBillForm();

      await billPage.selectRandomVendor();
      // Clear bill number
      await billPage.billNumberInput.clear();
      await billPage.fillLineItem(0, "Office Supplies", 50);

      await billPage.createAndApproveButton.click({ force: true });

      // Form should remain open
      await expect(billPage.billNumberInput).toBeVisible({ timeout: 5000 });

      // Teardown: close bill form
      await billPage.closeForm();
    });
  });

  // ── TRANSACTION VALIDATION ──────────────────────────────────────────────────
  test.describe("Transaction Modal Validation", () => {
    test("@regression @prod-safe should prevent submitting transaction with empty description", async ({
      transactionPage,
    }) => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Incoming");

      // Leave description empty, set amount
      await transactionPage.fillAmount(100);
      await transactionPage.selectAccount();

      // Click Add
      await transactionPage.addButton.click({ force: true });

      // Modal should remain visible because description is required
      const dialog = transactionPage.page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Teardown: close transaction modal
      await transactionPage.clickClose();
    });

    test("@regression @prod-safe should close transaction modal cleanly on cancel/close", async ({
      transactionPage,
    }) => {
      await transactionPage.goto();
      await transactionPage.openAddTransactionModal("Outgoing");

      const dialog = transactionPage.page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Click Close
      await transactionPage.clickClose();

      // Modal should be dismissed
      await expect(dialog).not.toBeVisible({ timeout: 5000 });
    });
  });
});
