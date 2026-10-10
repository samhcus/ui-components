import assert from "node:assert/strict";

export async function checkReadingPanel(browser, siteOrigin, libraryURL, device) {
  const viewport = device === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 };
  const context = await browser.newContext({ viewport, isMobile: device === "mobile", hasTouch: device === "mobile" });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const labels = ["Follow me on Instagram", "Subscribe on YouTube", "Follow me on GitHub", "Connect on LinkedIn", "Buy me a coffee"];
  const checkLinks = async (panel, expected) => {
    assert.deepEqual(await panel.locator("a").evaluateAll(links => links.map(link => link.getAttribute("aria-label"))), expected);
    assert.equal(await panel.getByRole("link", { name: "Connect on LinkedIn", exact: true }).getAttribute("href"), "https://www.linkedin.com/in/samhc/");
    const bounds = await panel.boundingBox();
    for (const link of await panel.locator("a").all()) {
      const box = await link.boundingBox();
      assert(box.x >= bounds.x && box.x + box.width <= bounds.x + bounds.width + 1);
      assert(box.y >= bounds.y && box.y + box.height <= bounds.y + bounds.height + 1, "social button is clipped");
    }
  };
  try {
    for (const route of ["/", "/examples/reading-gif-panel"]) {
      const response = await page.goto(new URL(route, siteOrigin).href, { waitUntil: "networkidle", timeout: 90_000 });
      assert.equal(response.status(), 200);
      if (route === "/") await page.locator('[class*="z-[100000]"]').waitFor({ state: "hidden", timeout: 20_000 });
      const panel = page.locator("#reading-gif");
      await panel.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Array.from(document.querySelectorAll("#reading-gif img")).every(image => image.complete && image.naturalWidth > 0));
      await checkLinks(panel, route === "/" ? labels.slice(2, 4) : labels);
      console.log(JSON.stringify({ suite: "reading", device, route, stage: "book dialog" }));
      assert.equal(await panel.getByRole("img", { name: /cover$/ }).count(), 2);
      await panel.getByRole("img", { name: "World War Z cover", exact: true }).click();
      const purchase = page.getByRole("link", { name: "Purchase", exact: true });
      await purchase.waitFor();
      assert.equal(new URL(await purchase.getAttribute("href")).hostname, "www.amazon.com");
      await page.keyboard.press("Escape");
      await purchase.waitFor({ state: "hidden" });
    }
    const library = new URL(libraryURL);
    library.searchParams.set("component", "reading-gif-panel");
    await page.goto(library.href, { waitUntil: "networkidle", timeout: 90_000 });
    const dialog = page.getByRole("dialog", { name: "Reading GIF Panel details" });
    await dialog.getByRole("link", { name: "Download original example ↓", exact: true }).waitFor();
    assert(await dialog.getByLabel("Source file").count());
    const panel = dialog.frameLocator('iframe[title="Original Reading GIF Panel example"]').locator("#reading-gif");
    await panel.waitFor();
    await checkLinks(panel, labels);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ suite: "reading", device, homepageButtons: 2, libraryButtons: 5, linkedin: "https://www.linkedin.com/in/samhc/", bookDialog: true, errors }));
  } finally { await context.close(); }
}
