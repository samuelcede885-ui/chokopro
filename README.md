# gramercy
Gramercy Lets go 

## Skills de diseño (`.claude/skills/`)

| Carpeta | Origen | Licencia |
|---|---|---|
| `emil-kowalski-design/` | [emilkowalski/skill](https://github.com/emilkowalski/skill) → `skills/emil-design-eng` (commit `2d22863`) | MIT |
| `impeccable-design/` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) → `.claude/skills/impeccable`, tag `skill-v4.6.0` | Apache 2.0 |
| `taste/` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), rama `taste-skill-v2` → `skills/taste-skill` (commit `9da1763`) | MIT |

Cada carpeta conserva el `LICENSE` de su proyecto original.

## Tienda (`index.html`)

Página de una sola pantalla con tres vistas: portada (`#/`), ficha de producto (`#/producto/<id>`) y carrito (`#/carrito`).
Ábrela con cualquier servidor estático, por ejemplo `python3 -m http.server`. Los productos y precios están en `PRODUCTS`, dentro de `app.js`; si pones el número de la tienda en `WHATSAPP`, el botón "Pagar" envía el pedido por WhatsApp.
