const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');
// Validar también compatibilidad con las nueve columnas anteriores.
const csv = parseCSV(fs.readFileSync('data/precios.csv', 'utf8')).map(row => row.slice(0, 9).join(';')).join('\n');
const context = vm.createContext({
  console: { warn() {} }, AbortController, setTimeout, clearTimeout,
  document: { addEventListener() {}, getElementById() { return null; } }, window: { PRICES_CONFIG: {} },
  PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const products = vm.runInContext('PRODUCTS_DATA', context);
assert.equal(products.length, 41);
const parsed = readPrices(csv, products);
assert.equal(parsed.length, 41);
for (const p of products) {
  const row = parsed.find(r => r.id === p.id);
  assert.equal(row.packageTotalPrice, p.packageTotalPrice);
  assert.equal(row.packageUnit, p.packageUnit);
}
const changed = csv.replace('10.0;1350.0', '7,5;15000');
const first = readPrices(changed, products)[0];
assert.equal(first.pricePerKg, 15000);
assert.equal(first.packageTotalPrice, 112500);
assert.equal(first.packageUnit, 'Caja x 7.5 kg');
for (const bad of [
  csv.replace('1350.0', '-100'), csv.replace('1350.0', 'NaN'),
  csv.replace('1350.0', '<script>'), csv.replace('1350.0', ''),
  csv.replace('10.0;1350.0', '0;12800'),
  csv.replace('nuez-cuartos-blanca;', 'nuez-mariposa-blanca;'),
  csv.replace('nuez-cuartos-blanca;', 'desconocido;'),
  csv.split('\n').slice(0, -2).join('\n'),
  csv.replace(';frasco;1.0;', ';frasco;1.5;'),
  csv.replace(';kg;10.0;', ';litro;10.0;')
]) assert.throws(() => readPrices(bad, products));
const commaCSV = csv.split(/\r?\n/).map(line => line.split(';').map(s => '"'+s.replaceAll('"','""')+'"').join(',')).join('\r\n');
assert.equal(readPrices(commaCSV, products).length, 41);
vm.runInContext(`
  renderProducts = () => {};
  updateCartUI = () => {};
  showToast = () => {};
  state.cart.push({ productId: PRODUCTS_DATA.find(p => p.id === 'nuez-mariposa-blanca').id, mode: 'mayorista', qty: 2 });
`, context);
(async () => {
  context.fetch = async () => ({ ok: true, text: async () => changed });
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').pricePerKg, 15000);
  assert.equal(vm.runInContext('state.cart[0].unitPrice', context), 112500);
  assert.equal(vm.runInContext('state.cart[0].qty', context), 2);
  context.fetch = async () => ({ ok: true, text: async () => csv.replace('1250.0', '-1') });
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').pricePerKg, 15000, 'La actualización fallida debe ser atómica');
  context.fetch = async () => { throw Error('Sin conexión'); };
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products.find(p => p.id === 'nuez-mariposa-blanca').pricePerKg, 15000);
  // Verifica el formato publicado por Sheets sin confundir 12,800.00 con 12.8.
  const formatted = commaCSV.replace('"1350.0"', '"12,800.00"');
  assert.equal(readPrices(formatted, products, { numberFormat: 'en-US' })[0].pricePerKg, 12800);
  for (const bad of ['12,80.00', '12.800,00', '1,2,800', '$12800', '-12800']) {
    assert.throws(() => readPrices(formatted.replace('12,800.00', bad), products, { numberFormat: 'en-US' }));
  }
  const mixedFixture = fs.readFileSync('scripts/fixtures/mixed-price-formats.csv', 'utf8');
  const mixed = readPrices(mixedFixture, products, { numberFormat: 'auto' });
  assert.equal(mixed[0].pricePerKg, 12800);
  assert.equal(mixed[0].packageTotalPrice, 128000);
  assert.equal(mixed[0].retailPrice, 1500);
  assert.equal(mixed[0].retailQuantity, 1);
  assert.equal(mixed[0].retailTotal, 1500);
  assert.equal(mixed[1].retailPrice, 0);
  for (const [value, expected] of [['12.800,00', 12800], ['12,800.00', 12800], ['1500,50', 1500.5], ['1.234,56', 1234.56]]) {
    assert.equal(readPrices(mixedFixture.replace('1500,00', value), products, { numberFormat: 'auto' })[0].retailPrice, expected);
  }
  for (const bad of ['-1500', '1,2,3', '12,80.00', '$1500', 'NaN']) {
    assert.throws(() => readPrices(mixedFixture.replace('1500,00', bad), products, { numberFormat: 'auto' }));
  }
  // Los separadores ambiguos siguen el formato de la columna, no el del resto de la hoja.
  const regionalQty = mixedFixture.replaceAll('"1,00"', '"1,000"');
  const spanishQty = regionalQty.replace('"1,000"', '"1,00"');
  const englishQty = regionalQty.replace('"1,000"', '"1.00"');
  assert.equal(readPrices(spanishQty, products, { numberFormat: 'auto' })[1].retailQuantity, 1);
  assert.equal(readPrices(englishQty, products, { numberFormat: 'auto' })[1].retailQuantity, 1000);
  if (process.argv[2]) {
    const publishedCSV = fs.readFileSync(process.argv[2], 'utf8');
    vm.runInContext(fs.readFileSync('prices-config.js', 'utf8'), context);
    let requestedUrl;
    context.fetch = async url => { requestedUrl = url; return { ok: true, text: async () => publishedCSV }; };
    await vm.runInContext('refreshPrices()', context);
    assert.equal(requestedUrl, context.window.PRICES_CONFIG.csvUrl);
    const live = readPrices(publishedCSV, products, context.window.PRICES_CONFIG);
    assert.equal(live.length, 41);
    for (const update of live) {
      const product = products.find(p => p.id === update.id);
      assert.equal(product.pricePerKg, update.pricePerKg);
      assert.equal(product.packageTotalPrice, update.packageTotalPrice);
      assert.equal(product.retailPrice, update.retailPrice);
      assert.equal(product.retailTotal, update.retailTotal);
    }
    assert.equal(vm.runInContext('state.cart[0].unitPrice', context), live[0].packageTotalPrice);
    console.log('OK: CSV publicado real, configuración online, catálogo y carrito.');
  }
  console.log('OK: 41 productos, totales, CSV Excel/online, decimales, validación, carrito y fallos de red.');
})().catch(error => { console.error(error); process.exitCode = 1; });
