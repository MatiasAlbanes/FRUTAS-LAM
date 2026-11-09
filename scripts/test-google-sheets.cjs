const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');
const grid = { innerHTML: '' };
const status = { textContent: '', classList: { toggle() {} } };
const context = vm.createContext({
  console: { warn() {} }, AbortController, AbortSignal, setTimeout, clearTimeout,
  document: { addEventListener() {}, querySelector() { return null; }, getElementById: id => id === 'productsGrid' ? grid : id === 'priceSyncStatus' ? status : null },
  window: { PRICES_CONFIG: { csvUrl: 'https://example.test/precios.csv', numberFormat: 'auto' } },
  PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const run = code => vm.runInContext(code, context);
const products = run('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]');
const old = fs.readFileSync('scripts/fixtures/legacy-connected-prices.csv', 'utf8');
assert.throws(() => readPrices(old, products, { numberFormat: 'auto' }), e => e.code === 'CATALOG_MISMATCH');
const oldRows = parseCSV(old).slice(1);
const oldProducts = oldRows.map(r => ({id:r[0], unit:r[2], packageKg:Number(r[3]), packageUnit:'Presentación'}));
const oldPrices = readPrices(old, oldProducts, { numberFormat: 'auto' });
const initial = readPrices(fs.readFileSync('data/precios.csv', 'utf8'), products);
for (const id of ['nuez-mariposa-blanca','miel-pura-campo-medio-kg']) {
  assert.equal(initial.find(p => p.id === id).retailPrice, oldPrices.find(p => p.id === id).retailPrice);
}
assert.equal(initial.find(p => p.id === 'nuez-mariposa-blanca').retailPrice, 1500);
assert.equal(initial.find(p => p.id === 'miel-pura-campo-medio-kg').retailPrice, 1967);
const tsv = fs.readFileSync('EXCEL EDITABLE/Precios-para-Google-Sheets.tsv', 'utf8');
const [headers, ...rows] = parseCSV(tsv);
const column = key => headers.indexOf(key);
assert.equal(rows.length, 42);
const parsed = readPrices(tsv, products, { numberFormat: 'auto' });
const honey = parsed.find(p => p.id === 'miel-churqui-1kg');
assert.equal(honey.packageTotalPrice, null);
assert.equal(honey.retailPrice, null);
assert.equal(parsed.find(p => p.id === 'nuez-mariposa-blanca').packageTotalPrice, 13500);
// El total editable manda aun si el precio unitario calculado todavía no se actualizó.
rows[0][column('precio_presentacion')] = '14000';
rows[0][column('precio_mayorista')] = '1350';
const honeyRow = rows.find(r => r[0] === 'miel-churqui-1kg');
const serialize = () => [headers, ...rows].map(r => r.join('\t')).join('\n');
const modified = readPrices(serialize(), products, { numberFormat: 'auto' });
assert.equal(modified[0].pricePerKg, 1400);
assert.equal(modified[0].packageTotalPrice, 14000);
// Las filas incompletas y los importes inválidos siguen rechazándose de forma atómica.
const badRows = rows.map(r => [...r]);
badRows[0][column('precio_presentacion')] = '-1';
assert.throws(() => readPrices([headers,...badRows].map(r => r.join('\t')).join('\n'), products));

(async () => {
  context.fetch = async () => ({ok:true, text:async()=>serialize()});
  await run('refreshPrices()');
  const walnut = products.find(p => p.id === 'nuez-mariposa-blanca'); // el catálogo ya no empieza por la nuez
  assert.equal(walnut.packageTotalPrice, 14000);
  assert.equal(walnut.retailPrice, 1500);
  // Importe solo de prueba: no se escribe en ningún archivo de entrega ni hoja real.
  honeyRow[column('precio_presentacion')] = '9000';
  await run('refreshPrices()');
  run("state.pricingMode='mayorista'; renderProducts(); addToCart('miel-churqui-1kg', 2)");
  let card = grid.innerHTML.match(/<article[^>]*data-product-id="miel-churqui-1kg"[\s\S]*?<\/article>/)[0];
  assert.match(card, /9\.000/);
  assert.doesNotMatch(card, /Consultar precio/);
  assert.equal(run('state.cart[0].unitPrice * state.cart[0].qty'), 18000);
  run("state.pricingMode='minorista'; renderProducts()");
  card = grid.innerHTML.match(/<article[^>]*data-product-id="miel-churqui-1kg"[\s\S]*?<\/article>/)[0];
  assert.match(card, /Consultar precio/);
  honeyRow[column('precio_presentacion')] = '';
  await run('refreshPrices()');
  assert.equal(run('state.cart[0].unitPrice'), null);
  assert.equal(products.find(p => p.id === 'miel-churqui-1kg').packageTotalPrice, null);
  console.log('OK: caso real de Sheets, 42 filas, minoristas preservados, total editable y activación de miel solo cuando se carga precio.');
})().catch(e => {console.error(e);process.exitCode=1;});
