/**
 * FRUTAS LAM - FRUTOS SECOS (Mendoza)
 * LÓGICA INTERACTIVA DEL CATÁLOGO Y COTIZADOR WHATSAPP
 * Precios de lista: Mayoristas por kilo (llevando caja cerrada).
 * Ambas listas se actualizan desde la planilla publicada.
 */

// =====================================================================
// CONFIGURACIÓN PRINCIPAL
// =====================================================================
const APP_CONFIG = {
  whatsappNumber: '5492634761151', // Mayorista
  retailWhatsappNumber: '5492634339550',
  businessName: 'Frutas LAM',
  tagline: 'Calidad y sabor en cada bocado',
  pickupAddress: '9 de Julio 1189, Mendoza Ciudad',
  instagramUser: '@lamfruts',
  instagramUrl: 'https://www.instagram.com/lamfruts/',
  wholesalePickup: 'Ingeniero Giagnoni, Junín',
  wholesaleMaps: 'https://maps.app.goo.gl/3Xq155JCwf7fQ5Y49',
  retailPickup: '9 de Julio 1189, Mendoza Ciudad'
};

// =====================================================================
// CATÁLOGO ACTUAL: PRODUCTOS CON FOTO FINAL Y PRECIO CONFIRMADO
// pricePerKg es el equivalente por unidad; packageTotalPrice es el total confirmado de la presentación.
// =====================================================================
const PRODUCTS_DATA = [
  {
    id: 'nuez-mariposa-blanca',
    name: 'Nuez Mariposa Blanca (Partida a mano)',
    category: 'Nueces',
    badge: 'Selección Especial',
    description: 'Mitades mariposa blanca partidas a mano, calibre parejo y textura crocante de primera selección.',
    image: 'assets/productos/nuez-mariposa-blanca-partida-a-mano.webp',
    pricePerKg: 1350.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 13500
  },
  {
    id: 'nuez-cuartos-blanca',
    name: 'Nuez Cuartos Blanca',
    category: 'Nueces',
    badge: 'Ideal Repostería',
    description: 'Cuartos de nuez blanca seleccionados, gran rendimiento para panificación, granola y consumo diario.',
    image: 'assets/productos/nuez-cuarto-extra-light.webp',
    pricePerKg: 1250.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 12500
  },
  {
    id: 'nuez-mariposa-ambar-light',
    name: 'Nuez Mariposa Ámbar-Light',
    category: 'Nueces',
    badge: 'Excelente Precio',
    description: 'Nuez mariposa color ámbar claro, sabor intenso y gran valor nutricional a un precio muy conveniente.',
    image: 'assets/productos/nuez-mariposa-ambar-light.webp',
    pricePerKg: 990.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 9900
  },
  {
    id: 'nuez-mariposa-light',
    name: 'Nuez Mariposa Light',
    category: 'Nueces',
    badge: '',
    description: 'Nuez Mariposa Light.',
    image: 'assets/productos/nuez-mariposa-light.webp',
    pricePerKg: 1270.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 12700
  },
  {
    id: 'almendra-marinada-3-4',
    name: 'Almendra Marinada N° 3/4',
    category: 'Almendras',
    badge: 'Gourmet',
    description: 'Almendra marinada calibre N° 3/4.',
    image: 'assets/productos/almendra-marinada-3.webp',
    pricePerKg: 1950.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 19500
  },
  {
    id: 'almendra-marinada-5-6',
    name: 'Almendra Marinada N° 5/6',
    category: 'Almendras',
    badge: 'Calibre Grande',
    description: 'Almendra marinada calibre N° 5/6.',
    image: 'assets/productos/almendra-marinada-6.webp',
    pricePerKg: 2100.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 21000
  },
  {
    id: 'almendra-guara-3-4',
    name: 'Almendra Guara N° 3/4',
    category: 'Almendras',
    badge: 'Alta Calidad',
    description: 'Almendra variedad Guara calibre N° 3/4.',
    image: 'assets/productos/almendra-guara-n3.webp',
    pricePerKg: 1950.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 19500
  },
  {
    id: 'almendra-guara-6',
    name: 'Almendra Guara N° 6',
    category: 'Almendras',
    badge: 'Premium',
    description: 'Almendra variedad Guara calibre N° 6.',
    image: 'assets/productos/almendra-guara-6.webp',
    pricePerKg: 2100.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 21000
  },
  {
    id: 'almendra-partida',
    name: 'Almendra Partida',
    category: 'Almendras',
    badge: 'Económica',
    description: 'Trozos de almendra natural, rinde al máximo en rellenos, galletitas, turrones y barras de cereal.',
    image: 'assets/productos/almendra-partida.webp',
    pricePerKg: 1520.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 15200
  },
  {
    id: 'harina-de-almendra',
    name: 'Harina de Almendra',
    category: 'Almendras',
    badge: 'Con piel',
    description: 'Harina de almendra con piel, presentación de 10 kg.',
    image: 'assets/productos/harina-de-almendra-con-piel-70.webp',
    pricePerKg: 290.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 2900
  },
  {
    id: 'aceituna-griega-1kg',
    name: 'Aceituna Griega Negra (1 kg)',
    category: 'Aceite y aceitunas',
    badge: 'Elaboración Propia',
    description: 'Aceituna negra estilo griego curada en sal seca y aceite, arrugada y con profundo sabor tradicional.',
    image: 'assets/productos/aceituna-negra-griega.webp',
    pricePerKg: 9500,
    unit: 'kg',
    packageKg: 1,
    packageUnit: 'Presentación x 1 kg',
    packageTotalPrice: 9500
  },
  {
    id: 'aceituna-griega-medio-kg',
    name: 'Aceituna Griega (Frasco 1/2 kg)',
    category: 'Aceite y aceitunas',
    badge: 'Presentación Frasco',
    description: 'Frasco sellado de 500g con aceitunas estilo griego listas para el consumo en picadas y aperitivos.',
    image: 'assets/productos/aceituna-negra-griega.webp',
    pricePerKg: 6200,
    unit: 'frasco',
    packageKg: 1,
    packageUnit: 'Frasco x 1/2 kg',
    packageTotalPrice: 6200
  },
  {
    id: 'aceituna-griega-5kg',
    name: 'Aceituna Griega Negra (Balde 5 kg)',
    category: 'Aceite y aceitunas',
    badge: 'Balde Mayorista',
    description: 'Balde hermético de 5 kg con aceitunas griegas negras seleccionadas para fiambrerías y gastronomía.',
    image: 'assets/productos/aceituna-negra-griega.webp',
    pricePerKg: 41500,
    unit: 'balde',
    packageKg: 1,
    packageUnit: 'Balde cerrado x 5 kg',
    packageTotalPrice: 41500
  },
  {
    id: 'aceituna-descarozada-granel',
    name: 'Aceituna Verde Descarozada (Granel)',
    category: 'Aceite y aceitunas',
    badge: 'Sin Carozo',
    description: 'Aceitunas verdes descarozadas carnosas y suaves al granel, perfectas para pizzas, empanadas y picadas.',
    image: 'assets/productos/aceituna-descarozada-verde.webp',
    pricePerKg: 590.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 5900
  },
  {
    id: 'aceite-oliva-extra-virgen',
    name: 'Aceite Oliva Extra Virgen (1 Litro)',
    category: 'Aceite y aceitunas',
    badge: 'Primera Prensada',
    description: 'Aceite de oliva extra virgen de primera prensada en frío, baja acidez y frutado fresco mendocino.',
    image: 'assets/productos/aceite-de-oliva-1l.webp',
    pricePerKg: 12800,
    unit: 'litro',
    packageKg: 1,
    packageUnit: 'Botella x 1 litro',
    packageTotalPrice: 12800
  },
  {
    id: 'aceite-oliva-extra-virgen-5l',
    name: 'Aceite Oliva Extra Virgen (5 Litros)',
    category: 'Aceite y aceitunas',
    badge: '',
    description: 'Aceite Oliva Extra Virgen (5 Litros).',
    image: 'assets/productos/aceite-de-oliva-5l.webp',
    pricePerKg: 12800.0,
    unit: 'litro',
    packageKg: 5,
    packageUnit: 'Bidón x 5 litros',
    packageTotalPrice: 64000
  },
  {
    id: 'castana-caju-vietnam',
    name: 'Castaña Cajú Vietnam',
    category: 'Frutos secos varios',
    badge: 'Importación',
    description: 'Castañas de cajú de Vietnam.',
    image: 'assets/productos/castana-de-caju-vietnam.webp',
    pricePerKg: 1280.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 12800
  },
  {
    id: 'pistacho-con-cascara',
    name: 'Pistacho c/c (con cáscara)',
    category: 'Frutos secos varios',
    badge: 'Favorito',
    description: 'Pistachos con cáscara.',
    image: 'assets/productos/pistacho-con-cascara.webp',
    pricePerKg: 2680.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 26800
  },
  {
    id: 'mani-sin-sal',
    name: 'Maní sin Sal (Tostado)',
    category: 'Frutos secos varios',
    badge: 'Económico',
    description: 'Maní cordobés tostado natural sin agregado de sal ni aceites, repelado y de calibre parejo.',
    image: 'assets/productos/mani-sin-sal.webp',
    pricePerKg: 320.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 3200
  },
  {
    id: 'miel-pura-campo-medio-kg',
    name: 'Miel Pura de Campo x 1/2 kg',
    category: 'Frutos secos varios',
    badge: '100% Pura',
    description: 'Miel cruda de flores de campo sin pasteurizar ni agregados, textura untuosa y aroma dulce natural.',
    image: 'assets/productos/miel-pura-500gr.webp',
    pricePerKg: 5000,
    unit: 'frasco',
    packageKg: 1,
    packageUnit: 'Frasco x 1/2 kg',
    packageTotalPrice: 5000
  },
  {
    id: 'granola-artesanal',
    name: 'Granola Artesanal',
    category: 'Frutos secos varios',
    badge: 'Con Miel y Frutos',
    description: 'Granola clásica sin coco.',
    image: 'assets/productos/granola-clasica.webp',
    pricePerKg: 480.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 4800
  },
  {
    id: 'ciruela-sin-carozo',
    name: 'Ciruela s/c (sin carozo)',
    category: 'Deshidratados',
    badge: 'Mendoza',
    description: 'Ciruela D\'Agen mendocina tierna, carnosa y húmeda sin carozo. Fuente natural de fibra y antioxidantes.',
    image: 'assets/productos/ciruela-dagen-sin-carozo-grande.webp',
    pricePerKg: 700.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 7000
  },
  {
    id: 'pasa-jumbo',
    name: 'Pasa Jumbo de Uva',
    category: 'Deshidratados',
    badge: 'Extra Grande',
    description: 'Pasas de uva morocha de gran calibre jumbo seleccionadas, carnosas, suaves y sin semillas.',
    image: 'assets/productos/pasa-morocha-doble-jumbo.webp',
    pricePerKg: 520.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 5200
  },
  {
    id: 'pasa-rubia-grande',
    name: 'Pasa Rubia Grande',
    category: 'Deshidratados',
    badge: 'Gourmet',
    description: 'Pasa dorada sultanina de gran tamaño, dulzor delicado con sutil toque cítrico, limpia y sin semillas.',
    image: 'assets/productos/pasa-rubia-grande.webp',
    pricePerKg: 770.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 7700
  },
  {
    id: 'pasa-flame',
    name: 'Pasa Flame Mendocina',
    category: 'Deshidratados',
    badge: 'Más Vendida',
    description: 'Pasas de uva tinta Flame de fincas de Mendoza, textura tierna y dulzor equilibrado sin semillas.',
    image: 'assets/productos/pasa-flame.webp',
    pricePerKg: 350.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 3500
  },
  {
    id: 'banana-chips',
    name: 'Banana Chips Crocantes',
    category: 'Deshidratados',
    badge: 'Snack Saludable',
    description: 'Crocantes chips de banana deshidratada y dorada al punto justo, snack nutritivo de alta energía.',
    image: 'assets/productos/chips-banana.webp',
    pricePerKg: 1030.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 10300
  },
  {
    id: 'higo-negro',
    name: 'Higo Negro Seco',
    category: 'Deshidratados',
    badge: 'Tradicional',
    description: 'Higos negros secados al sol en tierras cuyanas, piel delgada y corazón dulce con miel natural.',
    image: 'assets/productos/higo.webp',
    pricePerKg: 850.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 8500
  },
  {
    id: 'medallon-durazno',
    name: 'Medallón de Durazno',
    category: 'Deshidratados',
    badge: 'Cuyo Especial',
    description: 'Medallones tiernos de durazno amarillo deshidratado, aroma frutal concentrado y textura suave.',
    image: 'assets/productos/medallon-de-durazno.webp',
    pricePerKg: 940.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 9400
  },
  {
    id: 'pelon-durazno',
    name: 'Pelón de Durazno',
    category: 'Deshidratados',
    badge: 'Típico Cuyano',
    description: 'Pelones artesanales desecados, tradicionales de la mesa mendocina para compotas y consumo natural.',
    image: 'assets/productos/durazno-pelon.webp',
    pricePerKg: 620.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 6200
  },
  {
    id: 'datil-argelia-sin-carozo',
    name: 'Dátil Argelia sin Carozo',
    category: 'Deshidratados',
    badge: 'Deglet Nour',
    description: 'Dátiles importados de Argelia sin carozo, textura melosa con notas a miel y caramelo natural.',
    image: 'assets/productos/datiles-de-algeria.webp',
    pricePerKg: 1210.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 12100
  },
  {
    id: 'tomate-deshidratado-1ra',
    name: 'Tomate Deshidratado 1ra',
    category: 'Deshidratados',
    badge: '1ra Calidad',
    description: 'Tomates mendocinos secados al sol de primera calidad, sabor intenso y color vivo para ensaladas y pastas.',
    image: 'assets/productos/tomate-deshidratado.webp',
    pricePerKg: 1070.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 10700
  },
  {
    id: 'papaya',
    name: 'Papaya Multicolor',
    category: 'Deshidratados',
    badge: '',
    description: 'Papaya Multicolor.',
    image: 'assets/productos/papaya-multicolor.webp',
    pricePerKg: 680.0,
    unit: 'kg',
    packageKg: 10,
    packageUnit: 'Caja x 10 kg',
    packageTotalPrice: 6800
  },
  {
    id: 'mix-tropical-comun',
    name: 'Mix Tropical Común',
    category: 'Mixes',
    badge: '',
    description: 'Mix Tropical Común.',
    image: 'assets/productos/tropical-comun.webp',
    pricePerKg: 6900.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 34500
  },
  {
    id: 'mix-tropical-premium',
    name: 'Mix Tropical Premium',
    category: 'Mixes',
    badge: '',
    description: 'Mix Tropical Premium.',
    image: 'assets/productos/tropical-premium.webp',
    pricePerKg: 8300.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 41500
  },
  {
    id: 'mix-tropical-mega-eco',
    name: 'Mix Tropical MegaECO',
    category: 'Mixes',
    badge: '',
    description: 'Mix Tropical MegaECO.',
    image: 'assets/productos/mix-mega-eco.webp',
    pricePerKg: 5400.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 27000
  },
  {
    id: 'mix-tropical-sin-mani',
    name: 'Mix Tropical sin Maní',
    category: 'Mixes',
    badge: '',
    description: 'Mix Tropical sin Maní.',
    image: 'assets/productos/tropical-sin-mani.webp',
    pricePerKg: 9700.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 48500
  },
  {
    id: 'mix-clasico-sin-mani',
    name: 'Mix Clásico sin Maní',
    category: 'Mixes',
    badge: '',
    description: 'Mix Clásico sin Maní.',
    image: 'assets/productos/clasico-sin-mani.webp',
    pricePerKg: 9700.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 48500
  },
  {
    id: 'mix-clasico-con-mani',
    name: 'Mix Clásico con Maní',
    category: 'Mixes',
    badge: '',
    description: 'Mix Clásico con Maní.',
    image: 'assets/productos/clasico-con-mani.webp',
    pricePerKg: 8900.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 44500
  },
  {
    id: 'mix-patagonia',
    name: 'Mix Patagonia',
    category: 'Mixes',
    badge: '',
    description: 'Mix Patagonia.',
    image: 'assets/productos/mix-patagonia.webp',
    pricePerKg: 8700.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 43500
  },
  {
    id: 'mix-cervecero',
    name: 'Mix Cervecero',
    category: 'Mixes',
    badge: '',
    description: 'Mix Cervecero.',
    image: 'assets/productos/mix-cervecero.webp',
    pricePerKg: 5560.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 27800
  },
  {
    id: 'mix-frutal',
    name: 'Mix Frutal',
    category: 'Mixes',
    badge: '',
    description: 'Mix Frutal.',
    image: 'assets/productos/mix-frutal.webp',
    pricePerKg: 8900.0,
    unit: 'kg',
    packageKg: 5,
    packageUnit: 'Bolsón x 5 kg',
    packageTotalPrice: 44500
  }
];

