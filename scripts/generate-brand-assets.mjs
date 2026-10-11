// Draws the app icons, favicon and social card from the mascot, using Chrome. Run it again
// whenever the mascot or the brand colours change, and commit what it writes.
//
//   node scripts/generate-brand-assets.mjs
//
// With FRONTEND_URL set to a running app it also takes the screenshots that browsers show
// in the "Install app" dialog:
//
//   FRONTEND_URL=http://localhost:3000 node scripts/generate-brand-assets.mjs
//
// Needs a connection the first time, to load Manrope for the social card.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { chromium } from "playwright-core";

const root = new URL("../", import.meta.url);
const out = (path) => new URL(path, root).pathname;
const mascot = `data:image/png;base64,${readFileSync(out("src/assets/illustrations/mascot.png")).toString("base64")}`;
mkdirSync(out("public/icons"), { recursive: true });
mkdirSync(out("public/screenshots"), { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });

async function render(html, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await context.close();
  return png;
}

const icon = (size) => render(`<body style="margin:0"><img src="${mascot}" style="display:block;width:${size}px;height:${size}px">`, size, size);

// Chrome writes opaque screenshots without an alpha channel, which .ico readers reject,
// so favicon sizes are read back as raw pixels and encoded as RGBA PNGs here.
async function rgbaIcon(size) {
  const page = await browser.newPage();
  const pixels = await page.evaluate(
    async ({ src, size }) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = new OffscreenCanvas(size, size);
      const context = canvas.getContext("2d");
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, size, size);
      return Array.from(context.getImageData(0, 0, size, size).data);
    },
    { src: mascot, size },
  );
  await page.close();

  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 bits per channel, RGBA
  // Each row of pixels is prefixed with a zero: "no filter".
  const rows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) Buffer.from(pixels.slice(y * size * 4, (y + 1) * size * 4)).copy(rows, y * (size * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(rows)), chunk("IEND", Buffer.alloc(0))]);
}

// An .ico file is a small directory followed by the images, which may be PNGs as they are.
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)]);
}

for (const size of [96, 192, 512]) writeFileSync(out(`public/icons/icon-${size}.png`), await icon(size));
writeFileSync(out("src/app/icon.png"), await icon(192));
writeFileSync(out("src/app/apple-icon.png"), await icon(180));
writeFileSync(out("src/app/favicon.ico"), ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await rgbaIcon(size) })))));

const card = `<!doctype html>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600&display=block">
<style>
  body { margin: 0; width: 1200px; height: 630px; display: flex; background: #e8eaf8; color: #242424; font-family: Manrope, sans-serif; }
  .text { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 64px 0 64px 72px; }
  .brand { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: #2330be; }
  h1 { margin: 0; font-size: 68px; font-weight: 500; line-height: 1; letter-spacing: -0.045em; }
  .foot { font-size: 26px; color: #2330be; }
  .art { width: 440px; display: flex; align-items: center; justify-content: center; }
  .art img { width: 320px; height: 320px; border-radius: 72px; }
</style>
<div class="text">
  <div class="brand">Credlink Smartpay</div>
  <h1>Accept USDC on Stellar.<br>One link.<br>A clear checkout.</h1>
  <div class="foot">credlink.cc · Built for Ghanaian merchants</div>
</div>
<div class="art"><img src="${mascot}"></div>`;
writeFileSync(out("src/app/opengraph-image.png"), await render(card, 1200, 630));

if (process.env.FRONTEND_URL) {
  for (const [name, width, height, scale] of [["wide", 1280, 720, 1], ["narrow", 390, 844, 2]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(process.env.FRONTEND_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    writeFileSync(out(`public/screenshots/landing-${name}.png`), await page.screenshot({ type: "png" }));
    await context.close();
  }
}

await browser.close();
console.log("Brand assets written.");
