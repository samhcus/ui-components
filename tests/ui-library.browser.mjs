import assert from "node:assert/strict";

/** Run against a production build; Next dev blocks opaque iframe script requests. */
export async function checkUILibrary(browser, origin, path = "/library") {
  const results = [];
  for (const device of [{ name: "desktop", width: 1440, height: 1000 }, { name: "tablet", width: 820, height: 1000 }, { name: "phone", width: 390, height: 844 }, { name: "narrow-phone", width: 320, height: 800, reduce: true }]) {
    const context = await browser.newContext({ viewport: device, reducedMotion: device.reduce ? "reduce" : "no-preference" });
    const page = await context.newPage(); page.setDefaultTimeout(7000);
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    let stage = "load";
    try {
      await page.goto(origin + path);
      const example = page.frameLocator('iframe[title="Dynamic Island Toolbar interactive example"]');
      await example.getByRole("button", { name: "Draw over the page", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Draw over the page", exact: true }).count(), 0);
      assert(await page.evaluate(() => document.body.getBoundingClientRect().width <= innerWidth + 1));
      await page.locator("iframe").evaluate(el => el.scrollIntoView({ block: "center" }));
      const frame = page.frames().find(frame => frame.url().includes("/examples/dynamic-toolbar"));
      const parentState = () => page.evaluate(() => ({ root: document.documentElement.getAttribute("style"), theme: document.documentElement.className, body: document.body.getAttribute("style"), font: getComputedStyle(document.body).fontFamily }));
      const before = await parentState();
      assert(await frame.evaluate(() => { try { void parent.document; return false; } catch (error) { return error.name === "SecurityError"; } }));
      stage = "theme";
      await example.getByRole("button", { name: "Toggle light and dark mode", exact: true }).click();
      await frame.waitForFunction(() => document.documentElement.classList.contains("dark"));
      stage = "font";
      await example.getByRole("button", { name: "Choose the site font and text colour", exact: true }).click();
      await example.getByRole("button", { name: "Set font to Nunito", exact: true }).click();
      await frame.waitForFunction(() => document.documentElement.style.getPropertyValue("--font-inter").includes("nunito"));
      stage = "effects";
      await example.getByRole("button", { name: "Ambient background effects", exact: true }).click();
      assert.equal(await example.getByRole("button", { name: /Turn on / }).count(), 24);
      await example.getByRole("button", { name: "Turn on Snow", exact: true }).click();
      await example.getByRole("button", { name: "Background effect: snow", exact: true }).waitFor();
      stage = "color";
      await example.getByRole("button", { name: "Recolour the site background", exact: true }).click();
      await example.locator("div.cursor-crosshair").last().click({ position: { x: 110, y: 30 } });
      await frame.waitForFunction(() => !!document.documentElement.style.getPropertyValue("--background"));
      assert.deepEqual(await parentState(), before);
      stage = "restart";
      await page.getByRole("button", { name: "Restart example", exact: true }).click();
      await example.getByRole("button", { name: "Draw over the page", exact: true }).waitFor();
      const fresh = page.frames().find(frame => frame.url().includes("/examples/dynamic-toolbar"));
      assert(await fresh.evaluate(() => !document.documentElement.classList.contains("dark") && !document.documentElement.style.getPropertyValue("--background")));
      stage = "draw";
      await example.getByRole("button", { name: "Draw over the page", exact: true }).click();
      const box = await page.locator("iframe").boundingBox();
      await page.mouse.move(box.x + 50, box.y + 160); await page.mouse.down(); await page.mouse.move(box.x + 140, box.y + 200, { steps: 8 }); await page.mouse.up();
      // Draw mode is intentionally click-through until a real pointer approaches.
      const island = await example.getByRole("button", { name: "Cement drawing and exit", exact: true }).boundingBox();
      await page.mouse.move(island.x + island.width / 2, island.y + island.height / 2);
      await page.mouse.move(island.x + island.width / 2 + 1, island.y + island.height / 2);
      await fresh.waitForFunction(() => document.querySelector('[aria-label="Undo"]')?.disabled === false, null, { timeout: 7000 });
      await example.getByRole("button", { name: "Undo", exact: true }).click();
      await fresh.waitForFunction(() => document.querySelector('[aria-label="Redo"]')?.disabled === false, null, { timeout: 7000 });
      await example.getByRole("button", { name: "Redo", exact: true }).click();
      assert.deepEqual(await parentState(), before);
      await page.getByRole("button", { name: "Restart example", exact: true }).click();
      stage = "source drawer";
      const search = page.getByRole("textbox", { name: "Search components" }).filter({ visible: true });
      await search.fill("dynamic");
      const trigger = page.getByRole("button", { name: "View Dynamic Island Toolbar code", exact: true });
      await trigger.click();
      assert(await page.getByRole("combobox", { name: "Source file" }).locator("option").count() >= 14);
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert(await trigger.evaluate(el => el === document.activeElement));
      assert.deepEqual(errors, []);
      results.push({ device: device.name, passed: true });
    } catch (error) { throw new Error(`${device.name} / ${stage}: ${error.message}`, { cause: error }); }
    finally { await context.close(); }
  }
  return results;
}
