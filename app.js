// Tienda de una página: portada, producto, carrito, datos del pedido y confirmación.
// Los datos del negocio (WhatsApp, envío, pagos, catálogo) están en config.js.

const ICONS = {
  frame: '<circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 13h3M2.5 12 1 9M21.5 12 23 9"/>',
  lens: '<circle cx="12" cy="12" r="8"/><path d="M8 9.5a4.5 4.5 0 0 1 4-2.5"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/><path d="M10 7.5h4M10 10.5h4"/>',
  wallet: '<path d="M7 7.5 15.5 4l1.3 3.5"/><rect x="7.5" y="5.5" width="10" height="5" rx=".8" transform="rotate(-12 12.5 8)"/><rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M21 12h-4a2 2 0 0 0 0 4h4"/>',
  binance: '<path d="M12 3.5 14.4 6 12 8.4 9.6 6zM6 9.6 8.4 12 6 14.4 3.6 12zM18 9.6 20.4 12 18 14.4 15.6 12zM12 15.6l2.4 2.4-2.4 2.5-2.4-2.5zM12 9.6l2.4 2.4-2.4 2.4L9.6 12z"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>',
  wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1-.4-2.4-1.8-2.8-2.8l.9-1-1-2z"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 8v5M8 10.5h5"/>',
};

const SLIDES = [
  { product: "lentes", option: "ambar", head: ["Tu Vista,", "Tu Estilo"], wide: true },
  { product: "gafas", option: "negro", head: ["Sol con", "Estilo"], wide: true },
  { product: "lentes", option: "azul", head: ["Tu Vista,", "Tu Estilo"], wide: true },
];

const PAYMENT_METHODS = [
  { id: "pagoMovil", label: "Pago Móvil", icon: "phone" },
  { id: "binance", label: "Binance", icon: "binance" },
  { id: "efectivo", label: "Efectivo", icon: "wallet" },
];

