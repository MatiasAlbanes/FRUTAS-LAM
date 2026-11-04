const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');
const status = { textContent: '', classList: { toggle() {} } };
const context = vm.createContext({
  console: { warn() {} }, AbortController, AbortSignal, setTimeout, clearTimeout,
  document: { addEventListener() {}, getElementById: id => id === 'priceSyncStatus' ? status : null },
  window: { PRICES_CONFIG: {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const run = code => vm.runInContext(code, context);
const products = run('PRODUCTS_DATA');
const csv = fs.readFileSync('data/precios.csv', 'utf8');
const updates = readPrices(csv, products);
assert.equal(products.length, 41);
assert.equal(new Set(products.map(p => p.id)).size, 41);
for (const p of products) {
  assert.match(p.image, /^assets\/productos\/.+\.webp$/);
  assert.ok(fs.statSync(p.image).size > 0, p.id);
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
  for (const id of p.productos) assert.ok(products.some(product => product.id === id));
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
  assert.equal(products[0].packageTotalPrice, 13500);
  // Al cargar el Excel nuevo en Sheets se retoma la actualización online automáticamente.
  context.fetch = async () => ({ ok: true, text: async () => csv.replace('10.0;1350.0;13500.0', '10.0;1400.0;14000.0') });
  await run('refreshPrices()');
  assert.equal(products[0].packageTotalPrice, 14000);
  assert.match(status.textContent, /Precios actualizados/);
  // Una fila inválida posterior conserva el último precio online y nunca retrocede al respaldo.
  context.fetch = async () => ({ ok: true, text: async () => csv.replace('1350.0', '-1') });
  await run('refreshPrices()');
  assert.equal(products[0].packageTotalPrice, 14000);
  assert.match(status.textContent, /No pudimos actualizar/);
  console.log('OK: fotos finales, 41 productos, 9 mixes, cajas de 10 kg, bolsones de 5 kg, pendientes y migración de Sheets.');
})().catch(error => { console.error(error); process.exitCode = 1; });
