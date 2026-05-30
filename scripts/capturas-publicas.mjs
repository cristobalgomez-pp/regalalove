// Captura solo pantallas públicas (sin sesión) a 390px. No escribe en la DB.
//   node scripts/capturas-publicas.mjs after <slug-mesa-existente>
import { chromium, devices } from "playwright";

const BASE = "http://localhost:3000";
const TAG = process.argv[2] || "after";
const SLUG = process.argv[3] || "";

const rutas = [
  ["home", "/"],
  ["login", "/login"],
  ["registro", "/registro"],
  ["regalar", "/regalar"],
];
if (SLUG) {
  rutas.push(["mesa-publica", `/${SLUG}`]);
  rutas.push(["aportar", `/${SLUG}/aportar`]);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();

for (const [nombre, ruta] of rutas) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/movil-${TAG}-${nombre}.png`, fullPage: true });
  console.log(`ok ${nombre}`);
}

await browser.close();
console.log("listo");
