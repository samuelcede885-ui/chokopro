// Actualiza rate.json con la tasa oficial del euro del BCV (bolívares por euro).
// Uso: node scripts/update-rate.mjs   (Node 18 o superior)
// Fuente principal: DolarApi; respaldo: la portada del BCV.
import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../rate.json", import.meta.url);

async function fromDolarApi() {
  const res = await fetch("https://ve.dolarapi.com/v1/euros/oficial", { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`DolarApi respondió ${res.status}`);
  const j = await res.json();
  const rate = Number(j.promedio ?? j.venta ?? j.compra);
  const date = (j.fechaActualizacion || "").slice(0, 10);
  return { rate, date, via: "ve.dolarapi.com" };
}

async function fromBcv() {
  const res = await fetch("https://www.bcv.org.ve/", { headers: { "user-agent": "Mozilla/5.0 tienda-rate-bot" } });
  if (!res.ok) throw new Error(`BCV respondió ${res.status}`);
  const html = await res.text();
  const block = html.match(/id="euro"[\s\S]*?<strong>\s*([\d.,]+)\s*<\/strong>/);
  if (!block) throw new Error("No encontré la tasa del euro en la página del BCV");
  const rate = Number(block[1].replace(/\./g, "").replace(",", "."));
  const fecha = html.match(/Fecha Valor:[\s\S]*?content="([^"]+)"/);
  return { rate, date: fecha ? fecha[1].slice(0, 10) : new Date().toISOString().slice(0, 10), via: "bcv.org.ve" };
}

const valid = (r) => r && Number.isFinite(r.rate) && r.rate > 1 && /^\d{4}-\d{2}-\d{2}$/.test(r.date);

let result, errors = [];
for (const source of [fromDolarApi, fromBcv]) {
  try {
    const r = await source();
    if (valid(r)) { result = r; break; }
    errors.push(`${source.name}: respuesta inválida ${JSON.stringify(r)}`);
  } catch (e) {
    errors.push(`${source.name}: ${e.message}`);
  }
}

if (!result) {
  console.error("No se pudo obtener la tasa:\n" + errors.join("\n"));
  process.exit(1);
}

const current = JSON.parse(await readFile(FILE, "utf8"));
const next = { currency: "EUR", source: "BCV", rate: Math.round(result.rate * 10000) / 10000, date: result.date, fetchedAt: new Date().toISOString(), via: result.via };
if (current.rate === next.rate && current.date === next.date) {
  console.log(`Sin cambios: ${next.rate} Bs/€ (${next.date})`);
} else {
  await writeFile(FILE, JSON.stringify(next, null, 2) + "\n");
  console.log(`Tasa actualizada: ${next.rate} Bs/€ (${next.date}) vía ${next.via}`);
}
