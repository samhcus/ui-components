import assert from "node:assert/strict";

// Pass a Playwright Browser and a production-preview origin. These checks need
// real pointer/touch events under both motion preferences. Explicitly activating
// the dice or cat must animate them even when passive motion is reduced.
export async function checkSiteMotion(browser, origin, onlyDevice) {
  const results = [];
  for (const device of [
    { name: "desktop", width: 1440, height: 1000, touch: false, reduce: false },
    { name: "mobile", width: 390, height: 844, touch: true, reduce: false },
    { name: "narrow-mobile", width: 320, height: 800, touch: true, reduce: false },
    { name: "reduced-motion", width: 1440, height: 1000, touch: false, reduce: true },
    { name: "reduced-motion-mobile", width: 390, height: 844, touch: true, reduce: true },
  ]) {
    if (onlyDevice && device.name !== onlyDevice) continue;
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.touch, hasTouch: device.touch,
      reducedMotion: device.reduce ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(90_000);
    const errors = [];
    let catFrames = 0;
    let stage = "load";
    page.on("pageerror", error => { errors.push(error.message); console.error(device.name, stage, error.stack); });
    const press = async locator => {
      if (!device.touch) return locator.click();
      await locator.scrollIntoViewIfNeeded();
      // Use rendered viewport coordinates for the site's CSS-zoomed phone canvas.
      const point = await locator.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
        return { x, y, hit: el.contains(document.elementFromPoint(x, y)) };
      });
      assert(point.hit, `${device.name}: touch target is covered at ${JSON.stringify(point)}`);
      assert(point.x >= 0 && point.x < device.width && point.y >= 0 && point.y < device.height,
        `${device.name}: touch target is outside the visible viewport at ${JSON.stringify(point)}`);
      await page.touchscreen.tap(point.x, point.y);
    };
    try {
      await page.goto(origin, { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Toggle light and dark mode" }).waitFor();
      await page.waitForFunction(() => !document.querySelector('[class*="z-[100000]"]'));
      if (device.name === "narrow-mobile") {
        assert((await page.evaluate(() => document.body.getBoundingClientRect().width)) <= device.width + 1,
          "narrow-mobile: the authored canvas did not scale to the screen");
      }
      await page.evaluate(() => {
        // Make font latency deterministic even when the browser's HTTP cache is warm.
        const load = document.fonts.load.bind(document.fonts);
        document.fonts.load = (...args) => new Promise(resolve => setTimeout(resolve, 150)).then(() => load(...args));
        const root = document.documentElement;
        window.motionSamples = [];
        window.motionPaints = [];
        window.motionRoll = 0;
        document.addEventListener("click", event => {
          if (event.target.closest?.('[aria-label="Randomize the font, colour, and effect"]')) window.motionRoll += 1;
        }, true);
        let previous = root.style.getPropertyValue("--font-inter");
        window.motionObserver = new MutationObserver(() => {
          const current = root.style.getPropertyValue("--font-inter");
          if (current === previous) return;
          previous = current;
          const family = getComputedStyle(document.body).fontFamily.split(",")[0];
          window.motionSamples.push({ roll: window.motionRoll, family, ready: document.fonts.check(`500 16px ${family}`) });
        });
        window.motionObserver.observe(root, { attributes: true, attributeFilter: ["style"] });
        let painted = "";
        const samplePaint = () => {
          const look = `${getComputedStyle(document.body).fontFamily}|${getComputedStyle(root).backgroundColor}`;
          if (look !== painted) {
            window.motionPaints.push({ roll: window.motionRoll, look });
            painted = look;
          }
          window.motionPaintRaf = requestAnimationFrame(samplePaint);
        };
        window.motionPaintRaf = requestAnimationFrame(samplePaint);
      });
      const randomize = page.getByRole("button", { name: "Randomize the font, colour, and effect", exact: true });
      stage = "randomize";
      await press(randomize);
      await press(randomize); // a pending roll must be replaced
      await page.waitForFunction(() => document.querySelector('[aria-label="Randomize the font, colour, and effect"]')?.getAttribute("aria-busy") === "false");
      const { looks, paints } = await page.evaluate(() => {
        window.motionObserver.disconnect(); cancelAnimationFrame(window.motionPaintRaf);
        return { looks: window.motionSamples, paints: window.motionPaints };
      });
      // A slow test host may finish the first roll before delivering the second
      // tap. Count the latest roll, including any stale hops after that input.
      const latestLooks = looks.filter(look => look.roll === 2);
      assert.equal(latestLooks.length, 9, `${device.name}: only the latest roll should complete`);
      assert(looks.every(look => look.ready), `${device.name}: a roll used a font before it loaded`);
      const paintedLooks = new Set(paints.filter(paint => paint.roll === 2).map(paint => paint.look)).size;
      assert(paintedLooks >= 3, `${device.name}: the roll did not render multiple visible looks`);

      const reset = page.getByRole("button", { name: "Reset customizations", exact: true });
      stage = "reset";
      await press(reset);
      await press(randomize);
      await press(reset); // cancel while fonts or the next animation hop are pending
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue("--background")), "");
      assert.equal(await randomize.getAttribute("aria-busy"), "false");

      {
        stage = "cat chase";
        await press(page.getByRole("button", { name: "Make a cat follow the cursor", exact: true }));
        const cat = page.locator(".oneko-cat");
        await cat.waitFor({ state: "visible" });
        const target = { x: device.touch ? 50 : 1200, y: 100 };
        if (device.touch) await page.touchscreen.tap(target.x, target.y);
        else await page.mouse.move(target.x, target.y);
        await page.waitForTimeout(350);
        const movement = await cat.evaluate(async el => {
          const image = new Image();
          image.src = getComputedStyle(el).backgroundImage.slice(4, -1).replace(/^["']|["']$/g, "");
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 32;
          const ctx = canvas.getContext("2d");
          return new Promise(resolve => {
            const positions = [];
            const sprites = new Set();
            const pixels = new Set();
            const started = performance.now();
            const sample = now => {
              positions.push(el.style.transform);
              const position = getComputedStyle(el).backgroundPosition;
              if (!sprites.has(position)) {
                const [x, y] = position.split(" ").map(Number.parseFloat);
                ctx.clearRect(0, 0, 32, 32); ctx.drawImage(image, x, y);
                let hash = 0;
                for (const byte of ctx.getImageData(0, 0, 32, 32).data) hash = (hash * 31 + byte) >>> 0;
                pixels.add(hash);
                sprites.add(position);
              }
              if (now - started < 700) requestAnimationFrame(sample);
              else resolve({ frames: positions.length, changes: new Set(positions).size, sprites: sprites.size, pixelFrames: pixels.size });
            };
            requestAnimationFrame(sample);
          });
        });
        assert(movement.changes > movement.frames * 0.65, `${device.name}: cat movement still jumps between sprite ticks`);
        assert(movement.sprites >= 2, `${device.name}: running sprite frames did not advance`);
        assert(movement.pixelFrames >= 2, `${device.name}: the running frames rendered identical pixels`);
        catFrames = movement.pixelFrames;
        await page.waitForTimeout(6500);
        const settled = await cat.evaluate(el => el.getBoundingClientRect().toJSON());
        const distance = Math.hypot(settled.x + settled.width / 2 - target.x, settled.y + settled.height / 2 - target.y);
        assert(distance < 52, `${device.name}: cat missed the pointer by ${distance}px`);

        stage = "open post";
        await press(page.locator('#writing a[href="/writing/human-in-the-loop"]'));
        await page.locator('[data-overlay="close"]').waitFor({ state: "visible" });
        assert.equal(await cat.evaluate(el => el.parentElement.dataset.overlay), "close");
        stage = "close post";
        await press(page.getByRole("button", { name: "Close", exact: true }));
        await page.locator('[data-overlay="close"]').waitFor({ state: "detached" });
        assert.equal(await cat.evaluate(el => el.parentElement.tagName), "BODY");
        await press(reset);
        assert.equal(await cat.count(), 0);
      }
      assert.deepEqual(errors, [], `${device.name}: browser errors`);
      results.push({ device: device.name, looks: latestLooks.length, paintedLooks, catFrames, fontsReady: true, errors });
      console.log(JSON.stringify(results.at(-1)));
    } finally {
      await context.close();
    }
  }
  return results;
}
