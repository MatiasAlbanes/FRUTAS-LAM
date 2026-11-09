"""Empaqueta exclusivamente los archivos utilizados por la web, sin fotos de borrador."""
from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
files = {'index.html','styles.css','app.js','prices.js','prices-config.js','data/precios.csv','mayorista/index.html','minorista/index.html'}
for file in ['index.html','styles.css','app.js']:
    text=(ROOT/file).read_text()
    files.update(re.findall(r'assets/[a-zA-Z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg)',text))
for file in files:
    if not (ROOT/file).is_file():raise FileNotFoundError(file)
archive = ROOT/'Frutas-LAM-Web-lista-para-publicar.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    for file in sorted(files):z.write(ROOT/file,arcname=file)
with ZipFile(archive) as z:
    assert z.testzip() is None
    assert 'index.html' in z.namelist()
    assert not any('FOTOS/' in p or '.trabajo' in p or p.endswith('.xlsx') for p in z.namelist())
print(f'Web lista: {len(files)} archivos, {archive.stat().st_size/1048576:.1f} MB; sin borradores ni archivos de trabajo.')
