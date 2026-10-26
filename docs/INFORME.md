# Gramercy — informe de mejoras

Fecha: 26 de octubre de 2026. Alcance: bloques A, B, D, E y F del plan maestro. El bloque C (backend) queda como propuesta, porque necesita tu aprobación y decidir dónde alojarlo.

## Bloque A — Auditoría del estado inicial

Proyecto estático sin dependencias ni proceso de compilación: `index.html`, `styles.css`, `app.js` y 4 imágenes (1,4 MB en total). Rutas por hash: `#/`, `#/productos`, `#/contacto`, `#/producto/<id>/<variante>`, `#/carrito`.

| # | Hallazgo (versión anterior) | Dónde | Gravedad |
|---|---|---|---|
| 1 | `WHATSAPP = ""`: el botón «Pagar» solo copiaba texto al portapapeles | `app.js:5`, `app.js:283-297` | Alta |
| 2 | El botón decía «Pagar $X» aunque no había ningún cobro | `app.js:255` | Alta |
| 3 | Sin número de pedido, sin datos del cliente (solo un campo «Ubicación»), sin método de pago | `app.js:239-243` | Alta |
| 4 | El total no incluía envío ni lo mencionaba | `app.js:251-254` | Alta |
| 5 | Afirmaciones sin respaldo: «Bloquea la luz azul», «Reduce el cansancio visual», «Mejora la calidad del sueño», «Protege tus ojos a largo plazo», «Protege tu vista»; en el suéter, «algodón», «Mantiene el calor ideal» | `app.js:28-35`, `app.js:46-53`, `app.js:58-60` | Alta |
| 6 | Precios, catálogo y totales calculados solo en el navegador | `app.js:17-55` | Alta (sin backend) |
| 7 | Sin inventario ni estado «agotado» | `app.js:17-55` | Media |
| 8 | Quitar un artículo no se podía deshacer; cantidad máxima 99 sin regla de negocio | `app.js:267-268`, `app.js:205` | Media |
| 9 | `window.open` para WhatsApp: los navegadores lo bloquean en marcos y ventanas emergentes | `app.js:291` | Media |
| 10 | Datos del usuario insertados en HTML con un escape parcial (solo comillas) | `app.js:242` | Media |
| 11 | Sin foco visible al cambiar de vista, sin enlace para saltar al contenido, puntos del carrusel de 12 px (área táctil pequeña) | `index.html`, `styles.css:118-123` | Media |
| 12 | Imágenes PNG de 280–750 KB sin `width`/`height` (saltos de diseño al cargar) | `assets/` | Baja |
| 13 | Sin metadatos sociales ni títulos por vista | `index.html` | Baja |

No había backend, pasarela de pago, inventario ni panel administrativo.

## Bloque B — Correcciones del flujo de compra

