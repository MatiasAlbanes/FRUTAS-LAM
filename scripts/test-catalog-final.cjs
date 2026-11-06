const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');
const status = { textContent: '', classList: { toggle() {} } };
const grid = { innerHTML: '' };
const context = vm.createContext({
  console: { warn() {} }, AbortController, AbortSignal, setTimeout, clearTimeout,
  document: { addEventListener() {}, getElementById: id => id === 'priceSyncStatus' ? status : id === 'productsGrid' ? grid : null },
  window: { PRICES_CONFIG: {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const run = code => vm.runInContext(code, context);
const products = run('PRODUCTS_DATA');
const consultationProducts = run('CONSULTATION_PRODUCTS');
const allProducts = [...products, ...consultationProducts];
const honey = consultationProducts.find(p => p.id === 'miel-churqui-1kg');
assert.ok(honey?.consultationOnly);
assert.equal(honey.image, 'assets/productos/miel-churqui-1kg.webp');
assert.ok(!products.some(p => p.id === honey.id), 'No inventar un precio para la miel Churqui');
for (const [mode, number] of [['mayorista', '5492634761151'], ['minorista', '5492634339550']]) {
  run(`state.pricingMode = '${mode}'; renderProducts()`);
  const card = grid.innerHTML.match(/<article[^>]*data-product-id="miel-churqui-1kg"[\s\S]*?<\/article>/)[0];
  assert.match(card, /Consultar precio/);
  assert.ok(card.includes('https://wa.me/' + number));
  assert.doesNotMatch(card, /primary-price">|btn-add-cart" data-id/);
  run("addToCart('miel-churqui-1kg', 1)");
  assert.equal(run('state.cart.length'), 0);
}
const html = fs.readFileSync('index.html', 'utf8');
assert.doesNotMatch(html, /class="hero-photo"/);
for (const number of ['5492634761151', '5492634339550']) {
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(m => m[1].includes('wa.me/' + number) && /(?:Mayorista|Minorista):/.test(m[2]));
  assert.equal(links.length, 2);
  for (const link of links) assert.match(link[2], /<svg/);
}
const csv = fs.readFileSync('data/precios.csv', 'utf8');
const updates = readPrices(csv, products);
assert.equal(products.length, 41);
assert.equal(new Set(products.map(p => p.id)).size, 41);
for (const p of products) {
  const imagePath = p.image.split('?')[0];
  assert.match(imagePath, /^assets\/productos\/.+\.webp$/);
  assert.ok(fs.statSync(imagePath).size > 0, p.id);
  assert.equal(p.packageTotalPrice, p.pricePerKg * p.packageKg, p.id);
  assert.equal(updates.find(row => row.id === p.id).packageTotalPrice, p.packageTotalPrice);
}
for (const id of ['nuez-con-cascara', 'pistacho-pelado', 'higo-blanco']) {
  assert.ok(!products.some(p => p.id === id));
}
const expected = {
  'nuez-mariposa-blanca': [10, 1350, 13500],
  'nuez-mariposa-light': [10, 1270, 12700],
  'nuez-cuartos-blanca': [10, 1250, 12500],
  'papaya': [10, 680, 6800],
  'harina-de-almendra': [10, 290, 2900],
  'mix-tropical-comun': [5, 6900, 34500],
  'mix-tropical-premium': [5, 8300, 41500],
  'mix-tropical-mega-eco': [5, 5400, 27000],
  'mix-tropical-sin-mani': [5, 9700, 48500],
  'mix-clasico-sin-mani': [5, 9700, 48500],
  'mix-clasico-con-mani': [5, 8900, 44500],
  'mix-patagonia': [5, 8700, 43500],
  'mix-cervecero': [5, 5560, 27800],
  'mix-frutal': [5, 8900, 44500]
};
for (const [id, values] of Object.entries(expected)) {
  const p = products.find(p => p.id === id);
  assert.deepEqual([p.packageKg, p.pricePerKg, p.packageTotalPrice], values, id);
}
assert.equal(products.filter(p => p.category === 'Mixes').length, 9);
const register = JSON.parse(fs.readFileSync('data/catalogo-fotos.json'));
assert.equal(register.length, 46);
for (const p of register) {
  assert.ok(fs.existsSync(p.foto));
  for (const id of p.productos) assert.ok(allProducts.some(product => product.id === id));
}
const pending = JSON.parse(fs.readFileSync('data/productos-pendientes.json'));
assert.equal(pending.filter(p => p.foto).length, 5);
for (const p of pending) assert.ok(!products.some(product => product.name === p.producto));

(async () => {
  vm.runInContext(fs.readFileSync('prices-config.js', 'utf8'), context);
  const calls = [];
  // Hoja antigua/incompleta: no debe reemplazar el catálogo nuevo ni impedir el lanzamiento.
  context.fetch = async url => {
    calls.push(url);
    return { ok: true, text: async () => url === 'data/precios.csv' ? csv : csv.split('\n').slice(0, -2).join('\n') };
  };
  await run('refreshPrices()');
  assert.equal(calls.length, 2);
  assert.equal(calls[1], 'data/precios.csv');
  assert.match(status.textContent, /Lista de lanzamiento vigente/);
  assert.equal(products.find(product => product.id === 'nuez-mariposa-blanca').packageTotalPrice, 13500);
  // Al cargar el Excel nuevo en Sheets se retoma la actualización online automáticamente.
  context.fetch = async () => ({ ok: true, text: async () => csv.replaceAll('13500.0', '14000.0') });
  await run('refreshPrices()');
  assert.equal(products.find(product => product.id === 'nuez-mariposa-blanca').packageTotalPrice, 14000);
  assert.match(status.textContent, /Precios actualizados/);
  // Una fila inválida posterior conserva el último precio online y nunca retrocede al respaldo.
  context.fetch = async () => ({ ok: true, text: async () => csv.replaceAll('13500.0', '-1') });
  await run('refreshPrices()');
  assert.equal(products.find(product => product.id === 'nuez-mariposa-blanca').packageTotalPrice, 14000);
  assert.match(status.textContent, /No pudimos actualizar/);
  console.log('OK: fotos finales, 41 productos, 9 mixes, cajas de 10 kg, bolsones de 5 kg, pendientes y migración de Sheets.');
})().catch(error => { console.error(error); process.exitCode = 1; });
