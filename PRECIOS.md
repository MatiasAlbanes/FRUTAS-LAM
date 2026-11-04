# Precios mayoristas y minoristas

Las dos listas usan el CSV publicado configurado en `prices-config.js`. El enlace existente se conserva. El cliente edita cada cantidad y precio por separado en Google Sheets. La web consulta al cargar, cada 60 segundos mientras está visible y al volver a la pestaña; Google puede demorar unos minutos en publicar los cambios.

## Ampliar la planilla online existente

El enlace publicado permite lectura, no edición. La web está preparada para las columnas nuevas; la planilla online debe ampliarse desde la cuenta de su propietario.

Sin borrar ni reemplazar la hoja `Precios`, agregar al final:

- G1: `cantidad_minorista`. Completar G2:G33 con 1 (o la cantidad de kg/litros/unidades por presentación minorista).
- H1: `precio_minorista`. Completar H2:H33 con 0 inicialmente, según lo solicitado; luego cargar los precios reales por kg, litro, frasco o balde.
- I1 (opcional): `total_minorista`. En I2, fórmula `=G2*H2`, extendida hasta I33. La web recalcula los totales y no depende de esta columna.

No es necesario cambiar los encabezados mayoristas anteriores (`cantidad`, `precio_unitario`, `total_presentacion`), el enlace ni el identificador de pestaña. Mantener activa la publicación automática de esa hoja. No publicar datos privados.

`EXCEL EDITABLE/Frutas-LAM-Precios.xlsx` incluye las dos listas con encabezados explícitos (`cantidad_mayorista`, `precio_mayorista`, `total_mayorista` y sus equivalentes minoristas), fórmulas, validación y celdas editables amarillas. Se admiten tanto los encabezados anteriores como los nuevos. Subir este Excel como otro archivo no lo conecta automáticamente al enlace actual.

## Cantidades y precios

- `id`, `producto`, `unidad`: referencias del catálogo, sin cambiar identificadores ni unidades ni borrar filas.
- `cantidad_mayorista` (antes `cantidad`): kg, litros, frascos o baldes por presentación mayorista.
- `precio_mayorista` (antes `precio_unitario`): precio por la unidad indicada, llevando la presentación mayorista.
- `cantidad_minorista`: kg, litros, frascos o baldes por presentación minorista; por defecto, 1. Para vender medio kilo, usar 0,5.
- `precio_minorista`: precio por kg, litro, frasco o balde, independiente del mayorista. Inicialmente $0 por pedido del usuario.
- Ambos totales se calculan como cantidad × precio. Los controles del catálogo agregan presentaciones completas de la modalidad elegida.

Ejemplo minorista: cantidad 0,5 y precio 20000 por kg → presentación de medio kilo a $10.000. Los frascos y baldes requieren cantidades enteras. El balde de aceitunas de 5 kg se cotiza por balde, no por kilo.

Cargar números sin símbolo $ ni separadores de miles. La exportación conectada usa formato en-US (12,800.00), interpretado con `numberFormat` en la configuración. Mantener la configuración regional de la hoja. El CSV local admite coma o punto decimal sin separadores de miles.

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
- `node scripts/test-prices.cjs /ruta/al/csv-descargado.csv` verifica también la planilla publicada real.

`python scripts/crear-planilla.py` regenera los archivos iniciales desde app.js; no ejecutarlo sobre una lista ya actualizada por el cliente. Sin `csvUrl`, se lee `data/precios.csv`.
