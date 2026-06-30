import { chromium } from "playwright";

const baseUrl = "https://nexus-intake-bjj4m9l91-nexusdeliverysolutions.vercel.app";
const testPdfPath = "/workspaces/nexus-intake/tmp/test-upload.pdf";
const email = `autotest+${Date.now()}@example.com`;
const password = "NexusTest123";

const results = {
  deploymentUrl: baseUrl,
  user: email,
  checks: {
    uploadMissingCompanyIdErrorAbsent: false,
    documentsPageLoadedWithoutMissingCompanyError: false,
    uploadNewPdfSucceeded: false,
    previewWorked: false,
    downloadWorked: false,
  },
  notes: [],
  errors: [],
};

function hasText(locator, text) {
  return locator.getByText(text, { exact: false }).isVisible().catch(() => false);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/signup`, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.getByLabel("Company Name").fill("Nexus Auto Test Co");
    await page.getByLabel("Contact Name").fill("Automation User");
    await page.getByLabel("Phone Number").fill("+441234567890");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);
    await page.getByRole("button", { name: /create account|sign up/i }).click();

    await page.waitForURL((url) => {
      return ["/", "/onboarding", "/signin"].some((p) => url.pathname === p);
    }, { timeout: 60000 });

    if (page.url().includes("/signin")) {
      throw new Error("Signup did not create an active session; redirected to /signin.");
    }

    if (page.url().includes("/onboarding")) {
      const companyInput = page.getByLabel("Company name *");
      await companyInput.fill("Nexus Auto Test Co");
      await page.getByRole("button", { name: /continue to dashboard/i }).click();
      await page.waitForURL((url) => url.pathname === "/", { timeout: 60000 });
    }

    await page.goto(`${baseUrl}/portal/intake`, { waitUntil: "domcontentloaded", timeout: 60000 });

    const hasUploadMissingCompanyError = await hasText(page, "Missing company ID for document upload.");
    results.checks.uploadMissingCompanyIdErrorAbsent = !hasUploadMissingCompanyError;
    if (hasUploadMissingCompanyError) {
      results.notes.push("Upload page displayed missing company ID error before upload.");
    }

    await page.getByRole("button", { name: /Upload Document/i }).first().click();

    const fileInput = page.locator("#file-upload");
    await fileInput.setInputFiles(testPdfPath);

    await page.getByText("Document Uploaded", { exact: false }).waitFor({ timeout: 60000 });
    results.checks.uploadNewPdfSucceeded = true;

    const hasUploadMissingCompanyErrorAfter = await hasText(page, "Missing company ID for document upload.");
    if (hasUploadMissingCompanyErrorAfter) {
      results.notes.push("Upload page displayed missing company ID error after upload attempt.");
      results.checks.uploadMissingCompanyIdErrorAbsent = false;
    }

    await page.goto(`${baseUrl}/portal/documents`, { waitUntil: "domcontentloaded", timeout: 60000 });

    const hasDocumentsMissingCompanyError = await hasText(page, "Missing company ID in the current session.");
    results.checks.documentsPageLoadedWithoutMissingCompanyError = !hasDocumentsMissingCompanyError;
    if (hasDocumentsMissingCompanyError) {
      results.notes.push("Documents page displayed missing company ID in session.");
    }

    await page.getByText(/Documents/i).first().waitFor({ timeout: 15000 });

    const firstViewButton = page.getByRole("button", { name: /^View$/ }).first();
    const firstDownloadButton = page.getByRole("button", { name: /^Download$/ }).first();

    const viewButtonVisible = await firstViewButton.isVisible().catch(() => false);
    const downloadButtonVisible = await firstDownloadButton.isVisible().catch(() => false);

    if (!viewButtonVisible || !downloadButtonVisible) {
      throw new Error("Document actions not available; no uploaded documents were rendered.");
    }

    const viewPopupPromise = page.waitForEvent("popup", { timeout: 30000 });
    await firstViewButton.click();
    const viewPopup = await viewPopupPromise;
    await viewPopup.waitForLoadState("domcontentloaded", { timeout: 30000 });
    results.checks.previewWorked = true;
    await viewPopup.close();

    const downloadPopupPromise = page.waitForEvent("popup", { timeout: 30000 });
    await firstDownloadButton.click();
    const downloadPopup = await downloadPopupPromise;
    await downloadPopup.waitForLoadState("domcontentloaded", { timeout: 30000 });
    results.checks.downloadWorked = true;
    await downloadPopup.close();
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : String(error));
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
})();
