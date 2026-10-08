/**
 * Centralized test data for the COUNT Automation Framework.
 *
 * All test data constants are defined here to keep tests clean
 * and make data changes easy to manage.
 */

import { ENV } from "../utils/env";

// ── Valid Test Data ───────────────────────────────────────────

export const VALID_ADMIN = {
  email: ENV.ADMIN_EMAIL || "admin@example.com",
  password: ENV.ADMIN_PASSWORD || "ValidPassword123!",
};

export const VALID_EMPLOYEE = {
  email: process.env.EMPLOYEE_EMAIL || "employee@example.com",
  password: process.env.EMPLOYEE_PASSWORD || "ValidPassword123!",
};

export const VALID_REGISTRATION = {
  firstName: "Test",
  lastName: "Automation",
  email: `qa.auto+${Date.now()}@test.getcount.com`,
  password: "SecureP@ss123!",
  confirmPassword: "SecureP@ss123!",
};

// ── Invalid Test Data ─────────────────────────────────────────

export const INVALID_EMAILS = {
  empty: "",
  noAtSign: "invalidemail.com",
  noDomain: "user@",
  noUser: "@domain.com",
  spaces: "user name@domain.com",
  specialChars: "user!#$@domain.com",
  doubleDot: "user@domain..com",
  tooLong: `${"a".repeat(256)}@domain.com`,
};

export const INVALID_PASSWORDS = {
  empty: "",
  tooShort: "12345",
  noUppercase: "password123!",
  noLowercase: "PASSWORD123!",
  noNumber: "Password!!!",
  noSpecialChar: "Password123",
  spaces: "Pass word 123!",
};

export const MISMATCHED_PASSWORDS = {
  password: "SecureP@ss123!",
  confirmPassword: "DifferentP@ss456!",
};

// ── Page Metadata ─────────────────────────────────────────────

export const PAGE_TITLES = {
  signIn: /COUNT/i,
  signUp: /COUNT/i,
  forgotPassword: /COUNT/i,
  employeeSignIn: /COUNT/i,
  clientPortal: /COUNT.*Client Portal/i,
};

export const PAGE_URLS = {
  signIn: "/signin",
  signUp: "/signup",
  forgotPassword: "/forgot-password",
  employeeSignIn: "/person/signin",
  clientPortalLogin: "/client-portal/login",
};

// ── UI Text Constants ─────────────────────────────────────────

export const UI_TEXT = {
  signIn: {
    heading: /sign in/i,
    emailPlaceholder: /work email/i,
    continueButton: /continue/i,
    passwordPlaceholder: /password/i,
    signInButton: /sign in/i,
  },
  signUp: {
    heading: /sign up|create.*account/i,
    businessOption: /business/i,
    accountantOption: /accountant/i,
  },
  forgotPassword: {
    heading: /forgot password|reset password/i,
    requestButton: /request|reset|send/i,
  },
  employeeSignIn: {
    heading: /sign in|employee/i,
    signInButton: /sign in|log in/i,
  },
  clientPortal: {
    heading: /client portal|sign in/i,
    sendCodeButton: /send code|get code|continue/i,
  },
};
