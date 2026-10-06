# kyuji-font

Display ordinary Japanese text written in shinjitai (新字体) using kyujitai (旧字体 / 正字) glyphs (e.g., 国学 shows as 國學). The underlying text is not changed, allowing copy, search, and page scripts to see the original characters.

This project implements the same idea as [sito.jp](https://sito.jp/index/orthography.html) (伊藤信哉研究室), which serves a modified 原ノ味 font so shinjitai text displays in kyujitai.

## Fonts

Two font families in OpenType CFF (.otf) format, each provided in Regular and Bold weights:

- **Kyuji Mincho** (derived from Source Han Serif JP)
- **Kyuji Gothic** (derived from Source Han Sans JP)

## How It Works

- The font's `cmap` table maps shinjitai codepoints to kyujitai glyphs (`data/chars.tsv`, 456 characters take effect).
- Word-dependent forms are handled via contextual substitutions appended to the `ccmp` feature (`data/words.tsv`), e.g., 弁当→辨當, 弁論→辯論, 花弁→花瓣, 総合→綜合, 連絡→聯絡.
- `ccmp` is used so substitutions also function in vertical writing.

## Limitations

- Historical kana usage (歴史的仮名遣) is not handled (fonts cannot perform this).
- Word rules only match two adjacent characters within a single shaping run. Browsers split kanji and kana into separate runs, so forms such as 弁え are not converted.
- Characters with multiple kyujitai forms that are not present in `data/words.tsv` retain a single form (e.g., standalone 弁 remains 弁).
- 寧 has no target glyph in Source Han and is left unchanged.
- Word rules match without word boundaries; entries that misfire were dropped (e.g., 日食 in 毎日食べた, 月食, 一丁 in 一丁目).
- If a page names only Latin fonts (e.g. font-family: Arial), the browser renders kanji with the operating system's fallback font, so they are not converted.
- Kyuji has only Regular and Bold, so very light or very heavy page fonts get Regular or Bold kanji.
- Pages that use only generic families (serif/sans-serif) are drawn entirely in the browser's default fonts (which the Browser Setup step sets to Kyuji).

## Installation

1. Download `kyuji-fonts.zip` from GitHub Releases.
2. Install the four `.otf` files (16–25 MB each):
   - **macOS:** Font Book
   - **Windows:** Right-click and select "Install"
   - **Linux:** `~/.local/share/fonts`

## Browser Setup

1. **Default fonts:** Set the browser's default Japanese fonts (serif → Kyuji Mincho, sans-serif → Kyuji Gothic) for pages using generic font families.
2. **Userscript:** Install `kyuji-font.user.js` in a userscript manager (Tampermonkey, Violentmonkey). The userscript (v0.2.0) keeps the page's own fonts and draws only the affected kanji from the Kyuji fonts: the kanji in `data/chars.tsv` plus every kanji appearing in `data/words.tsv` (789 characters). Word-rule kanji must come from the same font or the contextual rule cannot see its neighbour, so some unchanged kanji (e.g. 明, 論) are also drawn by Kyuji.
   - **How:** It adds `FontFace` entries under the page's own family names, limited with `unicode-range` to those kanji.
   - **Installed system fonts** (Hiragino, Yu Gothic/Mincho, Meiryo, MS Gothic/Mincho, Osaka, IPAex): Defining a face under an installed font's name hides that font, so the script first re-adds the original faces by PostScript name, split into weight bands, and adds the Kyuji kanji in the same bands. macOS PostScript names were read from CoreText; Windows names are the commonly documented ones and have not been verified.
   - **Web fonts the page declares** (found through `document.fonts`): The script adds a Kyuji face with the same weight/style/stretch descriptors as each of the page's faces.
   - Families not in that list and not declared by the page are left untouched.
   - **Verification:** In Chrome, `CSS.getPlatformFontsForNode` (DevTools protocol) reported e.g. for a Hiragino Mincho page "Hiragino Mincho ProN 5 glyphs, Kyuji Mincho 3 glyphs" for 国学の校舎、です, and for a page web font only the affected kanji came from Kyuji.

## Building from Source

Build with Nix:

```sh
nix build
```

Outputs are placed in `result/share/fonts/opentype`. The build takes the Source Han fonts from nixpkgs, runs `build.py` for each face, and executes `check.py`, which shapes sample strings with HarfBuzz (horizontal and vertical) and fails if expected glyphs do not appear.

Development shell:

```sh
nix develop
```

Manual build:

```sh
python3 build.py SourceHanSerif.ttc 10 "Kyuji Mincho" 0.1.0 KyujiMincho-Regular.otf
```

## Editing Tables

Edit `data/chars.tsv` and `data/words.tsv`:
- Tab-separated format.
- Lines starting with `#` are comments.
- Entries in `data/words.tsv` must consist of exactly two characters.

## Releases

Pushing a tag matching `v*` runs GitHub Actions to build and attach `kyuji-fonts.zip` and `kyuji-font.user.js` to the release.

## License & Credits

- **Code** (`build.py`, `check.py`, userscript): MIT License.
- **Fonts**: SIL Open Font License 1.1, derived from Source Han Serif / Sans by Adobe. The OFL Reserved Font Name "Source" is not used.
- Conversion tables were derived from the userscript 舊字變換 by yu.
