import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseUrl = "http://localhost:3000";
const screenshotsDir = "/workspaces/nexus-intake/tmp/screenshots";
const email = `autotest+sprint1-${Date.now()}@example.com`;
const password = "NexusTest123";
const testPdfPath = "/workspaces/nexus-intake/tmp/purchase-order-test.pdf";

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function hasUrlPath(page, path) {
  return new URL(page.url()).pathname === path;
}

async function signupAndLand(page) {
  await page.goto(`${baseUrl}/signup`, { waitUntil: "domcontentloaded", timeout: 60000 });

  await page.locator("#companyName").fill("Nexus Sprint 1 Test Co", { force: true });
  await page.locator("#contactName").fill("Sprint Tester", { force: true });
  await page.locator("#contactPhone").fill("+441234567890", { force: true });
  await page.locator("#email").fill(email, { force: true });
  await page.locator("#password").fill(password, { force: true });
  await page.locator("#confirmPassword").fill(password, { force: true });
  await page.getByRole("button", { name: /create account|sign up/i }).click();

  await page.waitForURL((url) => {
    return ["/", "/onboarding", "/signin"].some((p) => url.pathname === p);
  }, { timeout: 60000 });

  if (await hasUrlPath(page, "/signin")) {
    throw new Error("Signup redirected to /signin; no active session was established.");
  }

  if (await hasUrlPath(page, "/onboarding")) {
    const companyInput = page.getByLabel("Company name *");
    await companyInput.fill("Nexus Sprint 1 Test Co");
    await page.getByRole("button", { name: /continue to dashboard/i }).click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 60000 });
  }
}

(async () => {
  await ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  const results = {
    email,
    screenshots: [],
  };

  try {
    await signupAndLand(page);

    await page.goto(`${baseUrl}/portal/intake`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.getByRole("button", { name: /Upload Document/i }).first().click();

    await page.locator("#file-upload").setInputFiles(testPdfPath);
    await page.getByText("Document Uploaded", { exact: false }).waitFor({ timeout: 60000 });

    const uploadShot = `${screenshotsDir}/sprint1-upload-success.png`;
    await page.screenshot({ path: uploadShot, fullPage: true });
    results.screenshots.push(uploadShot);

    await page.getByRole("button", { name: /^Review Job$/ }).click();
    await page.getByText("Extracted Document", { exact: false }).waitFor({ timeout: 60000 });

    const reviewShot = `${screenshotsDir}/sprint1-review-job.png`;
    await page.screenshot({ path: reviewShot, fullPage: true });
    results.screenshots.push(reviewShot);

    await page.getByRole("button", { name: /^Create Job$/ }).click();
    await page.getByText("Job Created", { exact: false }).waitFor({ timeout: 60000 });

    const createdShot = `${screenshotsDir}/sprint1-job-created.png`;
    await page.screenshot({ path: createdShot, fullPage: true });
    results.screenshots.push(createdShot);

    console.log(JSON.stringify({ success: true, ...results }, null, 2));
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          success: false,
          ...results,
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