// Visible para consultar, separado de los artículos cotizados hasta confirmar su precio.
const CONSULTATION_PRODUCTS = [{
  id: 'miel-churqui-1kg',
  name: 'Miel Churqui x 1 kg',
  category: 'Frutos secos varios',
  description: 'Miel de monte multifloral Churqui, frasco de 1 kg.',
  image: 'assets/productos/miel-churqui-1kg.webp',
  unit: 'frasco',
  packageKg: 1,
  packageUnit: 'Frasco x 1 kg',
  pricePerKg: null,
  packageTotalPrice: null,
  retailPrice: null,
  retailQuantity: 1,
  retailTotal: null,
  optionalPriceRow: true,
  consultationOnly: true
}];

// Valores iniciales pedidos: lista minorista en cero hasta su carga en la planilla.
PRODUCTS_DATA.forEach(product => Object.assign(product, {
  retailPrice: 0, retailQuantity: 1, retailTotal: 0
}));

// =====================================================================
// ESTADO DE LA APLICACIÓN
// =====================================================================
const state = {
  pricingMode: 'mayorista', // 'mayorista' (default) | 'minorista'
  activeCategory: 'all',
  searchQuery: '',
  cart: [] // { cartItemId, productId, name, mode, pricePerKg, unitPrice, packageDesc, qty, image, unit }
};

