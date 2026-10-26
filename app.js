// Gramercy — tienda de una página: portada, ficha de producto y carrito.

// Número de WhatsApp para recibir pedidos (solo dígitos, con código de país, p. ej. "584121234567").
// Si queda vacío, "Pagar" copia el pedido al portapapeles.
const WHATSAPP = "";

const ICONS = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  moon: '<path d="M14 4a8 8 0 1 0 6 13A7 7 0 0 1 14 4z"/><path d="M17 4h3l-3 3h3M20.5 9h2l-2 2h2"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  diamond: '<path d="M6 4h12l4 5-10 11L2 9z"/><path d="M2 9h20M9 4l3 16 3-16M6 4l3 5M18 4l-3 5"/>',
  thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  feather: '<path d="M20 4C11 4 6 10 6 18"/><path d="M20 4c0 9-6 13-14 14M4 20l2-2M9 13h6M11 9h6"/>',
};

const PRODUCTS = {
  lentes: {
    id: "lentes",
    brand: "Blue Light",
    name: "Lentes Blue Light",
    price: 20,
    optionLabel: "Color",
    options: [
      { id: "ambar", label: "Ámbar", swatch: "#f6a21a", img: "assets/lentes-ambar.png" },
      { id: "azul", label: "Azul", swatch: "#5a8fd6", img: "assets/lentes-azul.png" },
    ],
    description:
      "Montura redonda de acetato negro con cristales que filtran la luz azul de pantallas y luces LED. Ligeros para usarlos toda la jornada frente al computador o el teléfono, y con el estilo suficiente para no quitártelos al salir.",
    features: [
      ["eye", "Bloquea la", "Luz azul"],
      ["monitor", "Reduce el", "Cansancio visual"],
      ["moon", "Mejora la", "Calidad del sueño"],
      ["shield", "Protege tus ojos", "a largo plazo"],
    ],
  },
  polo: {
    id: "polo",
    brand: "Polo Ralph Lauren",
    name: "Quarter Zip Polo Ralph Lauren",
    short: "Quarter Zip Polo",
    price: 120,
    optionLabel: "Tallas",
    options: ["S", "M", "L", "XL", "XXL"].map((s) => ({ id: s, label: s, img: "assets/polo-quarter-zip.png" })),
    defaultOption: "L",
    description:
      "Suéter de punto trenzado en algodón con media cremallera dorada, cuello alto y el pony bordado en rojo sobre el pecho. Abriga sin pesar y combina igual de bien con jeans que con pantalón de vestir.",
    features: [
      ["diamond", "Diseño", "Premium"],
      ["thermo", "Mantiene el", "Calor ideal"],
      ["feather", "Máxima", "Comodidad"],
      ["shield", "Calidad Polo", "de larga duración"],
    ],
  },
};

const SLIDES = [
  { product: "lentes", option: "ambar", head: ["Protege", "Tu Vista"], wide: true },
  { product: "polo", option: "L", head: ["Eleva", "Tu Estilo"] },
  { product: "lentes", option: "azul", head: ["Protege", "Tu Vista"], wide: true },
];

const app = document.getElementById("app");
const money = (n) => "$" + n.toFixed(2);
const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const optionOf = (p, id) => p.options.find((o) => o.id === id) || p.options[0];
const defaultOpt = (p) => p.defaultOption || p.options[0].id;

// ---------- Carrito (se recuerda en este navegador) ----------
let cart = [];
let location_ = "";
try {
  const saved = JSON.parse(localStorage.getItem("gramercy-cart") || "{}");
  cart = Array.isArray(saved.items) ? saved.items.filter((l) => PRODUCTS[l.product]) : [];
  location_ = saved.location || "";
} catch (e) {}

function save() {
  try { localStorage.setItem("gramercy-cart", JSON.stringify({ items: cart, location: location_ })); } catch (e) {}
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const badge = document.querySelector(".badge");
  badge.textContent = count;
  badge.hidden = count === 0;
}

