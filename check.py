"""Shape sample text with HarfBuzz: kyujitai with trad on, untouched without it.

usage: check.py FONT.otf ...   (needs hb-shape on PATH)
"""
import subprocess
import sys

from fontTools.ttLib import TTFont

# input text -> what it must render as (glyph-for-glyph)
CASES = {
    '国学': '國學',
    '弁当と弁論': '辨當と辯論',
    '花弁': '花瓣',
    '総合連絡': '綜合聯絡',
    '侵食': '侵蝕',
    '毎日食べた一丁目': '每日⻝べた一丁目',  # 日食 must not fire; 食 itself maps to ⻝
}


def shape(font_path, text, direction, features=''):
    out = subprocess.run(
        ['hb-shape', '--no-glyph-names', '--no-positions', '--no-clusters',
         f'--direction={direction}', f'--features={features}', font_path, text],
        capture_output=True, text=True, check=True).stdout
    return [int(g) for g in out.strip('[]\n').split('|')]


def main():
    failed = 0
    for path in sys.argv[1:]:
        font = TTFont(path)
        cmap = font.getBestCmap()
        for text, want in CASES.items():
            # the expected glyph of each kyujitai char is what its own codepoint maps to
            expect = [font.getGlyphID(cmap[ord(c)]) for c in want]
            plain = [font.getGlyphID(cmap[ord(c)]) for c in text]
            if shape(path, text, 'ltr') != plain:
                failed += 1
                print(f'FAIL {path}: {text} changed without trad')
            for direction in ('ltr', 'ttb'):
                got = shape(path, text, direction, 'trad')
                if direction == 'ttb':
                    # vert may swap kana/punctuation; compare kanji positions only
                    pairs = [(g, e) for g, e, c in zip(got, expect, want) if '㐀' <= c <= '鿿']
                    ok = all(g == e for g, e in pairs)
                else:
                    ok = got == expect
                if not ok:
                    failed += 1
                    print(f'FAIL {path} {direction}: {text} -> {got}, want {want} {expect}')
        print(f'{path}: checked')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
