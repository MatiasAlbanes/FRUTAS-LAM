# Precios mayoristas y minoristas

Las dos listas usan la exportación CSV directa de la hoja Precios indicada en `prices-config.js`: documento `1q7g0bp7SloTi9dzRyFVbf6n3usMoatDF0yrOQBfrzc8`, pestaña `507715810`, cuyo enlace de edición confirmó el usuario. Se comprobó su descarga sin sesión y el permiso de lectura desde GitHub Pages (CORS). El cliente edita cada cantidad y precio por separado en Google Sheets. La web consulta al cargar, cada 60 segundos mientras está visible y al volver a la pestaña; La exportación puede demorar en reflejar los cambios de Google. El botón Actualizar precios permite reintentar y el estado muestra la última lectura correcta o un error.

## Ampliar la planilla online existente

El acceso disponible permite lectura, no edición desde esta sesión. El Excel descargado y Google Sheets son archivos distintos: los cambios del primero no modifican la hoja online. La web está preparada para las columnas nuevas; la planilla online debe ampliarse desde la cuenta de su propietario.

Sin borrar ni reemplazar la hoja `Precios`, agregar al final:

- G1: `cantidad_minorista`. Completar G2:G33 con 1 (o la cantidad de kg/litros/unidades por presentación minorista).
- H1: `precio_minorista`. Completar H2:H33 con 0 inicialmente, según lo solicitado; luego cargar los precios reales por kg, litro, frasco o balde.
- I1 (opcional): `total_minorista`. En I2, fórmula `=G2*H2`, extendida hasta I33. La web recalcula los totales y no depende de esta columna.

No es necesario cambiar los encabezados mayoristas anteriores (`cantidad`, `precio_unitario`, `total_presentacion`), el enlace ni el identificador de pestaña. Mantener el acceso de lectura sin inicio de sesión a esa hoja. No publicar datos privados.

`EXCEL EDITABLE/Frutas-LAM-Precios.xlsx` incluye las dos listas con encabezados explícitos (`cantidad_mayorista`, `precio_mayorista`, `total_mayorista` y sus equivalentes minoristas), fórmulas, validación y celdas editables amarillas. Se admiten tanto los encabezados anteriores como los nuevos. Subir este Excel como otro archivo no lo conecta automáticamente al enlace actual.

## Cantidades y precios

- `id`, `producto`, `unidad`: referencias del catálogo, sin cambiar identificadores ni unidades ni borrar filas.
- `cantidad_mayorista` (antes `cantidad`): kg, litros, frascos o baldes por presentación mayorista.
- `precio_mayorista` (antes `precio_unitario`): precio por la unidad indicada, llevando la presentación mayorista.
- `cantidad_minorista`: kg, litros, frascos o baldes por presentación minorista; por defecto, 1. Para vender medio kilo, usar 0,5.
- `precio_minorista`: precio por kg, litro, frasco o balde, independiente del mayorista. Inicialmente $0 por pedido del usuario.
- Ambos totales se calculan como cantidad × precio. Los controles del catálogo agregan presentaciones completas de la modalidad elegida.

Ejemplo minorista: cantidad 0,5 y precio 20000 por kg → presentación de medio kilo a $10.000. Los frascos y baldes requieren cantidades enteras. El balde de aceitunas de 5 kg se cotiza por balde, no por kilo.

Cargar números sin símbolo $ ni separadores de miles. La exportación conectada puede mezclar formatos entre celdas: 12,800.00, 12.800,00 y 1500,00. `numberFormat: auto` reconoce los separadores por celda y utiliza el formato predominante de cada columna para los casos ambiguos. No se necesitan cambios de formato en Google Sheets. El CSV local admite coma o punto decimal sin separadores de miles.

Un minorista explícito en cero se muestra como $0 y se incluye así en el pedido. Una celda minorista vacía muestra Precio pendiente e impide agregar/enviar ese producto hasta su carga. Mientras la planilla anterior no tenga las columnas minoristas, se usan los ceros iniciales solicitados.

La planilla debe contener los 32 productos. Una fila inválida rechaza toda la actualización y conserva los últimos precios válidos de la sesión. Si la primera carga falla se mantienen los precios incluidos en app.js. No se insertan textos recibidos de la planilla en el HTML.

## Contactos y retiros

- Mayorista: WhatsApp +54 9 263 476-1151. Retiro en Ingeniero Giagnoni, Junín: https://maps.app.goo.gl/3Xq155JCwf7fQ5Y49.
- Minorista: WhatsApp +54 9 2634 33-9550. Retiro en 9 de Julio 1189, Mendoza Ciudad.
- Instagram: https://www.instagram.com/lamfruts/.

El carrito calcula ambas modalidades. Cuando contiene productos de las dos, ofrece botones separados que envían únicamente los artículos, totales y ubicación de esa modalidad a su contacto. El WhatsApp flotante sigue la modalidad del catálogo. Los cambios de la planilla actualizan también los importes del carrito y muestran un aviso.

## Publicación y verificación

Repositorio: alverto9266-sys/FRUTAS-LAM. Publicar los archivos del sitio; un push no confirma por sí solo un despliegue en el hosting.

Pruebas:

- `node scripts/test-prices.cjs`
- `node scripts/test-retail.cjs`
- `node scripts/test-categories.cjs`
- `node scripts/test-prices.cjs /ruta/al/csv-descargado.csv` verifica también la planilla publicada real.

`python scripts/crear-planilla.py` regenera los archivos iniciales desde app.js; no ejecutarlo sobre una lista ya actualizada por el cliente. Sin `csvUrl`, se lee `data/precios.csv`.

## Filtros del catálogo

Cinco familias: Nueces; Almendras; Aceite y aceitunas; Frutos secos varios; Deshidratados. El aceite de oliva está junto a las cuatro presentaciones de aceitunas. Frutos secos varios incluye castañas, pistachos, maní, miel y granola. Se conservan los 32 productos.

Las tarjetas superiores y los botones del catálogo usan el mismo filtro, indican la categoría activa y actualizan el título y cantidad de resultados. Funcionan con ambas listas de precios y la búsqueda. Todos permite volver al catálogo completo.

## Corrección de formatos mixtos

Se conservó una muestra real en `scripts/fixtures/mixed-price-formats.csv`: mayorista 12,800.00, cantidad minorista 1,00 y precio minorista 1500,00. Las pruebas verifican el catálogo a $1.500, dos presentaciones a $3.000 y el mismo importe en el mensaje de WhatsApp. Los totales recibidos de la planilla siguen siendo informativos: la página recalcula ambos.
