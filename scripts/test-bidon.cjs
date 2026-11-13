// Total minorista del envase cerrado (bidón de 5 litros = 5 × precio por litro) sin afectar otras presentaciones.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');
const elements = new Map();
for (const id of ['productsGrid', 'emptyState', 'cartCount', 'cartItemsContainer', 'cartEmptyState', 'cartDrawerFooter', 'cartTotalPrice',
  'cartSummaryLabel', 'btnSendWhatsAppOrder', 'btnSendRetailWhatsAppOrder', 'cartPickupNote', 'cartCustomerName', 'cartDeliverySelect', 'priceSyncStatus']) {
  elements.set(id, { innerHTML: '', textContent: '', style: {}, value: '', hidden: false, disabled: false, classList: { toggle() {} } });
}
elements.get('cartDeliverySelect').value = 'retiro';
const opened = [];
const floating = { setAttribute() {}, querySelector() { return { textContent: '' }; } };
const context = vm.createContext({ console: { warn() {} }, AbortController, AbortSignal, setTimeout, clearTimeout, URL,
  document: { addEventListener() {}, getElementById: id => elements.get(id) || null, querySelector: () => floating },
  window: { PRICES_CONFIG: { csvUrl: 'https://example.test/p.csv', numberFormat: 'auto' }, open: u => opened.push(new URL(u)) }, PriceSheet: { readPrices } });
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext('showToast = () => {}', context);
const run = code => vm.runInContext(code, context);
const [h, ...rows] = parseCSV(fs.readFileSync('scripts/fixtures/nueva-planilla-datos-web.csv', 'utf8'));
const set = (id, key, value) => rows.find(r => r[0] === id)[h.indexOf(key)] = value;
const csv = () => [h, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
set('aceite-oliva-extra-virgen-5l', 'precio_minorista', '$ 12,300.00');   // $/litro
set('aceite-oliva-extra-virgen', 'precio_minorista', '$ 12,800.00');
set('mix-frutal', 'precio_minorista', '$ 9,300.00');
set('miel-pura-campo-medio-kg', 'precio_minorista', '$ 5,150.00');
const card = id => elements.get('productsGrid').innerHTML.match(new RegExp(`<article[^>]*data-product-id="${id}"[\\s\\S]*?</article>`))[0].replace(/\s+/g, ' ');

(async () => {
  context.fetch = async () => ({ ok: true, text: async () => csv() });
  await run('refreshPrices()');
  run("state.pricingMode = 'minorista'; renderProducts()");
  // Bidón de 5 litros: precio unitario intacto y total = 5 × 12.300.
  let c = card('aceite-oliva-extra-virgen-5l');
  assert.match(c, /12\.300<\/span><span class="price-unit">\/ litro/);
  assert.match(c, /Venta x <strong>5 litros<\/strong>/);
  assert.match(c, /Total: <strong>\$\s?61\.500<\/strong>/);
  // Otras presentaciones: sin multiplicar.
  assert.match(card('aceite-oliva-extra-virgen'), /Total: <strong>\$\s?12\.800</);
  assert.match(card('aceite-oliva-extra-virgen'), /Venta x <strong>1 litro</);
  assert.match(card('mix-frutal'), /Total: <strong>\$\s?9\.300</);          // mix: se vende por kg
  assert.match(card('nuez-mariposa-blanca'), /Total: <strong>\$\s?13\.600</); // granel: 1 kg
  assert.match(card('miel-pura-campo-medio-kg'), /Total: <strong>\$\s?5\.150</);
  assert.match(card('miel-pura-campo-medio-kg'), /Venta x <strong>1 frasco</);
  // Carrito: 2 bidones = 2 × 61.500, una sola multiplicación.
  run("addToCart('aceite-oliva-extra-virgen-5l', 2)");
  assert.equal(run('state.cart[0].unitPrice'), 61500);
  assert.equal(run('state.cart[0].pricePerKg'), 12300);
  assert.equal(run('state.cart[0].packageDesc'), '5 litros');
  assert.match(elements.get('cartTotalPrice').textContent, /123\.000/);
  run("addToCart('aceite-oliva-extra-virgen', 1)");
  assert.match(elements.get('cartTotalPrice').textContent, /135\.800/);
  // WhatsApp minorista: 5 litros a $12.300/litro → $61.500 por bidón.
  run("sendOrderToWhatsApp('minorista')");
  const text = opened.at(-1).searchParams.get('text');
  assert.match(text, /2x Aceite Oliva Extra Virgen \(5 Litros\) \(5 litros @ \$\s?12\.300\/litro\) → \$\s?123\.000/);
  assert.match(text, /TOTAL ESTIMADO:\* \$\s?135\.800/);
  // Una actualización de precios mantiene el total del bidón (se recalcula, no se acumula).
  set('aceite-oliva-extra-virgen-5l', 'precio_minorista', '$ 13,000.00');
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].unitPrice'), 65000);
  assert.match(elements.get('cartTotalPrice').textContent, /142\.800/);
  // Aunque la planilla diga cantidad_minorista = 5, no se multiplica dos veces.
  set('aceite-oliva-extra-virgen-5l', 'cantidad_minorista', '5');
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].unitPrice'), 65000, 'Sin doble multiplicación');
  // El mayorista no cambia: bidón = 5 × precio por litro.
  const w = readPrices(csv(), run('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]'), { numberFormat: 'auto' }).find(p => p.id === 'aceite-oliva-extra-virgen-5l');
  assert.equal(w.packageTotalPrice, 5 * w.pricePerKg);
  // Un minorista vacío o en cero sigue siendo «Consultar precio».
  set('aceite-oliva-extra-virgen-5l', 'precio_minorista', '');
  await run('refreshPrices()');
  run("state.pricingMode = 'minorista'; renderProducts()");
  assert.match(card('aceite-oliva-extra-virgen-5l'), /Consultar precio/);
  console.log('OK: bidón de 5 litros $12.300/litro → total $61.500; carrito y WhatsApp sin doble multiplicación; otras presentaciones sin cambios.');
})().catch(e => { console.error(e); process.exitCode = 1; });
