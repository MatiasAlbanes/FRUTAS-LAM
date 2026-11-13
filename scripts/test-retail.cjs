const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');
const elements = new Map();
for (const id of ['productsGrid', 'emptyState', 'cartCount', 'cartItemsContainer', 'cartEmptyState',
  'cartDrawerFooter', 'cartTotalPrice', 'cartSummaryLabel', 'btnSendWhatsAppOrder',
  'btnSendRetailWhatsAppOrder', 'cartPickupNote', 'cartCustomerName', 'cartDeliverySelect']) {
  elements.set(id, { innerHTML: '', textContent: '', style: {}, value: '', hidden: false, disabled: false });
}
elements.get('cartDeliverySelect').value = 'retiro';
const pickupOption = { textContent: '' };
const tooltip = { textContent: '' };
const floating = { setAttribute(name, value) { this[name] = value; }, querySelector() { return tooltip; } };
const opened = [];
const context = vm.createContext({
  console, AbortController, setTimeout, clearTimeout,
  document: {
    addEventListener() {}, getElementById: id => elements.get(id) || null,
    querySelector: selector => selector.startsWith('#cartDeliverySelect') ? pickupOption : floating
  },
  window: { PRICES_CONFIG: {}, open: url => opened.push(new URL(url)) }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext('showToast = () => {}', context);
const run = code => vm.runInContext(code, context);
const products = run('PRODUCTS_DATA');
const [headers, ...rows] = parseCSV(fs.readFileSync('scripts/fixtures/respaldo-referencia.csv', 'utf8'));
const field = key => headers.indexOf(key);
const serialize = (h, r) => [h, ...r].map(row => row.join(';')).join('\n');
// Fixture controlada para probar ceros: un cero no es un precio válido, equivale a «sin precio».
for (const row of rows) { row[field('precio_minorista')] = '0'; row[field('total_minorista')] = '0'; }
const original = serialize(headers, rows);
assert.equal(rows.length, 41);
for (const p of readPrices(original, products)) {
  assert.equal(p.retailPrice, null);
  assert.equal(p.retailTotal, null);
  assert.equal(p.retailQuantity, 1);
}
// Compatibilidad con la hoja mayorista publicada antes de la ampliación.
const legacy = serialize(['id','producto','unidad','cantidad','precio_unitario','total_presentacion'], rows.map(r => r.slice(0,6)));
// Sin columnas minoristas se conserva el minorista que ya tiene la ficha (respaldo vigente).
assert.equal(readPrices(legacy, products)[0].retailPrice, products.find(p => p.id === rows[0][0]).retailPrice);
rows[0][field('cantidad_minorista')] = '0,5';
rows[0][field('precio_minorista')] = '20000';
const retailCSV = serialize(headers, rows);
const parsed = readPrices(retailCSV, products);
assert.equal(parsed[0].retailTotal, 10000);
assert.equal(parsed[0].packageTotalPrice, 131500, 'Minorista no debe modificar la lista mayorista');
for (const bad of ['-1', 'NaN', '<img>', '1,2,3']) {
  assert.throws(() => readPrices(retailCSV.replace(';20000;', ';'+bad+';'), products));
}
const fractionalJars = rows.map(r => [...r]);
fractionalJars.find(r => r[2] === 'frasco')[field('cantidad_minorista')] = '0,5';
assert.throws(() => readPrices(serialize(headers, fractionalJars), products));

(async () => {
  context.fetch = async () => ({ ok: true, text: async () => retailCSV });
  await run('refreshPrices()');
  run("state.pricingMode = 'minorista'; renderProducts(); syncModeContact()");
  assert.match(elements.get('productsGrid').innerHTML, /20\.000/);
  assert.match(elements.get('productsGrid').innerHTML, /10\.000/);
  assert.doesNotMatch(elements.get('productsGrid').innerHTML, /[Aa] coordinar|[Aa] cotizar/);
  assert.match(floating.href, /5492634339550/);
  run("addToCart(PRODUCTS_DATA.find(p => p.id === 'nuez-mariposa-blanca').id, 2)");
  assert.match(elements.get('cartTotalPrice').textContent, /20\.000/);
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, true);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').hidden, false);
  assert.match(pickupOption.textContent, /9 de Julio 1189/);
  run("sendOrderToWhatsApp('minorista')");
  assert.equal(opened.at(-1).pathname, '/5492634339550');
  assert.match(opened.at(-1).searchParams.get('text'), /20\.000/);
  assert.match(opened.at(-1).searchParams.get('text'), /9 de Julio 1189/);

  // Un carrito mixto debe separar destinatario, artículos, ubicación y total.
  run("state.pricingMode = 'mayorista'; addToCart(PRODUCTS_DATA.find(p => p.id === 'nuez-cuartos-blanca').id, 1); syncModeContact()");
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, false);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').hidden, false);
  assert.match(elements.get('cartTotalPrice').textContent, /141\.000/);
  assert.match(floating.href, /5492634761151/);
  run("sendOrderToWhatsApp('mayorista')");
  assert.equal(opened.at(-1).pathname, '/5492634761151');
  const wholesaleText = opened.at(-1).searchParams.get('text');
  assert.match(wholesaleText, /Nuez Cuartos Blanca/);
  assert.doesNotMatch(wholesaleText, /Partida a mano/);
  assert.match(wholesaleText, /121\.000/);
  assert.match(wholesaleText, /Ingeniero Giagnoni, Junín/);
  assert.match(wholesaleText, /3Xq155JCwf7fQ5Y49/);
  run("sendOrderToWhatsApp('minorista')");
  assert.doesNotMatch(opened.at(-1).searchParams.get('text'), /Nuez Cuartos Blanca/);

  // Actualiza ambos precios y el carrito sin alterar cantidades.
  context.fetch = async () => ({ ok: true, text: async () => retailCSV.replace(';20000;', ';22000;') });
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].qty'), 2);
  assert.equal(run('state.cart[0].unitPrice'), 11000);
  assert.match(elements.get('cartTotalPrice').textContent, /143\.000/);
  // Celda vacía no equivale a precio cero: impide enviar un subtotal incompleto.
  context.fetch = async () => ({ ok: true, text: async () => retailCSV.replace(';20000;', ';;') });
  await run('refreshPrices()');
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').disabled, true);
  const before = opened.length;
  run("sendOrderToWhatsApp('minorista')");
  assert.equal(opened.length, before);
  // Un cero tampoco es un precio: no se cotiza, no se puede enviar y se muestra «Consultar precio».
  context.fetch = async () => ({ ok: true, text: async () => original });
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].unitPrice'), null);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').disabled, true);
  const beforeZero = opened.length;
  run("sendOrderToWhatsApp('minorista')");
  assert.equal(opened.length, beforeZero);
  run("state.pricingMode = 'minorista'; renderProducts()");
  assert.match(elements.get('productsGrid').innerHTML, /Consultar precio/);
  assert.doesNotMatch(elements.get('productsGrid').innerHTML, /\$\s?0(?![\d.,])/);
  const cartBeforeZero = run('state.cart.length');
  run("addToCart('nuez-cuartos-blanca', 1)");
  assert.equal(run('state.cart.length'), cartBeforeZero, 'No se puede agregar un minorista en cero');
  run("removeCartItem(state.cart[1].cartItemId)");
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, true);
  assert.match(elements.get('cartTotalPrice').textContent, /sin precio/);
  // Regresión real: Google exporta mayoristas en inglés y minoristas con coma decimal.
  const mixedCSV = fs.readFileSync('scripts/fixtures/mixed-price-formats.csv', 'utf8');
  context.window.PRICES_CONFIG = { csvUrl: 'https://example.test/precios.csv', numberFormat: 'auto' };
  context.fetch = async () => ({ ok: true, text: async () => mixedCSV });
  await run('refreshPrices()');
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').pricePerKg, 12800);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').retailPrice, 1500);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').retailQuantity, 1);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').retailTotal, 1500);
  assert.equal(run('state.cart[0].unitPrice'), 1500);
  assert.match(elements.get('cartTotalPrice').textContent, /3\.000/);
  run("state.pricingMode = 'minorista'; renderProducts(); sendOrderToWhatsApp('minorista')");
  assert.match(elements.get('productsGrid').innerHTML, /1\.500/);
  assert.equal(opened.at(-1).pathname, '/5492634339550');
  assert.match(opened.at(-1).searchParams.get('text'), /3\.000/);
  console.log('OK: planilla real con formatos mezclados → minorista $1.500, carrito y WhatsApp $3.000.');
  console.log('OK: minorista $0, fraccionamiento, precios separados, carrito mixto, dos WhatsApp, retiros y actualización online.');
})().catch(error => { console.error(error); process.exitCode = 1; });
