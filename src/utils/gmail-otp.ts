import { ImapFlow, type ImapFlowOptions } from "imapflow";

/**
 * Gmail OTP Reader
 *
 * Connects to Gmail via IMAP using an App Password and polls for the latest
 * OTP email from getcount.com. Extracts a 6-digit numeric OTP code from the
 * email body.
 *
 * Prerequisites:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Generate an App Password at: https://myaccount.google.com/apppasswords
 *   3. Enable IMAP in Gmail settings: Settings > See all settings > Forwarding and POP/IMAP > Enable IMAP
 *   4. Set GMAIL_APP_PASSWORD in your .env.dev / .env.prod file
 *
 * Usage:
 *   const otp = await fetchOtpFromGmail("vijay.varsur+ajpm@getcount.com", "abcd efgh ijkl mnop");
 */

interface GmailOtpOptions {
  /** Gmail address that receives the OTP emails */
  email: string;
  /** Google App Password (16-char, spaces optional — they are stripped) */
  appPassword: string;
  /** Maximum time (ms) to poll for the OTP email. Default: 60000 (60s) */
  timeoutMs?: number;
  /** Polling interval (ms) between inbox checks. Default: 3000 (3s) */
  pollIntervalMs?: number;
  /** Only consider emails received after this timestamp. Default: 30s before now */
  sinceDate?: Date;
  /**
   * Sender filter — only match emails from addresses containing this string.
   * Default: "getcount" (matches noreply@getcount.com, security@getcount.com, etc.)
   */
  senderFilter?: string;
}

/**
 * Fetch the latest 6-digit OTP from a Gmail inbox.
 *
 * Connects via IMAP, searches for recent emails matching the sender filter,
 * and extracts the first 6-digit number from the email body. Polls until
 * an OTP is found or timeout is reached.
 *
 * @returns The 6-digit OTP string, or null if not found within timeout.
 */
export async function fetchOtpFromGmail(
  options: GmailOtpOptions,
): Promise<string | null> {
  const {
    email,
    appPassword,
    timeoutMs = 60_000,
    pollIntervalMs = 3_000,
    sinceDate = new Date(Date.now() - 30_000),
    senderFilter = "getcount",
  } = options;

  // Strip spaces from App Password (Google shows it as "abcd efgh ijkl mnop")
  const cleanPassword = appPassword.replace(/\s/g, "");

  const imapConfig: ImapFlowOptions = {
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: cleanPassword,
    },
    logger: false, // Suppress verbose IMAP logging
  };

  const startTime = Date.now();
  let client: ImapFlow | null = null;

  try {
    client = new ImapFlow(imapConfig);
    await client.connect();
    console.log(`📧 Connected to Gmail IMAP as ${email}`);

    while (Date.now() - startTime < timeoutMs) {
      const otp = await searchForOtp(client, sinceDate, senderFilter);
      if (otp) {
        console.log(`✅ OTP extracted from Gmail: ${otp}`);
        return otp;
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(
        `⏳ No OTP email yet (${elapsed}s elapsed). Polling again in ${pollIntervalMs / 1000}s...`,
      );
      await sleep(pollIntervalMs);
    }

    console.warn(
      `⚠️  OTP email not found within ${timeoutMs / 1000}s timeout.`,
    );
    return null;
  } catch (error) {
    console.error("❌ Gmail IMAP error:", (error as Error).message);
    return null;
  } finally {
    if (client) {
      try {
        await client.logout();
      } catch {
        // Ignore logout errors
      }
    }
  }
}

/**
 * Search the inbox for the most recent OTP email and extract the code.
 */
