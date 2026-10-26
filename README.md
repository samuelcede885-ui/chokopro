# chokopro

Tienda online Gramercy: lentes blue light y Quarter Zip Polo Ralph Lauren, con pedidos por WhatsApp.

## Skills de diseño (`.claude/skills/`)

| Carpeta | Origen | Licencia |
|---|---|---|
| `emil-kowalski-design/` | [emilkowalski/skill](https://github.com/emilkowalski/skill) → `skills/emil-design-eng` (commit `2d22863`) | MIT |
| `impeccable-design/` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) → `.claude/skills/impeccable`, tag `skill-v4.6.0` | Apache 2.0 |
| `taste/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), rama `taste-skill-v2` → `skills/taste-skill` (commit `9da1763`) | MIT |

Cada carpeta conserva el `LICENSE` de su proyecto original.

## Tienda (`index.html`)

Tienda de una página: portada (`#/`), producto (`#/producto/<id>`), carrito (`#/carrito`), datos del pedido (`#/pedido`) y confirmación (`#/orden/<referencia>`). Los pedidos se envían por WhatsApp; no hay cobro en línea.

- **`config.js`**: WhatsApp, envío, métodos de pago, políticas, catálogo, precios y disponibilidad. Es el único archivo que hay que tocar para datos del negocio.
- **Tasa euro BCV**: `rate.json`, actualizado por `.github/workflows/tasa-bcv.yml` (manual: `node scripts/update-rate.mjs`).
- **Ver la tienda**: `python3 -m http.server` en la carpeta del repo y abre `localhost:8000`.
- **Pruebas**: `node tests/e2e.cjs` (necesita Playwright con Chromium).
- **Estado, pruebas y pendientes**: [`docs/INFORME.md`](docs/INFORME.md).
