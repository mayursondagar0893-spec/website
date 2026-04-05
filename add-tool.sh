#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
# add-tool.sh — Integrate a new HTML tool into taxationupdates.com
#
# Usage:
#   ./add-tool.sh FILENAME.html "Tool Name" "Short description" [emoji]
#
# What it does automatically:
#   1. Validates the file exists in the repo root
#   2. Bumps CACHE_NAME version in sw.js
#   3. Adds the file to PRECACHE_URLS in sw.js
#   4. Adds a <url> entry to sitemap.xml
#   5. Inserts a portfolio card into index.html
#   6. Prints a validation report of required head elements
# ════════════════════════════════════════════════════════════════
set -euo pipefail

FILENAME="${1:-}"
TOOL_NAME="${2:-}"
DESCRIPTION="${3:-}"
EMOJI="${4:-🛠️}"

# ── Argument validation ──────────────────────────────────────────
if [[ -z "$FILENAME" || -z "$TOOL_NAME" || -z "$DESCRIPTION" ]]; then
  echo ""
  echo "  Usage: ./add-tool.sh FILENAME.html \"Tool Name\" \"Short description\" [emoji]"
  echo ""
  echo "  Example:"
  echo "    ./add-tool.sh GST-CALCULATOR.html \"GST Calculator\" \"Calculate GST for any amount\" \"🧮\""
  echo ""
  exit 1
fi

SITE_ROOT="$(cd "$(dirname "$0")" && pwd)"
FILE_PATH="$SITE_ROOT/$FILENAME"
TODAY=$(date +%Y-%m-%d)

# ── File existence check ─────────────────────────────────────────
if [[ ! -f "$FILE_PATH" ]]; then
  echo ""
  echo "  ❌ Error: '$FILENAME' not found in $SITE_ROOT"
  echo "     Save your HTML file there first, then re-run this script."
  echo ""
  exit 1
fi

echo ""
echo "  ══════════════════════════════════════════════"
echo "  Adding tool: $TOOL_NAME ($FILENAME)"
echo "  ══════════════════════════════════════════════"
echo ""

# ── Python does all file manipulations ──────────────────────────
python3 - "$FILENAME" "$TOOL_NAME" "$DESCRIPTION" "$EMOJI" "$TODAY" "$SITE_ROOT" <<'PYEOF'
import sys, re, os

filename    = sys.argv[1]
tool_name   = sys.argv[2]
description = sys.argv[3]
emoji       = sys.argv[4]
today       = sys.argv[5]
site_root   = sys.argv[6]

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ── 1. sw.js ─────────────────────────────────────────────────────
sw_path = os.path.join(site_root, 'sw.js')
sw = read(sw_path)

# Bump CACHE_NAME version
old_version_match = re.search(r"taxationupdates-v(\d+)", sw)
if old_version_match:
    old_v = int(old_version_match.group(1))
    new_v = old_v + 1
    sw = sw.replace(f"taxationupdates-v{old_v}", f"taxationupdates-v{new_v}")
    print(f"  [sw.js]     CACHE_NAME bumped: v{old_v} → v{new_v}")
else:
    print("  [sw.js]     ⚠️  Could not find CACHE_NAME version — update manually")

# Add to PRECACHE_URLS if not already present
url_entry = f"  '/{filename}',"
if f"/{filename}" in sw:
    print(f"  [sw.js]     '{filename}' already in PRECACHE_URLS — skipped")
else:
    sw = re.sub(
        r"(const PRECACHE_URLS = \[[\s\S]*?)(];)",
        lambda m: m.group(1) + url_entry + "\n" + m.group(2),
        sw
    )
    print(f"  [sw.js]     Added '/{filename}' to PRECACHE_URLS")

write(sw_path, sw)

# ── 2. sitemap.xml ───────────────────────────────────────────────
sitemap_path = os.path.join(site_root, 'sitemap.xml')
sitemap = read(sitemap_path)

sitemap_url = f"https://taxationupdates.com/{filename}"
if sitemap_url in sitemap:
    print(f"  [sitemap]   '{filename}' already in sitemap.xml — skipped")
