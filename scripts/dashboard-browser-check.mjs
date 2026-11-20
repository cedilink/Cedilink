// Drives the merchant dashboard in a real browser against a running frontend and backend,
// then pays a checkout with the Testnet customer key and watches the dashboard update live.
// Expects a freshly seeded database (no payments yet).
//
//   FRONTEND_URL=http://localhost:3000 API_URL=http://localhost:4000 node scripts/dashboard-browser-check.mjs
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

const backend = new URL("../../cedlink-backend/", import.meta.url);
const require = createRequire(new URL("package.json", backend));
const { Keypair, TransactionBuilder } = require("@stellar/stellar-sdk");
for (const file of [".env.testnet", ".env.local"]) {
  try {
    process.loadEnvFile(new URL(file, backend));
  } catch {
    // optional
  }
}

const FRONTEND = process.env.FRONTEND_URL ?? "http://localhost:3000";
const API = `${process.env.API_URL ?? "http://localhost:4000"}/v1`;
const SHOTS = process.env.SHOTS_DIR ?? new URL("../.checks/", import.meta.url).pathname;
const customer = Keypair.fromSecret(process.env.CUSTOMER_SECRET);
const EMAIL = process.env.SEED_MERCHANT_EMAIL;
const PASSWORD = process.env.SEED_MERCHANT_PASSWORD;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${ok || !detail ? "" : `  -> ${detail}`}`);
};

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await context.grantPermissions(["clipboard-read", "clipboard-write"]);

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
// Expected refusals (401 before sign-in, 422 for the invalid wallets tried below) are not defects.
// The instant-navigation check is a development-server diagnostic, not a defect in the page.
page.on("console", (m) => m.type() === "error" && !/status of (401|422)|Could not validate that a segment/.test(m.text()) && errors.push(m.text()));

const shot = (name, target = page) => target.screenshot({ path: `${SHOTS}${name}.png` });
const sees = (text, timeout = 15_000, target = page) =>
  target.getByText(text, { exact: false }).first().waitFor({ timeout }).then(() => true, () => false);
const settle = (ms = 900) => page.waitForTimeout(ms);

/** Pays a checkout the way the checkout page does, signing with the customer key. */
async function pay(paymentId) {
  const post = async (path, body) =>
    (await fetch(`${API}/checkout/${paymentId}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
  const built = await post("/transaction", { customerWallet: customer.publicKey() });
  const tx = TransactionBuilder.fromXDR(built.xdr, built.networkPassphrase);
  tx.sign(customer);
  return post("/submit", { signedXdr: tx.toXDR() });
}

console.log("\nSign in");
await page.goto(`${FRONTEND}/dashboard`);
await page.waitForURL(/\/login/, { timeout: 15_000 }).catch(() => {});
check("signed-out visitors are sent to the login page", page.url().includes("/login"));
await page.getByLabel("Email address").fill(EMAIL);
await page.getByLabel("Password").fill("definitely-wrong");
await page.getByRole("button", { name: "Sign in" }).click();
check("a wrong password is refused", await sees("Email or password is incorrect"));
await shot("d-00-login");
await page.getByLabel("Password").fill(PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/dashboard$/, { timeout: 15_000 }).catch(() => {});
check("signs in and lands on the dashboard", (await sees("Verified payments")) && (await sees("Ama Boateng")));

console.log("\nEmpty workspace");
check("dashboard shows an empty workspace", await sees("No activity yet"));
await settle(); await shot("d-01-dashboard-empty");
await page.getByRole("link", { name: "Link management" }).first().click();
check("link management shows the empty state", await sees("No payment links yet"));
await settle(); await shot("d-02-payments-empty");

console.log("\nStellar USDC settings");
await page.getByRole("link", { name: "Stellar USDC" }).click();
check("settings load the receiving wallet", await sees("Accept Stellar USDC"));
const wallet = page.getByLabel("Receiving wallet");
const original = await wallet.inputValue();
check("receiving wallet is the seeded Testnet account", original === process.env.MERCHANT_PUBLIC_KEY, original);
await wallet.fill("not-a-stellar-address");
await page.getByRole("button", { name: "Save changes" }).click();
check("an invalid address is refused", await sees("valid Stellar public key"));
await wallet.fill(Keypair.random().publicKey());
await page.getByRole("button", { name: "Save changes" }).click();
check("an unfunded account is refused", await sees("does not exist on Stellar Testnet"));
await settle(300); await shot("d-03-settings-error");
await wallet.fill(original);
await page.getByRole("button", { name: "Save changes" }).click();
check("a valid wallet is saved", await sees("Saved"));

