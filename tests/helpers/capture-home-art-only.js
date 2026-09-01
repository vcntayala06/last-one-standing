const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const outputDirectory = path.resolve("test-results/home-6.36-final-approved-assets");
const baseUrl = process.env.LOS_BASE_URL || "http://127.0.0.1:8086/";

const views = [
  { name: "desktop-landscape-1440x900", width: 1440, height: 900 },
  { name: "phone-portrait-390x844", width: 390, height: 844 },
  { name: "phone-landscape-844x390", width: 844, height: 390 },
];

(async () => {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const view of views) {
      const context = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        serviceWorkers: "block",
      });
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.screenshot({
        path: path.join(outputDirectory, `${view.name}.png`),
        animations: "disabled",
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
})();
