// ==UserScript==
// @name         Kyuji Font
// @namespace    https://github.com/gapul/kyuji-font
// @version      0.1.0
// @description  Render Japanese pages in kyujitai with the locally installed Kyuji Mincho / Kyuji Gothic. Text itself is left untouched.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// An @font-face rule hides an installed font of the same family name, so
// re-pointing the common Japanese font names at the Kyuji fonts swaps the
// glyphs without touching text, icon fonts, or the page's serif/sans choice.
(() => {
  'use strict';

  const GOTHIC = [
    'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Hiragino Kaku Gothic Pro',
    'ヒラギノ角ゴシック', 'ヒラギノ角ゴ ProN', 'ヒラギノ角ゴ ProN W3', 'ヒラギノ角ゴ Pro W3',
    'Yu Gothic', 'YuGothic', 'Yu Gothic UI', '游ゴシック', '游ゴシック体', '游ゴシック Medium',
    'Meiryo', 'メイリオ', 'Meiryo UI', 'MS PGothic', 'ＭＳ Ｐゴシック', 'MS Gothic', 'ＭＳ ゴシック',
    'BIZ UDPGothic', 'BIZ UDGothic', 'Noto Sans JP', 'Noto Sans CJK JP', 'Source Han Sans JP',
    'Source Han Sans', 'IPAexGothic', 'IPAPGothic', 'M PLUS 1p', 'Zen Kaku Gothic New', 'Osaka',
  ];
  const MINCHO = [
    'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'ヒラギノ明朝 ProN', 'ヒラギノ明朝 ProN W3',
    'Yu Mincho', 'YuMincho', '游明朝', '游明朝体', 'MS PMincho', 'ＭＳ Ｐ明朝', 'MS Mincho', 'ＭＳ 明朝',
    'BIZ UDPMincho', 'BIZ UDMincho', 'Noto Serif JP', 'Noto Serif CJK JP', 'Source Han Serif JP',
    'Source Han Serif', 'IPAexMincho', 'IPAPMincho', 'Shippori Mincho', 'Zen Old Mincho',
  ];

  const faces = (names, family) => names.flatMap((name) => [
    `@font-face{font-family:"${name}";font-weight:100 549;` +
      `src:local("${family} Regular"),local("${family.replace(' ', '')}-Regular")}`,
    `@font-face{font-family:"${name}";font-weight:550 900;` +
      `src:local("${family} Bold"),local("${family.replace(' ', '')}-Bold")}`,
  ]).join('\n');

  const style = document.createElement('style');
  style.textContent = faces(GOTHIC, 'Kyuji Gothic') + '\n' + faces(MINCHO, 'Kyuji Mincho');

  // Where several @font-face rules share a name, the last one wins, so keep
  // ours after any web font the page itself declares (e.g. Noto Sans JP).
  const place = () => {
    const parent = document.head || document.documentElement;
    if (parent && parent.lastElementChild !== style) parent.appendChild(style);
  };
  place();
  document.addEventListener('DOMContentLoaded', place);
  window.addEventListener('load', place);
})();
