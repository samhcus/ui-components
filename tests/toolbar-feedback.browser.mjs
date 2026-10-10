import assert from "node:assert/strict";

export async function checkToolbarFeedback(browser, origin, deviceName) {
  const devices = {
    desktop: [1440, 1000, false, false], mobile: [390, 844, true, false],
    "narrow-mobile": [320, 800, true, false], "reduced-motion": [1440, 1000, false, true],
    "reduced-motion-mobile": [390, 844, true, true],
  };
  const [width, height, touch, reduce] = devices[deviceName];
  const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(() => {
    window.feedbackCues = [];
    window.feedbackAnalysers = [];
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.feedbackCues.push(performance.now());
      return start.apply(this, args);
    };
    const create = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function (...args) {
      const analyser = create.apply(this, args);
      window.feedbackAnalysers.push(analyser);
      return analyser;
    };
  });
  const button = name => page.getByRole("button", { name, exact: true });
  const press = async locator => {
    if (!touch) return locator.click();
    await locator.scrollIntoViewIfNeeded();
    const point = await locator.evaluate(el => {
      const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      return { x, y, hit: el.contains(document.elementFromPoint(x, y)) };
    });
    assert(point.hit, `Touch target is covered: ${JSON.stringify(point)}`);
    await page.touchscreen.tap(point.x, point.y);
  };
  const count = () => page.evaluate(() => window.feedbackCues.length);
  const panel = page.locator("[data-toolbar-panel]");
  try {
    await page.goto(`${origin}/examples/dynamic-toolbar`, { waitUntil: "load" });
    // This is also the exact-source example used by the sandboxed UI library.
    await button(reduce ? "Enable site sounds" : "Mute site sounds").waitFor();
    const bounds = await page.locator("[data-toolbar]").boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${deviceName}: toolbar clips the viewport`);
    await press(button("Count: 0"));
    assert.equal(await button("Count: 1").count(), 1);
    if (!reduce) await page.waitForFunction(() => window.feedbackCues.length > 0, null, { timeout: 1000 });
    assert(reduce ? await count() === 0 : await count() > 0, "Shared button feedback must respect the default sound preference");
    if (reduce) await press(button("Enable site sounds"));

    if (!touch) await button("Choose the site font and text colour").hover();
    const beforeExpansion = await count();
    await press(button("Choose the site font and text colour"));
    await page.waitForTimeout(20);
    assert.equal(await count() - beforeExpansion, 2, "A control's existing expand cue must not receive a second shared click cue");
    await button("Set font to Space Mono").waitFor({ state: "visible" });
    await press(button("Set font to Space Mono"));
    await page.waitForTimeout(350);
    const fontHeight = await panel.evaluate(el => el.getBoundingClientRect().height);
    await page.evaluate(() => {
      window.panelHeights = [];
      window.panelSampling = true;
      const sample = () => {
        window.panelHeights.push(document.querySelector("[data-toolbar-panel]").getBoundingClientRect().height);
        if (window.panelSampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await press(button("Recolour the site background"));
    await page.waitForTimeout(350);
    const colorHeight = await panel.evaluate(el => el.getBoundingClientRect().height);
    const heights = await page.evaluate(() => { window.panelSampling = false; return window.panelHeights; });
    assert(Math.min(...heights) >= Math.min(fontHeight, colorHeight) - 2, "Switching tools must not collapse the shell through zero");
    if (!reduce) assert(new Set(heights.map(value => Math.round(value))).size > 2, "Panel resizing must paint intermediate frames");
    await press(button("Ambient background effects"));
    await press(button("Choose the site font and text colour"));
    await press(button("Recolour the site background"));
    await page.waitForTimeout(350);
    assert.equal(await panel.getAttribute("aria-hidden"), "false");
    assert.equal(await page.locator("[data-toolbar-panel]:not([aria-hidden='true'])").count(), 1);

    // Recolour through the actual site controls, then recolour the text separately.
    const background = panel.locator(".cursor-crosshair");
    const colorPoint = await background.boundingBox();
    await page.mouse.click(colorPoint.x + colorPoint.width * 0.4, colorPoint.y + colorPoint.height * 0.25);
    await press(button("Choose the site font and text colour"));
    await page.waitForTimeout(350);
    const text = panel.locator(".cursor-crosshair");
    const textPoint = await text.boundingBox();
    await page.mouse.click(textPoint.x + textPoint.width * 0.6, textPoint.y + textPoint.height * 0.65);

    await press(button("Draw over the page"));
    await page.waitForTimeout(350);
    const weight = panel.locator('[aria-label="Marker thickness"]');
    const track = await weight.boundingBox();
    const beforeSlider = await count();
    await page.mouse.move(track.x + track.width * 0.1, track.y + track.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width * 0.95, track.y + track.height / 2, { steps: 12 });
    await page.waitForTimeout(35);
    await page.mouse.move(track.x + track.width + 15, track.y + track.height / 2);
    await page.waitForTimeout(35);
    const atLimit = await count();
    await page.mouse.move(track.x + track.width + 25, track.y + track.height / 2, { steps: 4 });
    await page.mouse.up();
    assert(atLimit > beforeSlider, "Slider travel must produce haptic ticks");
    assert.equal(await count(), atLimit, "A slider pinned at its endpoint must be silent");

    await page.mouse.move(width / 2, 100);
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 200);
    await page.getByText("Drawing is on", { exact: true }).waitFor();
    await page.waitForTimeout(100);
    const toast = await page.getByText("Drawing is on", { exact: true }).evaluate(el => {
      const body = getComputedStyle(document.body), title = getComputedStyle(el);
      const shell = getComputedStyle(el.closest('[role="status"]'));
      return { bodyFont: body.fontFamily, toastFont: title.fontFamily, bodyTracking: body.letterSpacing, toastTracking: title.letterSpacing, bodySize: body.fontSize, toastSize: title.fontSize,
        color: title.color, foreground: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim(), background: shell.backgroundColor };
    });
    assert.match(toast.bodyFont, /Space Mono/, "The font control must actually select the requested face");
    assert.equal(toast.toastFont, toast.bodyFont);
    assert.equal(parseFloat(toast.toastTracking) / parseFloat(toast.toastSize), parseFloat(toast.bodyTracking) / parseFloat(toast.bodySize));
    assert.deepEqual(toast.color.match(/[\d.]+/g), toast.foreground.match(/[\d.]+/g), "Toast text must follow the selected site ink colour");
    assert.notEqual(toast.background, "rgba(0, 0, 0, 0)");
    assert.equal(await page.evaluate(() => scrollY), scrollBefore);
    const warningCount = await count();
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 100);
    await page.waitForTimeout(100);
    assert.equal(await page.getByText("Drawing is on", { exact: true }).count(), 1);
    assert.equal(await count(), warningCount, "Repeated blocked scrolls must not stack notification sounds");
    await page.screenshot({ path: `/tmp/personal-site-toolbar-${deviceName}.png` });

    // Touch first relights the dimmed drawing island; the second tap exits.
    const exit = button("Cement drawing and exit");
    if (!touch) {
      const box = await exit.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2);
    }
    await press(exit);
    if (touch && await exit.count()) await press(exit);
    await press(button("Mute site sounds"));
    const muted = await count();
    await press(button("Count: 1"));
    assert.equal(await count(), muted, "Mute must silence shared button and hover feedback");
    await page.reload({ waitUntil: "load" });
    await button("Enable site sounds").waitFor();
    assert.equal(await count(), 0, "Muted preference must survive reload");
    await press(button("Enable site sounds"));
    await press(button("Count: 0"));
    assert(await count() > 0, "Explicit sound opt-in must work under either motion preference");
    // Sample the real audio bus, proving these are generated signals, not just calls.
    const peak = await page.evaluate(async () => {
      let peak = 0;
      for (let i = 0; i < 20; i++) {
        for (const analyser of window.feedbackAnalysers) {
          const samples = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(samples);
          for (const value of samples) peak = Math.max(peak, Math.abs(value - 128));
        }
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      return peak;
    });
    assert(peak > 0, "The shared haptic must produce a non-silent audio signal");
    const range = page.getByRole("slider", { name: "Slider value" });
    await range.focus();
    const beforeRange = await count();
    await range.press("ArrowRight");
    await page.getByText("Value: 51", { exact: true }).waitFor();
    assert(await count() > beforeRange, "Native slider changes must receive shared haptics");
    await page.evaluate(() => document.querySelector("#example-components").addEventListener("click", event => event.stopPropagation()));
    if (!touch) await button("Count: 1").hover();
    await page.waitForTimeout(35); // Let the previous slider detent's throttle expire.
    const beforeStopped = await count();
    await press(button("Count: 1"));
    await page.waitForFunction(before => window.feedbackCues.length > before, beforeStopped, { timeout: 1000 });
    assert(await count() > beforeStopped, "Controls that stop propagation must still receive shared feedback");
    const beforeTyping = await count();
    await page.getByRole("textbox", { name: "Text input" }).fill("Quiet typing");
    assert.equal(await count(), beforeTyping, "Typing must remain silent");
    await page.goto(origin, { waitUntil: "load" });
    await page.locator('div[class*="z-[100000]"][class*="grid place-items-center"]').waitFor({ state: "hidden" });
    await press(page.getByRole("button", { name: /Dynamic toolbar/ }).first());
    const sampleFont = button("Choose the sample paragraph's typeface");
    await sampleFont.evaluate(el => el.scrollIntoView({ block: "center" }));
    await press(sampleFont);
    await page.waitForTimeout(350);
    const demo = page.locator("[data-toolbar-panel]").last();
    assert.equal(await demo.getAttribute("aria-hidden"), "false");
    await press(button("Recolour the sample card"));
    await page.waitForTimeout(350);
    assert((await demo.boundingBox()).height > 100, "The embedded toolbar must resize into its new panel");
    await press(button("Recolour the sample card"));
    await page.waitForTimeout(350);
    assert((await demo.boundingBox()).height < 1, "The embedded toolbar must close fully");
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ device: deviceName, continuousPanel: true, sliderDetents: true, styledToast: true, sharedSound: true, mutePersistence: true, embeddedToolbar: true, signalPeak: peak, errors }));
  } finally { await context.close(); }
}
