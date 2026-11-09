// Rutas /mayorista y /minorista: modalidad inicial, URL al cambiar de modalidad, Atrás/Adelante y carrito.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');

// Elemento de DOM mínimo: cualquier método desconocido es inofensivo y los eventos se guardan.
function fakeElement(id) {
  const handlers = {};
  const base = { id, innerHTML: '', textContent: '', value: '', hidden: false, disabled: false, style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener(type, fn) { (handlers[type] ||= []).push(fn); }, handlers,
    setAttribute() {}, removeAttribute() {}, querySelector: () => null, querySelectorAll: () => [], focus() {}, click() {} };
  return base;
}
function createBrowser(startUrl) {
  const elements = new Map();
  const listeners = {};
  const entries = [{ url: new URL(startUrl, 'https://frutaslam.com.ar'), state: null }];
  let index = 0;
  const location = {
    get href() { return entries[index].url.href; }, get pathname() { return entries[index].url.pathname; },
    get search() { return entries[index].url.search; }, get hash() { return entries[index].url.hash; }
  };
  const fire = type => (listeners[type] || []).forEach(fn => fn({}));
  const history = {
    pushState(state, _t, url) { entries.splice(index + 1); entries.push({ url: new URL(url, location.href), state }); index++; },
    replaceState(state, _t, url) { entries[index] = { url: new URL(url, location.href), state }; },
    back() { index = Math.max(0, index - 1); fire('popstate'); },
    forward() { index = Math.min(entries.length - 1, index + 1); fire('popstate'); }
  };
  const domReady = [];
  const document = {
    hidden: false, body: fakeElement('body'),
    addEventListener(type, fn) { if (type === 'DOMContentLoaded') domReady.push(fn); },
    getElementById: id => { if (!elements.has(id)) elements.set(id, fakeElement(id)); return elements.get(id); },
    querySelector: () => fakeElement('q'), querySelectorAll: () => []
  };
  const window = { PRICES_CONFIG: {}, location, history, open() {},
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); } };
  const context = vm.createContext({ console: { warn() {}, log: console.log }, document, window, setInterval() {}, setTimeout, clearTimeout,
    AbortController, AbortSignal, URL, URLSearchParams, PriceSheet: { readPrices }, fetch: async () => { throw new Error('sin red'); } });
  vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
  vm.runInContext('showToast = () => {}', context);
  domReady.forEach(fn => fn());
  const run = code => vm.runInContext(code, context);
  const click = id => document.getElementById(id).handlers.click.forEach(fn => fn({ preventDefault() {} }));
  return { run, click, history, entries: () => entries.map(e => e.url.pathname + e.url.search + e.url.hash), now: () => location.pathname + location.search + location.hash };
}

// 1) Modalidad inicial según la URL de entrada.
let b = createBrowser('/');
assert.equal(b.run('state.pricingMode'), 'mayorista', '/ sigue entrando en mayorista');
assert.equal(b.now(), '/', '/ no se modifica al cargar');
assert.deepEqual(b.entries(), ['/']);
for (const [entry, mode, clean] of [
  ['/?modo=mayorista', 'mayorista', '/mayorista'], ['/?modo=minorista', 'minorista', '/minorista'],
  ['/?modo=minorista#catalogo', 'minorista', '/minorista#catalogo'], ['/minorista', 'minorista', '/minorista'],
  ['/mayorista/', 'mayorista', '/mayorista'], ['/?modo=inventado', 'mayorista', '/?modo=inventado']
]) {
  b = createBrowser(entry);
  assert.equal(b.run('state.pricingMode'), mode, `${entry} → ${mode}`);
  assert.equal(b.entries().length, 1, 'La normalización reemplaza la entrada, no agrega historial');
}
assert.equal(createBrowser('/?modo=minorista').now(), '/minorista', '?modo= queda como /minorista');
assert.equal(createBrowser('/?modo=minorista').entries().length, 1);
assert.equal(createBrowser('/?modo=minorista&x=1').now(), '/minorista?x=1', 'Conserva otros parámetros');