else:
    new_entry = (
        f"  <url>\n"
        f"    <loc>{sitemap_url}</loc>\n"
        f"    <lastmod>{today}</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n"
        f"    <priority>0.8</priority>\n"
        f"  </url>\n"
    )
    sitemap = sitemap.replace('</urlset>', new_entry + '</urlset>')
    print(f"  [sitemap]   Added entry for '{filename}' (lastmod: {today})")

write(sitemap_path, sitemap)

# ── 3. index.html — portfolio card ───────────────────────────────
index_path = os.path.join(site_root, 'index.html')
index = read(index_path)

# Check if already linked
if filename in index:
    print(f"  [index]     '{filename}' already in index.html — skipped")
else:
    # Count existing cards to pick the next t-class (cycles t1→t2→t3)
    card_count = len(re.findall(r'class="portfolio-card', index))
    t_class = f"t{(card_count % 3) + 1}"

    new_card = (
        f'    <a href="{filename}" class="portfolio-card reveal">\n'
        f'      <div class="p-thumb {t_class}">{emoji}</div>\n'
        f'      <div class="p-body"><div class="p-tag">Tool</div>'
        f'<h3>{tool_name}</h3><p>{description}</p></div>\n'
        f'    </a>\n'
    )

    # Insert before the closing tag of portfolio-grid
    # The unique anchor is the </div> that closes .portfolio-grid followed by </section>
    ANCHOR = '  </div>\n</section>\n\n\n<!-- ══════════ BLOG'
    if ANCHOR in index:
        index = index.replace(ANCHOR, new_card + '  </div>\n</section>\n\n\n<!-- ══════════ BLOG')
        print(f"  [index]     Portfolio card inserted (class={t_class}, emoji={emoji})")
    else:
        print(f"  [index]     ⚠️  Could not find portfolio-grid anchor — add card manually")

write(index_path, index)

# ── 4. Validation report on the tool HTML ────────────────────────
tool_html = read(os.path.join(site_root, filename))

checks = [
    ('GA tag G-YC101DVMH7',         'G-YC101DVMH7'               in tool_html),
    ('brand-icons.css linked',       '/brand-icons.css'            in tool_html),
    ('manifest.json linked',         '/manifest.json'              in tool_html),
    ('icon-192.png linked',          '/icons/icon-192.png'         in tool_html),
    ('og:title meta',                'og:title'                    in tool_html),
    ('og:description meta',          'og:description'              in tool_html),
    ('og:url meta',                  'og:url'                      in tool_html),
    ('canonical link',               'rel="canonical"'             in tool_html),
    ('twitter:card meta',            'twitter:card'                in tool_html),
    ('lang="en"',                    'lang="en"'                   in tool_html),
    ('data-theme="light"',           'data-theme="light"'          in tool_html),
    ('localStorage theme key',       "localStorage"                in tool_html and "'theme'" in tool_html),
    ('No raw phone numbers',         not bool(re.search(r'\b[6-9]\d{9}\b', tool_html))),
    ('dark mode CSS block',          '[data-theme="dark"]'         in tool_html),
    ('viewport meta',                'name="viewport"'             in tool_html),
]

print("")
print("  ── HTML Validation Report ─────────────────────")
all_pass = True
for label, passed in checks:
    icon = "✅" if passed else "❌"
    print(f"  {icon}  {label}")
    if not passed:
        all_pass = False

print("")
if all_pass:
    print("  ✅  All checks passed — tool is ready!")
else:
    print("  ⚠️  Fix the ❌ items above in the HTML file.")
print("  ───────────────────────────────────────────────")
print("")

PYEOF

echo "  Done. Files updated:"
echo "    • $FILENAME  (your tool)"
echo "    • sw.js      (cache version bumped + precache entry added)"
echo "    • sitemap.xml (new URL entry added)"
echo "    • index.html  (portfolio card added)"
echo ""
echo "  Next: commit all 4 files and push to deploy."
echo ""