// Estados de un pedido. Sin backend, la tienda solo puede llegar a "sent";
// el resto lo asigna el comercio cuando exista el panel de pedidos.
const ORDER_STATUS = {
  draft: "Por enviar a la tienda",
  sent: "Enviado · esperando confirmación de la tienda",
  pending_payment: "Pendiente de pago",
  payment_under_review: "Pago en verificación",
  paid: "Pagado",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const app = document.getElementById("app");
const money = (n) => "$" + n.toFixed(2);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const svg = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const optionOf = (p, id) => p.options.find((o) => o.id === id) || p.options[0];
const findOption = (p, id) => p.options.find((o) => o.id === id);
const defaultOpt = (p) => (p.options.find((o) => o.id === p.defaultOption && o.available) || p.options.find((o) => o.available) || p.options[0]).id;
const variantText = (p, o) => `${p.optionPrefix} ${o.label}`;
const pic = (o, alt, extra = "") => `<img src="${o.img}" width="${o.w}" height="${o.h}" alt="${esc(alt)}" ${extra}>`;

// WhatsApp válido: solo dígitos, 10 a 15 con código de país.
const WA = /^\d{10,15}$/.test(STORE.whatsapp || "") ? STORE.whatsapp : "";
const waDisplay = WA ? "+" + WA.replace(/^(\d{2})(\d{3})(\d+)$/, "$1 $2-$3") : "";

// Analítica sin datos personales: deja eventos en window.dataLayer para conectar después.
window.dataLayer = window.dataLayer || [];
const track = (event, data = {}) => window.dataLayer.push({ event, ...data });

// ---------- Estado guardado en este navegador ----------
const KEYS = { cart: "tienda-cart", form: "tienda-checkout", orders: "tienda-orders", rate: "tienda-rate" };
const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---------- Bolívares a tasa euro BCV ----------
// Monto en Bs = precio en dólares × tasa oficial del euro (STORE.bolivares en config.js).
const BS = STORE.bolivares || {};
const bsFmt = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bsMoney = (usd, r) => "Bs. " + bsFmt.format(Math.round(usd * r.rate * 100) / 100);
const dateFmt = (d) => d.split("-").reverse().join("/");
let rate = null;

// Una tasa sirve si es un número positivo con fecha y no tiene más de maxAgeDays días.
function freshRate(r) {
  if (!r || !(Number(r.rate) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(r.date || "")) return null;
  const age = (Date.now() - Date.parse(r.date + "T12:00:00-04:00")) / 864e5;
  return age <= (BS.maxAgeDays ?? 4) ? { rate: Number(r.rate), date: r.date } : null;
}

// Lugar para un monto en Bs; paintBs() lo llena. rateOverride fija la tasa (pedidos ya creados).
function bsTag(usd, cls = "bs", rateOverride) {
  const fixed = rateOverride ? `data-rate="${rateOverride.rate}" data-date="${rateOverride.date}"` : "";
  return `<span class="${cls}" data-bs="${usd}" ${fixed} hidden></span>`;
}
function bsNote(rateOverride) {
  const fixed = rateOverride ? `data-rate="${rateOverride.rate}" data-date="${rateOverride.date}"` : "";
  return `<p class="note bs-note" data-bs-note ${fixed} hidden></p>`;
}

function paintBs() {
  const pick = (el) => (el.dataset.rate ? { rate: Number(el.dataset.rate), date: el.dataset.date } : rate);
  document.querySelectorAll("[data-bs]").forEach((el) => {
    const r = pick(el);
    const text = r ? bsMoney(Number(el.dataset.bs), r) : "";
    if (el.textContent !== text) el.textContent = text;
    if (el.hidden !== !r) el.hidden = !r;
    const row = el.closest("[data-bs-row]");
    if (row && row.hidden !== !r) row.hidden = !r;
  });
  document.querySelectorAll("[data-bs-note]").forEach((el) => {
    const r = pick(el);
    const text = r ? `Tasa euro BCV del ${dateFmt(r.date)}: Bs. ${bsFmt.format(r.rate)} por cada $1. El monto final en bolívares se calcula con la tasa del día en que pagues.` : "";
    if (el.textContent !== text) el.textContent = text;
    if (el.hidden !== !r) el.hidden = !r;
  });
}

async function loadRate() {
  if (!BS.enabled) return;
  const cached = freshRate(load(KEYS.rate, null));
  if (cached) { rate = cached; paintBs(); }
  const found = [];
  try {
    const res = await fetch(BS.rateFile, { cache: "no-cache" });
    if (res.ok) found.push(await res.json());
  } catch (e) {}
  // Consulta directa: funciona donde la página puede llamar a la API (no dentro de un artifact de Claude).
  if (BS.liveUrl) {
    try {
      const res = await fetch(BS.liveUrl);
      if (res.ok) {
        const j = await res.json();
        found.push({ rate: Number(j.promedio ?? j.venta ?? j.compra), date: (j.fechaActualizacion || "").slice(0, 10) });
      }
    } catch (e) {}
  }
  const best = found.map(freshRate).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (best) { rate = best; store(KEYS.rate, best); }
  else if (!cached) rate = null;
  paintBs();
}

let cart = sanitizeCart(load(KEYS.cart, {}).items);
let form = Object.assign({ name: "", phone: "", city: "", address: "", ref: "", zone: "", payment: "", payRef: "" }, load(KEYS.form, {}));
let orders = load(KEYS.orders, []);
if (!Array.isArray(orders)) orders = [];

function sanitizeCart(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((l) => l && CATALOG[l.product] && findOption(CATALOG[l.product], l.option))
    .map((l) => ({ product: l.product, option: l.option, qty: Math.min(STORE.maxQtyPerLine, Math.max(1, parseInt(l.qty, 10) || 1)) }));
}

function saveCart() {
  store(KEYS.cart, { items: cart });
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const badge = document.querySelector(".badge");
  badge.textContent = count;
  badge.hidden = count === 0;
  document.querySelector(".cart-link").setAttribute("aria-label", count ? `Carrito, ${count} artículos` : "Carrito vacío");
}
const saveForm = () => store(KEYS.form, form);
const saveOrders = () => store(KEYS.orders, orders.slice(-20));

function addToCart(product, option, qty) {
  const line = cart.find((l) => l.product === product && l.option === option);
  const before = line ? line.qty : 0;
  const after = Math.min(STORE.maxQtyPerLine, before + qty);
  if (line) line.qty = after;
  else cart.push({ product, option, qty: after });
  saveCart();
  return after - before;
}

// Totales: el envío solo suma cuando hay una zona con tarifa configurada.
function totals() {
  const subtotal = cart.reduce((s, l) => s + CATALOG[l.product].price * l.qty, 0);
  const zone = STORE.shipping.zones.find((z) => z.id === form.zone);
  const shipping = zone ? zone.fee : null;
  return { subtotal, shipping, total: subtotal + (shipping || 0), shippingKnown: shipping !== null, zone };
}

// ---------- Aviso con acción opcional ----------
let toastTimer;
function toast(msg, action) {
  const t = document.querySelector(".toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ""}`;
  if (action) t.querySelector("button").addEventListener("click", () => { action.run(); t.classList.remove("show"); });
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 6000 : 2600);
}

function setMeta(title, description) {
  document.title = title ? `${title} · Tienda` : "Tienda";
  if (description) document.querySelector('meta[name="description"]').setAttribute("content", description);
}

// ---------- Portada ----------
let slideIndex = 1;
let slideTimer;

function renderHome() {
  const s = SLIDES[slideIndex];
  const p = CATALOG[s.product];
  const o = optionOf(p, s.option);
  setMeta("", "Lentes blue light y gafas de sol en Caracas. Pedidos por WhatsApp.");
  app.innerHTML = `
    <section class="hero">
      <div class="swap">
        <h1 class="headline"><span class="w">${s.head[0]}</span><span class="i">${s.head[1]}</span></h1>
        <a class="btn" href="#/producto/${p.id}/${o.id}">Order now ${arrow}</a>
        <div class="dots" role="group" aria-label="Productos destacados">
          ${SLIDES.map((x, i) => `<button type="button" data-slide="${i}" aria-label="Destacado ${i + 1}: ${esc(CATALOG[x.product].name)}" aria-current="${i === slideIndex}"></button>`).join("")}
        </div>
      </div>
      <a class="stage ${s.wide ? "wide" : ""}" href="#/producto/${p.id}/${o.id}" aria-label="Ver ${esc(p.name)}">
        ${pic(o, `${p.name}, ${variantText(p, o)}`, 'class="swap" fetchpriority="high"')}
      </a>
      <ul class="features swap">
        ${p.features.map(([ic, a, b]) => `<li>${svg(ic)}<div><small>${a}</small><b>${b}</b></div></li>`).join("")}
      </ul>
    </section>
    ${productsSection()}
    ${howSection()}`;
  app.querySelectorAll("[data-slide]").forEach((b) =>
    b.addEventListener("click", () => { slideIndex = +b.dataset.slide; renderHome(); app.querySelector(`[data-slide="${slideIndex}"]`).focus(); })
  );
  bindCopy();
  clearInterval(slideTimer);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    slideTimer = setInterval(() => {
      if (document.hidden || !app.querySelector(".hero") || scrollY > innerHeight * 0.5 || app.contains(document.activeElement)) return;
      slideIndex = (slideIndex + 1) % SLIDES.length;
      renderHome();
    }, 7000);
  }
}

function productsSection(filter = "") {
  const q = filter.trim().toLowerCase();
  const cards = Object.values(CATALOG)
    .flatMap((p) => p.options.map((o) => [p, o]))
    .filter(([p, o]) => !q || `${p.name} ${p.brand} ${o.label}`.toLowerCase().includes(q));
  return `
    <section class="section" id="productos" aria-labelledby="productos-h">
      <h2 id="productos-h">Nuestros <span>productos</span></h2>
      <div class="grid">
        ${cards.length ? cards.map(([p, o]) => {
          const soldOut = !o.available;
          return `
          <a class="card" href="#/producto/${p.id}/${o.id}">
            <div class="pic">${pic(o, `${p.name}, ${variantText(p, o)}`, 'loading="lazy" decoding="async"')}</div>
            <div class="row"><h3>${p.short || p.name}</h3><span class="price">${money(p.price)}</span></div>
            <span class="meta">${variantText(p, o)}${soldOut ? " · Agotado" : ""}</span>
            ${bsTag(p.price, "bs meta")}
          </a>`;
        }).join("") : `<p class="empty">No encontramos productos para “${esc(filter)}”. <a href="#/productos">Ver todos</a></p>`}
      </div>
    </section>`;
}

function contactLine() {
  return WA
    ? `<span class="wa-num" id="wa-num">${waDisplay}</span>
       <button type="button" class="link-btn" data-copy="${waDisplay}">Copiar número</button>
       <a class="link-btn" href="https://wa.me/${WA}" target="_blank" rel="noopener">Abrir WhatsApp</a>`
    : `<span>El número de WhatsApp aún no está configurado.</span>`;
}

function howSection() {
  const pol = STORE.policies;
  const items = [
    ["Cambios y devoluciones", pol.changes],
    ["Tiempos de entrega", pol.deliveryTimes],
    ["Privacidad", pol.privacy],
  ].filter(([, t]) => t);
  return `
    <section class="section how" id="como-comprar" aria-labelledby="how-h">
      <h2 id="how-h">Cómo <span>comprar</span></h2>
      <ol class="steps">
        <li><b>Arma tu pedido</b><span>Elige el producto, el color y la cantidad.</span></li>
        <li><b>Envíalo por WhatsApp</b><span>Te damos una referencia de pedido y el mensaje listo para enviar.</span></li>
        <li><b>Confirmamos</b><span>Disponibilidad, costo de envío y datos de pago, antes de que pagues.</span></li>
        <li><b>Pagas y despachamos</b><span>Verificamos tu pago a mano y luego coordinamos la entrega.</span></li>
      </ol>
      <div class="contact" id="contacto-info">
        <p class="opt-label">Contacto</p>
        <p class="contact-row">${contactLine()}</p>
        <p class="note">Precios en dólares (USD). ${STORE.city}.</p>
      </div>
      ${items.length ? `<div class="policies">${items.map(([h, t]) => `<details><summary>${h}</summary><p>${esc(t)}</p></details>`).join("")}</div>` : ""}
    </section>`;
}

// ---------- Ficha de producto ----------
// Cada unidad tiene su propio color: dos pares pueden ser ámbar y azul.
function renderProduct(id, optId) {
  const p = CATALOG[id];
  if (!p) return go("#/");
  let units = [(findOption(p, optId) || optionOf(p, defaultOpt(p))).id];
  let shown = units[0];
  setMeta(p.name, `${p.name} — ${money(p.price)}. ${p.description}`);
  track("view_item", { item: p.id, variant: shown });
  app.innerHTML = `
    <section class="detail">
      <div class="stage">
        <button type="button" class="zoom-btn" id="zoom" aria-label="Ampliar foto">
          ${pic(optionOf(p, shown), `${p.name}, ${variantText(p, optionOf(p, shown))}`, 'class="swap" id="pimg"')}
          <span class="zoom-hint">${svg("zoom")}Ampliar</span>
        </button>
      </div>
      <div class="panel">
        <p class="brand">${p.brand}</p>
        <h1 class="name">${p.name}</h1>
        <p class="price-big">${money(p.price)}</p>
        ${bsTag(p.price, "bs bs-big")}
        ${bsNote()}
        <p class="pay-note">Pagas con Pago Móvil, Binance o efectivo, después de que confirmemos tu pedido.</p>
        <div class="buy-row">
          <p class="opt-label" id="qty-label">Cantidad</p>
          <div class="stepper" role="group" aria-labelledby="qty-label">
            <button type="button" data-q="-1" aria-label="Quitar uno">−</button>
            <output aria-live="polite">1</output>
            <button type="button" data-q="1" aria-label="Agregar uno">+</button>
          </div>
        </div>
        <div id="units"></div>
        <p class="sold-msg" id="sold-msg" role="status"></p>
        <div class="desc"><h2>Descripción</h2><p>${p.description}</p></div>
        <div class="actions">
          <button type="button" class="btn btn-ink" id="add">Agregar al carrito ${arrow}</button>
          <a class="link-btn" href="#/productos">Seguir comprando</a>
        </div>
      </div>
    </section>`;

  const img = app.querySelector("#pimg");
  const add = app.querySelector("#add");
  const sold = app.querySelector("#sold-msg");
  const out = app.querySelector("output");
  const box = app.querySelector("#units");

  const showPhoto = (optionId) => {
    const o = optionOf(p, optionId);
    shown = o.id;
    if (!img.src.endsWith(o.img)) { img.src = o.img; img.width = o.w; img.height = o.h; img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap"); }
    img.alt = `${p.name}, ${variantText(p, o)}`;
    history.replaceState(null, "", `#/producto/${p.id}/${o.id}`);
  };
  const drawUnits = () => {
    out.textContent = units.length;
    box.innerHTML = unitPickers(p, units, "u");
    const bad = units.map((u) => optionOf(p, u)).filter((o) => !o.available);
    add.disabled = bad.length > 0;
    sold.textContent = bad.length ? `${variantText(p, bad[0])} está agotado. Elige otra opción.` : "";
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-opt]");
    if (!b || b.hasAttribute("data-soldout")) return;
    const k = +b.dataset.unit;
    units[k] = b.dataset.opt;
    drawUnits();
    showPhoto(units[k]);
    box.querySelector(`[data-unit="${k}"][data-opt="${units[k]}"]`)?.focus();
  });
  app.querySelectorAll("[data-q]").forEach((b) =>
    b.addEventListener("click", () => {
      if (+b.dataset.q > 0 && units.length < STORE.maxQtyPerLine) units.push(units[units.length - 1]);
      if (+b.dataset.q < 0 && units.length > 1) units.pop();
      drawUnits();
    })
  );
  drawUnits();

  add.addEventListener("click", () => {
    if (units.some((u) => !optionOf(p, u).available)) return;
    const counts = {};
    units.forEach((u) => { counts[u] = (counts[u] || 0) + 1; });
    let added = 0;
    for (const [opt, n] of Object.entries(counts)) added += addToCart(p.id, opt, n);
    track("add_to_cart", { item: p.id, variants: Object.keys(counts).join(","), qty: added });
    if (!added) return toast(`Ya tienes el máximo de ${STORE.maxQtyPerLine} unidades por opción.`);
    const labels = Object.keys(counts).map((o) => optionOf(p, o).label).join(", ");
    toast(`${added} × ${p.short || p.name} (${labels}) en tu carrito`, { label: "Ver carrito", run: () => go("#/carrito") });
  });
  app.querySelector("#zoom").addEventListener("click", () => openZoom(optionOf(p, shown), p));
}