// Actualización atómica: una planilla inválida conserva los últimos precios válidos.
let pricesLoading = false;
let lastPriceSource = '';
let lastPriceSync = null;
function updatePriceSyncStatus(message, failed = false) {
  const status = document.getElementById('priceSyncStatus');
  if (status) {
    status.textContent = message;
    status.classList.toggle('sync-error', failed);
  }
  const button = document.getElementById('refreshPricesBtn');
  if (button) {
    button.disabled = pricesLoading;
    button.textContent = pricesLoading ? 'Actualizando…' : 'Actualizar precios';
  }
}
async function refreshPrices() {
  if (pricesLoading) return;
  pricesLoading = true;
  updatePriceSyncStatus('Actualizando precios…');
  let syncError = false;
  let usedFallback = false;
  const config = window.PRICES_CONFIG || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs || 10000);
  try {
    const readSource = async (url, numberFormat) => {
      const response = await fetch(url, {
        cache: 'no-store', signal: controller.signal, credentials: 'omit'
      });
      if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
      return PriceSheet.readPrices(await response.text(), [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS], { numberFormat });
    };
    let updates;
    let source = config.csvUrl ? 'online' : 'local';
    try {
      updates = await readSource(config.csvUrl || 'data/precios.csv', config.csvUrl ? config.numberFormat : undefined);
    } catch (error) {
      // La hoja anterior todavía puede tener productos retirados o no incluir las altas.
      // Usar la lista de lanzamiento solo antes de recibir una actualización válida.
      if (lastPriceSync || !config.csvUrl || !config.fallbackCsvUrl) throw error;
      clearTimeout(timer);
      const fallbackResponse = await fetch(config.fallbackCsvUrl, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(config.timeoutMs || 10000) });
      if (!fallbackResponse.ok) throw new Error(`Error HTTP ${fallbackResponse.status}`);
      updates = PriceSheet.readPrices(await fallbackResponse.text(), [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]);
      source = 'local';
      usedFallback = true;
    }
    let changed = false;
    updates.forEach(update => {
      const product = [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS].find(p => p.id === update.id);
      if (Object.keys(update).some(key => update[key] !== product[key])) changed = true;
      Object.assign(product, update);
    });
    if (changed) {
      state.cart.forEach(item => {
        const product = [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS].find(p => p.id === item.productId);
        Object.assign(item, getProductPricing(product, item.mode));
      });
      renderProducts();
      updateCartUI();
      if (state.cart.length) {
        showToast('Actualizamos los precios de tu pedido con la lista vigente.');
      }
    }
    lastPriceSync = new Date();
    lastPriceSource = source;
  } catch (error) {
    syncError = true;
    console.warn('No se pudo actualizar la planilla; se conservan los precios vigentes.', error);
  } finally {
    clearTimeout(timer);
    pricesLoading = false;
    const time = lastPriceSync?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const localMessage = `Lista de lanzamiento vigente · No se pudo sincronizar la planilla. Última lectura local: ${time}.`;
    updatePriceSyncStatus(lastPriceSource === 'local' && config.csvUrl && config.fallbackCsvUrl
      ? localMessage
      : syncError
      ? (time ? `No pudimos actualizar. Última lectura: ${time}.` : 'No pudimos actualizar. Reintentá en unos instantes.')
      : `Precios actualizados · ${time}`, syncError || usedFallback);
  }
}

