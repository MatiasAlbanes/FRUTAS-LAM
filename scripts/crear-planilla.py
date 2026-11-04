"""Genera el Excel inicial y el CSV desde el catálogo actual. Ejecutar una sola vez al preparar la entrega."""
import csv, json, re, zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
(ROOT / 'data').mkdir(exist_ok=True)
(ROOT / 'EXCEL EDITABLE').mkdir(exist_ok=True)
source = (ROOT / 'app.js').read_text()
objects = re.findall(r'\{\s*id:.*?\n  \}', source, re.S)
products = []
for obj in objects:
    def string(key):
        return re.search(r"\b" + key + r": '((?:\\.|[^'])*)'", obj)[1].replace("\\'", "'")
    def number(key):
        return float(re.search(r'\b' + key + r': ([\d.]+)', obj)[1])
    products.append([string('id'), string('name'), string('unit'), number('packageKg'), number('pricePerKg')])
headers = ['id', 'producto', 'unidad', 'cantidad_mayorista', 'precio_mayorista', 'total_mayorista', 'cantidad_minorista', 'precio_minorista', 'total_minorista']
with (ROOT / 'data/precios.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f, delimiter=';', lineterminator='\n')
    writer.writerow(headers)
    for p in products:
        writer.writerow(p + [p[3] * p[4], 1, 0, 0])

def cell(col, row, value, style=0):
    ref = f'{col}{row}'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}" s="{style}"><v>{value:g}</v></c>'
    return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'
rows = ['<row r="1">' + ''.join(cell(c, 1, h, 1) for c,h in zip('ABCDEFGHI',headers)) + '</row>']
for i,p in enumerate(products, 2):
    cells = ''.join(cell(c, i, v, 2 if c in 'DE' else 0) for c,v in zip('ABCDE',p))
    cells += f'<c r="F{i}" s="3"><f>D{i}*E{i}</f><v>{p[3]*p[4]:g}</v></c>'
    cells += cell('G', i, 1, 2) + cell('H', i, 0, 2)
    cells += f'<c r="I{i}" s="3"><f>G{i}*H{i}</f><v>0</v></c>'
    rows.append(f'<row r="{i}">{cells}</row>')
last = len(products) + 1
sheet = f'''<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="34" customWidth="1"/><col min="2" max="2" width="49" customWidth="1"/><col min="3" max="3" width="12" customWidth="1"/><col min="4" max="9" width="23" customWidth="1"/></cols><sheetData>{''.join(rows)}</sheetData><autoFilter ref="A1:I{last}"/><dataValidations count="4"><dataValidation type="decimal" operator="between" allowBlank="0" showErrorMessage="1" errorTitle="Revisá el valor" error="Ingresá un número mayor que cero, sin signo de pesos." sqref="E2:E{last} {' '.join(f'D{i}' for i,p in enumerate(products,2) if p[2] not in ('frasco','balde'))}"><formula1>0.0001</formula1><formula2>1000000000</formula2></dataValidation><dataValidation type="whole" operator="between" allowBlank="0" showErrorMessage="1" error="Los frascos y baldes deben ser cantidades enteras." sqref="{' '.join(f'D{i}' for i,p in enumerate(products,2) if p[2] in ('frasco','balde'))}"><formula1>1</formula1><formula2>1000000000</formula2></dataValidation><dataValidation type="decimal" operator="between" allowBlank="1" showErrorMessage="1" error="Ingresá un precio minorista de cero o mayor." sqref="H2:H{last}"><formula1>0</formula1><formula2>1000000000</formula2></dataValidation><dataValidation type="custom" allowBlank="0" showErrorMessage="1" error="La cantidad debe ser positiva; frascos y baldes requieren enteros." sqref="G2:G{last}"><formula1>AND(ISNUMBER(G2),G2&gt;0,G2&lt;=1000000000,OR(AND($C2&lt;&gt;"frasco",$C2&lt;&gt;"balde"),MOD(G2,1)=0))</formula1></dataValidation></dataValidations></worksheet>'''
notes = [
    'FRUTAS LAM · Actualización de precios',
    'MAYORISTA: columnas D, E y F. MINORISTA: columnas G, H e I.',
    'Editá las celdas amarillas: cantidad y precio de cada modalidad. Los totales se calculan solos.',
    'cantidad_mayorista / cantidad_minorista: kg, litros, frascos o baldes por presentación.',
    'precio_mayorista / precio_minorista: importe por kg, litro, frasco o balde según unidad.',
    'Ejemplo mayorista: cantidad 10 y precio 15000 → caja $150.000.',
    'Ejemplo minorista: cantidad 0,5 y precio 20000 por kg → presentación de medio kilo $10.000.',
    'Los precios minoristas arrancan en $0, según lo solicitado. Cargá los valores de venta antes de usarla.',
    'Las listas mayorista y minorista se editan por separado y se envían a contactos distintos.',
    'El total de la presentación se calcula solo. La web también lo recalcula.',
    'No cambies los encabezados, los identificadores ni la unidad. No borres filas.',
    'Cargá números sin $ ni separadores de miles. Podés usar decimales.',
    'La aceituna en balde de 5 kg se cotiza por balde, no por kilo.',
    'Para sincronizar, esta planilla debe estar online y su hoja Precios conectada a la web.',
    'Modificar este archivo en la computadora no actualiza automáticamente el sitio.',
    'Solo la hoja Precios debe publicarse como CSV. No incluyas datos privados.',
    'En la planilla online ya conectada, podés agregar cantidad_minorista y precio_minorista al final.',
    'No hace falta cambiar los encabezados mayoristas anteriores: la web admite ambos formatos.',
]
notes_sheet = '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="125" customWidth="1"/></cols><sheetData>' + ''.join(f'<row r="{i}">{cell("A",i,t,1 if i==1 else 0)}</row>' for i,t in enumerate(notes,1)) + '</sheetData></worksheet>'
styles = '''<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF234839"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf fontId="0" fillId="3" borderId="0" numFmtId="4" xfId="0" applyFill="1" applyNumberFormat="1"/><xf fontId="0" fillId="0" borderId="0" numFmtId="4" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''
files = {
'[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
'_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Precios" sheetId="1" r:id="rId1"/><sheet name="Cómo usar" sheetId="2" r:id="rId2"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>',
'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
'xl/styles.xml': styles, 'xl/worksheets/sheet1.xml': sheet, 'xl/worksheets/sheet2.xml': notes_sheet,
}
with zipfile.ZipFile(ROOT / 'EXCEL EDITABLE/Frutas-LAM-Precios.xlsx', 'w', zipfile.ZIP_DEFLATED) as z:
    for name,content in files.items(): z.writestr(name, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + content)
print(f'Excel y CSV generados: {len(products)} productos.')
