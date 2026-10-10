// Loads the landing page in Chrome, scrolls through it the way a visitor would, and checks
// that the animated content ends up visible and nothing errors. Screenshots are saved for review.
//
//   FRONTEND_URL=http://localhost:3000 node scripts/landing-browser-check.mjs
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? new URL("../.checks/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${ok || !detail ? "" : `  -> ${detail}`}`);
};

const browser = await chromium.launch({ channel: "chrome" });

async function visit(name, { width, height, reducedMotion = "no-preference" }) {
  console.log(`\n${name}`);
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(FRONTEND, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${SHOTS}${name}-00-top.png` });

  // Scroll in small wheel steps so scroll-driven animations run as they would for a person.
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let shot = 1;
  let lastShotAt = 0;
  for (let guard = 0; guard < 400; guard++) {
    await page.mouse.wheel(0, 160);
    await page.waitForTimeout(90);
    const y = await page.evaluate(() => window.scrollY);
    if (y - lastShotAt >= height * 0.85) {
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${SHOTS}${name}-${String(shot++).padStart(2, "0")}.png` });
      lastShotAt = y;
    }
    if (y + height >= (await page.evaluate(() => document.documentElement.scrollHeight)) - 2) break;
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}${name}-${String(shot).padStart(2, "0")}-end.png` });

  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll("[data-split],[data-words],[data-fade],[data-clip],[data-hero]")]
      .filter((el) => getComputedStyle(el).visibility === "hidden" || Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => (el.textContent || el.tagName).trim().slice(0, 40)),
  );
  check("every animated element is visible after scrolling through", hidden.length === 0, hidden.join(" | "));
  check("no horizontal overflow", !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)));
  check("no browser errors", errors.length === 0, errors.join(" | "));
  console.log(`        page height ${total}px, ${shot} screenshots`);
  return { page, context };
}

const desktop = await visit("landing-desktop", { width: 1440, height: 900 });
check("the checkout scene reached its last step", await desktop.page.evaluate(() => document.querySelector('#how-it-works [aria-current="step"]')?.textContent?.includes("verified on-chain") ?? false));
check("navigation links exist for each section", (await desktop.page.locator('header a[href^="#"]').count()) === 3);
await desktop.context.close();

const mobile = await visit("landing-mobile", { width: 390, height: 844 });
await mobile.context.close();

const calm = await visit("landing-reduced-motion", { width: 1440, height: 900, reducedMotion: "reduce" });
check("reduced motion: the motion class is not applied", await calm.page.evaluate(() => !document.documentElement.classList.contains("motion")));
check("reduced motion: nothing is pinned", await calm.page.evaluate(() => document.querySelectorAll(".pin-spacer").length === 0));
await calm.context.close();

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
