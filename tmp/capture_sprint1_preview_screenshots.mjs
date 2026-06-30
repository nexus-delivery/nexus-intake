import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = "http://localhost:3000";
const screenshotsDir = "/workspaces/nexus-intake/tmp/screenshots";

(async () => {
  await fs.mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const screenshots = [];

  try {
    await page.goto(`${baseUrl}/portal/intake`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 60000 });
    await page.waitForTimeout(1200);
    const intakeShot = `${screenshotsDir}/sprint1-intake-upload-step.png`;
    await page.screenshot({ path: intakeShot, fullPage: true });
    screenshots.push(intakeShot);

    await page.goto(`${baseUrl}/debug/ocr-review-preview`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.getByText("Review Extracted Job (Preview)", { exact: false }).waitFor({ timeout: 15000 });
    const reviewShot = `${screenshotsDir}/sprint1-review-screen.png`;
    await page.screenshot({ path: reviewShot, fullPage: true });
    screenshots.push(reviewShot);

    await page.getByRole("button", { name: /^Create Job$/ }).click();
    await page
      .getByText("Preview only: Create Job action completed", { exact: false })
      .waitFor({ timeout: 15000 });
    const createdShot = `${screenshotsDir}/sprint1-create-job-action.png`;
    await page.screenshot({ path: createdShot, fullPage: true });
    screenshots.push(createdShot);

    console.log(JSON.stringify({ success: true, screenshots }, null, 2));
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          success: false,
          screenshots,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
})();
