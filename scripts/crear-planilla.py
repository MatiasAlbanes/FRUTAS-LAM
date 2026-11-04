"""Actualiza Excel/CSV desde app.js conservando las cantidades y precios minoristas del CSV."""
import csv
import json
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
source = (ROOT / 'app.js').read_text().split('const PRODUCTS_DATA = [', 1)[1].split('\n];', 1)[0]
products = []
for obj in re.findall(r'\{\s*id:.*?\n  \}', source, re.S):
    def string(key):
        return re.search(r"\b" + key + r": '((?:\\.|[^'])*)'", obj)[1].replace("\\'", "'")
    def number(key):
        return float(re.search(r'\b' + key + r': ([\d.]+)', obj)[1])
    products.append(dict(id=string('id'), name=string('name'), unit=string('unit'),
        quantity=number('packageKg'), price=number('pricePerKg'), total=number('packageTotalPrice'),
        image=string('image'), package=string('packageUnit')))

previous = {}
csv_path = ROOT / 'data/precios.csv'
if csv_path.exists():
    with csv_path.open(encoding='utf-8-sig', newline='') as f:
        previous = {row['id']:row for row in csv.DictReader(f, delimiter=';')}
headers = ['id','producto','unidad','cantidad_mayorista','precio_mayorista','total_mayorista',
           'cantidad_minorista','precio_minorista','total_minorista','precio_presentacion','foto','presentacion']
values = []
for p in products:
    old = previous.get(p['id'], {})
    retail_quantity = float(old.get('cantidad_minorista') or 1)
    raw_price = old.get('precio_minorista', '0')
    retail_price = float(raw_price) if raw_price != '' else ''
    retail_total = retail_quantity * retail_price if retail_price != '' else ''
    values.append([p['id'],p['name'],p['unit'],p['quantity'],p['price'],p['total'],
                   retail_quantity,retail_price,retail_total,p['total'],p['image'],p['package']])
ROOT.joinpath('data').mkdir(exist_ok=True)
with csv_path.open('w',encoding='utf-8-sig',newline='') as f:
    writer = csv.writer(f,delimiter=';',lineterminator='\n')
    writer.writerow(headers)
    writer.writerows(values)

def cell(col,row,value,style=0,formula=None):
    ref=f'{col}{row}'
    if formula is not None:
        cached = f'<v>{value:g}</v>' if isinstance(value,(int,float)) else ''
        return f'<c r="{ref}" s="{style}"><f>{escape(formula)}</f>{cached}</c>'
    if isinstance(value,(int,float)):
        return f'<c r="{ref}" s="{style}"><v>{value:g}</v></c>'
    return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'

def worksheet(rows,widths,validation=''):
    cols=''.join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i,w in enumerate(widths,1))
    return f'<worksheet xmlns="{NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>{cols}</cols><sheetData>{"".join(rows)}</sheetData>{validation}</worksheet>'

rows=['<row r="1">'+''.join(cell(c,1,h,1) for c,h in zip('ABCDEFGHIJKL',headers))+'</row>']
for i,vals in enumerate(values,2):
    content=[]
    for c,v in zip('ABCDEFGHIJKL',vals):
        formula = {'E':f'J{i}/D{i}','F':f'D{i}*E{i}','I':f'IF(H{i}="","",G{i}*H{i})'}.get(c)
        content.append(cell(c,i,v,2 if c in 'DGHJ' else 3 if c in 'EFI' else 0,formula))
    rows.append(f'<row r="{i}">{"".join(content)}</row>')
last=len(products)+1
validations = f'<autoFilter ref="A1:L{last}"/><dataValidations count="4">'
validations += f'<dataValidation type="decimal" operator="greaterThan" allowBlank="0" showErrorMessage="1" error="Ingresá un importe total mayor que cero." sqref="J2:J{last}"><formula1>0</formula1></dataValidation>'
validations += f'<dataValidation type="decimal" operator="greaterThanOrEqual" allowBlank="1" showErrorMessage="1" error="Ingresá un precio de cero o mayor." sqref="H2:H{last}"><formula1>0</formula1></dataValidation>'
for c in 'DG':
    formula=f'AND(ISNUMBER({c}2),{c}2&gt;0,{c}2&lt;=1000000000,OR(AND($C2&lt;&gt;"frasco",$C2&lt;&gt;"balde"),MOD({c}2,1)=0))'
    validations += f'<dataValidation type="custom" allowBlank="0" showErrorMessage="1" error="Cantidad positiva; frascos y baldes requieren enteros." sqref="{c}2:{c}{last}"><formula1>{formula}</formula1></dataValidation>'