// Un selector por unidad. Con una sola unidad se ve como un selector normal.
function unitPickers(p, units, scope) {
  if (p.options.length === 1) return "";
  if (units.length === 1) {
    return `<p class="opt-label" id="${scope}-0-label">${p.optionLabel}</p>
      <div class="chips" role="group" aria-labelledby="${scope}-0-label">${p.options.map((o) => chip(o, o.id === units[0], 0)).join("")}</div>`;
  }
  return `<p class="opt-label">${p.optionLabel} de cada ${p.unitLabel.toLowerCase()}</p>
    <div class="units">${units.map((u, k) => `
      <div class="unit">
        <span class="unit-label" id="${scope}-${k}-label">${p.unitLabel} ${k + 1}</span>
        <div class="chips" role="group" aria-labelledby="${scope}-${k}-label">${p.options.map((o) => chip(o, o.id === u, k)).join("")}</div>
      </div>`).join("")}
    </div>`;
}

function chip(o, pressed, unit) {
  const sw = o.swatch ? `<span class="sw" style="background:${o.swatch}"></span>` : "";
  const mark = `<span class="chip-check">${svg("check")}</span>`;
  return `<button type="button" class="chip" data-opt="${o.id}" data-unit="${unit}" aria-pressed="${pressed}" ${o.available ? "" : 'aria-disabled="true" data-soldout'}>${mark}${sw}${o.label}${o.available ? "" : '<span class="sr"> (agotado)</span>'}</button>`;
}

