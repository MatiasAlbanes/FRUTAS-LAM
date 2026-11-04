# Catálogo de lanzamiento · Frutas LAM

41 productos activos, seis categorías y fotos finales propias en `assets/productos/`. Las fichas, el encabezado y las categorías usan las imágenes finales. Las imágenes originales y los archivos de trabajo quedan fuera del paquete para publicar.

## Importes confirmados

El usuario confirmó que los importes enviados son el **total de la caja de 10 kg**, no el precio por kilo. Por ejemplo: nuez blanca, caja de 10 kg a $13.500; equivalente $1.350/kg. Se aplica a los productos a granel, incluida aceituna descarozada.

Los nueve mixes se venden por **bolsón de 5 kg**: Tropical Común $34.500; Tropical Premium $41.500; Tropical MegaECO $27.000; Tropical sin Maní $48.500; Clásico sin Maní $48.500; Clásico con Maní $44.500; Patagonia $43.500; Cervecero $27.800; Frutal $44.500.

Las presentaciones explícitas conservan su unidad: miel de campo de 500 g a $5.000/frasco; aceitunas griegas de 1 kg a $9.500, frasco de 500 g a $6.200 y balde de 5 kg a $41.500. Aceite de oliva a $12.800/litro; botella de 1 litro a $12.800 y bidón de 5 litros a $64.000, a la misma cotización por litro.

Se conservan los identificadores de los productos existentes. Se agregaron nuez mariposa light, papaya, nueve mixes y la presentación de aceite de 5 litros. Se retiró nuez con cáscara por pedido del usuario. Higo blanco y pistacho pelado no están en la lista actual ni tienen foto final y quedan en Pendientes.

## Excel

`EXCEL EDITABLE/Frutas-LAM-Precios.xlsx` contiene:

- **Precios**: los 41 productos activos con fórmulas, foto y presentación.
- **Cómo usar**: instrucciones de edición, publicación y sincronización.
- **Pendientes**: variantes sin precio o foto confirmados, separadas de los productos que se venden.
- **Fotos**: las 46 fotos finales y su correspondencia, incluidas alternativas del mismo calibre.

Mayorista: editar D (`cantidad_mayorista`) y J (`precio_presentacion`, TOTAL de la caja/bolsón/frasco/bidón). E (`precio_mayorista`) calcula J/D; F (`total_mayorista`) calcula D×E. No reemplazar fórmulas por importes de caja en la columna por kilo.

Minorista: editar G (`cantidad_minorista`) y H (`precio_minorista`, por unidad). I calcula el total. Se conservaron los valores minoristas del CSV anterior: inicialmente cero, como se había solicitado. Un minorista vacío significa precio pendiente; cero explícito se cotiza como cero. Cargar valores de venta si se desea habilitar pedidos minoristas con precio real.

La miel Churqui de 1 kg, ciruela con carozo, almendra Guara N° 5, nuez extra light partida a máquina y granola con coco tienen foto pero no precio confirmado para esa variante. No se les inventó precio. Las fotos de almendra N° 3 y 4 son alternativas del mismo producto N° 3/4, no nuevos productos. `data/catalogo-fotos.json` y `data/productos-pendientes.json` registran estas relaciones.

## Google Sheets y respaldo local

Se conserva el enlace de la hoja Precios configurada en `prices-config.js`: documento `1q7g0bp7SloTi9dzRyFVbf6n3usMoatDF0yrOQBfrzc8`, pestaña `507715810`.

El Excel local y Google Sheets son archivos distintos. Esta entrega no modifica la hoja online. Para conectarla al catálogo nuevo, copiar las celdas de la pestaña **Precios** del Excel sobre la pestaña **Precios existente** del documento conectado, conservando sus IDs y acceso de lectura CSV sin sesión. No crear otro documento ni cambiar el identificador de pestaña.

La web valida la lista completa antes de actualizar. Si la hoja online todavía tiene la lista anterior, usa `data/precios.csv` como respaldo inicial. Cuando la hoja tenga los 41 IDs válidos, retoma automáticamente la sincronización online. Consulta al cargar, cada 60 segundos mientras la página está visible y al volver a la pestaña. Una actualización inválida posterior conserva los últimos precios válidos y no vuelve a importes anteriores.

## Publicar

Extraer `Frutas-LAM-Web-lista-para-publicar.zip` y subir **su contenido** al hosting estático: `index.html` debe quedar en la raíz. Incluye únicamente HTML, CSS, JavaScript, CSV y los assets necesarios; no requiere instalar dependencias ni compilar. El Excel se entrega aparte y no necesita publicarse en el hosting.

No se realizó push ni despliegue. El acceso externo a la exportación de Google no pudo verificarse en esta sesión; se verificó con pruebas la migración de lista antigua a CSV local y el paso posterior a una hoja online completa.

## Verificación

- `node scripts/test-prices.cjs`
- `node scripts/test-retail.cjs`
- `node scripts/test-categories.cjs`
- `node scripts/test-catalog-final.cjs`

`python scripts/crear-planilla.py` regenera Excel/CSV desde los datos actuales de `app.js`, preservando cantidades/precios minoristas del CSV. No ejecutar sobre cambios mayoristas que solo existan en la hoja online: sincronizarlos primero con el catálogo local.

`python scripts/preparar-publicacion.py` regenera el ZIP de la web con sus archivos y assets utilizados. También se verificó en Chromium la carga de las 41 fichas, imágenes sin errores, filtro de nueve mixes y total de Tropical Común de $34.500, a 500 y 1440 px de ancho.

Se conservan los contactos y retiros: mayorista +54 9 263 476-1151 (Ingeniero Giagnoni, Junín), minorista +54 9 2634 33-9550 (9 de Julio 1189, Mendoza Ciudad), Instagram @lamfruts.
