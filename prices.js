/* Lector de planillas CSV; no ejecuta contenido de la planilla. */
(function (root) {
  'use strict';
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const firstLine = text.split(/\r?\n/, 1)[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { field += '"'; i++; }
        else if (quoted || field === '') quoted = !quoted;
        else throw new Error('Comillas inválidas en la planilla');
      } else if (!quoted && (c === delimiter || c === '\n' || c === '\r')) {
        row.push(field.trim()); field = '';
        if (c !== delimiter) {
          if (row.some(Boolean)) rows.push(row);
          row = [];
          if (c === '\r' && text[i + 1] === '\n') i++;
        }
      } else field += c;
    }
    if (quoted) throw new Error('Celda sin cerrar');
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }
  function positiveNumber(value, numberFormat) {
    let normalized;
    if (numberFormat === 'en-US') {
      // Google Sheets exporta los números con el formato visible de la hoja.
      if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,4})?$/.test(value)) {
        throw new Error('Número inválido: ' + value);
      }
      normalized = value.replace(/,/g, '');
    } else {
      // CSV local: sin separadores de miles; admite coma o punto decimal.
      if (!/^\d+(?:[.,]\d{1,4})?$/.test(value)) throw new Error('Número inválido: ' + value);
      normalized = value.replace(',', '.');
    }
    const number = Number(normalized);
    if (!Number.isFinite(number) || number <= 0 || number > 1e9) throw new Error('Valor fuera de rango');
    return number;
  }
  function readPrices(csv, products, options = {}) {
    const [headers, ...rows] = parseCSV(csv);
    const required = ['id', 'producto', 'unidad', 'cantidad', 'precio_unitario'];
    if (!headers || required.some(key => headers.filter(h => h === key).length !== 1)) {
      throw new Error('Faltan columnas o hay encabezados repetidos');
    }
    const catalog = new Map(products.map(p => [p.id, p]));
    const seen = new Set();
    const result = rows.map(row => {
      const cell = key => row[headers.indexOf(key)] || '';
      const id = cell('id'), product = catalog.get(id);
      if (!product || seen.has(id)) throw new Error('Producto desconocido o repetido: ' + id);
      seen.add(id);
      if (cell('unidad') !== product.unit) throw new Error('La unidad no coincide: ' + id);
      const quantity = positiveNumber(cell('cantidad'), options.numberFormat);
      const price = positiveNumber(cell('precio_unitario'), options.numberFormat);
      if (['frasco', 'balde'].includes(product.unit) && !Number.isInteger(quantity)) {
        throw new Error('La cantidad de unidades debe ser entera');
      }
      const total = Math.round(price * quantity * 100) / 100;
      if (total > 1e12) throw new Error('Total fuera de rango');
      let label = product.packageUnit;
      if (quantity !== product.packageKg) {
        label = product.unit === 'balde'
          ? `${quantity} baldes de 5 kg`
          : label.replace(/x [\d.,]+/, `x ${quantity}`);
      }
      return { id, pricePerKg: price, packageKg: quantity, packageTotalPrice: total, packageUnit: label };
    });
    if (seen.size !== products.length) throw new Error('La planilla debe contener todos los productos');
    return result;
  }
  root.PriceSheet = { parseCSV, readPrices };
  if (typeof module !== 'undefined') module.exports = root.PriceSheet;
})(typeof window !== 'undefined' ? window : globalThis);
