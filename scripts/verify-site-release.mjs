import { createRequire } from "node:module";
import path from "node:path";
import { checkToolbarFeedback } from "../tests/toolbar-feedback.browser.mjs";
import { checkSiteMotion } from "../tests/site-motion.browser.mjs";
import { checkReadingPanel } from "../tests/reading-panel.browser.mjs";

const [suite, device, siteOrigin = "https://samhc.us", libraryOrigin = "https://ui.samhc.us/"] = process.argv.slice(2);
const devices = (suite === "motion" || suite === "feedback")
  ? ["desktop", "mobile", "narrow-mobile", "reduced-motion", "reduced-motion-mobile"]
  : suite === "reading" ? ["desktop", "mobile"] : [];
if (!devices.includes(device)) throw new Error("Usage: node scripts/verify-site-release.mjs motion|feedback|reading DEVICE [SITE_ORIGIN] [LIBRARY_URL]");
const require = createRequire(import.meta.url);
const candidates = process.env.PLAYWRIGHT_MODULE ? [process.env.PLAYWRIGHT_MODULE] : [
  "playwright", "@playwright/test", "playwright-core",
  path.resolve(path.dirname(process.execPath), "../lib/node_modules/@playwright/cli/node_modules/playwright-core"),
];
let chromium;
for (const candidate of candidates) {
  try { ({ chromium } = require(candidate)); if (chromium) break; }
  catch (error) { if (error.code !== "MODULE_NOT_FOUND") throw error; }
}
if (!chromium) throw new Error("Playwright is unavailable. Set PLAYWRIGHT_MODULE to an existing Playwright module; this command does not install dependencies.");
// A fresh process per scenario also supports constrained WSL hosts.
const browser = await chromium.launch({ headless: true, timeout: 60_000, args: ["--single-process", "--no-zygote", "--disable-gpu"] });
try {
  if (suite === "feedback") await checkToolbarFeedback(browser, siteOrigin, device);
  else if (suite === "motion") await checkSiteMotion(browser, siteOrigin, device);
  else await checkReadingPanel(browser, siteOrigin, libraryOrigin, device);
} finally { await browser.close(); }
