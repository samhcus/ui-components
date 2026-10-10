"""Verify the immutable original reading-panel archive without changing files."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'registry/samuel/reading-panel/provenance.json').read_text())
for source in manifest['sources']:
    data = (root / source['snapshot']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == source['sha256'], source['snapshot']
    committed = subprocess.check_output(['git', 'show', manifest['sourceCommit'] + ':' + source['original']], cwd=root)
    assert committed == data, source['original']
for current, original in [('components/reading-panel/social-dock.tsx', 'components/brand/social-dock.tsx'), ('components/reading-panel/reading-data.ts', 'lib/reading.ts')]:
    source = next(item for item in manifest['sources'] if item['original'] == original)
    assert hashlib.sha256((root / current).read_bytes()).hexdigest() == source['sha256'], current
with zipfile.ZipFile(root / 'public/r/reading-gif-panel-example.zip') as archive:
    assert archive.testzip() is None
    names = set(archive.namelist())
    for source in manifest['sources']:
        if source['original'].startswith('public/'):
            assert hashlib.sha256(archive.read(source['original'])).hexdigest() == source['sha256'], source['original']
    for name in names:
        if not name.endswith(('.ts', '.tsx', '.js', '.mjs')):
            continue
        for target in re.findall(r'(?:from\s*|import\s*)[\"\'](@/[^\"\']+)', archive.read(name).decode()):
            stem = target[2:]
            assert any(stem + suffix in names for suffix in ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx']), (name, target)
print('Original source commit, snapshot hashes, frozen modules, ZIP integrity, assets, and bundled imports: PASS')
