#!/usr/bin/env bash
# update-sitemap-dates.sh — set every <lastmod> in sitemap.xml to the real
# last-change date of the file it points to.
#
#   • File has uncommitted changes  → today's date
#   • Otherwise                     → date of the last commit touching the file
#   • File missing                  → entry left unchanged (warning printed)
#
# Usage:  ./update-sitemap-dates.sh        (run from anywhere inside the repo)
# Run it before committing page edits so search engines see fresh dates.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

python3 - <<'PY'
import re, subprocess, datetime, os

today = datetime.date.today().isoformat()
src = open('sitemap.xml', encoding='utf-8').read()

def last_change(path):
    dirty = subprocess.run(['git', 'status', '--porcelain', '--', path],
                           capture_output=True, text=True).stdout.strip()
    if dirty:
        return today
    out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', path],
                         capture_output=True, text=True).stdout.strip()
    return out or today

changed = 0
def fix(m):
    global changed
    block, loc = m.group(0), m.group(1)
    path = loc.replace('https://taxationupdates.com/', '', 1) or 'index.html'
    if path.endswith('/'):
        path += 'index.html'
    if not os.path.exists(path):
        print(f'  ⚠️  {loc} → file not found, left unchanged')
        return block
    new = last_change(path)
    old = re.search(r'<lastmod>([^<]*)</lastmod>', block)
    if old and old.group(1) != new:
        changed += 1
        print(f'  ✅ {path}: {old.group(1)} → {new}')
        return block.replace(old.group(0), f'<lastmod>{new}</lastmod>')
    return block

out = re.sub(r'<url>\s*<loc>([^<]+)</loc>.*?</url>', fix, src, flags=re.S)
open('sitemap.xml', 'w', encoding='utf-8').write(out)
print(f'sitemap.xml: {changed} date(s) updated')
PY
