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
const original = fs.readFileSync('data/precios.csv', 'utf8');
const [headers, ...rows] = parseCSV(original);
const field = key => headers.indexOf(key);
const serialize = (h, r) => [h, ...r].map(row => row.join(';')).join('\n');
assert.equal(rows.length, 32);
for (const p of readPrices(original, products)) {
  assert.equal(p.retailPrice, 0);
  assert.equal(p.retailTotal, 0);
  assert.equal(p.retailQuantity, 1);
}
// Compatibilidad con la hoja mayorista publicada antes de la ampliación.
const legacy = serialize(['id','producto','unidad','cantidad','precio_unitario','total_presentacion'], rows.map(r => r.slice(0,6)));
assert.equal(readPrices(legacy, products)[0].retailPrice, 0);
rows[0][field('cantidad_minorista')] = '0,5';
rows[0][field('precio_minorista')] = '20000';
const retailCSV = serialize(headers, rows);
const parsed = readPrices(retailCSV, products);
assert.equal(parsed[0].retailTotal, 10000);
assert.equal(parsed[0].packageTotalPrice, 128000, 'Minorista no debe modificar la lista mayorista');
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
  run("addToCart(PRODUCTS_DATA[0].id, 2)");
  assert.match(elements.get('cartTotalPrice').textContent, /20\.000/);
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, true);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').hidden, false);
  assert.match(pickupOption.textContent, /9 de Julio 1189/);
  run("sendOrderToWhatsApp('minorista')");
  assert.equal(opened.at(-1).pathname, '/5492634339550');
  assert.match(opened.at(-1).searchParams.get('text'), /20\.000/);
  assert.match(opened.at(-1).searchParams.get('text'), /9 de Julio 1189/);

  // Un carrito mixto debe separar destinatario, artículos, ubicación y total.
  run("state.pricingMode = 'mayorista'; addToCart(PRODUCTS_DATA[1].id, 1); syncModeContact()");
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, false);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').hidden, false);
  assert.match(elements.get('cartTotalPrice').textContent, /138\.000/);
  assert.match(floating.href, /5492634761151/);
  run("sendOrderToWhatsApp('mayorista')");
  assert.equal(opened.at(-1).pathname, '/5492634761151');
  const wholesaleText = opened.at(-1).searchParams.get('text');
  assert.match(wholesaleText, /Nuez Cuartos Blanca/);
  assert.doesNotMatch(wholesaleText, /Partida a mano/);
  assert.match(wholesaleText, /118\.000/);
  assert.match(wholesaleText, /Ingeniero Giagnoni, Junín/);
  assert.match(wholesaleText, /3Xq155JCwf7fQ5Y49/);
  run("sendOrderToWhatsApp('minorista')");
  assert.doesNotMatch(opened.at(-1).searchParams.get('text'), /Nuez Cuartos Blanca/);

  // Actualiza ambos precios y el carrito sin alterar cantidades.
  context.fetch = async () => ({ ok: true, text: async () => retailCSV.replace(';20000;', ';22000;') });
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].qty'), 2);
  assert.equal(run('state.cart[0].unitPrice'), 11000);
  assert.match(elements.get('cartTotalPrice').textContent, /140\.000/);
  // Celda vacía no equivale a precio cero: impide enviar un subtotal incompleto.
  context.fetch = async () => ({ ok: true, text: async () => retailCSV.replace(';20000;', ';;') });
  await run('refreshPrices()');
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').disabled, true);
  const before = opened.length;
  run("sendOrderToWhatsApp('minorista')");
  assert.equal(opened.length, before);
  // El cero solicitado sí se muestra y se calcula como cero.
  context.fetch = async () => ({ ok: true, text: async () => original });
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].unitPrice'), 0);
  assert.equal(elements.get('btnSendRetailWhatsAppOrder').disabled, false);
  run("removeCartItem(state.cart[1].cartItemId)");
  assert.equal(elements.get('btnSendWhatsAppOrder').hidden, true);
  assert.match(elements.get('cartTotalPrice').textContent, /0/);
  console.log('OK: minorista $0, fraccionamiento, precios separados, carrito mixto, dos WhatsApp, retiros y actualización online.');
})().catch(error => { console.error(error); process.exitCode = 1; });
