"""Write the kanji the Kyuji fonts change into kyuji-font.user.js.

The userscript only routes these characters to the Kyuji fonts (unicode-range),
so the list has to follow data/. `--check` fails instead of writing when the
script is out of date.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / 'kyuji-font.user.js'


def kanji():
    chars = set()
    for name in ('chars.tsv', 'words.tsv'):
        for line in (ROOT / 'data' / name).read_text(encoding='utf-8').splitlines():
            if line and not line.startswith('#'):
                # every kanji of a word must come from the same font, or the
                # contextual rule never sees its neighbour
                chars.update(c for c in line.split('\t')[0]
                             if c == '々' or '㐀' <= c <= '鿿' or '豈' <= c <= '﫿')
    return ''.join(sorted(chars))


def main():
    text = SCRIPT.read_text(encoding='utf-8')
    new = re.sub(r"^  const CHARS = '.*';$", f"  const CHARS = '{kanji()}';", text, count=1, flags=re.M)
    if '--check' in sys.argv:
        if new != text:
            sys.exit('kyuji-font.user.js is out of date: run python3 gen_userscript.py')
        return
    SCRIPT.write_text(new, encoding='utf-8')


if __name__ == '__main__':
    main()