console.log("\nCreate a payment");
await page.goto(`${FRONTEND}/dashboard/links/new`);
await page.getByLabel("Product or service").fill("Ghana Web3 Conference Ticket");
await page.getByLabel("Amount").fill("25.00");
await page.getByLabel("Customer name").fill("Kofi Mensah");
await settle(300); await shot("d-04-create-payment");
await page.getByRole("button", { name: "Generate payment link" }).click();
check("shows the generated payment link", (await sees("Payment link created")) && (await sees("$25.00 USDC")));
const link = await page.locator("text=/\\/c\\/SP-\\d+/").first().textContent();
const paymentId = link.match(/SP-\d+/)[0];
check("the link points at this frontend's checkout", link.startsWith(`${FRONTEND}/c/SP-`), link);
await page.getByRole("button", { name: "Copy link" }).click();
check("copy link puts the link on the clipboard", (await page.evaluate(() => navigator.clipboard.readText())) === link);
await settle(300); await shot("d-05-checkout-created");

console.log("\nLink management");
await page.goto(`${FRONTEND}/dashboard/links`);
check("lists the new link as pending", (await sees("Ghana Web3 Conference Ticket")) && (await sees("Pending")));
await page.getByRole("radio", { name: /^Confirmed/ }).click();
check("a status with no links explains itself", await sees("Nothing here"));
check("the filter is kept in the URL", page.url().includes("status=confirmed"));
await page.getByRole("radio", { name: /^All/ }).click();
await page.getByLabel("Search links or request reference").fill("Accra design summit");
check("a search with no match says so", await sees("No results found"));
await settle(300); await shot("d-06-no-results");
await page.getByRole("button", { name: "Clear search" }).click();
check("clearing the search brings the list back", await sees("Ghana Web3 Conference Ticket"));

console.log("\nPayment details, then a live payment");
await page.getByRole("link", { name: /Ghana Web3 Conference Ticket/ }).first().click();
check("details show awaiting payment with nothing verified", (await sees("Waiting for the customer")) && (await sees("Not received yet")));
await settle(); await shot("d-07-details-awaiting");
const submitted = await pay(paymentId);
check("the customer's transaction is accepted", ["CONFIRMING", "TRANSACTION_SUBMITTED"].includes(submitted.status), JSON.stringify(submitted));
check("details turn Paid without a reload", await sees("This payment has been verified on Stellar", 60_000));
check("the success toast appears", await sees("Payment successful", 10_000));
await settle(1200); await shot("d-08-details-paid-with-toast");
check("the explorer link is offered", (await page.getByRole("link", { name: "View on Stellar explorer" }).getAttribute("href"))?.includes("/tx/") ?? false);
await page.getByRole("link", { name: "Dashboard", exact: true }).click();
check("the dashboard now counts the payment", await sees("$25.00"));
await settle(1500); await shot("d-09-dashboard");
await page.getByRole("link", { name: "Link management" }).first().click();
await sees("Ghana Web3 Conference Ticket");
await settle(); await shot("d-10-links");

console.log("\nMobile");
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, storageState: await context.storageState() });
const m = await phone.newPage();
await m.goto(`${FRONTEND}/dashboard`, { waitUntil: "networkidle" });
check("the dashboard fits a phone", (await sees("Verified payments", 15_000, m)) && !(await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
await m.waitForTimeout(1200); await shot("m-d-01-dashboard", m);
await m.getByRole("button", { name: "Open menu" }).click();
check("the menu opens as a drawer", await m.getByRole("button", { name: "Close menu" }).waitFor({ timeout: 5_000 }).then(() => true, () => false));
await m.waitForTimeout(600); await shot("m-d-02-drawer", m);
await m.getByRole("link", { name: "Link management" }).click();
check("links show as cards", (await m.getByRole("link", { name: /Ghana Web3 Conference Ticket/ }).first().waitFor({ timeout: 15_000 }).then(() => true, () => false)) && !(await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
await m.waitForTimeout(800); await shot("m-d-03-links", m);
await m.getByRole("link", { name: /Ghana Web3 Conference Ticket/ }).first().click();
await sees("Payment information", 15_000, m);
check("details fit a phone", !(await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
await m.waitForTimeout(800); await m.screenshot({ path: `${SHOTS}m-d-04-details.png`, fullPage: true });

console.log("\nSign out");
// The development server's overlay badge can sit over the account menu; it is not part of the app.
await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((node) => node.remove()));
await page.getByRole("button", { name: /Ama Boateng/ }).click();
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(/\/login/, { timeout: 15_000 }).catch(() => {});
check("signing out returns to the login page", page.url().includes("/login"));
check("no browser errors", errors.length === 0, errors.join(" | "));

await browser.close();
console.log(`\n${failures === 0 ? "ALL PASSED" : `${failures} FAILED`}  (screenshots in ${SHOTS})`);
process.exit(failures === 0 ? 0 : 1);