// 2) Cambiar de modalidad actualiza la URL y el historial; el clic en la modalidad ya activa no cambia nada.
b = createBrowser('/');
b.click('btnModeMayorista');
assert.equal(b.now(), '/', 'Clic en la modalidad activa: sin cambios');
b.click('btnModeMinorista');
assert.equal(b.run('state.pricingMode'), 'minorista'); assert.equal(b.now(), '/minorista');
b.click('btnModeMayorista');
assert.equal(b.run('state.pricingMode'), 'mayorista'); assert.equal(b.now(), '/mayorista');
assert.deepEqual(b.entries(), ['/', '/minorista', '/mayorista']);
b.click('cartTypeMinorista');
assert.equal(b.now(), '/minorista', 'Las pestañas del carrito también actualizan la URL');
b.click('cartTypeMayorista'); b.click('cartTypeMayorista');
assert.deepEqual(b.entries(), ['/', '/minorista', '/mayorista', '/minorista', '/mayorista']);

// 3) Atrás y Adelante cambian la modalidad sin tocar el carrito ni agregar historial.
b = createBrowser('/mayorista');
const [first] = b.run('PRODUCTS_DATA.map(p => p.id)');
b.run(`addToCart('${first}', 2)`);
const cartBefore = b.run('JSON.stringify(state.cart)');
b.click('btnModeMinorista');
assert.equal(b.now(), '/minorista');
b.history.back();
assert.equal(b.run('state.pricingMode'), 'mayorista'); assert.equal(b.now(), '/mayorista');
b.history.forward();
assert.equal(b.run('state.pricingMode'), 'minorista'); assert.equal(b.now(), '/minorista');
assert.deepEqual(b.entries(), ['/mayorista', '/minorista'], 'Atrás/Adelante no agregan entradas');
assert.equal(b.run('JSON.stringify(state.cart)'), cartBefore, 'El carrito se conserva al cambiar de modalidad y navegar');
// Atrás hasta la página principal (sin modalidad en la URL) vuelve al comportamiento por defecto.
b = createBrowser('/'); b.click('btnModeMinorista'); b.history.back();
assert.equal(b.run('state.pricingMode'), 'mayorista'); assert.equal(b.now(), '/');

// 4) Sin loops: cargar varias veces la misma entrada no agrega historial ni cambia la URL.
for (const entry of ['/?modo=minorista', '/minorista', '/']) {
  const x = createBrowser(entry); const before = x.entries().join();
  assert.equal(x.entries().join(), before);
}

// 5) Las páginas de entrada: mínimas, sin catálogo, sin bucle y con el destino correcto.
for (const mode of ['mayorista', 'minorista']) {
  const html = fs.readFileSync(`${mode}/index.html`, 'utf8');
  assert.ok(html.length < 2000, 'Página de entrada mínima');
  assert.ok(!/app\.js|styles\.css|assets\/productos/.test(html), 'No duplica catálogo ni scripts');
  assert.ok(html.includes(`content="0;url=../?modo=${mode}"`) && html.includes(`location.replace('../?modo=${mode}'`));
  assert.ok(html.includes(`rel="canonical" href="https://frutaslam.com.ar/${mode}"`));
  assert.ok(html.includes('og:image" content="https://frutaslam.com.ar/assets/logo-lam.png"'), 'Imagen de vista previa con URL absoluta');
  const target = new URL(`../?modo=${mode}`, `https://frutaslam.com.ar/${mode}/`);
  assert.equal(target.pathname + target.search, `/?modo=${mode}`, 'La redirección apunta a la página principal, no a sí misma');
}
// 6) La página principal no cambia salvo la versión del script.
const index = fs.readFileSync('index.html', 'utf8');
assert.match(index, /<script src="app\.js\?v=[^"]+"><\/script>/);
assert.ok(!/<base /i.test(index), 'Sin <base>: los enlaces #catalogo siguen siendo internos');
console.log('OK: /, /mayorista, /minorista, ?modo=, cambio de modalidad con URL, Atrás/Adelante, carrito intacto, sin bucles y páginas de entrada mínimas.');
