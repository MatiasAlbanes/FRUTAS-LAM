// Genera una tabla para pegar en A1 de la pestaña Precios EXISTENTE.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ document: { addEventListener() {} }, window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
const products = vm.runInContext('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]', context);
const prices = readPrices(fs.readFileSync(path.join(root, 'data/precios.csv'), 'utf8'), products);
const byId = new Map(prices.map(p => [p.id, p]));
const headers = ['id','producto','unidad','cantidad_mayorista','precio_mayorista','total_mayorista',
  'cantidad_minorista','precio_minorista','total_minorista','precio_presentacion','foto','presentacion'];
const rows = [headers];
products.forEach((p, index) => {
  const price = byId.get(p.id);
  const r = index + 2;
  rows.push([p.id, p.name, p.unit, price?.packageKg ?? p.packageKg,
    `=J${r}/D${r}`, `=D${r}*E${r}`,
    price?.retailQuantity ?? p.retailQuantity ?? 1,
    price?.retailPrice ?? '', `=G${r}*H${r}`, price?.packageTotalPrice ?? '', p.image, p.packageUnit]);
});
const target = path.join(root, 'EXCEL EDITABLE', 'Precios-para-Google-Sheets.tsv');
fs.writeFileSync(target, rows.map(row => row.join('\t')).join('\n') + '\n');
console.log(`Tabla lista para pegar: ${products.length} productos; miel Churqui sin precio; editar J (total) y H (minorista).`);
