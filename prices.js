/* Lector de planillas CSV; no ejecuta contenido de la planilla. */
(function (root) {
  'use strict';
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    const firstLine = text.split(/\r?\n/, 1)[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
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
  // Google exporta las celdas con formato de moneda tal como se ven (p. ej. "$ 13,500.00").
  const stripCurrency = value => value.replace(/^\$\s*/, '');
  const NUMBER_FORMATS = {
    'en-US': /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,4})?$/,
    'es-AR': /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,4})?$/
  };
  function columnFormat(rows, index) {
    // Usar el formato de la columna para los casos ambiguos como 1,000.
    // Los valores no ambiguos se interpretan individualmente, aunque se mezclen formatos.
    let english = 0, spanish = 0;
    for (const row of rows) {
      const value = stripCurrency(row[index] || '');
      const en = NUMBER_FORMATS['en-US'].test(value);
      const es = NUMBER_FORMATS['es-AR'].test(value);
      if (en && !es) english++;
      if (es && !en) spanish++;
    }
    return spanish > english ? 'auto-es-AR' : 'auto-en-US';
  }
  function positiveNumber(value, numberFormat, allowZero = false) {
    value = stripCurrency(value);
    let normalized;
    if (numberFormat?.startsWith('auto-')) {
      const en = NUMBER_FORMATS['en-US'].test(value);
      const es = NUMBER_FORMATS['es-AR'].test(value);
      if (!en && !es) throw new Error('Número inválido: ' + value);
      numberFormat = en && es ? numberFormat.slice(5) : en ? 'en-US' : 'es-AR';
    }
    if (NUMBER_FORMATS[numberFormat]) {
      if (!NUMBER_FORMATS[numberFormat].test(value)) throw new Error('Número inválido: ' + value);
      normalized = numberFormat === 'en-US'
        ? value.replace(/,/g, '')
        : value.replace(/\./g, '').replace(',', '.');
    } else {
      // CSV local: sin separadores de miles; admite coma o punto decimal.
      if (!/^\d+(?:[.,]\d{1,4})?$/.test(value)) throw new Error('Número inválido: ' + value);
      normalized = value.replace(',', '.');
    }
    const number = Number(normalized);
    if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0) || number > 1e9) throw new Error('Valor fuera de rango');
    return number;
  }
  function readPrices(csv, products, options = {}) {
    const [headers, ...rows] = parseCSV(csv);
    const quantityColumn = headers?.includes('cantidad_mayorista') ? 'cantidad_mayorista' : 'cantidad';
    const priceColumn = headers?.includes('precio_mayorista') ? 'precio_mayorista' : 'precio_unitario';
    const hasPresentationPrice = headers?.includes('precio_presentacion');
    const required = ['id', 'producto', 'unidad', quantityColumn, hasPresentationPrice ? 'precio_presentacion' : priceColumn];
    if (!headers || required.some(key => headers.filter(h => h === key).length !== 1)) {
      throw new Error('Faltan columnas o hay encabezados repetidos');
    }
    for (const key of ['precio_minorista', 'cantidad_minorista', priceColumn]) {
      if (headers.filter(h => h === key).length > 1) throw new Error('Columna repetida: ' + key);
    }
    const formats = Object.fromEntries(headers.map((key, index) => [key,
      options.numberFormat === 'auto' ? columnFormat(rows, index) : options.numberFormat
    ]));
    const catalog = new Map(products.map(p => [p.id, p]));
    const seen = new Set();
    const result = rows.map(row => {
      const cell = key => row[headers.indexOf(key)] || '';
      const id = cell('id'), product = catalog.get(id);
      if (!product) {
        const error = new Error('La hoja contiene un producto fuera del catálogo: ' + id);
        error.code = 'CATALOG_MISMATCH';
        throw error;
      }
      if (seen.has(id)) throw new Error('Producto repetido: ' + id);
      seen.add(id);
      if (cell('unidad') !== product.unit) throw new Error('La unidad no coincide: ' + id);
      const quantity = positiveNumber(cell(quantityColumn), formats[quantityColumn]);
      const rawPrice = cell(hasPresentationPrice ? 'precio_presentacion' : priceColumn);
      const pending = product.optionalPriceRow && rawPrice === '';
      const amount = pending ? null : positiveNumber(rawPrice, formats[hasPresentationPrice ? 'precio_presentacion' : priceColumn]);
      const price = amount === null ? null : hasPresentationPrice ? amount / quantity : amount;
      if (['frasco', 'balde'].includes(product.unit) && !Number.isInteger(quantity)) {
        throw new Error('La cantidad de unidades debe ser entera');
      }
      // Las columnas nuevas son opcionales durante la migración de la hoja publicada.
      // Un minorista vacío no se cotiza ni se reemplaza por el precio mayorista.
      // Un cero tampoco es un precio válido: se trata igual que una celda vacía («Consultar precio»).
      const rawRetail = !headers.includes('precio_minorista') ? (product.retailPrice ?? null)
        : cell('precio_minorista') === '' ? null
        : positiveNumber(cell('precio_minorista'), formats.precio_minorista, true);
      const retailPrice = rawRetail > 0 ? rawRetail : null;
      const retailQuantity = cell('cantidad_minorista') === '' ? 1
        : positiveNumber(cell('cantidad_minorista'), formats.cantidad_minorista);
      if (['frasco', 'balde'].includes(product.unit) && !Number.isInteger(retailQuantity)) {
        throw new Error('La cantidad minorista de unidades debe ser entera');
      }
      const retailTotal = retailPrice === null ? null : Math.round(retailPrice * retailQuantity * 100) / 100;
      if (retailTotal > 1e12) throw new Error('Total minorista fuera de rango');
      const total = amount === null ? null : Math.round((hasPresentationPrice ? amount : price * quantity) * 100) / 100;
      if (total > 1e12) throw new Error('Total fuera de rango');
      let label = product.packageUnit;
      if (quantity !== product.packageKg) {
        label = product.unit === 'balde'
          ? `${quantity} baldes de 5 kg`
          : label.replace(/x [\d.,]+/, `x ${quantity}`);
      }
      return { id, pricePerKg: price, packageKg: quantity, packageTotalPrice: total, packageUnit: label,
        retailPrice, retailQuantity, retailTotal };
    });
    if (products.some(p => !p.optionalPriceRow && !seen.has(p.id))) {
      const error = new Error('Faltan productos del catálogo actual en la hoja de precios');
      error.code = 'CATALOG_MISMATCH';
      throw error;
    }
    return result;
  }
  root.PriceSheet = { parseCSV, readPrices };
  if (typeof module !== 'undefined') module.exports = root.PriceSheet;
})(typeof window !== 'undefined' ? window : globalThis);
