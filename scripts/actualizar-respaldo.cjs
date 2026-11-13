// Copia los precios vigentes de Google Sheets (pestaña DATOS WEB) a data/precios.csv, el respaldo
// que usa la web solo si la planilla no responde al abrir la página.
// Lo ejecuta automáticamente .github/workflows/actualizar-precios.yml: el cliente solo edita la planilla.
// Uso manual: node scripts/actualizar-respaldo.cjs            (descarga la planilla configurada)
//             node scripts/actualizar-respaldo.cjs hoja.csv   (usa una exportación ya descargada)
// Valida la hoja con el mismo lector de la web: si algo no coincide con el catálogo, no escribe nada
// y el respaldo anterior queda intacto.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { readPrices } = require('../prices.js');

const root = path.resolve(__dirname, '..');
const csvPath = path.join(root, 'data', 'precios.csv');
const BOM = '﻿';

async function loadSheet() {
  if (process.argv[2]) return fs.readFileSync(process.argv[2], 'utf8');
  const config = vm.runInNewContext(fs.readFileSync(path.join(root, 'prices-config.js'), 'utf8') + ';window.PRICES_CONFIG', { window: {} });
  const response = await fetch(config.csvUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`No se pudo descargar la planilla: HTTP ${response.status}`);
  return response.text();
}

const number = value => value == null ? '' : Number.isInteger(value) ? value.toFixed(1) : String(value);

(async () => {
  const context = vm.createContext({ document: { addEventListener() {} }, window: {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  const products = vm.runInContext('[...PRODUCTS_DATA, ...CONSULTATION_PRODUCTS]', context);
  const prices = readPrices(await loadSheet(), products, { numberFormat: 'auto' });
  const byId = new Map(prices.map(p => [p.id, p]));

  // Mismo formato que genera crear-planilla.py; precio_presentacion = precio por unidad (kg, litro, frasco…).
  const header = ['id', 'producto', 'unidad', 'cantidad_mayorista', 'precio_mayorista', 'total_mayorista',
    'cantidad_minorista', 'precio_minorista', 'total_minorista', 'precio_presentacion', 'foto', 'presentacion'];
  // Conserva el orden de filas del respaldo actual; los productos nuevos van al final.
  const previousOrder = fs.existsSync(csvPath)
    ? fs.readFileSync(csvPath, 'utf8').replace(BOM, '').split(/\r?\n/).slice(1).map(line => line.split(';')[0])
    : [];
  const position = id => (previousOrder.indexOf(id) + 1) || Infinity;
  const rows = products.filter(p => byId.has(p.id))
    .sort((a, b) => position(a.id) - position(b.id))
    .map(p => {
      const price = byId.get(p.id);
      return [p.id, p.name, p.unit, number(price.packageKg), number(price.pricePerKg), number(price.packageTotalPrice),
        number(price.retailQuantity), number(price.retailPrice), number(price.retailTotal), number(price.pricePerKg),
        p.image, price.packageUnit].join(';');
    });
  const content = BOM + [header.join(';'), ...rows].join('\n') + '\n';
  const previous = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : '';
  if (content === previous) {
    console.log('Respaldo al día: la planilla no cambió.');
    return;
  }
  fs.writeFileSync(csvPath, content);
  console.log(`Respaldo actualizado: ${prices.length} productos (${prices.filter(p => p.retailPrice > 0).length} con minorista) en data/precios.csv.`);
})().catch(error => { console.error('No se actualizó el respaldo:', error.message); process.exit(1); });
