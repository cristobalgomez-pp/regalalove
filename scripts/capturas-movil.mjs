// Login a 390px y captura las pantallas clave. Uso:
//   node scripts/capturas-movil.mjs before
//   node scripts/capturas-movil.mjs after
import { chromium, devices } from "playwright";

const BASE = "http://localhost:3000";
const EMAIL = "mobiletest@regalove.test";
const PASSWORD = "Mobile-Test-1234";
const SLUG = "mesa-de-prueba-movil";
const TAG = process.argv[2] || "after";

const rutasPublicas = [
  ["home", "/"],
  ["login", "/login"],
  ["registro", "/registro"],
  ["regalar", "/regalar"],
  ["mesa-publica", `/${SLUG}`],
];
const rutasPrivadas = [
  ["dashboard", "/dashboard"],
  ["crear", "/dashboard/crear"],
  ["crear-rapido", "/dashboard/crear/rapido"],
  ["arma-mesa", `/dashboard/mesa/${SLUG}`],
  ["resumen", `/dashboard/mesa/${SLUG}/resumen`],
  ["recibido", `/dashboard/mesa/${SLUG}/recibido`],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();

async function shot(nombre, ruta) {
  await page.goto(`${BASE}${ruta}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `/tmp/movil-${TAG}-${nombre}.png`, fullPage: true });
  console.log(`ok ${nombre}`);
}

for (const [n, r] of rutasPublicas) await shot(n, r);

// Login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#correo", EMAIL);
await page.fill("#password", PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard**", { timeout: 15000 });

for (const [n, r] of rutasPrivadas) await shot(n, r);

await browser.close();
console.log("listo");
