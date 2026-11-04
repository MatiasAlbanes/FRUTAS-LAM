# Precios desde una planilla

El catálogo conserva su diseño. `prices-config.js` configura un enlace público de exportación CSV con acceso desde el navegador (CORS). Sin enlace, se lee `data/precios.csv`, incluido con los 32 precios actuales.

## Conexión configurada

`prices-config.js` ya contiene el enlace público CSV de la pestaña Precios de Google Sheets que compartió el usuario. Se verificó la descarga anónima y los 32 productos. La exportación de esta planilla utiliza formato en-US (12,800.00); `numberFormat` permite leerlo correctamente. Mantener la configuración regional de la hoja al editarla.

La página consulta al cargar, cada 60 segundos mientras esté visible y al volver a la pestaña. Google puede demorar unos minutos en actualizar su exportación publicada. El cliente debe editar la planilla de Google Sheets conectada, no el Excel local.

### Publicación pendiente

Estos cambios están en los archivos locales del proyecto. Para activarlos en el sitio público, publicar `index.html`, `app.js`, `prices.js` y `prices-config.js`, además de conservar `data/precios.csv` y los recursos existentes. El repositorio es alverto9266-sys/FRUTAS-LAM. No incluye configuración de despliegue; un push no confirma por sí solo una publicación en el hosting.

Para migrar de planilla, publicar únicamente la hoja Precios como CSV con actualización automática, verificar la descarga sin sesión y reemplazar `csvUrl`. El enlace debe devolver CSV y permitir lectura desde el navegador (CORS), no una pantalla de edición o inicio de sesión. No colocar claves de acceso en archivos públicos.

Sin enlace configurado, la alternativa manual consiste en exportar Precios como CSV UTF-8 y reemplazar `data/precios.csv` en el hosting.

## Columnas

- `id`: identificador fijo; no editar ni borrar filas.
- `producto`: nombre de referencia; no modifica el nombre en la web.
- `unidad`: fija. kg, litro, frasco o balde, según el producto.
- `cantidad`: kilos, litros o unidades por presentación. Frascos y baldes requieren enteros.
- `precio_unitario`: precio por la unidad indicada, sin símbolo $ ni separadores de miles.
- `total_presentacion`: fórmula informativa. La web calcula cantidad × precio unitario, no utiliza esta columna.

Solo cantidad y precio unitario necesitan editarse. El CSV local admite coma o punto decimal sin separadores de miles. La planilla conectada exporta punto decimal y coma de miles; se interpreta con `numberFormat: en-US`. Para aceitunas en balde de 5 kg, la unidad de precio es el balde completo. Los frascos de medio kilo se cotizan por frasco.

La planilla debe contener los 32 identificadores. Un error en una fila rechaza toda la actualización y conserva la última lista válida de la sesión. Si la primera carga falla se mantienen los valores incluidos en app.js. Los datos recibidos solo afectan números y presentaciones; no se insertan textos de la planilla en el HTML.

Si los precios cambian con un pedido abierto, se actualiza el carrito mayorista y aparece un aviso. Minorista sigue a consultar por WhatsApp.

## Verificación

`node scripts/test-prices.cjs`

Para comprobar también una descarga real de la planilla: `node scripts/test-prices.cjs /ruta/al/csv-descargado.csv`.

`python scripts/crear-planilla.py` regenera los archivos iniciales desde app.js; no ejecutar sobre una lista CSV ya actualizada por el cliente.