async function searchForOtp(
  client: ImapFlow,
  sinceDate: Date,
  senderFilter: string,
): Promise<string | null> {
  let lock;
  try {
    lock = await client.getMailboxLock("INBOX");

    // Search for recent emails since the cutoff date
    const messages = await client.search(
      {
        since: sinceDate,
        seen: false, // Only unread emails
      },
      { uid: true },
    );

    if (!messages || messages.length === 0) {
      return null;
    }

    // Process messages in reverse order (newest first)
    const sortedUids = [...messages].sort((a, b) => b - a);

    for (const uid of sortedUids) {
      const message = await client.fetchOne(
        uid,
        {
          envelope: true,
          source: true,
        },
        { uid: true },
      );

      if (!message) continue;
      if (!message.envelope?.from) continue;
      
      // Explicitly check the exact timestamp (IMAP SINCE only checks the day)
      if (message.envelope.date && new Date(message.envelope.date).getTime() < sinceDate.getTime()) {
        continue;
      }

      // Check if sender matches our filter
      const fromAddress = message.envelope.from
        .map(
          (addr: { address?: string }) =>
            addr.address?.toLowerCase() || "",
        )
        .join(",");
      if (!fromAddress.includes(senderFilter.toLowerCase())) continue;

      // Extract the email body as text
      const bodyText = message.source?.toString("utf-8") || "";

      // Look for a 6-digit OTP code in the body
      const otp = extractOtpFromBody(bodyText);
      if (otp) {
        // Mark the email as read
        try {
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
        } catch {
          // Non-critical — ignore flag errors
        }
        return otp;
      }
    }

    return null;
  } finally {
    if (lock) {
      lock.release();
    }
  }
}

/**
 * Extract a 6-digit OTP code from an email body.
 *
 * Tries multiple patterns commonly used in OTP emails:
 *   1. "code is 123456" or "code: 123456"
 *   2. "OTP: 123456" or "OTP is 123456"
 *   3. "verification code: 123456"
 *   4. Standalone 6-digit number on its own line
 *   5. Any 6-digit number as a last resort
 */
function extractOtpFromBody(body: string): string | null {
  // Decode quoted-printable and base64 content common in emails
  const decoded = decodeEmailBody(body);

  // Pattern 1: "code is/: XXXXXX" or "code XXXXXX"
  const codeMatch = decoded.match(
    /(?:code|pin|otp)\s*(?:is|:)?\s*(\d{6})\b/i,
  );
  if (codeMatch) return codeMatch[1];

  // Pattern 2: "verification code: XXXXXX"
  const verifyMatch = decoded.match(
    /verification\s+code\s*[:=]?\s*(\d{6})\b/i,
  );
  if (verifyMatch) return verifyMatch[1];

  // Pattern 3: Large/bold standalone number (often in HTML emails)
  const boldMatch = decoded.match(
    /<(?:b|strong|h\d|span)[^>]*>\s*(\d{6})\s*<\//i,
  );
  if (boldMatch) return boldMatch[1];

  // Pattern 4: Standalone 6-digit number on its own line
  const lineMatch = decoded.match(/^\s*(\d{6})\s*$/m);
  if (lineMatch) return lineMatch[1];

  // Pattern 5: Any 6-digit number (last resort)
  const anyMatch = decoded.match(/\b(\d{6})\b/);
  if (anyMatch) return anyMatch[1];

  return null;
}

/**
 * Decode common email encodings (quoted-printable, base64).
 */
function decodeEmailBody(raw: string): string {
  let decoded = raw;

  // Decode quoted-printable soft line breaks
  decoded = decoded.replace(/=\r?\n/g, "");

  // Decode quoted-printable hex escapes (e.g. =3D -> =)
  decoded = decoded.replace(/=([0-9A-F]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

  // Try to find and decode base64-encoded sections
  const base64Match = decoded.match(
    /Content-Transfer-Encoding:\s*base64[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\r?\n|$)/i,
  );
  if (base64Match) {
    try {
      const base64Content = base64Match[1].replace(/\s/g, "");
      decoded += "\n" + Buffer.from(base64Content, "base64").toString("utf-8");
    } catch {
      // Ignore base64 decode errors
    }
  }

  return decoded;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
