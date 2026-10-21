[日本語](README.ja.md)

# kyuji-font

kyuji-font consists of two font families plus a userscript that let a browser show ordinary Japanese text written in shinjitai (新字体) with kyujitai (旧字体) glyphs. The text itself is never changed, so copy, search, and page scripts see the original characters.

## Install and use

1. Download `kyuji-fonts.zip` from GitHub Releases and install the four `.otf` files (macOS: Font Book; Windows: right-click > Install; Linux: `~/.local/share/fonts`). Restart the browser after installing or updating the fonts; replacing a font file while a browser uses it can make it draw wrong kanji until restart.
2. Install `kyuji-font.user.js` in a userscript manager.
3. Recommended: set the browser's default Japanese fonts to Kyuji Mincho (serif) and Kyuji Gothic (sans-serif). Pages with no font named, and kanji on pages that name only Latin fonts such as Arial, fall back to these defaults.
   - Firefox: Settings > General > Fonts > Advanced, language Japanese.
   - Chrome: `chrome://settings/fonts`.
   - Without this, such kanji may get the system font's own `trad` forms, without word rules (弁論 becomes 辨論).

## How it works

### Fonts

- **Kyuji Mincho** (from Source Han Serif, Japanese face) and **Kyuji Gothic** (from Source Han Sans, Japanese face). Regular and Bold each, 4 `.otf` files, 16–25 MB each.
- By default they draw shinjitai like any Japanese font. Kyujitai appears only when the OpenType `trad` feature is on (CSS: `font-variant-east-asian: traditional`).
- Inside `trad`, substitutions run in this order:
  1. 376 two-character word rules from `data/words.tsv`, e.g. 弁当→辨當, 弁論→辯論, 花弁→花瓣. Some rules restore pre-1956 spellings replaced by same-sound kanji, e.g. 広報→弘報, 総合→綜合, 連絡→聯絡.
  2. One-to-one swaps for 456 characters from `data/chars.tsv`, e.g. 国→國, 学→學. Characters changed by a word rule are swapped again by step 2 when listed (回転→廻轉).
- Works in horizontal and vertical text.

### Userscript

`kyuji-font.user.js` (v0.3.0) is for Violentmonkey or Tampermonkey and downloads nothing.

- Turns on `font-variant-east-asian: traditional` for every element. This is the on/off switch: disable the script and every page shows shinjitai again, even where Kyuji is the browser default font.
- Keeps the page's own fonts. Only 789 kanji are drawn from Kyuji (all kanji in `chars.tsv` plus every kanji in `words.tsv`; word-rule kanji must come from one font for the rule to see its neighbour, so a few unchanged kanji such as 明 and 論 also come from Kyuji). It adds `FontFace` entries under the page's own family names, limited with `unicode-range` to those kanji; Kyuji Mincho for names that look like Mincho/serif, Kyuji Gothic otherwise.
- Installed system fonts (Hiragino, Yu Gothic/Mincho, Meiryo, MS Gothic/Mincho, Osaka, IPAex): a face added under an installed font's name hides that font, so the script re-adds the original faces by PostScript name in weight bands first. macOS names were checked; Windows names were not.
- Web fonts the page loads (`document.fonts`): adds a Kyuji face with the same weight/style/stretch, including fonts loaded later.

## Limitations

- No historical kana spelling (歴史的仮名遣); fonts cannot change spelling.
- Word rules see two adjacent characters in one shaping run; browsers split kanji and kana into separate runs, so 弁え is not converted.
- Rules ignore word boundaries: a listed word inside a longer word converts too (舞台風 → 舞颱風). Rules that misfired were removed (日食 in 毎日食べた, 月食, 一丁 in 一丁目).
- 寧 has no kyujitai glyph in Source Han and stays as is. 丙 was removed because its source mapping pointed at a kanbun mark.
- Only Regular and Bold: very light or heavy page fonts get Regular or Bold kanji.
- The global `trad` rule also switches page fonts that have their own `trad` feature (e.g. Hiragino) for characters they draw themselves, without word rules; on Simplified Chinese pages a font may switch to Traditional Chinese; and it overrides any `font-variant-east-asian` value the page sets.
- Tested on macOS in Firefox and Chrome.

## Build

- `nix build` produces `result/share/fonts/opentype`. It takes Source Han from nixpkgs, runs `build.py` per face, then `check.py` shapes sample text with HarfBuzz and fails unless `trad` gives kyujitai (horizontal and vertical) and no `trad` leaves shinjitai. It also runs `gen_userscript.py --check`, failing if the userscript's kanji list is out of date with `data/`.
- Dev shell: `nix develop`.
- Manual build: `python3 build.py SourceHanSerif.ttc 10 "Kyuji Mincho" 0.3.0 KyujiMincho-Regular.otf` (face indices: Serif 10/25, Sans 15/30 for Regular/Bold).
- Edit tables: `data/chars.tsv` and `data/words.tsv` are tab-separated, `#` starts a comment, and words are exactly two characters. After editing run `python3 gen_userscript.py`.
- Release: push a tag `v*` and GitHub Actions builds and attaches `kyuji-fonts.zip` and `kyuji-font.user.js`.

## Background and credits

This project uses the same idea as sito.jp (伊藤信哉研究室, https://sito.jp/index/orthography.html), which serves a modified 原ノ味 font so its shinjitai text shows in kyujitai.

Conversion tables were derived from the userscript 舊字變換 by yu, with fixes.

## License

- Code (`build.py`, `check.py`, `gen_userscript.py`, userscript): MIT.
- Fonts: SIL Open Font License 1.1, derived from Source Han Serif/Sans by Adobe; the Reserved Font Name "Source" is not used.