function openZoom(o, p) {
  const d = document.getElementById("zoom-dialog");
  d.querySelector("img").replaceWith(Object.assign(document.createElement("img"), { src: o.img, alt: `${p.name}, ${variantText(p, o)}`, width: o.w, height: o.h }));
  d.showModal();
}

// ---------- Carrito ----------
// El carrito guarda líneas por opción ({product, option, qty}) y se muestra agrupado
// por producto, con un selector por unidad.
const productIds = () => [...new Set(cart.map((l) => l.product))];
const unitsOf = (pid) => cart.filter((l) => l.product === pid).flatMap((l) => Array(l.qty).fill(l.option));

function moveUnit(pid, from, to) {
  if (from === to) return;
  const src = cart.find((l) => l.product === pid && l.option === from);
  const dst = cart.find((l) => l.product === pid && l.option === to);
  if (!src) return;
  if (dst) {
    if (dst.qty >= STORE.maxQtyPerLine) return toast(`Máximo ${STORE.maxQtyPerLine} unidades por opción.`);
    dst.qty++;
    src.qty--;
    if (!src.qty) cart.splice(cart.indexOf(src), 1);
  } else if (src.qty === 1) {
    src.option = to;
  } else {
    src.qty--;
    cart.splice(cart.indexOf(src) + 1, 0, { product: pid, option: to, qty: 1 });
  }
}