// =====================================================================
// UTILIDADES
// =====================================================================
function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getProductPricing(product, mode) {
  if (mode === 'mayorista') return {
    pricePerKg: product.pricePerKg, unitPrice: product.packageTotalPrice,
    packageDesc: product.packageUnit
  };
  const amount = product.retailQuantity || 1;
  return {
    pricePerKg: product.retailPrice ?? null, unitPrice: product.retailTotal ?? null,
    packageDesc: `${amount} ${product.unit || 'kg'}`
  };
}

function contactNumber(mode) {
  return mode === 'minorista' ? APP_CONFIG.retailWhatsappNumber : APP_CONFIG.whatsappNumber;
}

function pickupFor(mode) {
  return mode === 'minorista' ? APP_CONFIG.retailPickup : APP_CONFIG.wholesalePickup;
}

function syncModeContact() {
  const link = document.querySelector('.floating-whatsapp-btn');
  if (link) {
    link.href = `https://wa.me/${contactNumber(state.pricingMode)}?text=${encodeURIComponent(`Hola Frutas LAM! Quisiera hacer una consulta ${state.pricingMode}.`)}`;
    link.setAttribute('aria-label', `WhatsApp ${state.pricingMode}`);
    const tooltip = link.querySelector('.floating-tooltip');
    if (tooltip) tooltip.textContent = `Contacto ${state.pricingMode}`;
  }
}

