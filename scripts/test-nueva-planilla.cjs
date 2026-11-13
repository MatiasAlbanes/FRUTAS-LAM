// Verifica la conexión con la nueva planilla (pestaña DATOS WEB) usando una copia del CSV real exportado.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices, parseCSV } = require('../prices.js');

const elements = new Map();
for (const id of ['productsGrid', 'emptyState', 'cartCount', 'cartItemsContainer', 'cartEmptyState', 'cartDrawerFooter',
  'cartTotalPrice', 'cartSummaryLabel', 'btnSendWhatsAppOrder', 'btnSendRetailWhatsAppOrder', 'cartPickupNote',
  'cartCustomerName', 'cartDeliverySelect', 'priceSyncStatus']) {
  elements.set(id, { innerHTML: '', textContent: '', style: {}, value: '', hidden: false, disabled: false, classList: { toggle() {} } });
}
const floating = { setAttribute() {}, querySelector() { return { textContent: '' }; } };
const config = vm.runInNewContext(fs.readFileSync('prices-config.js', 'utf8') + ';window.PRICES_CONFIG', { window: {} });
const context = vm.createContext({
  console: { warn() {}, log: console.log }, AbortController, AbortSignal, setTimeout, clearTimeout, URL,
  document: { addEventListener() {}, getElementById: id => elements.get(id) || null, querySelector: () => floating },
  window: { PRICES_CONFIG: config, open() {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext('showToast = () => {}', context);
const run = code => vm.runInContext(code, context);
const products = run('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]');
const real = fs.readFileSync('scripts/fixtures/nueva-planilla-datos-web.csv', 'utf8');
const opts = { numberFormat: 'auto' };

// 1) Configuración: nueva planilla, respaldo local y actualización cada 60 s.
assert.match(config.csvUrl, /\/d\/1qruO_fHiunD41a2_P611gMfe_T_ta8XYhUbbiPCctV4\/export\?format=csv&gid=2898121$/);
assert.equal(config.fallbackCsvUrl, 'data/precios.csv');
assert.equal(config.refreshMs, 60000);

// 2) El CSV real (con "$ 13,500.00") se lee completo y coincide con el catálogo de app.js.
const [headers, ...rows] = parseCSV(real);
assert.equal(rows.length, 41);
assert.equal(new Set(rows.map(r => r[0])).size, 41, 'IDs sin duplicados');
const catalog = products.filter(p => !p.consultationOnly);
assert.deepEqual(rows.map(r => r[0]).sort(), Array.from(catalog, p => p.id).sort(), 'Los 41 IDs coinciden con app.js');
// control_nombre avisa si el cliente retocó un nombre en EDITAR PRECIOS («Granola », «chips banana»…);
// la web usa el id, así que un REVISAR no cambia qué precio recibe cada producto.
assert.ok(rows.every(r => ['OK', 'REVISAR'].includes(r[headers.indexOf('control_nombre')])));
const parsed = readPrices(real, products, opts);
assert.equal(parsed.length, 41);
assert.equal(parsed.some(p => p.id === 'miel-churqui-1kg'), false, 'La miel Churqui no está en la planilla');
for (const p of parsed) {
  const product = catalog.find(x => x.id === p.id);
  assert.equal(p.packageTotalPrice, product.packageTotalPrice, `Mayorista ${p.id}`);
  assert.equal(p.packageKg, product.packageKg, `Cantidad ${p.id}`);
  assert.equal(p.retailQuantity, 1);
}
const byRetail = id => parsed.find(p => p.id === id).retailPrice;
const withRetail = parsed.filter(p => p.retailPrice !== null).map(p => [p.id, p.retailPrice]);
assert.equal(withRetail.length, 41, 'La planilla vigente tiene minorista en los 41 productos');
assert.equal(byRetail('nuez-mariposa-blanca'), 13600);
assert.equal(byRetail('miel-pura-campo-medio-kg'), 5150);

// 3) El mayorista es el precio POR KG (por unidad): el total de la presentación = precio × cantidad.
const byRow = id => parsed.find(p => p.id === id);
assert.equal(byRow('nuez-mariposa-blanca').pricePerKg, 13150); assert.equal(byRow('nuez-mariposa-blanca').packageTotalPrice, 131500, 'Caja de 10 kg = 10 × precio por kg');
assert.equal(byRow('mix-tropical-comun').pricePerKg, 6900); assert.equal(byRow('mix-tropical-comun').packageTotalPrice, 34500, 'Bolsón de 5 kg = 5 × precio por kg');
assert.equal(byRow('aceite-oliva-extra-virgen-5l').pricePerKg, 11400); assert.equal(byRow('aceite-oliva-extra-virgen-5l').packageTotalPrice, 57000, 'Bidón de 5 litros = 5 × precio por litro');
assert.equal(byRow('aceituna-griega-5kg').packageTotalPrice, 41500, 'Presentaciones de 1 unidad: precio = total');

// Mayorista y minorista son independientes.
const edit = (id, key, value, text = real) => {
  const [h, ...r] = parseCSV(text);
  r.find(x => x[0] === id)[h.indexOf(key)] = value;
  return [h, ...r].map(x => x.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
};
let walnut = readPrices(edit('nuez-mariposa-blanca', 'precio_presentacion', '$ 1,500.00'), products, opts).find(p => p.id === 'nuez-mariposa-blanca');
assert.equal(walnut.packageTotalPrice, 15000); assert.equal(walnut.pricePerKg, 1500); assert.equal(walnut.retailPrice, 13600);
walnut = readPrices(edit('nuez-mariposa-blanca', 'precio_minorista', '$ 1,800.00'), products, opts).find(p => p.id === 'nuez-mariposa-blanca');
assert.equal(walnut.retailPrice, 1800); assert.equal(walnut.packageTotalPrice, 131500);
for (const empty of ['', '0', '$ 0.00']) {
  walnut = readPrices(edit('nuez-mariposa-blanca', 'precio_minorista', empty), products, opts).find(p => p.id === 'nuez-mariposa-blanca');
  assert.equal(walnut.retailPrice, null, `minorista «${empty}» = sin precio`);
  assert.equal(walnut.retailTotal, null);
  assert.equal(walnut.packageTotalPrice, 131500, 'El mayorista no se toca');
}
// Una fila inválida rechaza la lista completa (se conservan los últimos precios válidos).
assert.throws(() => readPrices(edit('nuez-mariposa-blanca', 'precio_presentacion', ''), products, opts));
assert.throws(() => readPrices(edit('nuez-mariposa-blanca', 'precio_presentacion', '$ 0.00'), products, opts));
assert.throws(() => readPrices(edit('nuez-mariposa-blanca', 'id', 'nuez-inventada'), products, opts), e => e.code === 'CATALOG_MISMATCH');

(async () => {
  // 4) Respaldo y actualización: la planilla online manda; si cae al inicio, se usa data/precios.csv.
  const requested = [];
  // Nuez cuartos con el minorista vacío para comprobar «Consultar precio».
  const noRetail = edit('nuez-cuartos-blanca', 'precio_minorista', '');
  context.fetch = async url => { requested.push(url); return { ok: true, text: async () => noRetail }; };
  await run('refreshPrices()');
  assert.equal(requested[0], config.csvUrl);
  const byId = id => run(`PRODUCTS_DATA.find(p => p.id === '${id}')`);
  assert.equal(byId('nuez-mariposa-blanca').retailTotal, 13600);
  assert.equal(byId('nuez-cuartos-blanca').retailPrice, null);

  // 5) Minorista vacío: «Consultar precio», botón deshabilitado y sin compra posible.
  run("state.pricingMode = 'minorista'; renderProducts()");
  const card = id => elements.get('productsGrid').innerHTML.match(new RegExp(`<article[^>]*data-product-id="${id}"[\\s\\S]*?</article>`))[0];
  assert.match(card('nuez-cuartos-blanca'), /Consultar precio/);
  assert.match(card('nuez-cuartos-blanca'), /btn-add-cart"[^>]*disabled/);
  assert.doesNotMatch(card('nuez-cuartos-blanca'), /\$\s?0(?![\d.,])/);
  assert.doesNotMatch(card('nuez-mariposa-blanca'), /Consultar precio/);
  run("addToCart('nuez-cuartos-blanca', 1)");
  assert.equal(run('state.cart.length'), 0, 'No se compra un producto minorista sin precio');
  run("addToCart('nuez-mariposa-blanca', 2)");
  assert.equal(run('state.cart[0].unitPrice'), 13600);
  // El mayorista de ese mismo producto sigue disponible y es independiente.
  run("state.pricingMode = 'mayorista'; addToCart('nuez-cuartos-blanca', 1)");
  assert.equal(run("state.cart.find(i => i.productId === 'nuez-cuartos-blanca').unitPrice"), 121000);

  // Un cero que llegara por cualquier vía tampoco se puede comprar.
  run("const z = PRODUCTS_DATA.find(p => p.id === 'nuez-cuartos-blanca'); z.retailPrice = 0; z.retailTotal = 0; state.pricingMode = 'minorista'");
  const before = run('state.cart.length');
  run("addToCart('nuez-cuartos-blanca', 1)");
  assert.equal(run('state.cart.length'), before, 'Un minorista en $0 no se compra');
  run("renderProducts()");
  assert.match(card('nuez-cuartos-blanca'), /Consultar precio/);

  // 6) Miel Churqui 1 kg sigue como «Consultar precio» en ambas modalidades.
  for (const mode of ['mayorista', 'minorista']) {
    run(`state.pricingMode = '${mode}'; renderProducts()`);
    assert.match(card('miel-churqui-1kg'), /Consultar precio/);
  }

  // 7) Respaldo: si la planilla falla antes de la primera lectura válida, se usa data/precios.csv.
  run("lastPriceSync = null; lastPriceSource = null");
  const urls = [];
  context.fetch = async url => {
    urls.push(url);
    if (url === config.csvUrl) throw new Error('Sin conexión con Google');
    return { ok: true, text: async () => fs.readFileSync(url, 'utf8') };
  };
  await run('refreshPrices()');
  assert.deepEqual(urls, [config.csvUrl, 'data/precios.csv']);
  assert.equal(run('lastPriceSource'), 'local');
  // data/precios.csv lo reescribe la tarea automática con la planilla vigente: se valida su forma, no sus importes.
  const local = readPrices(fs.readFileSync('data/precios.csv', 'utf8'), products);
  assert.equal(local.length, 41);
  assert.ok(local.every(p => p.pricePerKg > 0 && p.packageTotalPrice > 0), 'El respaldo tiene mayorista en todos los productos');
  assert.ok(local.every(p => p.retailPrice === null || p.retailPrice > 0), 'El respaldo no tiene minoristas en $0');
  // Con una lectura válida previa, una caída posterior conserva los últimos precios y no vuelve al respaldo.
  context.fetch = async () => ({ ok: true, text: async () => edit('nuez-mariposa-blanca', 'precio_presentacion', '$ 1,500.00') });
  await run('refreshPrices()');
  assert.equal(byId('nuez-mariposa-blanca').packageTotalPrice, 15000);
  assert.equal(run('lastPriceSource'), 'online');
  urls.length = 0;
  context.fetch = async url => { urls.push(url); throw new Error('Sin conexión'); };
  await run('refreshPrices()');
  assert.deepEqual(urls, [config.csvUrl], 'Con una lectura válida previa no se usa el respaldo');
  assert.equal(byId('nuez-mariposa-blanca').packageTotalPrice, 15000);
  // Actualización automática cada 60 s (mínimo 15 s) mientras la página está visible.
  assert.match(fs.readFileSync('app.js', 'utf8'), /setInterval\([\s\S]*?Math\.max\(15000, window\.PRICES_CONFIG\?\.refreshMs \|\| 60000\)/);
  console.log('OK: nueva planilla (41 IDs, precios del CSV real), independencia mayorista/minorista, $0 y vacío = «Consultar precio», miel Churqui, respaldo y 60 s.');
})().catch(e => { console.error(e); process.exitCode = 1; });
