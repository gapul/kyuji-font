[English](README.md)

# kyuji-font

## 概要

`kyuji-font` は、新字体で書かれた通常の日本語テキストをブラウザー上で旧字体の字形で表示するための、2つのフォントファミリーとユーザースクリプトのセットです。テキスト自体は一切書き換えないため、コピーやページ内検索、ページのスクリプトからは元の文字がそのまま見えます。

## 導入と使い方

1. GitHub Releases から `kyuji-fonts.zip` をダウンロードし、4つの `.otf` ファイルをインストールします（macOS: Font Book、Windows: 右クリック > インストール、Linux: `~/.local/share/fonts`）。フォントのインストールや更新の後はブラウザーを再起動してください。ブラウザーが使用中のフォントファイルを置き換えると、再起動するまで誤った漢字が描画されることがあります。
2. ユーザースクリプトマネージャー（Violentmonkey や Tampermonkey）に `kyuji-font.user.js` をインストールします。
3. 推奨設定として、ブラウザーのデフォルト日本語フォントに `Kyuji Mincho`（明朝・serif）と `Kyuji Gothic`（ゴシック・sans-serif）を設定します。フォント指定のないページや、`Arial` などの欧文フォントのみを指定しているページ上の漢字は、このデフォルトフォントにフォールバックします（Firefox: Settings > General > Fonts > Advanced、言語を Japanese に設定。Chrome: `chrome://settings/fonts`）。これを設定しない場合、そうした漢字にはシステムフォント自身の `trad` 字形が語単位の規則なしで適用されることがあります（`弁論` が `辨論` になります）。

## 仕組み（フォント・ユーザースクリプト）

### フォント

- `Kyuji Mincho`（Source Han Serif 日本語版ベース）と `Kyuji Gothic`（Source Han Sans 日本語版ベース）の2ファミリーです。それぞれ Regular と Bold があり、計4つの `.otf` ファイル（各 16–25 MB）で構成されます。
- デフォルトでは通常の日本語フォントと同様に新字体を描画します。OpenType の `trad` 機能（CSS の `font-variant-east-asian: traditional`）が有効なときだけ旧字体が表示されます。
- `trad` の内部では次の順序で置換が行われます。
  1. `data/words.tsv` による376個の二字熟語ルール（例: `弁当`→`辨當`、`弁論`→`辯論`、`花弁`→`花瓣`）。一部のルールは1956年以前の表記（同音の漢字に置き換えられたもの）を復元します（例: `広報`→`弘報`、`総合`→`綜合`、`連絡`→`聯絡`）。
  2. `data/chars.tsv` による456文字の一対一置換（例: `国`→`國`、`学`→`學`）。熟語ルールで変換された文字も、このリストに含まれていれば手順2でさらに置換されます（`回転`→`廻轉`）。
- 横書きと縦書きの両方で動作します。

### ユーザースクリプト

`kyuji-font.user.js`（v0.3.0）は Violentmonkey または Tampermonkey 用で、外部からのダウンロードは一切行いません。

- すべての要素に対して `font-variant-east-asian: traditional` を有効にします。これがオン・オフのスイッチになっており、スクリプトを無効にすれば、ブラウザーのデフォルトフォントを Kyuji に設定している場合でもすべてのページが新字体表示に戻ります。
- ページ本来のフォントを維持します。Kyuji から描画されるのは789字の漢字のみです（`chars.tsv` の全漢字と `words.tsv` に含まれる全漢字。熟語ルールが隣の文字を参照するには同じフォントで描画される必要があるため、`明` や `論` のような変換されない漢字も一部 Kyuji から描画されます）。スクリプトはページ自身のフォントファミリー名の下に、`unicode-range` で対象漢字のみに限定した `FontFace` エントリを追加します。ファミリー名が明朝・serif 系に見える場合は `Kyuji Mincho`、それ以外は `Kyuji Gothic` を割り当てます。
- インストール済みのシステムフォント（Hiragino、Yu Gothic/Mincho、Meiryo、MS Gothic/Mincho、Osaka、IPAex）については、既存のフォント名の下にフェイスを追加すると元のフォントが隠れてしまうため、まず元のフェイスを PostScript 名を使ってウェイト帯ごとに再登録します。macOS のフォント名は確認済みですが、Windows のフォント名は未確認です。
- ページが読み込む Web フォント（`document.fonts`）に対しては、後から読み込まれるものも含め、同じ weight / style / stretch を持つ Kyuji のフェイスを追加します。

## 制約

- 歴史的仮名遣には対応していません。フォントで仮名遣いを変えることはできません。
- 熟語ルールは同一シェイピングラン（shaping run）内の隣接する2文字を参照します。ブラウザーは漢字と仮名を別々のランに分割するため、`弁え` は変換されません。
- ルールは語の境界を区別しないため、長い語の中に登録語が含まれる場合も変換されます（`舞台風` → `舞颱風`）。誤変換を起こしたルール（`毎日食べた` の `日食`、`月食`、`一丁目` の `一丁`）は削除されています。
- `寧` は Source Han に旧字体のグリフがないためそのまま残ります。`丙` は元のマッピングが漢文用の記号を指していたため削除されました。
- ウェイトは Regular と Bold のみです。極細や極太のページフォントでも、漢字部分は Regular または Bold になります。
- グローバルな `trad` 指定により、独自の `trad` 機能を持つページフォント（Hiragino など）が自身で描画する文字も、熟語ルールなしで切り替わります。また、簡体字中国語のページではフォントが繁体字中国語に切り替わることがあるほか、ページ側が設定した `font-variant-east-asian` の値は上書きされます。
- macOS 上の Firefox と Chrome でテストされています。

## ビルド

- `nix build` → `result/share/fonts/opentype` に出力されます。nixpkgs から Source Han を取得し、フェイスごとに `build.py` を実行した後、`check.py` が HarfBuzz でサンプルテキストをシェイピングし、`trad` 有効時に旧字体（横書き・縦書き）、`trad` 無効時に新字体にならなければ失敗します。また `gen_userscript.py --check` も実行し、ユーザースクリプト内の漢字リストが `data/` と一致しない場合は失敗します。
- 開発シェルは `nix develop` で起動できます。手動ビルドのコマンドは `python3 build.py SourceHanSerif.ttc 10 "Kyuji Mincho" 0.3.0 KyujiMincho-Regular.otf` です（フェイス番号は Regular/Bold の順に Serif が 10/25、Sans が 15/30 です）。
- 変換表の編集はタブ区切りの `data/chars.tsv` と `data/words.tsv` で行います（`#` で始まる行はコメント、熟語はちょうど2文字です）。編集後は `python3 gen_userscript.py` を実行してください。
- リリース時は `v*` タグを push すると、GitHub Actions がビルドを行い、`kyuji-fonts.zip` と `kyuji-font.user.js` を添付します。

## 背景とクレジット

改変した原ノ味フォントを配信して新字体のテキストを旧字体で表示している sito.jp（伊藤信哉研究室、https://sito.jp/index/orthography.html）と同じ発想に基づいています。変換表は yu 氏によるユーザースクリプト「舊字變換」から派生し、修正を加えたものです。

## ライセンス

- コード（`build.py`、`check.py`、`gen_userscript.py`、ユーザースクリプト）: MIT ライセンス
- フォント: SIL Open Font License 1.1（Adobe による Source Han Serif/Sans からの派生であり、Reserved Font Name である "Source" は使用していません）