function renderCart() {
  setMeta("Carrito");
  if (!cart.length) {
    app.innerHTML = `<section class="cart"><div><h1 class="tag">CARRITO</h1>
      <p class="empty">Tu carrito está vacío. <a href="#/productos">Ver productos</a></p></div></section>`;
    return;
  }
  const t = totals();
  const blocked = cart.some((l) => !findOption(CATALOG[l.product], l.option).available);
  app.innerHTML = `
    <section class="cart">
      <div>
        <h1 class="tag">CARRITO</h1>
        ${productIds().map((pid) => {
          const p = CATALOG[pid];
          const units = unitsOf(pid);
          const soldOut = [...new Set(units)].map((u) => findOption(p, u)).filter((o) => !o.available);
          return `<div class="line" data-product="${pid}">
            <div class="line-head">
              <button type="button" class="qbtn" data-product="${pid}" data-q="-1" aria-label="Quitar un ${esc(p.unitLabel.toLowerCase())}">−</button>
              <span>${units.length} ${p.short || p.name}</span>
              <button type="button" class="qbtn" data-product="${pid}" data-q="1" aria-label="Agregar un ${esc(p.unitLabel.toLowerCase())}">+</button>
              <button type="button" class="rm" data-rm="${pid}">Quitar</button>
            </div>
            ${unitPickers(p, units, `c-${pid}`)}
            ${soldOut.map((o) => `<p class="sold-msg">${variantText(p, o)} se agotó. Cámbialo o quita esa unidad.</p>`).join("")}
          </div>`;
        }).join("")}
        <a class="link-btn" href="#/productos">Seguir comprando</a>
      </div>
      ${summaryCard(t, `
        <a class="btn btn-ink ${blocked ? "is-disabled" : ""}" href="#/pedido" id="next" ${blocked ? 'aria-disabled="true"' : ""}>Continuar con pedido ${arrow}</a>
        ${blocked ? '<p class="sold-msg">Hay artículos agotados en tu carrito.</p>' : ""}`)}
    </section>`;

  app.querySelectorAll(".qbtn").forEach((b) =>
    b.addEventListener("click", () => {
      const pid = b.dataset.product;
      const units = unitsOf(pid);
      const last = units[units.length - 1];
      if (+b.dataset.q > 0) {
        if (!addToCart(pid, last, 1)) return toast(`Máximo ${STORE.maxQtyPerLine} unidades por opción.`);
      } else {
        if (units.length === 1) return removeProduct(pid);
        const l = cart.find((x) => x.product === pid && x.option === last);
        l.qty--;
        if (!l.qty) cart.splice(cart.indexOf(l), 1);
        saveCart();
      }
      renderCart();
      app.querySelector(`.qbtn[data-product="${pid}"][data-q="${b.dataset.q}"]`)?.focus();
    })
  );
  app.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => removeProduct(b.dataset.rm)));
  app.querySelectorAll(".line .chip").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.hasAttribute("data-soldout")) return;
      const pid = b.closest(".line").dataset.product;
      const k = +b.dataset.unit;
      moveUnit(pid, unitsOf(pid)[k], b.dataset.opt);
      saveCart(); renderCart();
      app.querySelector(`.line[data-product="${pid}"] [data-unit="${k}"][data-opt="${b.dataset.opt}"]`)?.focus();
    })
  );
  const next = app.querySelector("#next");
  next.addEventListener("click", (e) => { if (blocked) e.preventDefault(); else track("begin_checkout", { items: cart.length }); });
}

function removeProduct(pid) {
  const before = cart.map((l) => ({ ...l }));
  cart = cart.filter((l) => l.product !== pid);
  saveCart(); renderCart();
  const p = CATALOG[pid];
  toast(`Quitaste ${p.short || p.name}`, {
    label: "Deshacer",
    run: () => { cart = before; saveCart(); if (location.hash === "#/carrito") renderCart(); },
  });
}

// bsRate: undefined = tasa actual; null = sin bolívares; objeto = tasa guardada en el pedido.
function summaryCard(t, footer, items = cart, bsRate) {
  const showBs = bsRate !== null;
  return `
    <aside class="summary" aria-label="Resumen del pedido">
      ${items.map((l) => {
        const p = CATALOG[l.product], o = optionOf(p, l.option);
        return `<div class="s-item"><div class="thumb">${pic(o, "", 'loading="lazy"')}</div>
          <div><h2>${l.qty} ${p.name}</h2><p>${variantText(p, o)} · ${money(p.price)} c/u</p></div></div>`;
      }).join("")}
      <div class="totals" aria-live="polite">
        <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div><span>Envío</span><span>${t.shippingKnown ? money(t.shipping) : "Por confirmar"}</span></div>
        <div class="grand"><span>${t.shippingKnown ? "Total" : "Total sin envío"}</span><span>${money(t.total)}</span></div>
        ${showBs ? `<div class="bs-row" data-bs-row hidden><span>${t.shippingKnown ? "Total en bolívares" : "En bolívares, sin envío"}</span>${bsTag(t.total, "", bsRate)}</div>` : ""}
      </div>
      ${showBs ? bsNote(bsRate) : ""}
      ${t.shippingKnown ? "" : '<p class="note">El costo de envío te lo confirmamos por WhatsApp antes de que pagues.</p>'}
      ${footer}
    </aside>`;
}

// ---------- Datos del pedido (checkout) ----------
const FIELDS = [
  { id: "name", label: "Nombre y apellido", auto: "name", min: 3, msg: "Escribe tu nombre y apellido." },
  { id: "phone", label: "Teléfono", auto: "tel", type: "tel", msg: "Escribe un teléfono válido, por ejemplo 0412-1234567.", test: (v) => /^\+?[\d\s().-]{10,18}$/.test(v) && v.replace(/\D/g, "").length >= 10 },
  { id: "address", label: "Dirección", auto: "street-address", min: 8, msg: "Escribe la dirección completa: urbanización, calle y casa o edificio." },
  { id: "city", label: "Ciudad", auto: "address-level2", min: 3, msg: "Escribe la ciudad de entrega." },
  { id: "ref", label: "Punto de referencia (opcional)", optional: true },
];

