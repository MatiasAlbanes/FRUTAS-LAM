const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');
const html = fs.readFileSync('index.html', 'utf8');
const names = ['Nueces', 'Almendras', 'Aceite y aceitunas', 'Frutos secos varios', 'Deshidratados'];
const elements = new Map();
function element() {
  const classes = new Set();
  return {
    innerHTML: '', textContent: '', style: {}, disabled: false,
    classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); }, contains(name) { return classes.has(name); } },
    setAttribute(name, value) { this[name] = value; }
  };
}
for (const id of ['productsGrid', 'emptyState', 'catalogCategoryTitle', 'catalogResultCount', 'priceSyncStatus', 'refreshPricesBtn']) elements.set(id, element());
const buttons = [...html.matchAll(/class="(filter-tab(?: active)?|category-card)" data-(filter|category)="([^"]+)"/g)]
  .map(match => ({ ...element(), dataset: { [match[2]]: match[3] } }));
assert.equal(buttons.filter(b => b.dataset.category).length, 5);
assert.equal(buttons.filter(b => b.dataset.filter).length, 6);
const context = vm.createContext({
  console: { warn() {} }, AbortController, setTimeout, clearTimeout,
  document: { addEventListener() {}, getElementById: id => elements.get(id) || null, querySelectorAll: () => buttons },
  window: { PRICES_CONFIG: {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
const run = code => vm.runInContext(code, context);
const products = run('PRODUCTS_DATA');
assert.deepEqual([...new Set(products.map(p => p.category))].sort(), [...names].sort());
assert.equal(products.find(p => p.id === 'aceite-oliva-extra-virgen').category, 'Aceite y aceitunas');
for (const id of ['pistacho-pelado','castana-caju-vietnam','mani-sin-sal']) {
  assert.equal(products.find(p => p.id === id).category, 'Frutos secos varios');
}
let total = 0;
for (const name of names) {
  run(`setCategory(${JSON.stringify(name)})`);
  const expected = products.filter(p => p.category === name);
  total += expected.length;
  const renderedIds = [...elements.get('productsGrid').innerHTML.matchAll(/data-product-id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(renderedIds.sort(), Array.from(expected, p => p.id).sort());
  assert.equal(elements.get('catalogCategoryTitle').textContent, name);
  assert.match(elements.get('catalogResultCount').textContent, new RegExp('^'+expected.length+' productos$'));
  assert.equal(buttons.filter(b => b['aria-pressed'] === 'true').length, 2);
  run("state.pricingMode = 'minorista'; renderProducts()");
  assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id=/g)].length, expected.length);
}
assert.equal(total, 32);
run("setCategory('Nueces'); state.searchQuery = 'cuartos'; renderProducts()");
assert.match(elements.get('productsGrid').innerHTML, /nuez-cuartos-blanca/);
assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id=/g)].length, 1);
run("state.searchQuery = 'aceituna'; renderProducts()");
assert.equal(elements.get('productsGrid').innerHTML, '');
assert.equal(elements.get('emptyState').style.display, 'block');
run("state.searchQuery = ''; setCategory('all')");
assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id=/g)].length, 32);
assert.equal(buttons.filter(b => b['aria-pressed'] === 'true').length, 1);
run("setCategory('inexistente')");
assert.equal(run('state.activeCategory'), 'all');
(async () => {
  const csv = fs.readFileSync('data/precios.csv', 'utf8');
  let release;
  context.fetch = () => new Promise(resolve => { release = resolve; });
  const loading = run('refreshPrices()');
  assert.equal(elements.get('refreshPricesBtn').disabled, true);
  assert.match(elements.get('priceSyncStatus').textContent, /Actualizando/);
  release({ ok: true, text: async () => csv });
  await loading;
  assert.match(elements.get('priceSyncStatus').textContent, /Precios actualizados/);
  assert.equal(elements.get('refreshPricesBtn').disabled, false);
  const oldPrice = products[0].pricePerKg;
  context.fetch = async () => { throw Error('Sin conexión'); };
  await run('refreshPrices()');
  assert.match(elements.get('priceSyncStatus').textContent, /No pudimos actualizar. Última lectura:/);
  assert.equal(elements.get('priceSyncStatus').classList.contains('sync-error'), true);
  assert.equal(elements.get('refreshPricesBtn').disabled, false);
  assert.equal(products[0].pricePerKg, oldPrice);
  context.fetch = async () => ({ ok: true, text: async () => csv.replace('12800.0', '-1') });
  await run('refreshPrices()');
  assert.match(elements.get('priceSyncStatus').textContent, /No pudimos actualizar/);
  assert.equal(products[0].pricePerKg, oldPrice);
  console.log('OK: cinco categorías, 32 productos, filtros en ambas listas, búsqueda, accesibilidad y estado real de actualización.');
})().catch(error => { console.error(error); process.exitCode = 1; });