- **Datos del negocio en `config.js`.** WhatsApp `584123307641` (+58 412-3307641), envío, métodos de pago, políticas y catálogo con disponibilidad por variante. Un valor en `null` se muestra como «se confirma por WhatsApp»; no se inventa nada.
- **WhatsApp validado** (10 a 15 dígitos). Si el número no es válido, la tienda oculta el botón de WhatsApp y deja solo «Copiar pedido».
- **Nuevo flujo:** Carrito → **Continuar con pedido** → Datos de entrega y método de pago → **Revisar y enviar pedido** → Pedido con referencia `GR-AAMMDD-XXXX` → **Enviar por WhatsApp** (enlace real `wa.me`, no `window.open`) o **Copiar pedido**.
- **Ningún texto promete un pago.** El pedido se crea en estado «Por enviar a la tienda». Pasa a «Enviado · esperando confirmación de la tienda» solo cuando el cliente pulsa «Sí, ya lo envié». El estado del pago siempre dice «Pendiente de confirmación».
- **El carrito se vacía solo cuando el cliente confirma que envió el mensaje**, no al generar el pedido.
- **Sin duplicados:** repetir el envío con el mismo carrito y los mismos datos reutiliza la misma referencia.
- **Validación:** nombre, teléfono (mínimo 10 dígitos), ciudad, dirección y método de pago son obligatorios, con mensajes junto a cada campo y el foco en el primer error. La zona de entrega se exige solo si hay tarifas configuradas.
- **Envío honesto:** sin tarifas configuradas, el resumen dice «Envío: Por confirmar» y «Total sin envío». Con zonas configuradas, se exige elegir una y el total la incluye.
- **Escape de HTML** en todo lo que escribe el usuario (`esc()` en `app.js`).
- **Agotados:** una variante con `available: false` no se puede agregar, aparece tachada y bloquea el checkout si ya estaba en el carrito.
- **Textos de producto:** se quitaron las afirmaciones de salud y de material. Ahora se describe lo que se ve en la foto y se invita a pedir la ficha técnica, la composición y las medidas por WhatsApp. El titular «Protege Tu Vista» pasó a ser «Tu Vista, Tu Estilo».
- **Talla o color por unidad:** al pedir más de uno, cada suéter tiene su propia talla (por ejemplo S y M) y cada par de lentes su color, tanto en la ficha como en el carrito. Cambiar una unidad no afecta a las demás.
- **Quitar con «Deshacer»** en el aviso, y un máximo configurable de 10 unidades por artículo.

## Bloque D — Métodos de pago

Tres tarjetas seleccionables (Pago Móvil con un teléfono, Binance con su símbolo, Efectivo con una cartera y un billete), con estados hover, foco, seleccionado (borde, marca ✓ y elevación, no solo color) y microanimaciones. Funcionan con flechas del teclado.

| Método | Qué muestra hoy | Qué muestra al configurarlo |
|---|---|---|
| Pago Móvil | «Te enviamos los datos por WhatsApp… No pagues antes de esa confirmación.» | Banco, teléfono y cédula, más un campo de referencia y el aviso «pendiente de verificación» |
| Binance | «Te indicamos por WhatsApp cómo pagar… No envíes fondos antes.» | Modalidad (Binance Pay o transferencia) e identificador, con aviso de verificación manual |
| Efectivo | «Las condiciones te las confirmamos por WhatsApp.» | El texto de condiciones que definas |

No se integró ninguna API de cobro: no hay credenciales ni autorización.

## Bloque E — Diseño, accesibilidad y rendimiento

- Se conservan el cielo turquesa con nubes, el azul marino, las fotos grandes y los paneles de vidrio. Los colores, espacios, radios, sombras y tiempos de animación ahora son tokens en `:root` de `styles.css`.
- Nuevas vistas de checkout y confirmación con el mismo lenguaje visual. Se añadió una sección «Cómo comprar» (4 pasos reales) y el contacto con el número copiable.
- Foto ampliable (zoom en un `<dialog>`, se cierra con Esc o clic).
- Accesibilidad: enlace «Saltar al contenido», foco al contenido al cambiar de vista, `aria-pressed` y `aria-invalid`, errores asociados a cada campo, áreas táctiles de al menos 44 px, `prefers-reduced-motion` respetado y título de pestaña por vista.
- Imágenes en WebP: de 1,4 MB a 148 KB, con `width` y `height` para evitar saltos y carga diferida en el catálogo.
- `window.dataLayer` recibe eventos sin datos personales: `view_item`, `add_to_cart`, `begin_checkout`, `select_payment`, `create_order`, `order_sent`.

## Bloque F — Pruebas ejecutadas

`node tests/e2e.cjs` levanta un servidor propio y recorre la tienda con Chromium. Resultado de la última ejecución: **18/18 comprobaciones pasan** (incluye dos suéteres S + M y el cambio de talla de una sola unidad en el carrito).

