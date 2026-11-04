// Enlace público de exportación CSV de la planilla online (sin claves ni contraseñas).
// Mientras esté vacío, se usa data/precios.csv.
window.PRICES_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRQI9ifslad0BcfSxKU3nFHJ-eef-ba0YkPe4TbFtFj6idk4XsVZm3oM5qDP7flWZmlXzFhDSbHIuJ9/pub?gid=507715810&single=true&output=csv',
  numberFormat: 'en-US', // Formato que publica esta planilla: 12,800.00
  refreshMs: 60000,
  timeoutMs: 10000
};
