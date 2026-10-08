/**
 * Script: generate-pdf-report.js
 *
 * Generates a professional, detailed PDF report from Playwright JSON test results.
 * Designed for sharing with QA leads, management, and stakeholders.
 *
 * Input:  test-results/results.json (Playwright JSON reporter output)
 * Output: reports/QA-Report-{ENV}-{DATE}.pdf
 *
 * Usage:
 *   node scripts/generate-pdf-report.js
 *   node scripts/generate-pdf-report.js --input test-results/results.json
 *   node scripts/generate-pdf-report.js --output reports/custom-name.pdf
 *   npm run report:pdf
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// ─── CLI Arguments ───────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const inputFile = getArg('input', path.resolve(__dirname, '..', 'test-results', 'results.json'));
const testEnv = (process.env.TEST_ENV || 'dev').toUpperCase();

// ─── Load JSON Results ───────────────────────────────────────────
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Results file not found: ${inputFile}`);
  console.error('   Run tests first with JSON reporter enabled:');
  console.error('   npx playwright test --reporter=json,html');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const stats = results.stats || {};

// ─── Text Sanitizer (Handles WinAnsi glyphs & Unicode safely) ────
function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[›»]/g, ' > ')
    .replace(/[‹«]/g, ' < ')
    .replace(/[•●▪]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Parse All Test Cases ────────────────────────────────────────
function flattenSuites(suites, parentTitle = '') {
  const tests = [];
  for (const suite of suites) {
    const rawTitle = sanitizeText(suite.title);
    const suiteName = parentTitle ? `${parentTitle} > ${rawTitle}` : rawTitle;
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          const lastResult = test.results?.[test.results.length - 1] || {};
          tests.push({
            suite: suiteName,
            title: sanitizeText(spec.title),
            status: lastResult.status || 'unknown',
            duration: lastResult.duration || 0,
            retries: test.results ? test.results.length - 1 : 0,
            projectName: test.projectName || 'chromium',
            steps: (lastResult.steps || []).map(s => ({
              ...s,
              title: sanitizeText(s.title),
            })),
            errors: (lastResult.errors || []).map(e => ({
              ...e,
              message: sanitizeText(e.message || ''),
              stack: sanitizeText(e.stack || ''),
            })),
            startTime: lastResult.startTime || '',
            tags: (spec.tags || []).map(t => sanitizeText(t)),
            file: sanitizeText(spec.file || suite.file || ''),
          });
        }
      }
    }
    if (suite.suites) {
      tests.push(...flattenSuites(suite.suites, suiteName));
    }
  }
  return tests;
}

const allTests = flattenSuites(results.suites || []);
const passed = allTests.filter(t => t.status === 'passed');
const failed = allTests.filter(t => t.status === 'failed' || t.status === 'timedOut');
const skipped = allTests.filter(t => t.status === 'skipped');
const flaky = allTests.filter(t => t.retries > 0 && t.status === 'passed');

// ─── Date Helpers ────────────────────────────────────────────────
const now = new Date();
const dateStr = now.toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
});
const timeStr = now.toLocaleTimeString('en-IN', {
  hour: '2-digit', minute: '2-digit', hour12: true,
});
const fileDateStr = now.toISOString().slice(0, 10);

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatDurationLong(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs} seconds`;
  return `${mins} min ${secs} sec`;
}

// ─── Determine Output Path ──────────────────────────────────────
const reportsDir = path.resolve(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
const defaultOutput = path.join(reportsDir, `QA-Report-${testEnv}-${fileDateStr}.pdf`);
const outputFile = getArg('output', defaultOutput);

// ─── Color Palette ──────────────────────────────────────────────
const COLORS = {
  primary:    '#1a1a2e',  // Dark navy
  accent:     '#16213e',  // Slightly lighter navy
  highlight:  '#0f3460',  // Deep blue
  brand:      '#e94560',  // Coral red accent
  success:    '#27ae60',  // Green
  danger:     '#e74c3c',  // Red
  warning:    '#f39c12',  // Amber
  info:       '#3498db',  // Blue
  muted:      '#7f8c8d',  // Grey
  lightGrey:  '#ecf0f1',  // Light grey bg
  white:      '#ffffff',
  black:      '#2c3e50',  // Near black
  passBg:     '#e8f5e9',
  failBg:     '#ffebee',
  skipBg:     '#fff3e0',
  flakyBg:    '#e3f2fd',
};

// ─── Create PDF Document ─────────────────────────────────────────
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: `QA Test Report - COUNT ${testEnv} - ${dateStr}`,
    Author: 'COUNT QA Automation Team',
    Subject: `Playwright Test Execution Report for ${testEnv} Environment`,
    Creator: 'COUNT Playwright Framework',
  },
});

const stream = fs.createWriteStream(outputFile);
doc.pipe(stream);

const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const LEFT = doc.page.margins.left;

// ─── Helper: Draw Rounded Rect ──────────────────────────────────
function drawRoundedRect(x, y, w, h, fill, radius = 6) {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fill(fill);
  doc.restore();
}

// ─── Helper: Check if we need a new page ─────────────────────────
function ensureSpace(needed) {
  const available = doc.page.height - doc.page.margins.bottom - doc.y;
  const maxAvailable = doc.page.height - doc.page.margins.bottom - doc.page.margins.top;
  if (available < needed && available < maxAvailable - 30) {
    doc.addPage();
  }
}

// ─── Helper: Status Badge ────────────────────────────────────────
function drawStatusBadge(x, y, status) {
  const labels = {
    passed: 'PASSED', failed: 'FAILED', timedOut: 'TIMED OUT',
    skipped: 'SKIPPED', flaky: 'FLAKY',
  };
  const colors = {
    passed: COLORS.success, failed: COLORS.danger, timedOut: COLORS.danger,
    skipped: COLORS.warning, flaky: COLORS.info,
  };
  const label = labels[status] || status.toUpperCase();
  const color = colors[status] || COLORS.muted;
  const badgeWidth = doc.widthOfString(label, { size: 8 }) + 14;

  drawRoundedRect(x, y, badgeWidth, 16, color, 8);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white);
  doc.text(label, x + 7, y + 4, { width: badgeWidth - 14 });
  return badgeWidth;
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 1: COVER PAGE
// ═══════════════════════════════════════════════════════════════════
function drawCoverPage() {
  // Full-page dark background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.primary);

  // Accent stripe at top
  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.brand);

  // Company / Project title
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.brand);
  doc.text('COUNT', LEFT, 80, { align: 'center', width: PAGE_WIDTH });

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(36).fillColor(COLORS.white);
  doc.text('QA Test Execution Report', LEFT, doc.y, { align: 'center', width: PAGE_WIDTH });

  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(16).fillColor('#bdc3c7');
  doc.text(`${testEnv} Environment`, LEFT, doc.y, { align: 'center', width: PAGE_WIDTH });

  // Date and time
  doc.moveDown(2);
  doc.font('Helvetica').fontSize(12).fillColor('#95a5a6');
  doc.text(`${dateStr}  •  ${timeStr}`, LEFT, doc.y, { align: 'center', width: PAGE_WIDTH });

  // ── Summary Stats Box ──
  const boxY = 340;
  const boxH = 180;
  drawRoundedRect(LEFT + 30, boxY, PAGE_WIDTH - 60, boxH, COLORS.accent, 12);

  // Stats grid (2x2)
  const statsData = [
    { label: 'Total Tests', value: String(allTests.length), color: COLORS.white },
    { label: 'Passed', value: String(passed.length), color: COLORS.success },
    { label: 'Failed', value: String(failed.length), color: failed.length > 0 ? COLORS.danger : COLORS.success },
    { label: 'Skipped', value: String(skipped.length), color: skipped.length > 0 ? COLORS.warning : COLORS.muted },
  ];

  const cellW = (PAGE_WIDTH - 60) / 2;
  const cellH = boxH / 2;

  statsData.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = LEFT + 30 + col * cellW + cellW / 2;
    const cy = boxY + row * cellH + 20;

    doc.font('Helvetica-Bold').fontSize(38).fillColor(stat.color);
    doc.text(stat.value, cx - 50, cy, { width: 100, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#95a5a6');
    doc.text(stat.label, cx - 50, cy + 42, { width: 100, align: 'center' });
  });

  // Pass rate bar
  const barY = boxY + boxH + 30;
  const passRate = allTests.length > 0 ? ((passed.length / allTests.length) * 100) : 0;

  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLORS.white);
  doc.text(`Pass Rate: ${passRate.toFixed(1)}%`, LEFT + 30, barY, { width: PAGE_WIDTH - 60 });

  const barTrackY = barY + 22;
  drawRoundedRect(LEFT + 30, barTrackY, PAGE_WIDTH - 60, 12, '#34495e', 6);
  if (passRate > 0) {
    const barFillW = Math.max(12, ((PAGE_WIDTH - 60) * passRate) / 100);
    const barColor = passRate === 100 ? COLORS.success : passRate >= 80 ? COLORS.info : COLORS.danger;
    drawRoundedRect(LEFT + 30, barTrackY, barFillW, 12, barColor, 6);
  }

  // Duration
  const totalDuration = stats.duration || allTests.reduce((sum, t) => sum + t.duration, 0);
  doc.moveDown(3);
  doc.font('Helvetica').fontSize(11).fillColor('#95a5a6');
  doc.text(`Total Duration: ${formatDurationLong(totalDuration)}`, LEFT, doc.y, {
    align: 'center', width: PAGE_WIDTH,
  });

  // Playwright version
  const pwVersion = results.config?.version || 'N/A';
  doc.moveDown(0.5);
  doc.text(`Playwright v${pwVersion}  •  Workers: ${results.config?.workers || 1}`, LEFT, doc.y, {
    align: 'center', width: PAGE_WIDTH,
  });

  // Footer branding
  doc.font('Helvetica').fontSize(9).fillColor('#636e72');
  doc.text('Generated by COUNT Playwright Automation Framework', LEFT, doc.page.height - 80, {
    align: 'center', width: PAGE_WIDTH,
  });
  doc.text('Confidential - Internal Use Only', LEFT, doc.y + 4, {
    align: 'center', width: PAGE_WIDTH,
  });
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 2: EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════════════
function drawExecutiveSummary() {
  doc.addPage();

  // Section header
  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.primary);
  doc.text('Executive Summary', LEFT, 50);
  doc.moveTo(LEFT, doc.y + 4).lineTo(LEFT + PAGE_WIDTH, doc.y + 4).strokeColor(COLORS.brand).lineWidth(2).stroke();
  doc.moveDown(1.2);

  // Environment info table
  const envRows = [
    ['Environment', testEnv],
    ['Base URL', results.config?.projects?.[1]?.testDir ? '—' : '—'],
    ['Browser', results.config?.projects?.find(p => p.name !== 'auth-setup')?.name || 'chromium'],
    ['Workers', String(results.config?.workers || 1)],
    ['Retries', String(results.config?.projects?.find(p => p.name !== 'auth-setup')?.retries ?? 0)],
    ['Playwright Version', `v${results.config?.version || 'N/A'}`],
    ['Execution Date', dateStr],
    ['Execution Time', timeStr],
  ];

  // Fix Base URL from env
  const baseUrl = testEnv === 'PROD' ? 'https://app.getcount.com' : 'https://dev-app.getcount.com';
  envRows[1][1] = baseUrl;

  const tableX = LEFT;
  const col1W = 160;
  const col2W = PAGE_WIDTH - col1W;
  const rowH = 26;

  envRows.forEach((row, i) => {
    const y = doc.y;
    if (i % 2 === 0) {
      doc.rect(tableX, y, PAGE_WIDTH, rowH).fill(COLORS.lightGrey);
    }
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.black);
    doc.text(row[0], tableX + 10, y + 7, { width: col1W });
    doc.font('Helvetica').fontSize(10).fillColor(COLORS.black);
    doc.text(row[1], tableX + col1W, y + 7, { width: col2W });
    doc.y = y + rowH;
  });

  doc.moveDown(1.5);

  // ── Results Breakdown ──
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.primary);
  doc.text('Results Breakdown');
  doc.moveDown(0.5);

  const totalDuration = stats.duration || allTests.reduce((sum, t) => sum + t.duration, 0);
  const passRate = allTests.length > 0 ? ((passed.length / allTests.length) * 100) : 0;

  const breakdownRows = [
    ['Total Test Cases', String(allTests.length), COLORS.black],
    ['Passed', String(passed.length), COLORS.success],
    ['Failed', String(failed.length), failed.length > 0 ? COLORS.danger : COLORS.success],
    ['Skipped', String(skipped.length), skipped.length > 0 ? COLORS.warning : COLORS.muted],
    ['Flaky', String(flaky.length), flaky.length > 0 ? COLORS.info : COLORS.muted],
    ['Pass Rate', `${passRate.toFixed(1)}%`, passRate === 100 ? COLORS.success : passRate >= 80 ? COLORS.info : COLORS.danger],
    ['Total Duration', formatDurationLong(totalDuration), COLORS.black],
  ];

  breakdownRows.forEach((row, i) => {
    const y = doc.y;
    if (i % 2 === 0) {
      doc.rect(tableX, y, PAGE_WIDTH, rowH).fill(COLORS.lightGrey);
    }
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.black);
    doc.text(row[0], tableX + 10, y + 7, { width: col1W });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(row[2]);
    doc.text(row[1], tableX + col1W, y + 7, { width: col2W });
    doc.y = y + rowH;
  });

  // ── Verdict ──
  doc.moveDown(1.5);
  const verdictColor = failed.length === 0 ? COLORS.success : COLORS.danger;
  const verdictText = failed.length === 0
    ? 'ALL TESTS PASSED - Build is STABLE'
    : `${failed.length} TEST(S) FAILED - Build NEEDS ATTENTION`;

  drawRoundedRect(LEFT, doc.y, PAGE_WIDTH, 40, verdictColor, 8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.white);
  doc.text(verdictText, LEFT + 15, doc.y + 12, { width: PAGE_WIDTH - 30 });
  doc.moveDown(2);
}

// ═══════════════════════════════════════════════════════════════════
// PAGE 3+: DETAILED TEST RESULTS
// ═══════════════════════════════════════════════════════════════════
function drawDetailedResults() {
  doc.addPage();

  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.primary);
  doc.text('Detailed Test Results', LEFT, 50);
  doc.moveTo(LEFT, doc.y + 4).lineTo(LEFT + PAGE_WIDTH, doc.y + 4).strokeColor(COLORS.brand).lineWidth(2).stroke();
  doc.moveDown(1);

  // Group by suite
  const suiteMap = new Map();
  for (const test of allTests) {
    if (!suiteMap.has(test.suite)) suiteMap.set(test.suite, []);
    suiteMap.get(test.suite).push(test);
  }

  let testIndex = 1;

  for (const [suiteName, suiteTests] of suiteMap) {
    ensureSpace(80);

    // Suite header
    const suitePassed = suiteTests.filter(t => t.status === 'passed').length;
    const suiteTotal = suiteTests.length;
    const suitePassRate = ((suitePassed / suiteTotal) * 100).toFixed(0);

    drawRoundedRect(LEFT, doc.y, PAGE_WIDTH, 30, COLORS.accent, 6);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.white);
    doc.text(`[Suite] ${suiteName}`, LEFT + 10, doc.y + 8, { width: PAGE_WIDTH - 120 });
    doc.font('Helvetica').fontSize(9).fillColor('#bdc3c7');
    doc.text(`${suitePassed}/${suiteTotal} passed (${suitePassRate}%)`, LEFT + PAGE_WIDTH - 130, doc.y - 10, {
      width: 120, align: 'right',
    });
    doc.y += 14;
    doc.moveDown(0.5);

    // Each test in this suite
    for (const test of suiteTests) {
      const bgColor = test.status === 'passed' ? COLORS.passBg
        : test.status === 'failed' || test.status === 'timedOut' ? COLORS.failBg
        : COLORS.skipBg;

      const innerX = LEFT + 14;
      const innerW = PAGE_WIDTH - 28;

      // Calculate title height
      doc.font('Helvetica-Bold').fontSize(10);
      const titleText = `#${testIndex}  ${test.title}`;
      const titleHeight = doc.heightOfString(titleText, { width: innerW - 85 });

      // Calculate dynamic steps height
      let stepsHeight = 0;
      if (test.steps.length > 0) {
        stepsHeight = 16;
        const displaySteps = test.steps.slice(0, 10);
        for (const step of displaySteps) {
          const stepText = `  [+] ${step.title}`;
          doc.font('Helvetica').fontSize(8);
          const sh = doc.heightOfString(stepText, { width: innerW - 90 });
          stepsHeight += Math.max(14, sh + 2);
        }
        if (test.steps.length > 10) stepsHeight += 14;
      }
      
      // Calculate errors height
      let errorsHeight = 0;
      if (test.errors.length > 0) {
        errorsHeight = 12;
        for (const err of test.errors.slice(0, 2)) {
          const errText = (err.message || err.stack || JSON.stringify(err)).slice(0, 200);
          const textH = doc.heightOfString(errText, { width: innerW - 8, font: 'Courier', size: 7 });
          errorsHeight += Math.max(30, textH + 12) + 10;
        }
      }

      const cardH = 34 + titleHeight + stepsHeight + errorsHeight;

      ensureSpace(cardH + 10);
      const startY = doc.y;
      
      drawRoundedRect(LEFT, startY, PAGE_WIDTH, cardH, bgColor, 6);

      // Left accent border
      const accentColor = test.status === 'passed' ? COLORS.success
        : test.status === 'failed' || test.status === 'timedOut' ? COLORS.danger
        : COLORS.warning;
      doc.rect(LEFT, startY, 4, cardH).fill(accentColor);

      let currentY = startY + 10;

      // Status badge (pinned at top-right of card)
      drawStatusBadge(LEFT + PAGE_WIDTH - 80, currentY - 2, test.status);

      // Test number + title (wrapped within available width before badge)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.black);
      doc.text(titleText, innerX, currentY, { width: innerW - 85 });
      currentY += titleHeight + 6;

      // File + duration (clearly spaced below title)
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
      let fileDurationText = `[File] ${test.file}  |  [Time] ${formatDuration(test.duration)}`;
      if (test.retries > 0) {
        fileDurationText += `  |  [Retries] ${test.retries}`;
      }
      doc.text(fileDurationText, innerX, currentY, { width: innerW });
      currentY += 16;

      // Steps
      if (test.steps.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.highlight);
        doc.text('Test Steps:', innerX, currentY, { width: innerW });
        currentY += 16;

        const displaySteps = test.steps.slice(0, 10);
        for (const step of displaySteps) {
          const stepIcon = test.status === 'passed' ? '[+]' : '[-]';
          const stepColor = test.status === 'passed' ? COLORS.success : COLORS.black;

          doc.font('Helvetica').fontSize(8).fillColor(stepColor);
          const stepText = `  ${stepIcon} ${step.title}`;
          const stepH = doc.heightOfString(stepText, { width: innerW - 90 });
          doc.text(stepText, innerX + 4, currentY, { width: innerW - 90 });
          doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
          doc.text(formatDuration(step.duration), innerX + innerW - 80, currentY, { width: 70, align: 'right' });
          currentY += Math.max(14, stepH + 2);
        }

        if (test.steps.length > 10) {
          doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
          doc.text(`  ... and ${test.steps.length - 10} more steps`, innerX + 4, currentY);
          currentY += 14;
        }
      }

      // Errors
      if (test.errors.length > 0) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.danger);
        doc.text('Error:', innerX, currentY, { width: innerW });
        currentY += 12;

        for (const err of test.errors.slice(0, 2)) {
          const errMsg = (err.message || err.stack || JSON.stringify(err)).slice(0, 200);
          const textH = doc.heightOfString(errMsg, { width: innerW - 8, font: 'Courier', size: 7 });
          doc.font('Courier').fontSize(7).fillColor(COLORS.danger);
          doc.text(errMsg, innerX + 4, currentY, { width: innerW - 8 });
          currentY += Math.max(30, textH + 12) + 10;
        }
      }

      doc.y = startY + cardH + 10;
      testIndex++;
    }

    doc.moveDown(0.5);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FAILED TESTS DEEP DIVE (only if failures exist)
// ═══════════════════════════════════════════════════════════════════
function drawFailedTestsDeepDive() {
  if (failed.length === 0) return;

  doc.addPage();

  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.danger);
  doc.text('[!] Failed Tests - Deep Dive', LEFT, 50);
  doc.moveTo(LEFT, doc.y + 4).lineTo(LEFT + PAGE_WIDTH, doc.y + 4).strokeColor(COLORS.danger).lineWidth(2).stroke();
  doc.moveDown(1);

  for (const test of failed) {
    ensureSpace(120);

    const startY = doc.y;
    drawRoundedRect(LEFT, startY, PAGE_WIDTH, 4, COLORS.danger, 0);
    doc.y = startY + 8;

    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.danger);
    doc.text(`[FAIL] ${test.title}`, LEFT + 8, doc.y);
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted);
    doc.text(`Suite: ${test.suite}`, LEFT + 8);
    doc.text(`File: ${test.file}`, LEFT + 8);
    doc.text(`Duration: ${formatDuration(test.duration)}  |  Retries: ${test.retries}`, LEFT + 8);
    doc.moveDown(0.5);

    if (test.errors.length > 0) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.black);
      doc.text('Error Details:', LEFT + 8);
      doc.moveDown(0.3);

      for (const err of test.errors) {
        const currentY = doc.y;
        const errText = (err.message || err.stack || JSON.stringify(err)).slice(0, 500);
        const textH = doc.heightOfString(errText, { width: PAGE_WIDTH - 30, font: 'Courier', size: 7 });
        const boxH = Math.max(50, textH + 12);
        
        drawRoundedRect(LEFT + 8, currentY, PAGE_WIDTH - 16, boxH, '#fdf2f2', 4);
        doc.font('Courier').fontSize(7).fillColor(COLORS.danger);
        doc.text(errText, LEFT + 14, currentY + 6, { width: PAGE_WIDTH - 30 });
        
        doc.y = currentY + boxH + 10;
      }
    }

    doc.moveDown(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SUITE-LEVEL SUMMARY TABLE
// ═══════════════════════════════════════════════════════════════════
function drawSuiteSummaryTable() {
  doc.addPage();

  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.primary);
  doc.text('Suite-Level Summary', LEFT, 50);
  doc.moveTo(LEFT, doc.y + 4).lineTo(LEFT + PAGE_WIDTH, doc.y + 4).strokeColor(COLORS.brand).lineWidth(2).stroke();
  doc.moveDown(1);

  // Group by suite
  const suiteMap = new Map();
  for (const test of allTests) {
    if (!suiteMap.has(test.suite)) suiteMap.set(test.suite, []);
    suiteMap.get(test.suite).push(test);
  }

  // Table headers
  const colWidths = [PAGE_WIDTH * 0.40, PAGE_WIDTH * 0.12, PAGE_WIDTH * 0.12, PAGE_WIDTH * 0.12, PAGE_WIDTH * 0.12, PAGE_WIDTH * 0.12];
  const headers = ['Suite', 'Total', 'Passed', 'Failed', 'Duration', 'Pass %'];
  const headerY = doc.y;
  const headerH = 28;

  drawRoundedRect(LEFT, headerY, PAGE_WIDTH, headerH, COLORS.primary, 4);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white);
  let hx = LEFT + 8;
  headers.forEach((h, i) => {
    doc.text(h, hx, headerY + 9, { width: colWidths[i] - 8 });
    hx += colWidths[i];
  });
  doc.y = headerY + headerH;

  let rowIdx = 0;
  for (const [suiteName, suiteTests] of suiteMap) {
    ensureSpace(28);
    const rowY = doc.y;
    const rowH = 26;

    if (rowIdx % 2 === 0) {
      doc.rect(LEFT, rowY, PAGE_WIDTH, rowH).fill(COLORS.lightGrey);
    }

    const suitePassed = suiteTests.filter(t => t.status === 'passed').length;
    const suiteFailed = suiteTests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
    const suiteDuration = suiteTests.reduce((sum, t) => sum + t.duration, 0);
    const suitePassRate = ((suitePassed / suiteTests.length) * 100).toFixed(0);

    const cellValues = [
      suiteName.length > 35 ? suiteName.slice(-35) : suiteName,
      String(suiteTests.length),
      String(suitePassed),
      String(suiteFailed),
      formatDuration(suiteDuration),
      `${suitePassRate}%`,
    ];

    let cx = LEFT + 8;
    cellValues.forEach((val, i) => {
      const cellColor = i === 2 ? COLORS.success
        : i === 3 ? (suiteFailed > 0 ? COLORS.danger : COLORS.success)
        : i === 5 ? (Number(suitePassRate) === 100 ? COLORS.success : COLORS.danger)
        : COLORS.black;
      doc.font(i === 0 ? 'Helvetica' : 'Helvetica-Bold').fontSize(9).fillColor(cellColor);
      doc.text(val, cx, rowY + 8, { width: colWidths[i] - 8 });
      cx += colWidths[i];
    });

    doc.y = rowY + rowH;
    rowIdx++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER ON EACH PAGE (drawn at the end via buffered pages)
// ═══════════════════════════════════════════════════════════════════
function addFooters() {
  const totalPages = doc.bufferedPageRange().count;

  // Skip cover page (index 0)
  for (let i = 1; i < totalPages; i++) {
    doc.switchToPage(i);

    // Temporarily zero out bottom margin so drawing footer text outside content area
    // does not trigger PDFKit's automatic addPage()
    const oldBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // Bottom line
    doc.moveTo(LEFT, doc.page.height - 40)
      .lineTo(LEFT + PAGE_WIDTH, doc.page.height - 40)
      .strokeColor('#dee2e6').lineWidth(0.5).stroke();

    // Page number
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted);
    doc.text(
      `Page ${i + 1} of ${totalPages}`,
      LEFT, doc.page.height - 34,
      { width: PAGE_WIDTH / 2, lineBreak: false }
    );

    // Report identity
    doc.text(
      `COUNT QA Report - ${testEnv} - ${dateStr}`,
      LEFT + PAGE_WIDTH / 2, doc.page.height - 34,
      { width: PAGE_WIDTH / 2, align: 'right', lineBreak: false }
    );

    doc.page.margins.bottom = oldBottom;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ASSEMBLE THE REPORT
// ═══════════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log(`║     Generating PDF Report: ${testEnv.padEnd(25)}║`);
console.log('╚══════════════════════════════════════════════════════╝\n');

drawCoverPage();
drawExecutiveSummary();
drawDetailedResults();
drawFailedTestsDeepDive();
drawSuiteSummaryTable();
addFooters();

doc.end();

stream.on('finish', () => {
  const fileSize = fs.statSync(outputFile).size;
  const fileSizeKB = (fileSize / 1024).toFixed(1);

  console.log('📄 PDF Report Generated Successfully!');
  console.log(`   📍 File   : ${outputFile}`);
  console.log(`   📦 Size   : ${fileSizeKB} KB`);
  console.log(`   📊 Tests  : ${allTests.length} total | ${passed.length} passed | ${failed.length} failed`);
  console.log(`   🎯 Rate   : ${allTests.length > 0 ? ((passed.length / allTests.length) * 100).toFixed(1) : 0}% pass rate`);
  console.log(`\n✅ Ready to share with QA Head!\n`);
});
