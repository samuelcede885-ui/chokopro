// Prueba de punta a punta de la tienda: node tests/e2e.cjs [carpeta-de-capturas]
// Levanta un servidor estático propio y recorre los criterios de aceptación con Chromium.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SHOTS = process.argv[2];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp" };

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); };

// Sirve config.js con cambios, para probar agotados y tarifas de envío sin tocar el archivo real.
async function withConfig(page, patch) {
  await page.route("**/config.js", async (route) => {
    let body = fs.readFileSync(path.join(ROOT, "config.js"), "utf8");
    body = patch(body);
    route.fulfill({ status: 200, contentType: "text/javascript", body });
  });
}

async function fillCheckout(page, data = {}) {
  const d = { name: "Ana Pérez", phone: "0412-1234567", city: "Caracas", address: "Los Samanes, calle 3, casa 12", ...data };
  for (const [k, v] of Object.entries(d)) await page.fill(`#f-${k}`, v);
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  const newPage = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    const page = await ctx.newPage();
    // La API en vivo no se usa en las pruebas: la tasa sale de rate.json.
    await page.route("**/ve.dolarapi.com/**", (r) => r.abort());
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text()) && errors.push(m.text()));
    return page;
  };

  // 1. Todas las vistas cargan sin errores.
  let page = await newPage();
  for (const h of ["#/", "#/productos", "#/producto/lentes/ambar", "#/producto/polo/M", "#/carrito", "#/contacto"]) {
    await page.goto(base + h); await page.waitForTimeout(250);
  }
  check("1. Portada, catálogo, producto y carrito cargan sin errores de consola", errors.length === 0, errors.join(" | "));

  // 2. Añadir ambos colores y varias tallas, cambiar cantidades, quitar y deshacer.
  await page.goto(base + "#/producto/lentes/ambar");
  await page.click("#add");
  await page.click('[data-opt="azul"]'); await page.click('[data-q="1"]'); await page.click("#add");
  await page.goto(base + "#/producto/polo/M"); await page.click("#add");
  await page.click('[data-opt="XL"]'); await page.click("#add");
  await page.goto(base + "#/carrito");
  let lines = await page.locator(".line").count();
  const unitRows = await page.locator(".unit").count();
  const badge1 = await page.textContent(".badge");
  await page.click('.qbtn[data-product="lentes"][data-q="1"]');
  const qty0 = await page.textContent('.line[data-product="lentes"] .line-head span');
  await page.click('[data-rm="polo"]');
  const afterRemove = await page.locator(".line").count();
  await page.click(".toast button");
  const afterUndo = await page.locator(".line").count();
  check("2. Ambos colores y dos tallas en el carrito; cantidades, quitar y deshacer", lines === 2 && unitRows === 5 && badge1 === "5" && /^4 /.test(qty0) && afterRemove === 1 && afterUndo === 2,
    `productos=${lines} unidades=${unitRows} badge=${badge1} qty0="${qty0}" quitar=${afterRemove} deshacer=${afterUndo}`);

  // Totales: 2 ámbar + 2 azul (20) + M + XL (120) = 320.
  const subtotal = await page.textContent(".totals div:first-child span:last-child");
  const ship = await page.textContent(".totals div:nth-child(2) span:last-child");
  check("6a. Subtotal correcto y envío «Por confirmar» sin tarifa configurada", subtotal === "$320.00" && ship === "Por confirmar", `${subtotal} / ${ship}`);

  // 3. Recargar conserva el carrito.
  await page.reload(); await page.waitForTimeout(200);
  check("3. Recargar conserva el carrito", (await page.locator(".unit").count()) === 6 && (await page.textContent(".badge")) === "6");

  // 5. Sin datos obligatorios no se crea pedido.
  await page.click("#next");
  await page.waitForSelector("#checkout");
  await page.click("#review");
  const url5 = page.url();
  const errs5 = await page.locator(".err:not(:empty)").count();
  const focused = await page.evaluate(() => document.activeElement.id);
  check("5. Sin datos obligatorios no se crea pedido; errores visibles y foco en el primero", url5.endsWith("#/pedido") && errs5 >= 5 && focused === "f-name", `errores=${errs5} foco=${focused}`);
  await fillCheckout(page, { phone: "123" });
  await page.click('label.pc-pagoMovil');
  await page.click("#review");
  check("5b. Teléfono inválido bloquea el pedido", page.url().endsWith("#/pedido") && /teléfono válido/.test(await page.textContent("#e-phone")));

  // 15. Los datos escritos sobreviven a una recarga.
  await page.reload(); await page.waitForTimeout(200);
  check("15. Los datos del formulario no se pierden al recargar", (await page.inputValue("#f-address")) === "Los Samanes, calle 3, casa 12");

  // 7. Cada método muestra instrucciones honestas.
  const info = {};
  for (const m of ["pagoMovil", "binance", "efectivo"]) {
    await page.click(`label.pc-${m}`);
    info[m] = await page.textContent("#pay-info");
  }
  check("7. Cada método de pago se puede elegir y muestra sus instrucciones",
    /0171 Banco Activo/.test(info.pagoMovil) && /0412-3307641/.test(info.pagoMovil) && /33\.972\.869/.test(info.pagoMovil) && /pendiente de verificación/.test(info.pagoMovil) && /Binance/.test(info.binance) && /efectivo/i.test(info.efectivo), JSON.stringify(info).slice(0, 160));

  // 9. Doble clic no duplica pedidos.
  await fillCheckout(page);
  await page.click("label.pc-binance");
  await page.dblclick("#review");
  await page.waitForSelector(".order-id");
  const id1 = await page.textContent(".order-id b");
  await page.goto(base + "#/pedido"); await page.click("#review"); await page.waitForSelector(".order-id");
  const id2 = await page.textContent(".order-id b");
  const nOrders = await page.evaluate(() => JSON.parse(localStorage.getItem("tienda-orders")).length);
  check("9. Clic repetido o reenvío con los mismos datos no duplica el pedido", id1 === id2 && nOrders === 1, `${id1} / ${id2} / pedidos=${nOrders}`);

  // Mensaje de WhatsApp completo.
  const href = await page.getAttribute("#send", "href");
  const msg = decodeURIComponent(href.split("text=")[1]);
  check("3.2 Mensaje de WhatsApp con número, pedido, variantes, totales, método y dirección",
    href.startsWith("https://wa.me/584123307641?") && msg.includes(id1) && msg.includes("Cristal Ámbar") && msg.includes("Talla XL") &&
    msg.includes("Total: $320.00 + envío") && msg.includes("Método de pago: Binance") && msg.includes("Los Samanes"), msg.split("\n").slice(0, 3).join(" / "));

  // 8. Nada marca el pedido como pagado; el carrito sigue lleno hasta confirmar el envío.
  const st = await page.textContent(".status");
  const cartBefore = await page.textContent(".badge");
  await page.click("#mark-sent");
  const st2 = await page.textContent(".status");
  const cartAfter = await page.isHidden(".badge");
  const paid = await page.evaluate(() => JSON.parse(localStorage.getItem("tienda-orders")).some((o) => o.status === "paid"));
  check("8. El pedido nunca pasa a «pagado» solo; el carrito se vacía al confirmar el envío",
    /Por enviar/.test(st) && cartBefore === "6" && /esperando confirmación/.test(st2) && cartAfter && !paid, `${st} → ${st2}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/orden-desk.png` });

  // 2b. Dos suéteres con tallas distintas, y cambio de talla por unidad en el carrito.
  page = await newPage();
  await page.goto(base + "#/producto/polo/L");
  await page.click('[data-q="1"]');
  const rows2 = await page.locator(".unit").count();
  await page.click('[data-unit="0"][data-opt="S"]');
  await page.click('[data-unit="1"][data-opt="M"]');
  await page.click("#add");
  const cartOf = () => page.evaluate(() => JSON.parse(localStorage.getItem("tienda-cart")).items.map((l) => `${l.option}${l.qty}`).join(" "));
  const c1 = await cartOf();
  await page.goto(base + "#/carrito");
  await page.click('.line[data-product="polo"] [data-unit="1"][data-opt="L"]');
  const c2 = await cartOf();
  await page.click('.line[data-product="polo"] [data-unit="0"][data-opt="L"]');
  const c3 = await cartOf();
  const sum2 = await page.textContent(".totals div:first-child span:last-child");
  check("2b. Cada suéter con su talla: S + M en la ficha; en el carrito se cambia una unidad sin tocar la otra",
    rows2 === 2 && c1 === "S1 M1" && c2 === "S1 L1" && c3 === "L2" && sum2 === "$240.00", `filas=${rows2} | ${c1} → ${c2} → ${c3} | ${sum2}`);

  // Bolívares: precio en dólares × tasa euro BCV de rate.json; una tasa vieja no se muestra.
  const today = new Date(Date.now() - 4 * 3600e3).toISOString().slice(0, 10);
  const ddmm = today.split("-").reverse().join("/");
  page = await newPage();
  await page.route("**/rate.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ currency: "EUR", source: "BCV", rate: 500, date: today }) }));
  await page.goto(base + "#/producto/polo/L");
  await page.waitForSelector(".bs-big:not([hidden])");
  const bsPolo = await page.textContent(".bs-big");
  await page.click('[data-q="1"]'); await page.click("#add");
  await page.goto(base + "#/carrito");
  const bsCart = await page.textContent(".bs-row span:last-child");
  await page.click("#next");
  await fillCheckout(page); await page.click("label.pc-pagoMovil"); await page.click("#review");
  await page.waitForSelector(".order-id");
  const bsMsg = decodeURIComponent((await page.getAttribute("#send", "href")).split("text=")[1]);
  const pmOrder = await page.textContent(".pm-order");
  check("Bs. Monto en bolívares a tasa euro en ficha, carrito y mensaje de WhatsApp",
    bsPolo === "Bs. 60.000,00" && bsCart === "Bs. 120.000,00" && bsMsg.includes(`Total en bolívares: Bs. 120.000,00 + envío (tasa euro BCV 500,00 del ${ddmm})`) &&
    /0412-3307641/.test(pmOrder) && /Bs\. 120\.000,00/.test(pmOrder),
    `${bsPolo} | ${bsCart} | ${bsMsg.split("\n").find((l) => l.includes("bolívares"))}`);

  page = await newPage();
  const old = new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10);
  await page.route("**/rate.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ rate: 500, date: old }) }));
  await page.goto(base + "#/producto/polo/L"); await page.waitForTimeout(400);
  check("Bs. Una tasa de hace 10 días no se muestra", await page.isHidden(".bs-big"));

  // 4. Variante agotada no se puede comprar; un carrito con ella no avanza.
  page = await newPage();
  await withConfig(page, (b) => b.replace('w: 666, h: 737, available: true,', 'w: 666, h: 737, available: s !== "S",'));
  await page.goto(base + "#/producto/polo/S");
  const disabled = await page.isDisabled("#add");
  const soldTxt = await page.textContent("#sold-msg");
  await page.evaluate(() => localStorage.setItem("tienda-cart", JSON.stringify({ items: [{ product: "polo", option: "S", qty: 1 }] })));
  await page.goto(base + "#/carrito"); await page.reload();
  const blocked = await page.getAttribute("#next", "aria-disabled");
  await page.click("#next", { force: true });
  check("4. Talla agotada: no se puede agregar y bloquea el checkout", disabled && /agotado/.test(soldTxt) && blocked === "true" && page.url().endsWith("#/carrito"), soldTxt);

  // 6b. Con una zona configurada, el envío entra en el total.
  page = await newPage();
  await withConfig(page, (b) => b.replace("zones: [],", 'zones: [{ id: "este", label: "Caracas — Este", fee: 3 }],'));
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("tienda-cart", JSON.stringify({ items: [{ product: "lentes", option: "azul", qty: 2 }] })));
  await page.reload(); await page.goto(base + "#/pedido");
  await fillCheckout(page);
  await page.click("label.pc-efectivo");
  await page.click("#review");
  const zoneErr = await page.textContent("#e-zone");
  await page.selectOption("#f-zone", "este");
  await page.waitForTimeout(100);
  const total6 = await page.textContent(".totals .grand span:last-child");
  check("6b. Con tarifa configurada se exige zona y el total incluye el envío", /zona/.test(zoneErr) && total6 === "$43.00", `${zoneErr} / ${total6}`);

  // 11. Sin desbordamiento horizontal en todos los anchos y vistas.
  const widths = [320, 375, 390, 768, 1024, 1440, 1920];
  const overflow = [];
  for (const w of widths) {
    const p = await newPage({ viewport: { width: w, height: 900 } });
    await p.goto(base);
    await p.evaluate(() => localStorage.setItem("tienda-cart", JSON.stringify({ items: [{ product: "polo", option: "XXL", qty: 3 }, { product: "lentes", option: "ambar", qty: 1 }] })));
    await p.reload();
    for (const h of ["#/", "#/producto/lentes/azul", "#/producto/polo/L", "#/carrito", "#/pedido"]) {
      await p.goto(base + h); await p.waitForTimeout(150);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) overflow.push(`${w}px ${h}: ${sw}`);
      if (SHOTS && (w === 390 || w === 1440)) await p.screenshot({ path: `${SHOTS}/${w}-${h.replace(/[#/]/g, "") || "inicio"}.png`, fullPage: w === 390 });
    }
    await p.context().close();
  }
  check("11. Sin scroll horizontal en 320–1920 px", overflow.length === 0, overflow.join(", "));

  // 12. Teclado y movimiento reducido.
  page = await newPage({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("tienda-cart", JSON.stringify({ items: [{ product: "lentes", option: "azul", qty: 1 }] })));
  await page.reload(); await page.goto(base + "#/pedido");
  await page.focus('input[value="pagoMovil"]');
  await page.keyboard.press("ArrowRight");
  const kb = await page.evaluate(() => document.querySelector('input[name="payment"]:checked')?.value);
  await page.keyboard.press("Tab");
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector(".pc-check")).transitionDuration);
  await page.goto(base + "#/"); await page.reload();
  await page.keyboard.press("Tab");
  const skip = await page.evaluate(() => document.activeElement.className);
  check("12. Pagos operables con flechas, enlace de salto y movimiento reducido", kb === "binance" && skip === "skip" && parseFloat(anim) < 0.001, `teclado=${kb} primerTab=${skip} transición=${anim}`);

  // 13. Sin secretos en el código público.
  const src = ["app.js", "config.js", "index.html"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
  check("13. Sin claves, tokens ni datos bancarios en el código", !/(api[_-]?key|secret|token|password|privateKey)\s*[:=]/i.test(src) && /details: null/.test(src));

  check("Sin errores de consola en toda la prueba", errors.length === 0, errors.join(" | "));

  await browser.close();
  server.close();
  const pass = results.filter((r) => r.ok).length;
  for (const r of results) console.log(`${r.ok ? "PASA " : "FALLA"}  ${r.name}${r.detail && !r.ok ? `\n        ${r.detail}` : r.detail ? `  (${r.detail})` : ""}`);
  console.log(`\n${pass}/${results.length} comprobaciones pasan`);
  process.exit(pass === results.length ? 0 : 1);
})();
