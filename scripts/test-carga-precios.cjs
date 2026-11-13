// Ningún importe se muestra antes de leer la planilla (o su respaldo), y el respaldo se regenera solo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { readPrices } = require('../prices.js');

const elements = new Map();
const el = () => ({ innerHTML: '', textContent: '', style: {}, value: '', hidden: false, disabled: false, classList: { toggle() {}, contains() { return false; } } });
const toasts = [];
const config = vm.runInNewContext(fs.readFileSync('prices-config.js', 'utf8') + ';window.PRICES_CONFIG', { window: {} });
const context = vm.createContext({
  console: { warn() {}, log() {} }, AbortController, AbortSignal, setTimeout, clearTimeout, URL,
  document: { addEventListener() {}, getElementById: id => (elements.has(id) || elements.set(id, el()), elements.get(id)), querySelector: () => null },
  window: { PRICES_CONFIG: config, open() {} }, PriceSheet: { readPrices }
});
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext('showToast = message => toastLog.push(message)', Object.assign(context, { toastLog: toasts }));
const run = code => vm.runInContext(code, context);
const grid = () => elements.get('productsGrid').innerHTML;
const card = id => grid().match(new RegExp(`<article[^>]*data-product-id="${id}"[\\s\\S]*?</article>`))[0];
const sheet = fs.readFileSync('scripts/fixtures/nueva-planilla-datos-web.csv', 'utf8');

(async () => {
  // 1) Antes de la primera lectura: «Cargando precios…», sin importes y sin poder comprar.
  for (const mode of ['mayorista', 'minorista']) {
    run(`state.pricingMode = '${mode}'; renderProducts()`);
    assert.match(card('nuez-mariposa-blanca'), /Cargando precios…/);
    assert.doesNotMatch(card('nuez-mariposa-blanca'), /\$\s?\d/, `Sin importes de referencia en ${mode}`);
    assert.match(card('nuez-mariposa-blanca'), /btn-add-cart"[^>]*disabled/);
    assert.match(card('miel-churqui-1kg'), /Consultar precio/);
    run("addToCart('nuez-mariposa-blanca', 1)");
    assert.equal(run('state.cart.length'), 0);
  }
  assert.match(toasts.at(-1), /cargando los precios/);

  // 2) Si Google y el respaldo fallan, se sigue sin mostrar importes (y se reintenta cada 60 s).
  context.fetch = async () => { throw new Error('Sin conexión'); };
  await run('refreshPrices()');
  run("state.pricingMode = 'mayorista'; renderProducts()");
  assert.match(card('nuez-mariposa-blanca'), /Cargando precios…/);

  // 3) Con la planilla: se muestran sus importes aunque coincidan con los de referencia.
  context.fetch = async () => ({ ok: true, text: async () => sheet });
  await run('refreshPrices()');
  assert.match(card('nuez-mariposa-blanca'), /13\.150/);
  assert.match(card('nuez-mariposa-blanca'), /131\.500/);
  assert.doesNotMatch(card('nuez-mariposa-blanca'), /Cargando precios/);
  run("addToCart('nuez-mariposa-blanca', 1)");
  assert.equal(run('state.cart[0].unitPrice'), 131500);

  // 4) Respaldo publicado: válido para el catálogo actual.
  const products = run('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]');
  const local = readPrices(fs.readFileSync('data/precios.csv', 'utf8'), products);
  assert.equal(local.length, 41);
  assert.ok(local.every(p => p.packageTotalPrice > 0));

  // 5) Script del respaldo: copia la planilla, no reescribe si no cambió y no toca nada si es inválida.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lam-respaldo-'));
  for (const file of ['app.js', 'prices.js', 'prices-config.js']) fs.copyFileSync(file, path.join(tmp, file));
  fs.mkdirSync(path.join(tmp, 'scripts')); fs.mkdirSync(path.join(tmp, 'data'));
  fs.copyFileSync('scripts/actualizar-respaldo.cjs', path.join(tmp, 'scripts/actualizar-respaldo.cjs'));
  fs.copyFileSync('scripts/fixtures/respaldo-referencia.csv', path.join(tmp, 'data/precios.csv'));
  const script = path.join(tmp, 'scripts/actualizar-respaldo.cjs');
  const target = path.join(tmp, 'data/precios.csv');
  const changedSheet = path.join(tmp, 'hoja.csv');
  fs.writeFileSync(changedSheet, sheet.replace('"$ 13,150.00"', '"$ 14,000.00"'));
  execFileSync('node', [script, changedSheet], { stdio: 'pipe' });
  const walnut = readPrices(fs.readFileSync(target, 'utf8'), products).find(p => p.id === 'nuez-mariposa-blanca');
  assert.equal(walnut.pricePerKg, 14000);
  assert.equal(walnut.packageTotalPrice, 140000);
  assert.match(execFileSync('node', [script, changedSheet]).toString(), /al día/);
  const before = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(changedSheet, sheet.replace('"$ 13,150.00"', ''));
  assert.throws(() => execFileSync('node', [script, changedSheet], { stdio: 'pipe' }));
  assert.equal(fs.readFileSync(target, 'utf8'), before, 'Una planilla inválida no pisa el respaldo');
  fs.rmSync(tmp, { recursive: true, force: true });

  // 6) La tarea automática existe, corre sola y publica solo data/precios.csv.
  const workflow = fs.readFileSync('.github/workflows/actualizar-precios.yml', 'utf8');
  assert.match(workflow, /cron: '\*\/15 \* \* \* \*'/);
  assert.match(workflow, /node scripts\/actualizar-respaldo\.cjs/);
  assert.match(workflow, /git commit [^\n]*-- data\/precios\.csv/);
  console.log('OK: sin importes antes de leer la planilla, respaldo automático que copia la planilla y no se pisa con datos inválidos.');
})().catch(error => { console.error(error); process.exitCode = 1; });