function addToCart(product, option, qty) {
  const line = cart.find((l) => l.product === product && l.option === option);
  if (line) line.qty += qty;
  else cart.push({ product, option, qty });
  save();
}

let toastTimer;
function toast(msg) {
  const t = document.querySelector(".toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

// ---------- Vistas ----------
let slideIndex = 1;
let slideTimer;

function renderHome() {
  const s = SLIDES[slideIndex];
  const p = PRODUCTS[s.product];
  const o = optionOf(p, s.option);
  app.innerHTML = `
    <section class="hero">
      <div class="swap">
        <h1 class="headline"><span class="w">${s.head[0]}</span><span class="i">${s.head[1]}</span></h1>
        <a class="btn" href="#/producto/${p.id}/${o.id}">Order now ${arrow}</a>
        <div class="dots" role="group" aria-label="Destacados">
          ${SLIDES.map((x, i) => `<button type="button" data-slide="${i}" aria-label="Destacado ${i + 1}" aria-current="${i === slideIndex}"></button>`).join("")}
        </div>
      </div>
      <a class="stage ${s.wide ? "wide" : ""}" href="#/producto/${p.id}/${o.id}" aria-label="Ver ${p.name}">
        <img class="swap" src="${o.img}" alt="${p.name}${p.options.length && s.wide ? " " + o.label : ""}">
      </a>
      <ul class="features swap">
        ${p.features.map(([ic, a, b]) => `<li>${svg(ic)}<div><small>${a}</small><b>${b}</b></div></li>`).join("")}
      </ul>
    </section>
    ${productsSection()}`;
  app.querySelectorAll("[data-slide]").forEach((b) =>
    b.addEventListener("click", () => { slideIndex = +b.dataset.slide; renderHome(); })
  );
  clearInterval(slideTimer);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    slideTimer = setInterval(() => {
      if (document.hidden || !app.querySelector(".hero") || scrollY > innerHeight * 0.5) return;
      slideIndex = (slideIndex + 1) % SLIDES.length;
      const y = scrollY;
      renderHome();
      scrollTo(0, y);
    }, 7000);
  }
}

function productsSection(filter = "") {
  const q = filter.trim().toLowerCase();
  const cards = Object.values(PRODUCTS)
    .flatMap((p) => (p.id === "lentes" ? p.options.map((o) => [p, o]) : [[p, optionOf(p, defaultOpt(p))]]))
    .filter(([p, o]) => !q || `${p.name} ${p.brand} ${o.label}`.toLowerCase().includes(q));
  return `
    <section class="section" id="productos">
      <h2>Nuestros <span>productos</span></h2>
      <div class="grid">
        ${cards.length ? cards.map(([p, o]) => `
          <a class="card" href="#/producto/${p.id}/${o.id}">
            <div class="pic"><img src="${o.img}" alt="${p.name}" loading="lazy"></div>
            <div class="row"><h3>${p.short || p.name}</h3><span class="price">${money(p.price)}</span></div>
            <span class="meta">${p.id === "lentes" ? "Cristal " + o.label : "Tallas S a XXL"}</span>
          </a>`).join("") : `<p class="empty">No encontramos “${filter}”.</p>`}
      </div>
    </section>`;
}

function renderProduct(id, optId) {
  const p = PRODUCTS[id];
  if (!p) return go("#/");
  let opt = optionOf(p, optId || defaultOpt(p)).id;
  let qty = 1;
  app.innerHTML = `
    <section class="detail">
      <div class="stage"><img class="swap" id="pimg" src="${optionOf(p, opt).img}" alt="${p.name}"></div>
      <div class="panel">
        <p class="brand">${p.brand}</p>
        <h1 class="name">${p.name}</h1>
        <p class="price-big">${money(p.price)}</p>
        <div class="pay" aria-label="Métodos de pago">
          <span class="pay-chip pm">Pago Móvil</span><span class="pay-chip bn">Binance</span><span class="pay-chip ef">Efectivo</span>
        </div>
        <p class="opt-label">${p.optionLabel}</p>
        <div class="chips" role="group" aria-label="${p.optionLabel}">
          ${p.options.map((o) => `<button type="button" class="chip" data-opt="${o.id}" aria-pressed="${o.id === opt}">${o.swatch ? `<span class="sw" style="background:${o.swatch}"></span>` : ""}${o.label}</button>`).join("")}
        </div>
        <div class="buy-row">
          <p class="opt-label">Cantidad</p>
          <div class="stepper">
            <button type="button" data-q="-1" aria-label="Quitar uno">−</button>
            <output aria-live="polite">1</output>
            <button type="button" data-q="1" aria-label="Agregar uno">+</button>
          </div>
        </div>
        <div class="desc"><h3>Descripción</h3><p>${p.description}</p></div>
        <button type="button" class="btn btn-ink" id="add">Agregar al carrito ${arrow}</button>
      </div>
    </section>`;
  const img = app.querySelector("#pimg");
  app.querySelectorAll("[data-opt]").forEach((b) =>
    b.addEventListener("click", () => {
      opt = b.dataset.opt;
      app.querySelectorAll("[data-opt]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const src = optionOf(p, opt).img;
      if (!img.src.endsWith(src)) { img.src = src; img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap"); }
      history.replaceState(null, "", `#/producto/${p.id}/${opt}`);
    })
  );
  const out = app.querySelector("output");
  app.querySelectorAll("[data-q]").forEach((b) =>
    b.addEventListener("click", () => { qty = Math.min(99, Math.max(1, qty + +b.dataset.q)); out.textContent = qty; })
  );
  app.querySelector("#add").addEventListener("click", () => {
    addToCart(p.id, opt, qty);
    toast(`${qty} × ${p.short || p.name} (${optionOf(p, opt).label}) agregado`);
  });
}

function renderCart() {
  const subtotal = cart.reduce((s, l) => s + PRODUCTS[l.product].price * l.qty, 0);
  if (!cart.length) {
    app.innerHTML = `<section class="cart"><div><span class="tag">CARRITO</span>
      <p class="empty">Tu carrito está vacío. <a href="#/productos">Ver productos</a></p></div></section>`;
    return;
  }
  app.innerHTML = `
    <section class="cart">
      <div>
        <span class="tag">CARRITO</span>
        ${cart.map((l, i) => {
          const p = PRODUCTS[l.product];
          return `<div class="line">
            <div class="line-head">
              <button type="button" class="qbtn" data-line="${i}" data-q="-1" aria-label="Quitar uno">—</button>
              <span>${l.qty} ${p.short || p.name}</span>
              <button type="button" class="qbtn" data-line="${i}" data-q="1" aria-label="Agregar uno">+</button>
              <button type="button" class="rm" data-rm="${i}">Quitar</button>
            </div>
            <p class="h3">${p.optionLabel}</p>
            <div class="chips">
              ${p.options.map((o) => `<button type="button" class="chip" data-line="${i}" data-opt="${o.id}" aria-pressed="${o.id === l.option}">${o.swatch ? `<span class="sw" style="background:${o.swatch}"></span>` : ""}${o.label}</button>`).join("")}
            </div>
          </div>`;
        }).join("")}
        <p class="h3">Ubicación</p>
        <label class="field">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
          <input id="loc" type="text" placeholder="Caracas, Los Samanes" value="${location_.replace(/"/g, "&quot;")}" autocomplete="street-address" aria-label="Ubicación de entrega">
        </label>
      </div>
      <aside class="summary" aria-label="Resumen del pedido">
        ${cart.map((l) => {
          const p = PRODUCTS[l.product], o = optionOf(p, l.option);
          return `<div class="s-item"><div class="thumb"><img src="${o.img}" alt=""></div>
            <div><h4>${l.qty} ${p.name}</h4><p>${p.id === "polo" ? "Talla " : "Cristal "}${o.label}</p></div></div>`;
        }).join("")}
        <div class="totals">
          <div><span>Producto</span><span>${money(subtotal)}</span></div>
          <div class="grand"><span>Total</span><span>${money(subtotal)}</span></div>
        </div>
        <button type="button" class="btn btn-ink" id="pay">Pagar ${money(subtotal)} ${arrow}</button>
      </aside>
    </section>`;

  app.querySelectorAll(".qbtn").forEach((b) =>
    b.addEventListener("click", () => {
      const l = cart[+b.dataset.line];
      l.qty = Math.max(0, l.qty + +b.dataset.q);
      if (!l.qty) cart.splice(+b.dataset.line, 1);
      save(); renderCart();
    })
  );
  app.querySelectorAll("[data-rm]").forEach((b) =>
    b.addEventListener("click", () => { cart.splice(+b.dataset.rm, 1); save(); renderCart(); })
  );
  app.querySelectorAll(".chip[data-line]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = +b.dataset.line, l = cart[i];
      const twin = cart.findIndex((x, j) => j !== i && x.product === l.product && x.option === b.dataset.opt);
      if (twin >= 0) { cart[twin].qty += l.qty; cart.splice(i, 1); } else l.option = b.dataset.opt;
      save(); renderCart();
    })
  );
  const loc = app.querySelector("#loc");
  loc.addEventListener("input", () => { location_ = loc.value; save(); });
  app.querySelector("#pay").addEventListener("click", () => checkout(subtotal, loc));
}

function checkout(total, loc) {
  if (!location_.trim()) { loc.focus(); return toast("Escribe tu ubicación para la entrega"); }
  const lines = cart.map((l) => {
    const p = PRODUCTS[l.product];
    return `• ${l.qty} × ${p.name} — ${p.id === "polo" ? "Talla" : "Cristal"} ${optionOf(p, l.option).label} (${money(p.price * l.qty)})`;
  });
  const msg = `Hola Gramercy, quiero hacer este pedido:\n${lines.join("\n")}\nTotal: ${money(total)}\nUbicación: ${location_.trim()}`;
  if (WHATSAPP) {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(msg).then(() => toast("Pedido copiado. Pégalo en el chat de la tienda."), () => toast("Pedido listo: " + money(total)));
  } else {
    toast("Pedido listo: " + money(total));
  }
}

// ---------- Rutas ----------
function go(hash) { location.hash = hash; }

function route() {
  const [, view, a, b] = (location.hash || "#/").split("/");
  clearInterval(slideTimer);
  document.querySelectorAll("[data-nav]").forEach((n) => n.removeAttribute("aria-current"));
  const mark = (k) => document.querySelector(`[data-nav="${k}"]`).setAttribute("aria-current", "page");
  if (view === "producto") { renderProduct(a, b); mark("productos"); scrollTo(0, 0); }
  else if (view === "carrito") { renderCart(); scrollTo(0, 0); }
  else {
    renderHome();
    if (view === "productos") { mark("productos"); document.getElementById("productos").scrollIntoView(); }
    else if (view === "contacto") { mark("contacto"); document.getElementById("contacto").scrollIntoView(); }
    else { mark("inicio"); scrollTo(0, 0); }
  }
}

// ---------- Búsqueda ----------
const search = document.querySelector(".search");
const searchInput = search.querySelector("input");
search.querySelector(".search-toggle").addEventListener("click", () => {
  search.classList.toggle("open");
  if (search.classList.contains("open")) searchInput.focus();
});
search.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value;
  if (!app.querySelector(".hero")) { clearInterval(slideTimer); renderHome(); }
  clearInterval(slideTimer);
  app.querySelector("#productos").outerHTML = productsSection(q);
  app.querySelector("#productos").scrollIntoView();
});

addEventListener("hashchange", route);
save();
route();
