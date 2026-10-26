// Configuración de la tienda Gramercy.
// Todo lo que el propietario debe confirmar vive aquí. Un valor en null significa
// "todavía no lo tenemos": la tienda lo muestra como "se confirma por WhatsApp"
// en lugar de inventar un dato.

const STORE = {
  name: "Gramercy",
  city: "Caracas, Venezuela",
  currency: "USD",

  // WhatsApp de la tienda: código de país + número, sin el 0 inicial.
  // +58 0412-3307641 se escribe "584123307641".
  whatsapp: "584123307641",

  // Máximo de unidades por artículo en un pedido.
  maxQtyPerLine: 10,

  // Envío. Mientras zones esté vacío, el carrito muestra "Envío por confirmar"
  // y el total no incluye envío.
  // Ejemplo: zones: [{ id: "ccs-este", label: "Caracas — Este", fee: 3 }]
  shipping: {
    zones: [],
    pickup: null, // p. ej. { label: "Retiro en tienda", address: "…" }
  },

  // Métodos de pago. details/terms en null = los datos se envían por WhatsApp
  // después de confirmar disponibilidad y envío.
  payments: {
    pagoMovil: {
      enabled: true,
      // p. ej. { bank: "0102 Banco de Venezuela", phone: "0412-0000000", id: "V-00000000" }
      details: null,
    },
    binance: {
      enabled: true,
      // Modalidad aceptada: "binance-pay" o "transfer". null = sin definir.
      mode: null,
      // p. ej. { payId: "000000000" } para Binance Pay
      details: null,
    },
    efectivo: {
      enabled: true,
      // p. ej. "Pago contra entrega en dólares, con monto exacto."
      terms: null,
    },
  },

  // Políticas comerciales. Solo se publican las que tengan texto.
  policies: {
    changes: null,
    deliveryTimes: null,
    privacy: null,
  },
};

// Catálogo. available: false marca una variante como agotada.
const CATALOG = {
  lentes: {
    id: "lentes",
    brand: "Blue Light",
    name: "Lentes Blue Light",
    price: 20,
    optionLabel: "Color",
    optionPrefix: "Cristal",
    unitLabel: "Par",
    options: [
      { id: "ambar", label: "Ámbar", swatch: "#f6a21a", img: "assets/lentes-ambar.webp", w: 695, h: 352, available: true },
      { id: "azul", label: "Azul", swatch: "#5a8fd6", img: "assets/lentes-azul.webp", w: 742, h: 317, available: true },
    ],
    description:
      "Montura redonda negra con cristales tintados en ámbar o azul, para usar a diario frente al computador o el teléfono. Si necesitas la ficha técnica del cristal, pídela por WhatsApp antes de comprar.",
    features: [
      ["frame", "Montura", "redonda negra"],
      ["lens", "Cristal", "ámbar o azul"],
      ["monitor", "Para uso", "frente a pantallas"],
      ["chat", "Ficha técnica", "por WhatsApp"],
    ],
  },
  polo: {
    id: "polo",
    brand: "Polo Ralph Lauren",
    name: "Quarter Zip Polo Ralph Lauren",
    short: "Quarter Zip Polo",
    price: 120,
    optionLabel: "Talla",
    optionPrefix: "Talla",
    unitLabel: "Suéter",
    options: ["S", "M", "L", "XL", "XXL"].map((s) => ({
      id: s, label: s, img: "assets/polo-quarter-zip.webp", w: 666, h: 737, available: true,
    })),
    defaultOption: "L",
    description:
      "Suéter de punto trenzado con media cremallera, cuello alto y el pony bordado en rojo sobre el pecho. Pide la composición y las medidas de cada talla por WhatsApp antes de comprar.",
    features: [
      ["zip", "Media", "cremallera"],
      ["knit", "Punto", "trenzado"],
      ["pony", "Pony", "bordado"],
      ["ruler", "Tallas", "S a XXL"],
    ],
  },
};