function renderCheckout() {
  if (!cart.length) return go("#/carrito");
  setMeta("Datos del pedido");
  const t = totals();
  const zones = STORE.shipping.zones;
  const methods = PAYMENT_METHODS.filter((m) => STORE.payments[m.id]?.enabled);
  app.innerHTML = `
    <section class="cart checkout">
      <form id="checkout" novalidate>
        <h1 class="tag">TU PEDIDO</h1>
        <fieldset>
          <legend class="h3">Entrega</legend>
          <div class="form-grid">
            ${FIELDS.map((f) => `
              <div class="f ${f.id === "address" ? "wide" : ""}">
                <label for="f-${f.id}">${f.label}</label>
                <input id="f-${f.id}" name="${f.id}" type="${f.type || "text"}" value="${esc(form[f.id])}" ${f.auto ? `autocomplete="${f.auto}"` : ""} ${f.optional ? "" : 'required aria-required="true"'} maxlength="160" aria-describedby="e-${f.id}">
                <p class="err" id="e-${f.id}"></p>
              </div>`).join("")}
            ${zones.length ? `
              <div class="f wide">
                <label for="f-zone">Zona de entrega</label>
                <select id="f-zone" name="zone" required aria-describedby="e-zone">
                  <option value="">Elige tu zona</option>
                  ${zones.map((z) => `<option value="${esc(z.id)}" ${z.id === form.zone ? "selected" : ""}>${esc(z.label)} — ${money(z.fee)}</option>`).join("")}
                </select>
                <p class="err" id="e-zone"></p>
              </div>` : ""}
          </div>
          ${zones.length ? "" : '<p class="note">Aún no publicamos tarifas por zona: te confirmamos el costo de envío y la cobertura por WhatsApp antes de que pagues.</p>'}
        </fieldset>
        <fieldset>
          <legend class="h3">Método de pago</legend>
          <div class="paycards" role="radiogroup" aria-describedby="e-payment">
            ${methods.map((m) => `
              <label class="paycard pc-${m.id}">
                <input type="radio" name="payment" value="${m.id}" ${form.payment === m.id ? "checked" : ""}>
                <span class="pc-icon">${svg(m.icon)}</span>
                <span class="pc-label">${m.label}</span>
                <span class="pc-check">${svg("check")}<span class="sr">Seleccionado</span></span>
              </label>`).join("")}
          </div>
          <p class="err" id="e-payment"></p>
          <div class="pay-info" id="pay-info" aria-live="polite"></div>
        </fieldset>
      </form>
      ${summaryCard(t, `
        <button type="submit" form="checkout" class="btn btn-ink" id="review">Revisar y enviar pedido ${arrow}</button>
        <a class="link-btn" href="#/carrito">Volver al carrito</a>`)}
    </section>`;

  const f = app.querySelector("#checkout");
  f.addEventListener("input", (e) => {
    const el = e.target;
    if (el.name && el.name in form) { form[el.name] = el.value; saveForm(); }
    if (el.name === "payment") { renderPayInfo(); track("select_payment", { method: el.value }); }
    if (el.getAttribute("aria-invalid") === "true") validateField(el.name);
  });
  f.addEventListener("change", (e) => { if (e.target.name === "zone") { form.zone = e.target.value; saveForm(); renderCheckout(); } });
  f.addEventListener("focusout", (e) => { if (e.target.name && e.target.value) validateField(e.target.name); });
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = [...FIELDS.map((x) => x.id), "zone", "payment"].filter((k) => !validateField(k));
    if (bad.length) {
      const first = app.querySelector(`[name="${bad[0]}"]`);
      first?.focus();
      return toast("Revisa los campos marcados.");
    }
    const order = createOrder();
    go(`#/orden/${order.id}`);
  });
  renderPayInfo();
}

