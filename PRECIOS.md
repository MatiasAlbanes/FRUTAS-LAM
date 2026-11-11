# Catálogo de lanzamiento · Frutas LAM

42 productos visibles (41 cotizados y miel Churqui de 1 kg para consultar precio), seis categorías y fotos finales propias en `assets/productos/`. Las fichas, el encabezado y las categorías usan las imágenes finales. Las imágenes originales y los archivos de trabajo quedan fuera del paquete para publicar.

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

Mayorista: el cliente escribe el **precio por kg** (por unidad: kg, litro, frasco, balde) en la columna `precio_presentacion` de `DATOS WEB`. La web calcula el total de la caja o bolsón como precio × `cantidad_mayorista` (10 kg en granel, 5 kg en mixes, 5 litros en el bidón). Las presentaciones de una sola unidad no cambian. En las planillas anteriores esa columna era el total de la caja.

Minorista: editar G (`cantidad_minorista`) y H (`precio_minorista`, por unidad). I calcula el total. Se conservaron los valores minoristas leídos de Google Sheets: nuez blanca $1.500 y miel de campo de 500 g $1.967; los demás continúan en cero. Un minorista vacío significa precio pendiente; cero explícito se cotiza como cero. Cargar valores de venta si se desea habilitar pedidos minoristas con precio real.

La miel Churqui de 1 kg, ciruela con carozo, almendra Guara N° 5, nuez extra light partida a máquina y granola con coco tienen foto pero no precio confirmado para esa variante. No se les inventó precio. La miel Churqui se muestra en ambas modalidades con «Consultar precio» y enlace al WhatsApp correspondiente; no se puede agregar al carrito sin un importe confirmado. Las fotos de almendra N° 3 y 4 son alternativas del mismo producto N° 3/4, no nuevos productos. `data/catalogo-fotos.json` y `data/productos-pendientes.json` registran estas relaciones.

## Google Sheets y respaldo local

Se conserva el enlace de la hoja Precios configurada en `prices-config.js`: documento `1q7g0bp7SloTi9dzRyFVbf6n3usMoatDF0yrOQBfrzc8`, pestaña `507715810`.

El Excel local y Google Sheets son archivos distintos. La hoja online original se pudo leer y comparar: todavía contiene 32 productos antiguos. Desde esta sesión figura «Solo ver», por lo que no se modificó directamente. Para conectarla al catálogo nuevo, abrir `EXCEL EDITABLE/Precios-para-Google-Sheets.tsv`, copiar la tabla completa y pegarla en **A1 de la pestaña Precios existente** del documento conectado. Incluye 42 productos: los 41 cotizados y la miel Churqui de 1 kg sin importe. Conservar los IDs y el acceso de lectura CSV sin sesión. No crear otro documento ni cambiar el identificador de pestaña.

La web valida la lista completa antes de actualizar. Si la hoja online todavía tiene la lista anterior, usa `data/precios.csv` como respaldo inicial. Cuando la hoja tenga los 41 IDs válidos, retoma automáticamente la sincronización online. Consulta al cargar, cada 60 segundos mientras la página está visible y al volver a la pestaña. Una actualización inválida posterior conserva los últimos precios válidos y no vuelve a importes anteriores. El estado ahora avisa cuando se está usando el respaldo y no se pudo sincronizar. La columna `precio_presentacion` es la fuente mayorista cuando existe: cambiar J actualiza el total y recalcula el precio por unidad, incluso si la fórmula de E todavía no se recalculó. La miel Churqui admite J/H vacíos y se habilita por modalidad solo cuando el cliente agrega un precio.

## Publicar

Extraer `Frutas-LAM-Web-lista-para-publicar.zip` y subir **su contenido** al hosting estático: `index.html` debe quedar en la raíz. Incluye únicamente HTML, CSS, JavaScript, CSV y los assets necesarios; no requiere instalar dependencias ni compilar. El Excel se entrega aparte y no necesita publicarse en el hosting.

El sitio se publica desde main del repositorio FRUTAS-LAM mediante GitHub Pages. La exportación real de Google se leyó en esta sesión y permitió reproducir el rechazo de la hoja vieja; se conservaron sus minoristas en el respaldo y en la tabla de migración.

## Verificación

- `node scripts/test-prices.cjs`
- `node scripts/test-retail.cjs`
- `node scripts/test-categories.cjs`
- `node scripts/test-catalog-final.cjs`

`python scripts/crear-planilla.py` regenera Excel/CSV desde los datos actuales de `app.js`, preservando cantidades/precios minoristas del CSV. No ejecutar sobre cambios mayoristas que solo existan en la hoja online: sincronizarlos primero con el catálogo local.

`python scripts/preparar-publicacion.py` regenera el ZIP de la web con sus archivos y assets utilizados. También se verificó en Chromium la carga de las 41 fichas, imágenes sin errores, filtro de nueve mixes y total de Tropical Común de $34.500, a 500 y 1440 px de ancho.

Se conservan los contactos y retiros: mayorista +54 9 263 476-1151 (Ingeniero Giagnoni, Junín), minorista +54 9 2634 33-9550 (9 de Julio 1189, Mendoza Ciudad), Instagram @lamfruts.

## Reparación de sincronización (4 de noviembre de 2026)

La exportación real tenía 32 filas: incluía nuez con cáscara, higo blanco y pistacho pelado, y no tenía los doce productos nuevos. La validación rechazaba toda la lectura. La tabla TSV nueva conserva las ediciones minoristas y los totales mayoristas confirmados. Pegarla completa en A1 de la hoja existente; luego usar Actualizar precios. Editar J para el TOTAL mayorista de la presentación y H para el precio minorista por unidad. No pegar el TSV en otra pestaña ni crear otra planilla. La miel Churqui debe mantener J/H vacíos hasta que el cliente los cargue.

`node scripts/preparar-google-sheets.cjs` regenera la tabla TSV. `node scripts/test-google-sheets.cjs` verifica el caso real, los valores minoristas preservados, la prioridad del total editable y la activación/desactivación de la miel sin ventas gratuitas.