| Criterio del plan | Resultado |
|---|---|
| 1. Vistas sin errores de consola | ✅ Verificado |
| 2. Ambos colores, varias tallas, cantidades, quitar | ✅ Verificado (incluye «Deshacer») |
| 3. Recargar conserva el carrito | ✅ Verificado |
| 4. Talla agotada no se puede comprar | ✅ Verificado con una configuración de prueba |
| 5. Sin datos obligatorios no hay pedido | ✅ Verificado (también un teléfono inválido) |
| 6. Totales con y sin envío configurado | ✅ Verificado ($320 sin envío; $40 + $3 = $43 con zona) |
| 7. Cada método muestra sus instrucciones | ✅ Verificado |
| 8. Nada marca el pedido como pagado | ✅ Verificado |
| 9. Clic repetido no duplica | ✅ Verificado (doble clic y reenvío) |
| 10. El comercio gestiona pedidos | ❌ No existe: requiere el backend (bloque C) |
| 11. Móvil, tableta y escritorio | ✅ Sin scroll horizontal en 320, 375, 390, 768, 1024, 1440 y 1920 px, en 5 vistas |
| 12. Teclado, lector de pantalla, movimiento reducido | ⚠️ Teclado y movimiento reducido verificados; no se probó con un lector de pantalla real |
| 13. Sin secretos ni precios confiados al frontend | ⚠️ No hay secretos. Los precios siguen en el frontend: sin backend no se pueden recalcular en el servidor |
| 14. Rendimiento de imágenes y animaciones | ⚠️ Imágenes −89 %, animaciones solo con `transform` y `opacity`; no se midieron métricas formales |
| 15. Fallos recuperables sin perder datos | ✅ El formulario sobrevive a una recarga; sin red no hay nada que falle porque no hay llamadas al servidor |

**Verificado: 11 de 15 criterios completos, 3 parciales y 1 pendiente.**

## Bloque C — Backend (propuesta, sin implementar)

Hoy la referencia del pedido se genera en el navegador y el pedido solo existe en el dispositivo del cliente y en el WhatsApp de la tienda. Para cumplir los criterios 10 y 13 hace falta:

1. **API de pedidos:** recibe el carrito (productos, variantes y cantidades, nunca precios), recalcula precios y envío desde la base de datos, valida el inventario, genera la referencia y devuelve el pedido. Usa una clave de idempotencia para no duplicar.
2. **Base de datos:** productos, variantes con stock, zonas de envío, pedidos con historial de estados (`draft` → `pending_payment` → `payment_under_review` → `paid` → `preparing` → `shipped` → `delivered` / `cancelled`) y comprobantes.
3. **Panel con acceso protegido** para ver pedidos, revisar comprobantes, cambiar estados y editar stock.
4. **Avisos:** un aviso a la tienda por cada pedido nuevo.

Opciones de bajo costo: Supabase (base de datos, autenticación y almacenamiento de comprobantes) con funciones en el servidor, o un servidor Node pequeño con SQLite en un VPS. En los dos casos la tienda actual se conecta cambiando `createOrder()` en `app.js` por una llamada a la API.

## Datos pendientes del propietario

- [x] WhatsApp oficial: +58 412-3307641 (escrito en `config.js` como `584123307641`, sin el 0 inicial)
- [ ] Confirmar precios: lentes $20 y suéter $120, en USD; impuestos
- [ ] Stock real por talla y color (hoy todas las variantes están disponibles)
- [ ] Zonas, tarifas y tiempos de entrega; ¿hay retiro?
- [ ] Datos de Pago Móvil (banco, teléfono, cédula) y cómo verifican los pagos
- [ ] Binance: ¿Binance Pay o transferencia? Pay ID o dirección autorizada
- [ ] Condiciones del pago en efectivo
- [ ] Políticas de cambios, privacidad y tiempos de entrega
- [ ] Ficha técnica de los lentes; composición y medidas del suéter (para la guía de tallas)
- [ ] Más fotos de cada producto (la galería hoy tiene una por variante)
- [ ] Hosting y backend preferidos (bloque C)