function formatARS(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✓</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// =====================================================================
// RENDERIZADO DEL CATÁLOGO DE PRODUCTOS
// =====================================================================
function setCategory(category) {
  const valid = category === 'all' || PRODUCTS_DATA.some(product => product.category === category);
  state.activeCategory = valid ? category : 'all';
  document.querySelectorAll('.filter-tab, .category-card').forEach(button => {
    const active = (button.dataset.filter || button.dataset.category) === state.activeCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  // Filtrado por categoría y búsqueda
  const filtered = [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS].filter(product => {
    const matchCategory = state.activeCategory === 'all' || product.category === state.activeCategory;
    const q = normalizeSearch(state.searchQuery.trim());
    const matchSearch = !q ||
      normalizeSearch(product.name).includes(q) ||
      normalizeSearch(product.category).includes(q) ||
      normalizeSearch(product.description).includes(q);

    return matchCategory && matchSearch;
  });

  const title = document.getElementById('catalogCategoryTitle');
  if (title) title.textContent = state.activeCategory === 'all' ? 'Catálogo' : state.activeCategory;
  const count = document.getElementById('catalogResultCount');
  if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  const isMayorista = state.pricingMode === 'mayorista';

  grid.innerHTML = filtered.map(product => {
    let mainPriceHtml = '';
    let subPriceInfo = '';
    let btnAddText = '';

    const unitLabel = product.unit || 'kg';
    const consultationOnly = product.consultationOnly && getProductPricing(product, state.pricingMode).unitPrice == null;

    if (consultationOnly) {
      mainPriceHtml = '<span class="price-pending">Consultar precio</span>';
      subPriceInfo = `<div class="sub-pack-row">${product.packageUnit}</div>`;
    } else if (isMayorista) {
      // MODO MAYORISTA (Precios del folleto por kilo llevando caja)
      mainPriceHtml = `
        <span class="primary-price">${formatARS(product.pricePerKg)}</span>
        <span class="price-unit">/ ${unitLabel}</span>
      `;

      const wspRetailQuery = encodeURIComponent(`Hola Frutas LAM! Quisiera consultar el precio minorista para: ${product.name}`);
      const wspLink = `https://wa.me/${APP_CONFIG.retailWhatsappNumber}?text=${wspRetailQuery}`;

      if (product.packageKg > 1) {
        subPriceInfo = `
          <div class="sub-pack-row"><strong>${product.packageUnit}</strong></div>
          <div class="sub-total-box">Total ${product.category === 'Mixes' ? 'bolsón' : product.unit === 'litro' ? 'bidón' : 'caja'}: <strong>${formatARS(product.packageTotalPrice)}</strong></div>
          <div class="sub-minorista-hint"><a href="${wspLink}" target="_blank" rel="noopener noreferrer">Consultar minorista</a></div>
        `;
      } else {
        subPriceInfo = `
          <div class="sub-pack-row"><strong>${product.packageUnit}</strong></div>
          <div class="sub-total-box">Precio cerrado: <strong>${formatARS(product.packageTotalPrice)}</strong></div>
          <div class="sub-minorista-hint"><a href="${wspLink}" target="_blank" rel="noopener noreferrer">Consultar minorista</a></div>
        `;
      }
      btnAddText = 'Agregar';
    } else {
      const pricing = getProductPricing(product, 'minorista');
      const available = pricing.unitPrice !== null;
      mainPriceHtml = available
        ? `<span class="primary-price">${formatARS(product.retailPrice)}</span><span class="price-unit">/ ${unitLabel}</span>`
        : '<span class="price-pending">Precio pendiente</span>';
      subPriceInfo = `<div class="sub-pack-row">Venta x <strong>${pricing.packageDesc}</strong></div>`;
      if (available) subPriceInfo += `<div class="sub-total-box">Total: <strong>${formatARS(pricing.unitPrice)}</strong></div>`;
      btnAddText = available ? 'Agregar' : 'Sin precio';
    }

    return `
      <article class="product-card" data-product-id="${product.id}">
        <div class="product-img-box">
          <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async" width="1254" height="1254">
        </div>

        <div class="product-body">
          <h3 class="product-name">${product.name}</h3>

          <div class="product-pricing-box">
            <div class="primary-price-line">
              ${mainPriceHtml}
            </div>
            <div class="secondary-price-line">
              ${subPriceInfo}
            </div>
          </div>

          <div class="product-actions-row">
            ${consultationOnly ? `
              <a class="btn-add-cart" href="https://wa.me/${contactNumber(state.pricingMode)}?text=${encodeURIComponent(`Hola Frutas LAM! Quisiera consultar el precio de ${product.name}.`)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
            ` : `
            <div class="qty-control" aria-label="Cantidad">
              <button type="button" class="qty-btn btn-minus" data-id="${product.id}" aria-label="Restar 1">-</button>
              <input type="text" class="qty-input" id="qty-${product.id}" value="1" readonly aria-label="Cantidad para ${product.name}">
              <button type="button" class="qty-btn btn-plus" data-id="${product.id}" aria-label="Sumar 1">+</button>
            </div>

            <button type="button" class="btn-add-cart" data-id="${product.id}" ${!isMayorista && product.retailTotal == null ? 'disabled' : ''} aria-label="${btnAddText} ${product.name}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>${btnAddText}</span>
            </button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// =====================================================================
// GESTIÓN DEL CARRITO / COTIZADOR
// =====================================================================
function addToCart(productId, quantity) {
  const product = [...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS].find(p => p.id === productId);
  if (!product) return;

  quantity = Math.max(1, Math.min(999, Math.trunc(Number(quantity)) || 1));
  const mode = state.pricingMode; // 'mayorista' | 'minorista'
  const pricing = getProductPricing(product, mode);
  if (pricing.unitPrice === null) {
    showToast('Este producto todavía no tiene precio cargado para esta modalidad.');
    return;
  }

  const cartItemId = `${productId}-${mode}`;
  const existing = state.cart.find(item => item.cartItemId === cartItemId);

  if (existing) {
    existing.qty = Math.min(999, existing.qty + quantity);
  } else {
    state.cart.push({
      cartItemId,
      productId: product.id,
      name: product.name,
      mode,
      ...pricing,
      qty: quantity,
      image: product.image,
      unit: product.unit || 'kg'
    });
  }

  updateCartUI();
  showToast(`¡${product.name} agregado a tu pedido!`);
}

function updateCartItemQty(cartItemId, delta) {
  const item = state.cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  item.qty = Math.min(999, item.qty + delta);
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.cartItemId !== cartItemId);
  }

  updateCartUI();
}

function removeCartItem(cartItemId) {
  state.cart = state.cart.filter(i => i.cartItemId !== cartItemId);
  updateCartUI();
}

function clearCart() {
  state.cart = [];
  updateCartUI();
  showToast('El pedido ha sido vaciado.');
}

function updateCartUI() {
  const badge = document.getElementById('cartCount');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const emptyState = document.getElementById('cartEmptyState');
  const footer = document.getElementById('cartDrawerFooter');
  const totalPriceElem = document.getElementById('cartTotalPrice');
  const totalSummaryLabel = document.getElementById('cartSummaryLabel');

  const totalItemsCount = state.cart.reduce((acc, item) => acc + item.qty, 0);
  if (badge) badge.textContent = totalItemsCount;

  if (state.cart.length === 0) {
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (footer) footer.style.display = 'flex';

  const totalEstimated = state.cart.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.qty, 0);
  const pending = state.cart.some(item => item.unitPrice === null);
  const hasMayorista = state.cart.some(item => item.mode === 'mayorista');
  const hasMinorista = state.cart.some(item => item.mode === 'minorista');

  if (itemsContainer) itemsContainer.innerHTML = state.cart.map(item => {
    const missing = item.unitPrice === null;
    const subtotal = missing ? 'Precio pendiente' : formatARS(item.unitPrice * item.qty);
    const modeLabel = item.mode === 'mayorista' ? 'Mayorista' : 'Minorista';
    const unitInfo = missing ? 'Precio pendiente'
      : `${formatARS(item.pricePerKg)} / ${item.unit}`;
    return `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-pack">${item.packageDesc} · <span class="badge-mode-${item.mode === 'mayorista' ? 'may' : 'min'}">${modeLabel}</span></div>
          <div class="cart-item-price">${unitInfo}</div>
          <div class="cart-item-bottom">
            <div class="cart-qty-control">
              <button type="button" class="btn-cart-qty" onclick="updateCartItemQty('${item.cartItemId}', -1)" aria-label="Restar una presentación">-</button>
              <span class="cart-qty-value">${item.qty}</span>
              <button type="button" class="btn-cart-qty" onclick="updateCartItemQty('${item.cartItemId}', 1)" aria-label="Sumar una presentación">+</button>
            </div>
            <div class="cart-item-subtotal">Subtotal: <strong>${subtotal}</strong></div>
            <button type="button" class="btn-cart-remove" onclick="removeCartItem('${item.cartItemId}')" title="Quitar producto">✕</button>
          </div>
        </div>
      </div>`;
  }).join('');

  if (totalPriceElem) totalPriceElem.textContent = pending ? 'Hay productos sin precio' : formatARS(totalEstimated);
  if (totalSummaryLabel) totalSummaryLabel.textContent = 'Total estimado:';
  const retailButton = document.getElementById('btnSendRetailWhatsAppOrder');
  const configureButton = (button, mode, visible) => {
    if (!button) return;
    button.hidden = !visible;
    button.disabled = state.cart.some(item => item.mode === mode && item.unitPrice === null);
    button.textContent = `Enviar pedido ${mode}`;
  };
  configureButton(document.getElementById('btnSendWhatsAppOrder'), 'mayorista', hasMayorista);
  configureButton(retailButton, 'minorista', hasMinorista);
  const pickupOption = document.querySelector('#cartDeliverySelect option[value="retiro"]');
  if (pickupOption) pickupOption.textContent = hasMayorista && hasMinorista
    ? 'Retiro en el punto de cada modalidad'
    : `Retiro: ${pickupFor(hasMinorista ? 'minorista' : 'mayorista')}`;
  const pickupNote = document.getElementById('cartPickupNote');
  if (pickupNote) pickupNote.textContent = [
    hasMayorista ? `Mayorista: ${pickupFor('mayorista')}.` : '',
    hasMinorista ? `Minorista: ${pickupFor('minorista')}.` : ''
  ].filter(Boolean).join(' ');
}

// Cada modalidad se envía a su contacto, incluso si el carrito contiene ambas.
function sendOrderToWhatsApp(mode = state.pricingMode) {
  const items = state.cart.filter(item => item.mode === mode);
  if (!items.length) {
    showToast(`No hay productos ${mode === 'mayorista' ? 'mayoristas' : 'minoristas'} en tu pedido.`);
    return;
  }
  if (items.some(item => item.unitPrice === null)) {
    showToast('Hay productos sin precio. Actualizá tu pedido antes de enviarlo.');
    return;
  }
  const customerName = document.getElementById('cartCustomerName')?.value.trim() || 'Cliente Web';
  const delivery = document.getElementById('cartDeliverySelect')?.value || 'retiro';
  const pickup = pickupFor(mode);
  const deliveryText = delivery === 'retiro'
    ? `Retiro ${mode}: ${pickup}${mode === 'mayorista' ? '\n' + APP_CONFIG.wholesaleMaps : ''}`
    : delivery;
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const itemsText = items.map(item =>
    `• ${item.qty}x ${item.name} (${item.packageDesc} @ ${formatARS(item.pricePerKg)}/${item.unit}) → ${formatARS(item.unitPrice * item.qty)}`
  ).join('\n');
  const message = `Hola Frutas LAM! Quiero realizar un *PEDIDO ${mode.toUpperCase()}* desde la web:

*Nombre / Negocio:* ${customerName}
*Forma de entrega:* ${deliveryText}

${itemsText}

*TOTAL ESTIMADO:* ${formatARS(total)}

¿Tienen disponibilidad para coordinar la entrega?`;
  window.open(`https://wa.me/${contactNumber(mode)}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

// =====================================================================
// FORMULARIO DE CONTACTO RÁPIDO A WHATSAPP
// =====================================================================
function handleContactForm(e) {
  e.preventDefault();
  const name = document.getElementById('contactName')?.value.trim() || '';
  const city = document.getElementById('contactCity')?.value.trim() || '';
  const type = document.getElementById('contactType')?.value || '';
  const text = document.getElementById('contactMessage')?.value.trim() || '';

  const msg =
`👋 *HOLA FRUTAS LAM!*
Te contacto desde el sitio web con la siguiente consulta:

👤 *Nombre / Comercio:* ${name}
📍 *Ubicación:* ${city}
🎯 *Interés:* ${type}

💬 *Mensaje:*
${text}`;

  const waUrl = `https://wa.me/${contactNumber(type.toLowerCase().includes('minorista') ? 'minorista' : 'mayorista')}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

// =====================================================================
// MANEJO DEL DRAWER / MODAL DEL CARRITO
// =====================================================================
let cartReturnFocus = null;

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    cartReturnFocus = document.activeElement;
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('open');
    document.getElementById('closeCartBtn')?.focus();
    backdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    if (!drawer.classList.contains('open')) return;
    cartReturnFocus?.focus();
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('open');
    backdrop.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// =====================================================================
// INICIALIZACIÓN DE EVENTOS DEL DOM
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('refreshPricesBtn')?.addEventListener('click', refreshPrices);
  refreshPrices();
  setInterval(() => {
    if (!document.hidden) refreshPrices();
  }, Math.max(15000, window.PRICES_CONFIG?.refreshMs || 60000));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshPrices();
  });

  // 1. Render inicial (Default: Mayorista)
  renderProducts();
  updateCartUI();

  // 2. Switch de Modalidad de Precios (Mayorista vs Minorista)
  const btnMayorista = document.getElementById('btnModeMayorista');
  const btnMinorista = document.getElementById('btnModeMinorista');
  const modeBanner = document.getElementById('modeInfoBanner');
  const modeInfoText = document.getElementById('modeInfoText');

  function setPricingMode(mode) {
    state.pricingMode = mode;
    ['btnModeMayorista', 'cartTypeMayorista', 'btnModeMinorista', 'cartTypeMinorista'].forEach(id => {
      const button = document.getElementById(id);
      const active = id.endsWith(mode === 'mayorista' ? 'Mayorista' : 'Minorista');
      button?.classList.toggle('active', active);
      button?.setAttribute('aria-pressed', String(active));
    });
    if (mode === 'mayorista') {
      btnMayorista?.classList.add('active');
      btnMinorista?.classList.remove('active');
      modeBanner?.classList.add('wholesale-active');
      if (modeInfoText) {
        modeInfoText.textContent = 'Granel: caja de 10 kg. Mixes: bolsón de 5 kg. Cada ficha indica el precio por unidad y el total de la presentación.';
      }
    } else {
      btnMinorista?.classList.add('active');
      btnMayorista?.classList.remove('active');
      modeBanner?.classList.remove('wholesale-active');
      if (modeInfoText) {
        modeInfoText.textContent = 'Precios minoristas por kg o unidad. Elegí la presentación y armá tu pedido.';
      }
    }
    renderProducts();
    syncModeContact();
  }

  btnMayorista?.addEventListener('click', () => setPricingMode('mayorista'));
  btnMinorista?.addEventListener('click', () => setPricingMode('minorista'));

  setPricingMode(state.pricingMode);

  // Switch dentro del Carrito
  const cartTypeMay = document.getElementById('cartTypeMayorista');
  const cartTypeMin = document.getElementById('cartTypeMinorista');

  cartTypeMay?.addEventListener('click', () => {
    cartTypeMay.classList.add('active');
    cartTypeMin?.classList.remove('active');
    setPricingMode('mayorista');
  });

  cartTypeMin?.addEventListener('click', () => {
    cartTypeMin.classList.add('active');
    cartTypeMay?.classList.remove('active');
    setPricingMode('minorista');
  });

  // 3. Filtros por Categoría
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => setCategory(tab.dataset.filter));
  });
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      setCategory(card.dataset.category);
      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
  setCategory(state.activeCategory);

  // 4. Buscador
  const searchInput = document.getElementById('productSearchInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderProducts();
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.searchQuery = '';
    clearBtn.style.display = 'none';
    renderProducts();
  });

  document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
    state.searchQuery = '';
    state.activeCategory = 'all';
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    setCategory('all');
  });

  // 5. Delegación de eventos para la grilla de productos (+ / - / Agregar)
  const productsGrid = document.getElementById('productsGrid');
  productsGrid?.addEventListener('click', (e) => {
    const btnPlus = e.target.closest('.btn-plus');
    const btnMinus = e.target.closest('.btn-minus');
    const btnAdd = e.target.closest('.btn-add-cart');

    if (btnPlus) {
      const id = btnPlus.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      if (input) input.value = parseInt(input.value || 1, 10) + 1;
    }

    if (btnMinus) {
      const id = btnMinus.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      if (input && parseInt(input.value, 10) > 1) {
        input.value = parseInt(input.value, 10) - 1;
      }
    }

    if (btnAdd) {
      const id = btnAdd.dataset.id;
      const input = document.getElementById(`qty-${id}`);
      const qty = parseInt(input?.value || 1, 10);
      addToCart(id, qty);
      if (input) input.value = 1; // Reset counter
    }
  });

  // 6. Apertura y cierre del carrito
  document.getElementById('openCartBtn')?.addEventListener('click', openCart);
  document.getElementById('closeCartBtn')?.addEventListener('click', closeCart);
  document.getElementById('cartBackdrop')?.addEventListener('click', closeCart);
  document.getElementById('btnClearCart')?.addEventListener('click', clearCart);
  document.getElementById('btnSendWhatsAppOrder')?.addEventListener('click', () => sendOrderToWhatsApp('mayorista'));
  document.getElementById('btnSendRetailWhatsAppOrder')?.addEventListener('click', () => sendOrderToWhatsApp('minorista'));

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      document.getElementById('mobileNavPanel')?.classList.remove('open');
      document.getElementById('mobileMenuBtn')?.setAttribute('aria-expanded', 'false');
    }
    const drawer = document.getElementById('cartDrawer');
    if (e.key === 'Tab' && drawer?.classList.contains('open')) {
      const controls = [...drawer.querySelectorAll('button, input, select, a[href], [tabindex="0"]')]
        .filter(el => !el.disabled && el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });

  // 7. Formulario de Contacto
  document.getElementById('contactForm')?.addEventListener('submit', handleContactForm);

  // 8. Menú Mobile Toggle
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobilePanel = document.getElementById('mobileNavPanel');
  mobileBtn?.addEventListener('click', () => {
    const isOpen = mobilePanel?.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Cerrar menú mobile al hacer clic en un link
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobilePanel?.classList.remove('open');
      mobileBtn?.setAttribute('aria-expanded', 'false');
    });
  });

});
