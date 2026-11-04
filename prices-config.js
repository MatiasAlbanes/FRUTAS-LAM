// Exportación directa de la hoja Precios que edita el cliente en Google Sheets.
// Mientras esté vacío, se usa data/precios.csv.
window.PRICES_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/1q7g0bp7SloTi9dzRyFVbf6n3usMoatDF0yrOQBfrzc8/export?format=csv&gid=507715810',
  numberFormat: 'auto', // Admite columnas 12,800.00 y 12.800,00 o 1500,00.
  refreshMs: 60000,
  timeoutMs: 10000
};
