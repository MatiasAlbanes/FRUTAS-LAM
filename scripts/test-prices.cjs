const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');
const csv = fs.readFileSync('data/precios.csv', 'utf8');
const context = vm.createContext({
  console: { warn() {} }, AbortController, setTimeout, clearTimeout,
  document: { addEventListener() {} }, window: { PRICES_CONFIG: {} },
  PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const products = vm.runInContext('PRODUCTS_DATA', context);
assert.equal(products.length, 32);
const parsed = readPrices(csv, products);
assert.equal(parsed.length, 32);
for (const p of products) {
  const row = parsed.find(r => r.id === p.id);
  assert.equal(row.packageTotalPrice, p.packageTotalPrice);
  assert.equal(row.packageUnit, p.packageUnit);
}
const changed = csv.replace('10.0;12800.0', '7,5;15000');
const first = readPrices(changed, products)[0];
assert.equal(first.pricePerKg, 15000);
assert.equal(first.packageTotalPrice, 112500);
assert.equal(first.packageUnit, 'Caja x 7.5 kg');
for (const bad of [
  csv.replace('12800.0', '-100'), csv.replace('12800.0', 'NaN'),
  csv.replace('12800.0', '<script>'), csv.replace('12800.0', ''),
  csv.replace('10.0;12800.0', '0;12800'),
  csv.replace('nuez-cuartos-blanca;', 'nuez-mariposa-blanca;'),
  csv.replace('nuez-cuartos-blanca;', 'desconocido;'),
  csv.split('\n').slice(0, -2).join('\n'),
  csv.replace(';frasco;6.0;', ';frasco;6.5;'),
  csv.replace(';kg;10.0;', ';litro;10.0;')
]) assert.throws(() => readPrices(bad, products));
const commaCSV = csv.split(/\r?\n/).map(line => line.split(';').map(s => '"'+s.replaceAll('"','""')+'"').join(',')).join('\r\n');
assert.equal(readPrices(commaCSV, products).length, 32);
vm.runInContext(`
  renderProducts = () => {};
  updateCartUI = () => {};
  showToast = () => {};
  state.cart.push({ productId: PRODUCTS_DATA[0].id, mode: 'mayorista', qty: 2 });
`, context);
(async () => {
  context.fetch = async () => ({ ok: true, text: async () => changed });
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products[0].pricePerKg, 15000);
  assert.equal(vm.runInContext('state.cart[0].unitPrice', context), 112500);
  assert.equal(vm.runInContext('state.cart[0].qty', context), 2);
  context.fetch = async () => ({ ok: true, text: async () => csv.replace('11800.0', '-1') });
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products[0].pricePerKg, 15000, 'La actualización fallida debe ser atómica');
  context.fetch = async () => { throw Error('Sin conexión'); };
  await vm.runInContext('refreshPrices()', context);
  assert.equal(products[0].pricePerKg, 15000);
  // Verifica el formato publicado por Sheets sin confundir 12,800.00 con 12.8.
  const formatted = commaCSV.replace('"12800.0"', '"12,800.00"');
  assert.equal(readPrices(formatted, products, { numberFormat: 'en-US' })[0].pricePerKg, 12800);
  for (const bad of ['12,80.00', '12.800,00', '1,2,800', '$12800', '-12800']) {
    assert.throws(() => readPrices(formatted.replace('12,800.00', bad), products, { numberFormat: 'en-US' }));
  }
  if (process.argv[2]) {
    const publishedCSV = fs.readFileSync(process.argv[2], 'utf8');
    vm.runInContext(fs.readFileSync('prices-config.js', 'utf8'), context);
    let requestedUrl;
    context.fetch = async url => { requestedUrl = url; return { ok: true, text: async () => publishedCSV }; };
    await vm.runInContext('refreshPrices()', context);
    assert.equal(requestedUrl, context.window.PRICES_CONFIG.csvUrl);
    const live = readPrices(publishedCSV, products, context.window.PRICES_CONFIG);
    assert.equal(live.length, 32);
    for (const update of live) {
      const product = products.find(p => p.id === update.id);
      assert.equal(product.pricePerKg, update.pricePerKg);
      assert.equal(product.packageTotalPrice, update.packageTotalPrice);
    }
    assert.equal(vm.runInContext('state.cart[0].unitPrice', context), live[0].packageTotalPrice);
    console.log('OK: CSV publicado real, configuración online, catálogo y carrito.');
  }
  console.log('OK: 32 productos, totales, CSV Excel/online, decimales, validación, carrito y fallos de red.');
})().catch(error => { console.error(error); process.exitCode = 1; });
