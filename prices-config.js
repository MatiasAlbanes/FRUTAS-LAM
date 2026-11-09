// Exportación directa de la pestaña DATOS WEB de la planilla de precios (Google Sheets).
// El cliente edita EDITAR PRECIOS; DATOS WEB copia esos valores junto con los IDs de los productos.
// Si la lectura online falla antes de recibir una lista válida, se usa data/precios.csv.
window.PRICES_CONFIG = {
  csvUrl: 'https://docs.google.com/spreadsheets/d/1qruO_fHiunD41a2_P611gMfe_T_ta8XYhUbbiPCctV4/export?format=csv&gid=2898121',
  // Respaldo local con la lista vigente por si la planilla no responde.
  fallbackCsvUrl: 'data/precios.csv',
  numberFormat: 'auto', // Admite 12,800.00 y 12.800,00, con o sin símbolo $ (Google exporta "$ 13,500.00").
  refreshMs: 60000,
  timeoutMs: 10000
};