validations+='</dataValidations>'
sheets=[('Precios',worksheet(rows,[34,49,12,23,23,23,23,23,23,25,65,28],validations))]
notes=[
 'FRUTAS LAM · Catálogo listo para publicar',
 '41 productos activos con foto final. Las variantes sin precio están separadas en Pendientes.',
 'IMPORTANTE: la lista recibida cotiza el TOTAL de la caja de 10 kg, no el precio por kilo.',
 'Ejemplo confirmado: nuez blanca, caja de 10 kg a $13.500; equivalente $1.350/kg.',
 'Los mixes se cotizan por bolsón de 5 kg: Tropical Común $34.500 por bolsón, equivalente $6.900/kg.',
 'Mayorista: editá D (cantidad de kg/litros/frascos/baldes) y J (precio TOTAL de la presentación).',
 'E (precio por unidad) y F (total) se calculan automáticamente. No escribas sobre las fórmulas.',
 'Minorista: editá G (cantidad) y H (precio por kg/litro/frasco/balde). I calcula el total.',
 'Los minoristas siguen inicialmente en cero como en la planilla anterior. Celda vacía = precio pendiente.',
 'Presentaciones de miel, aceite y aceitunas se respetan según la unidad y el tamaño de cada ficha.',
 'Aceite: botella de 1 litro $12.800; bidón de 5 litros $64.000 a la misma cotización por litro.',
 'K identifica la foto final del producto. L describe la presentación. No cambies los IDs ni las unidades.',
 'Fotos registra las 46 imágenes finales y su correspondencia. Las alternativas no son nuevas variedades.',
 'No se publica ningún producto de Pendientes hasta confirmar su precio y, cuando corresponda, su foto.',
 'Para publicar la web: extraé Frutas-LAM-Web-lista-para-publicar.zip y subí su contenido al hosting.',
 'La web incluye los precios actualizados en data/precios.csv y funciona antes de actualizar Google Sheets.',
 'Para sincronizar Sheets: copiá las celdas de Precios sobre la pestaña Precios EXISTENTE de la hoja conectada.',
 'Conservá la misma hoja/pestaña y su acceso CSV sin sesión. No crees otro documento ni cambies el enlace.',
 'Cuando la hoja conectada tenga los 41 IDs, la web la usará automáticamente. Se consulta cada 60 segundos.',
 'Modificar solo este Excel en la computadora no modifica la hoja online. No publiques datos privados.',
]
sheets.append(('Cómo usar',worksheet([f'<row r="{i}">{cell("A",i,t,1 if i==1 else 0)}</row>' for i,t in enumerate(notes,1)],[130])))
pending=json.loads((ROOT/'data/productos-pendientes.json').read_text())
pending_rows=[['producto','precio_confirmado','foto','estado']]+[[p['producto'],'',p['foto'],p['motivo']] for p in pending]
photo_rows=[['foto_final','productos','estado']]+[[p['foto'],', '.join(p['productos']),p['estado']] for p in json.loads((ROOT/'data/catalogo-fotos.json').read_text())]
for title,records,widths in [('Pendientes',pending_rows,[48,24,70,85]),('Fotos',photo_rows,[70,80,35])]:
    xml_rows=[f'<row r="{i}">'+''.join(cell(c,i,v,1 if i==1 else 2 if title=='Pendientes' and c=='B' else 0) for c,v in zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ',vals))+'</row>' for i,vals in enumerate(records,1)]
    sheets.append((title,worksheet(xml_rows,widths)))

styles='''<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF234839"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf fontId="0" fillId="3" borderId="0" numFmtId="4" xfId="0" applyFill="1" applyNumberFormat="1"/><xf fontId="0" fillId="0" borderId="0" numFmtId="4" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''
rels_ns='http://schemas.openxmlformats.org/package/2006/relationships'
relbase='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
files={
 '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,len(sheets)+1))+'</Types>',
 '_rels/.rels':f'<Relationships xmlns="{rels_ns}"><Relationship Id="rId1" Type="{relbase}/officeDocument" Target="xl/workbook.xml"/></Relationships>',
 'xl/workbook.xml':f'<workbook xmlns="{NS}" xmlns:r="{relbase}"><sheets>'+''.join(f'<sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>' for i,(name,_) in enumerate(sheets,1))+'</sheets><calcPr fullCalcOnLoad="1"/></workbook>',
 'xl/_rels/workbook.xml.rels':f'<Relationships xmlns="{rels_ns}">'+''.join(f'<Relationship Id="rId{i}" Type="{relbase}/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,len(sheets)+1))+f'<Relationship Id="rId{len(sheets)+1}" Type="{relbase}/styles" Target="styles.xml"/></Relationships>',
 'xl/styles.xml':styles,
}
for i,(_,xml) in enumerate(sheets,1): files[f'xl/worksheets/sheet{i}.xml']=xml
(ROOT/'EXCEL EDITABLE').mkdir(exist_ok=True)
with zipfile.ZipFile(ROOT/'EXCEL EDITABLE/Frutas-LAM-Precios.xlsx','w',zipfile.ZIP_DEFLATED) as z:
    for name,xml in files.items():z.writestr(name,'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+xml)
print(f'Excel y CSV actualizados: {len(products)} productos; {len(pending)} pendientes; 46 fotos; minoristas conservados.')
