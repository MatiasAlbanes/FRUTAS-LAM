// Excepción mayorista de Granola: precio por kg × 20 = bolsón de 20 kg; el resto no cambia.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const PriceSheet = require(path.join(root, 'prices.js'));
const src = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const products = vm.runInNewContext(src.match(/const PRODUCTS_DATA = (\[[\s\S]*?\n\]);/)[1]);
const csv = fs.readFileSync(path.join(root, 'data/precios.csv'), 'utf8');
const rows = csv.trim().split(/\r?\n/).map(l => l.split(';'));
const head = rows[0];
const col = n => head.indexOf(n);
const withGranola = price => rows.map((r, i) => {
  if (i && r[0] === 'granola-artesanal') { r = r.slice(); r[col('precio_presentacion')] = price; r[col('cantidad_mayorista')] = '10.0'; }
  return r.join(';');
}).join('\n');
const read = text => PriceSheet.readPrices(text, products.concat(vm.runInNewContext(src.match(/const CONSULTATION_PRODUCTS = (\[[\s\S]*?\n\]);/)?.[1] || '[]')));
const base = read(csv);
const g = read(withGranola('4350')).find(x => x.id === 'granola-artesanal');
assert.strictEqual(g.packageKg, 20);
assert.strictEqual(g.packageUnit, 'Bolsón x 20 kg');
assert.strictEqual(g.pricePerKg, 4350);
assert.strictEqual(g.packageTotalPrice, 87000);
const other = read(withGranola('4350'));
for (const p of base.filter(x => x.id !== 'granola-artesanal')) {
  assert.deepStrictEqual(other.find(x => x.id === p.id), p, 'cambió ' + p.id);
}
assert.strictEqual(other.find(x => x.id === 'granola-artesanal').retailPrice, base.find(x => x.id === 'granola-artesanal').retailPrice);
console.log('OK: Granola = precio por kg × 20 (bolsón de 20 kg, $87.000 con $4.350/kg); demás productos y minorista idénticos.');
