// Mix Europeo: producto nuevo cuyo precio carga el cliente en la planilla (EDITAR PRECIOS → DATOS WEB).
// Antes de cargarlo se muestra «Consultar precio» sin romper la lectura del resto; al cargarlo se vende como cualquier mix.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');

const elements = new Map();
for (const id of ['productsGrid', 'emptyState', 'cartCount', 'cartItemsContainer', 'cartEmptyState', 'cartDrawerFooter',
  'cartTotalPrice', 'cartSummaryLabel', 'btnSendWhatsAppOrder', 'btnSendRetailWhatsAppOrder', 'cartPickupNote',
  'cartCustomerName', 'cartDeliverySelect', 'priceSyncStatus', 'catalogCategoryTitle', 'catalogResultCount']) {
  elements.set(id, { innerHTML: '', textContent: '', style: {}, value: '', hidden: false, disabled: false, classList: { toggle() {} } });
}
const floating = { setAttribute() {}, querySelector() { return { textContent: '' }; } };
const config = vm.runInNewContext(fs.readFileSync('prices-config.js', 'utf8') + ';window.PRICES_CONFIG', { window: {} });
const context = vm.createContext({
  console: { warn() {}, log: console.log }, AbortController, AbortSignal, setTimeout, clearTimeout, URL,
  document: { addEventListener() {}, getElementById: id => elements.get(id) || null, querySelector: () => floating, querySelectorAll: () => [] },
  window: { PRICES_CONFIG: config, open() {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext('showToast = () => {}', context);
const run = code => vm.runInContext(code, context);
const products = run('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]');
const opts = { numberFormat: 'auto' };
const real = fs.readFileSync('scripts/fixtures/nueva-planilla-datos-web.csv', 'utf8');

// 1) Alta en el catálogo: mismo formato que los demás mixes, foto final y precio opcional.
const europeo = products.find(p => p.id === 'mix-europeo');
assert.ok(europeo, 'Mix Europeo está en el catálogo');
assert.deepEqual([europeo.name, europeo.category, europeo.unit, europeo.packageKg, europeo.packageUnit],
  ['Mix Europeo', 'Mixes', 'kg', 5, 'Bolsón x 5 kg']);
assert.equal(europeo.image, 'assets/productos/mix-europeo.webp');
assert.ok(fs.statSync(europeo.image).size > 0);
assert.ok(europeo.optionalPriceRow && europeo.consultationOnly);
assert.equal(europeo.pricePerKg, null); assert.equal(europeo.packageTotalPrice, null);

// 2) Planilla sin la fila todavía: se lee igual (no se rechaza toda la hoja).
assert.equal(readPrices(real, products, opts).some(p => p.id === 'mix-europeo'), false);

// 3) Fila agregada en DATOS WEB. Se agrega al final como en la planilla real (control_nombre al final).
const withRow = (price, retail, text = real) => {
  const [h, ...r] = parseCSV(text);
  const row = new Array(h.length).fill('');
  Object.entries({ id: 'mix-europeo', producto: 'Mix Europeo', unidad: 'kg', cantidad_mayorista: '5',
    precio_presentacion: price, cantidad_minorista: '1', precio_minorista: retail, control_nombre: 'OK' })
    .forEach(([key, value]) => { row[h.indexOf(key)] = value; });
  return [h, ...r, row].map(x => x.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
};
const read = csv => readPrices(csv, products, opts).find(p => p.id === 'mix-europeo');
// Precio sin cargar: celda vacía o «$ 0.00» (fórmula que apunta a una celda en blanco) = a consultar.
for (const empty of ['', '$ 0.00', '0']) {
  const row = read(withRow(empty, empty));
  assert.equal(row.pricePerKg, null, `mayorista «${empty}» = sin precio`);
  assert.equal(row.packageTotalPrice, null);
  assert.equal(row.retailPrice, null);
  assert.equal(readPrices(withRow(empty, empty), products, opts).length, 42, 'El resto de la hoja se sigue leyendo');
}
// Cargado: precio por kg × 5 = bolsón, como los demás mixes.
const priced = read(withRow('$ 7,000.00', '$ 7,500.00'));
assert.equal(priced.pricePerKg, 7000); assert.equal(priced.packageTotalPrice, 35000);
assert.equal(priced.packageKg, 5); assert.equal(priced.packageUnit, 'Bolsón x 5 kg');
assert.equal(priced.retailPrice, 7500); assert.equal(priced.retailTotal, 7500);
// Un precio mal escrito en Mix Europeo sigue rechazando la hoja, igual que en los otros productos.
assert.throws(() => read(withRow('abc', '')));
// Los otros productos obligatorios siguen sin admitir $0 ni vacío.
const [h, ...r] = parseCSV(withRow('', ''));
r.find(x => x[0] === 'mix-frutal')[h.indexOf('precio_presentacion')] = '$ 0.00';
assert.throws(() => readPrices([h, ...r].map(x => x.join(',')).join('\n'), products, opts));

(async () => {
  const card = id => elements.get('productsGrid').innerHTML.match(new RegExp(`<article[^>]*data-product-id="${id}"[\\s\\S]*?</article>`))[0];
  const load = async csv => {
    context.fetch = async () => ({ ok: true, text: async () => csv });
    await run('refreshPrices()');
  };

  // 4) Planilla con la fila pero sin precio: tarjeta «Consultar precio» con WhatsApp, sin carrito, en ambas modalidades.
  await load(withRow('', ''));
  assert.match(elements.get('priceSyncStatus').textContent, /Precios actualizados/);
  for (const [mode, number] of [['mayorista', '5492634761151'], ['minorista', '5492634339550']]) {
    run(`state.pricingMode = '${mode}'; renderProducts()`);
    assert.match(card('mix-europeo'), /Consultar precio/);
    assert.ok(card('mix-europeo').includes('https://wa.me/' + number));
    assert.ok(card('mix-europeo').includes('assets/productos/mix-europeo.webp'));
    assert.doesNotMatch(card('mix-europeo'), /primary-price">|btn-add-cart" data-id/);
    run("addToCart('mix-europeo', 1)");
    assert.equal(run('state.cart.length'), 0, 'No se vende sin precio');
  }

  // 5) El cliente carga los dos precios: mayorista $7.000/kg → bolsón $35.000; minorista $7.500/kg.
  await load(withRow('$ 7,000.00', '$ 7,500.00'));
  run("state.pricingMode = 'mayorista'; renderProducts()");
  assert.doesNotMatch(card('mix-europeo'), /Consultar precio/);
  assert.match(card('mix-europeo'), /7\.000/);
  assert.match(card('mix-europeo'), /Total bolsón: <strong>\$\s?35\.000/);
  assert.match(card('mix-europeo'), /btn-add-cart" data-id="mix-europeo"/);
  run("addToCart('mix-europeo', 2)");
  assert.equal(run("state.cart.find(i => i.productId === 'mix-europeo').unitPrice"), 35000);
  run("state.cart.length = 0; state.pricingMode = 'minorista'; renderProducts()");
  assert.match(card('mix-europeo'), /7\.500/);
  run("addToCart('mix-europeo', 1)");
  assert.equal(run("state.cart.find(i => i.productId === 'mix-europeo').unitPrice"), 7500);

  // 6) Solo mayorista cargado: el minorista queda «Consultar precio» y no se compra (como en el resto).
  run("state.cart.length = 0");
  await load(withRow('$ 7,000.00', ''));
  run("state.pricingMode = 'minorista'; renderProducts()");
  assert.match(card('mix-europeo'), /Consultar precio/);
  run("addToCart('mix-europeo', 1)");
  assert.equal(run('state.cart.length'), 0);
  run("state.pricingMode = 'mayorista'; renderProducts()");
  assert.match(card('mix-europeo'), /Total bolsón: <strong>\$\s?35\.000/);

  // 7) Aparece en el filtro Mixes (10 mixes) y en la búsqueda.
  run("state.searchQuery = ''; setCategory('Mixes')");
  assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id="(mix-[^"]+)"/g)].length, 10);
  run("state.searchQuery = 'europeo'; setCategory('all')");
  assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id=/g)].length, 1);
  // 8) «Qué contiene»: los 10 mixes lo muestran en un desplegable; el resto de los productos no.
  const mixes = products.filter(p => p.category === 'Mixes');
  assert.equal(mixes.length, 10);
  run("state.searchQuery = ''; state.pricingMode = 'mayorista'; setCategory('all')");
  const html = elements.get('productsGrid').innerHTML;
  const detailsOf = id => card(id).match(/<details class="product-contains"[^>]*>[\s\S]*?<\/details>/)?.[0];
  for (const mix of mixes) {
    assert.ok(mix.contains && !/opcional/i.test(mix.contains), `${mix.id} tiene su lista de ingredientes`);
    assert.match(detailsOf(mix.id), new RegExp('<summary>Qué contiene</summary>\\s*<p>' + mix.contains + '</p>'));
  }
  assert.equal([...html.matchAll(/<details class="product-contains"/g)].length, 10, 'Solo los mixes llevan desplegable');
  assert.doesNotMatch(card('papaya'), /product-contains/);
  assert.match(detailsOf('mix-europeo'), /avellana/);
  assert.match(detailsOf('mix-cervecero'), /Maíz frito, maní saborizado, semilla de zapallo, maní salado/);
  assert.doesNotMatch(detailsOf('mix-frutal'), /almendra/);
  // También en «Consultar precio» y en minorista; y el buscador encuentra por ingrediente.
  assert.match(detailsOf('mix-europeo'), /Qué contiene/);
  run("state.pricingMode = 'minorista'; renderProducts()");
  assert.equal([...elements.get('productsGrid').innerHTML.matchAll(/<details class="product-contains"/g)].length, 10);
  run("state.pricingMode = 'mayorista'");
  // Una ficha abierta sigue abierta cuando la grilla se vuelve a dibujar (por ejemplo, al actualizar precios).
  assert.doesNotMatch(card('mix-europeo'), /product-contains"[^>]*\sopen/);
  run("openContains.add('mix-europeo'); renderProducts()");
  assert.match(card('mix-europeo'), /product-contains"[^>]*\sopen/);
  assert.doesNotMatch(card('mix-frutal'), /product-contains"[^>]*\sopen/);
  // Mix Europeo queda en el grupo de mixes de arriba, antes del primer producto que no es mix tras ellos.
  const order = [...elements.get('productsGrid').innerHTML.matchAll(/data-product-id="([^"]+)"/g)].map(m => m[1]);
  assert.ok(order.indexOf('mix-europeo') < order.indexOf('medallon-durazno'), 'Mix Europeo está arriba con los demás mixes');
  assert.ok(order.indexOf('mix-europeo') < order.indexOf('mix-cervecero'));
  run("openContains.clear(); state.searchQuery = 'avellana'; setCategory('all')");
  assert.deepEqual([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id="([^"]+)"/g)].map(m => m[1]), ['mix-europeo'], 'Buscar «avellana» encuentra solo el Europeo');
  run("state.searchQuery = 'kiwi'; renderProducts()");
  assert.deepEqual([...elements.get('productsGrid').innerHTML.matchAll(/data-product-id="([^"]+)"/g)].map(m => m[1]), ['mix-frutal']);
  run("state.searchQuery = ''; renderProducts()");
  console.log('OK: Mix Europeo — sin fila o sin precio = «Consultar precio»; con precio = bolsón de 5 kg (mayorista × 5) y minorista, como los demás mixes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