function validateField(name) {
  const errEl = app.querySelector(`#e-${name}`);
  let msg = "";
  if (name === "payment") {
    if (!form.payment) msg = "Elige cómo vas a pagar.";
  } else if (name === "zone") {
    if (!STORE.shipping.zones.length) return true;
    if (!STORE.shipping.zones.some((z) => z.id === form.zone)) msg = "Elige tu zona de entrega.";
  } else {
    const def = FIELDS.find((x) => x.id === name);
    if (!def || def.optional) return true;
    const v = (form[name] || "").trim();
    if (!v || (def.min && v.length < def.min) || (def.test && !def.test(v))) msg = def.msg;
  }
  if (errEl) errEl.textContent = msg;
  const input = app.querySelector(name === "payment" ? ".paycards" : `[name="${name}"]`);
  input?.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

function renderPayInfo() {
  const box = app.querySelector("#pay-info");
  if (!box) return;
  const m = form.payment;
  const cfg = STORE.payments[m];
  if (!m || !cfg) { box.innerHTML = ""; return; }
  let html = "";
  if (m === "pagoMovil") {
    html = cfg.details
      ? `<p>Haz el Pago Móvil a estos datos <b>después</b> de que confirmemos tu pedido y el costo de envío:</p>
         ${pmDetails(cfg.details, totals())}
         <div class="f"><label for="f-payRef">Referencia del pago (si ya pagaste)</label>
         <input id="f-payRef" name="payRef" type="text" inputmode="numeric" maxlength="20" value="${esc(form.payRef)}"></div>
         <p class="note">Tu pago queda <b>pendiente de verificación</b> hasta que lo confirmemos con el banco.</p>`
      : `<p>Te enviamos los datos de Pago Móvil por WhatsApp cuando confirmemos disponibilidad y envío. No pagues antes de esa confirmación.</p>`;
  } else if (m === "binance") {
    const mode = cfg.mode === "binance-pay" ? "Binance Pay" : cfg.mode === "transfer" ? "transferencia desde Binance" : null;
    html = cfg.details && mode
      ? `<p>Aceptamos <b>${mode}</b>. Paga después de que confirmemos tu pedido:</p>
         <dl class="kv">${Object.entries(cfg.details).map(([k, v]) => `<dt>${esc(k === "payId" ? "Pay ID" : k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
         <p class="note">El pago es manual: queda <b>pendiente de verificación</b> hasta que lo revisemos.</p>`
      : `<p>Te indicamos por WhatsApp cómo pagar con Binance y a qué cuenta, después de confirmar tu pedido. No envíes fondos antes de esa confirmación.</p>`;
  } else if (m === "efectivo") {
    html = cfg.terms
      ? `<p>${esc(cfg.terms)}</p>`
      : `<p>Las condiciones del pago en efectivo (entrega o retiro, monto exacto) te las confirmamos por WhatsApp.</p>`;
  }
  box.innerHTML = `<div class="pay-box swap">${html}</div>`;
  bindCopy(box);
}

// Datos de Pago Móvil con botón de copiar y el monto en bolívares (sin envío si aún no se conoce).
function pmDetails(d, t, r) {
  const rows = [["Banco", d.bank, (d.bank.match(/^\d{4}/) || [d.bank])[0]], ["Teléfono", d.phone, d.phone.replace(/\D/g, "")], ["Cédula", d.id, d.id.replace(/\D/g, "")]]
    .filter(([, v]) => v);
  return `<dl class="kv pm">
    ${rows.map(([k, v, c]) => `<dt>${k}</dt><dd><span>${esc(v)}</span><button type="button" class="copy-chip" data-copy="${esc(c)}" data-copy-label="${k} copiado" aria-label="Copiar ${k.toLowerCase()}">Copiar</button></dd>`).join("")}
    <dt>Monto</dt><dd>${money(t.total)}${bsTag(t.total, "bs-inline", r)}${t.shippingKnown ? "" : "<span>+ envío</span>"}</dd>
  </dl>`;
}

// ---------- Pedido ----------
// Sin backend la referencia se genera en este navegador. Repetir el envío con el mismo
// carrito y los mismos datos reutiliza el pedido en lugar de crear uno nuevo.
function fingerprint() {
  return JSON.stringify([cart, form.name, form.phone, form.city, form.address, form.ref, form.zone, form.payment, form.payRef]);
}

function createOrder() {
  const fp = fingerprint();
  const existing = orders.find((o) => o.status === "draft" && o.fp === fp);
  if (existing) return existing;
  const d = new Date();
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(36).padStart(2, "0")).join("").slice(-4).toUpperCase();
  const t = totals();
  const order = {
    id: `PED-${ymd}-${rand}`,
    fp,
    createdAt: d.toISOString(),
    status: "draft",
    items: cart.map((l) => ({ ...l, price: CATALOG[l.product].price })),
    customer: { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), address: form.address.trim(), ref: form.ref.trim() },
    zone: t.zone ? { label: t.zone.label, fee: t.zone.fee } : null,
    payment: form.payment,
    payRef: form.payRef.trim(),
    bs: rate ? { ...rate } : null,
    subtotal: t.subtotal,
    shipping: t.shipping,
    total: t.total,
  };
  orders.push(order);
  saveOrders();
  track("create_order", { items: order.items.length, method: order.payment });
  return order;
}

function orderMessage(o) {
  const method = PAYMENT_METHODS.find((m) => m.id === o.payment)?.label || o.payment;
  const lines = o.items.map((l) => {
    const p = CATALOG[l.product], opt = optionOf(p, l.option);
    return `• ${l.qty} × ${p.name} — ${variantText(p, opt)} — ${money(l.price)} c/u = ${money(l.price * l.qty)}`;
  });
  return [
    `Hola, quiero confirmar este pedido.`,
    `Pedido: ${o.id}`,
    ``,
    ...lines,
    ``,
    `Subtotal: ${money(o.subtotal)}`,
    `Envío: ${o.shipping === null ? "por confirmar" : `${money(o.shipping)} (${o.zone.label})`}`,
    `Total: ${money(o.total)}${o.shipping === null ? " + envío" : ""}`,
    o.bs ? `Total en bolívares: ${bsMoney(o.total, o.bs)}${o.shipping === null ? " + envío" : ""} (tasa euro BCV ${bsFmt.format(o.bs.rate)} del ${dateFmt(o.bs.date)})` : null,
    `Método de pago: ${method}${o.payRef ? ` (referencia ${o.payRef})` : ""}`,
    ``,
    `Nombre: ${o.customer.name}`,
    `Teléfono: ${o.customer.phone}`,
    `Ciudad: ${o.customer.city}`,
    `Dirección: ${o.customer.address}`,
    o.customer.ref ? `Referencia: ${o.customer.ref}` : null,
  ].filter((x) => x !== null).join("\n");
}

function renderOrder(id) {
  const o = orders.find((x) => x.id === id);
  if (!o) {
    app.innerHTML = `<section class="cart"><div><h1 class="tag">PEDIDO</h1>
      <p class="empty">No encontramos ese pedido en este dispositivo. <a href="#/carrito">Ir al carrito</a></p></div></section>`;
    return;
  }
  setMeta(`Pedido ${o.id}`);
  const msg = orderMessage(o);
  const method = PAYMENT_METHODS.find((m) => m.id === o.payment);
  const sent = o.status !== "draft";
  app.innerHTML = `
    <section class="cart order">
      <div>
        <h1 class="tag">PEDIDO</h1>
        <p class="order-id">Referencia <b>${o.id}</b></p>
        <p class="status ${sent ? "is-sent" : ""}" role="status">${ORDER_STATUS[o.status]}</p>
        ${sent ? `
          <p class="lead">Recibirás la confirmación de disponibilidad, envío y datos de pago por WhatsApp. Tu pago no se considera recibido hasta que lo verifiquemos.</p>
          <div class="actions"><a class="btn" href="#/">Volver a la tienda ${arrow}</a></div>` : `
          <p class="lead">Tu pedido todavía no le llegó a la tienda. Envíalo por WhatsApp para que lo confirmemos: el mensaje ya está escrito.</p>
          <div class="actions">
            ${WA ? `<a class="btn btn-ink" id="send" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${svg("wa", "wa-ico")}Enviar por WhatsApp</a>` : ""}
            <button type="button" class="btn" id="copy">Copiar pedido</button>
          </div>
          <p class="note">${WA ? `Si WhatsApp no se abre, copia el pedido y envíalo al <b class="wa-num">${waDisplay}</b>.` : "El WhatsApp de la tienda aún no está configurado: copia el pedido y envíalo por el canal que te indicaron."}</p>
          <div class="confirm-sent">
            <p>¿Ya enviaste el mensaje?</p>
            <button type="button" class="link-btn" id="mark-sent">Sí, ya lo envié</button>
            <a class="link-btn" href="#/pedido">Editar datos</a>
          </div>`}
        ${o.payment === "pagoMovil" && STORE.payments.pagoMovil.details ? `
          <div class="pay-box pm-order">
            <p><b>Datos para tu Pago Móvil.</b> Paga cuando te confirmemos el envío y mándanos la referencia por WhatsApp.</p>
            ${pmDetails(STORE.payments.pagoMovil.details, { total: o.total, shippingKnown: o.shipping !== null }, o.bs || null)}
          </div>` : ""}
        <details class="msg-preview"><summary>Ver el mensaje</summary><pre>${esc(msg)}</pre></details>
      </div>
      ${summaryCard({ subtotal: o.subtotal, shipping: o.shipping, total: o.total, shippingKnown: o.shipping !== null }, `
        <dl class="kv">
          <dt>Método de pago</dt><dd>${method ? method.label : esc(o.payment)}${o.payRef ? ` · ref. ${esc(o.payRef)}` : ""}</dd>
          <dt>Estado del pago</dt><dd>${o.status === "paid" ? "Pagado" : "Pendiente de confirmación"}</dd>
          <dt>Entrega</dt><dd>${esc(o.customer.name)} · ${esc(o.customer.phone)}<br>${esc(o.customer.address)}, ${esc(o.customer.city)}${o.customer.ref ? `<br>Ref.: ${esc(o.customer.ref)}` : ""}</dd>
        </dl>`, o.items, o.bs || null)}
    </section>`;
  bindCopy();
  if (sent) return;
  const markSent = () => {
    if (o.status !== "draft") return;
    o.status = "sent";
    o.sentAt = new Date().toISOString();
    saveOrders();
    // El carrito se vacía solo cuando el cliente confirma que el pedido salió.
    cart = []; saveCart();
    form.payRef = ""; saveForm();
    track("order_sent", { method: o.payment });
    renderOrder(o.id);
  };
  app.querySelector("#mark-sent").addEventListener("click", markSent);
  app.querySelector("#copy").addEventListener("click", (e) => copyText(msg, e.currentTarget, "Pedido copiado"));
}

function copyText(text, btn, done) {
  const ok = () => { toast(done); btn.blur(); };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(ok, () => toast("No pudimos copiar: abre «Ver el mensaje» y cópialo a mano."));
  else toast("No pudimos copiar: abre «Ver el mensaje» y cópialo a mano.");
}

function bindCopy(root = app) {
  root.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.copy, b, b.dataset.copyLabel || "Número copiado")));
}

// ---------- Rutas ----------
let firstRoute = true;
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

function route() {
  const [, view, a, b] = (location.hash || "#/").split("/");
  clearInterval(slideTimer);
  document.querySelectorAll("[data-nav]").forEach((n) => n.removeAttribute("aria-current"));
  const mark = (k) => document.querySelector(`[data-nav="${k}"]`).setAttribute("aria-current", "page");
  if (view === "producto") { renderProduct(a, b); mark("productos"); scrollTo(0, 0); }
  else if (view === "carrito") { renderCart(); scrollTo(0, 0); }
  else if (view === "pedido") { renderCheckout(); scrollTo(0, 0); }
  else if (view === "orden") { renderOrder(a); scrollTo(0, 0); }
  else {
    renderHome();
    if (view === "productos") { mark("productos"); document.getElementById("productos").scrollIntoView(); }
    else if (view === "contacto") { mark("contacto"); document.getElementById("como-comprar").scrollIntoView(); }
    else { mark("inicio"); scrollTo(0, 0); }
  }
  // Al cambiar de vista el foco pasa al contenido; en la primera carga se deja donde está.
  if (!firstRoute) app.focus({ preventScroll: true });
  firstRoute = false;
}

// ---------- Búsqueda ----------
const search = document.querySelector(".search");
const searchInput = search.querySelector("input");
search.querySelector(".search-toggle").addEventListener("click", () => {
  const open = search.classList.toggle("open");
  search.querySelector(".search-toggle").setAttribute("aria-expanded", open);
  if (open) searchInput.focus();
});
search.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value;
  if (!app.querySelector(".hero")) renderHome();
  clearInterval(slideTimer);
  app.querySelector("#productos").outerHTML = productsSection(q);
  app.querySelector("#productos").scrollIntoView();
});

// Otra pestaña cambió el carrito: sincronizar.
addEventListener("storage", (e) => {
  if (e.key === KEYS.cart) { cart = sanitizeCart(load(KEYS.cart, {}).items); saveCart(); if (location.hash === "#/carrito") renderCart(); }
});

document.getElementById("zoom-dialog").addEventListener("click", (e) => {
  if (e.target.id === "zoom-dialog" || e.target.closest(".zoom-close")) e.currentTarget.close();
});

document.getElementById("foot-wa").innerHTML = WA ? ` · WhatsApp <span class="wa-num">${waDisplay}</span>` : "";

// Cada vista nueva recibe los montos en bolívares sin volver a dibujarse.
new MutationObserver(paintBs).observe(app, { childList: true, subtree: true });

addEventListener("hashchange", route);
saveCart();
route();
loadRate();
