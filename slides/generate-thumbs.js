const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const slidesDir = path.join(__dirname);
const thumbsDir = path.join(__dirname, 'thumbnails');

const slideFiles = [
  'slide01-cover.html',
  'slide02-problem.html',
  'slide03-solution.html',
  'slide04-features.html',
  'slide05-qr-attendance.html',
  'slide06-grades.html',
  'slide07-roles.html',
  'slide08-technology.html',
  'slide09-dashboard.html',
  'slide10-future.html',
  'slide11-closing.html',
];

async function main() {
  if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  for (let i = 0; i < slideFiles.length; i++) {
    const htmlFile = path.join(slidesDir, slideFiles[i]);
    const thumbFile = path.join(thumbsDir, `slide${String(i + 1).padStart(2, '0')}.png`);

    const page = await context.newPage();
    await page.goto(`file://${htmlFile}`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: thumbFile, fullPage: false });
    await page.close();

    console.log(`✓ Thumbnail ${i + 1}: ${thumbFile}`);
  }

  await browser.close();
  console.log('\nAll thumbnails generated!');
}

main().catch(console.error);
