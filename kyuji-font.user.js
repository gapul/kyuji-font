// ==UserScript==
// @name         Kyuji Font
// @namespace    https://github.com/gapul/kyuji-font
// @version      0.3.0
// @description  Render Japanese pages in kyujitai with the locally installed Kyuji Mincho / Kyuji Gothic, keeping the page's own fonts for everything else. Text itself is left untouched.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// Only the kanji the Kyuji fonts change are drawn from them; every other
// character stays in the font the page asked for. This works by adding faces
// under the page's own family names, limited by unicode-range to those kanji.
(() => {
  'use strict';

  // Generated from data/ by gen_userscript.py.
  const CHARS = '々一丁万上与両並中乗乱乳乾亀了予争亜交人仏代仮企会伝伸低佐体余併供価侮侵係俊保倉倒倹停偽僧償先克免児党入全共典内円冊冒冗写冬処凶刃分列別利制券刺削前剣剤剰割助励労効勅勉動勘務勢勤勧勲包区医卑単即却原厳参双反収受叙口古台史号合吟呉告周和唖唱問喝喩喫営嘆嘘嘱噛器回団囲図固国圏園圧地城堕報塀塁塚塩境増墨壁壊壌士壮声壱売変外多大天奇契奥奨奪奮妨姫娯嬢学安宝実害寛寝寧対寿専将尋導小少尚尭尽屈届屏属層岳峡崩巌巣差巻布希帯帰帳干年并幸庁広底廃廉廊弁弐弥弦弯張強弾当形彫影役径後徒従御復徳徴心応快思恋恐恒恩息恵悔悦悩悪情惨想感慎慨慰慶憎憲憶懐懲成戒戦戯戸戻房扇手才払承技抗抜択抵担拝拠拡挑挙挟挿捜掃掌掘接控掲掻揚援揺損摂撃撹擲支放敏教散数文斉斎断旅旗既旧早昇明昼晋晩晴暁暑暖暗暦暴曲書曽有朗期本朴条来枢枯栄根格案桜桝桟梅棄検楼楽概様槙模権横機欄欠欧歌歓止歩歯歳歴死残殖殴殺殻殿母毎比気水決沈没沢沪沿泊注洗活浄浅浜海浸消涙混清渇済渉渋渓渚温測湾湿満溶滅滝滞漁漢潜潮激瀬火灯炉炎炭点為焦然焼煮熱燥物特犠状独狭猟猥猪献獣珠理琢瑶瓶生産用画留略畳疎疏病痩痴痺発白的皇益盗盟盲相県真眼知短石研砕破碑確礼社祈祉祐祖祝神祥祷禄禅禍禎福秘称税稲穀穂穏突窃立竜端符筆答管節範簡粉粋粛精糖糸糾純索累終経結絡絵絶継続綿総緑緒線編練縁縄縦繁繊繋繍缶署美義羽翻考者聡聴肝胆背能脚脱脳腐腰膜膨臓自臭興舌舎舗船色艶芦花芸芽英茎荘荷落著蒋蒸蔵薄薫薬虚虜虫蚕蛍蛮蝋行術衛衣衰装裏補製褐褒襲覆覇視覚覧観解触討訓記訥訳証試詭誉語説読調論諭諸謀謁講謝謡謹識譲護豊象買賓賛賞贈起跡践踏車転軽輪輸辞辺迷退逆透逓途通連逸遅遊達遥選遺避邦郎郭郷都酔酢酸醤醸釈重野量針鉄鉱銘銭鋭鋳錬録鎖鎮長開間関閲闘防阻除陥陰陳険隆随障隠隣隷雄集雇雑離難霊露青靖静響頴頻頼顔顕類風飛食飢飯飲飼飾餅餓館饉香駁駄駅駆騒験騰骨髄高髪鬪魃鴎鶏鹸麦麹麺麻黄黒黙齢卑繁';

  // Defining any face under an installed font's family name hides that font,
  // so for these families the original faces are re-added by PostScript name
  // first. Entries are [CSS weight, local() names]; macOS names were read from
  // CoreText, Windows names are the commonly documented ones (not verified).
  const SYSTEM = {
    'Hiragino Sans': [[100, ['HiraginoSans-W0']], [200, ['HiraginoSans-W1']], [300, ['HiraginoSans-W2']],
      [400, ['HiraginoSans-W3']], [500, ['HiraginoSans-W4']], [600, ['HiraginoSans-W5']],
      [700, ['HiraginoSans-W6']], [800, ['HiraginoSans-W7']], [900, ['HiraginoSans-W8']]],
    'Hiragino Kaku Gothic ProN': [[400, ['HiraKakuProN-W3']], [700, ['HiraKakuProN-W6']]],
    'Hiragino Kaku Gothic Pro': [[400, ['HiraKakuPro-W3']], [700, ['HiraKakuPro-W6']]],
    'Hiragino Mincho ProN': [[400, ['HiraMinProN-W3']], [700, ['HiraMinProN-W6']]],
    'Hiragino Mincho Pro': [[400, ['HiraMinPro-W3']], [700, ['HiraMinPro-W6']]],
    'Hiragino Maru Gothic ProN': [[400, ['HiraMaruProN-W4']]],
    'Yu Gothic': [[300, ['YuGothic-Light', 'YuGo-Medium']], [400, ['YuGothic-Regular', 'YuGo-Medium']],
      [500, ['YuGothic-Medium', 'YuGo-Medium']], [700, ['YuGothic-Bold', 'YuGo-Bold']]],
    'Yu Mincho': [[300, ['YuMincho-Light', 'YuMin-Medium']], [400, ['YuMincho-Regular', 'YuMin-Medium']],
      [600, ['YuMincho-Demibold', 'YuMin-Demibold']], [800, ['YuMin-Extrabold', 'YuMincho-Demibold']]],
    'Meiryo': [[400, ['Meiryo']], [700, ['Meiryo-Bold']]],
    'Meiryo UI': [[400, ['MeiryoUI']], [700, ['MeiryoUI-Bold']]],
    'MS Gothic': [[400, ['MS-Gothic']]],
    'MS PGothic': [[400, ['MS-PGothic']]],
    'MS Mincho': [[400, ['MS-Mincho']]],
    'MS PMincho': [[400, ['MS-PMincho']]],
    'Osaka': [[400, ['Osaka']]],
    'IPAexGothic': [[400, ['IPAexGothic']]],
    'IPAexMincho': [[400, ['IPAexMincho']]],
  };
  const ALIASES = {
    'ヒラギノ角ゴシック': 'Hiragino Sans',
    'ヒラギノ角ゴ ProN': 'Hiragino Kaku Gothic ProN', 'ヒラギノ角ゴ ProN W3': 'Hiragino Kaku Gothic ProN',
    'ヒラギノ角ゴ Pro': 'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro W3': 'Hiragino Kaku Gothic Pro',
    'ヒラギノ明朝 ProN': 'Hiragino Mincho ProN', 'ヒラギノ明朝 ProN W3': 'Hiragino Mincho ProN',
    'ヒラギノ明朝 Pro': 'Hiragino Mincho Pro', 'ヒラギノ明朝 Pro W3': 'Hiragino Mincho Pro',
    'ヒラギノ丸ゴ ProN': 'Hiragino Maru Gothic ProN', 'ヒラギノ丸ゴ ProN W4': 'Hiragino Maru Gothic ProN',
    'YuGothic': 'Yu Gothic', '游ゴシック': 'Yu Gothic', '游ゴシック体': 'Yu Gothic', '游ゴシック Medium': 'Yu Gothic',
    'YuMincho': 'Yu Mincho', '游明朝': 'Yu Mincho', '游明朝体': 'Yu Mincho',
    'メイリオ': 'Meiryo',
    'ＭＳ ゴシック': 'MS Gothic', 'ＭＳ Ｐゴシック': 'MS PGothic', 'ＭＳ 明朝': 'MS Mincho', 'ＭＳ Ｐ明朝': 'MS PMincho',
  };

  const range = (() => {
    const cps = [...CHARS].map((c) => c.codePointAt(0));
    const out = [];
    for (let i = 0; i < cps.length; i++) {
      let j = i;
      while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
      const hex = (n) => n.toString(16).toUpperCase();
      out.push(i === j ? `U+${hex(cps[i])}` : `U+${hex(cps[i])}-${hex(cps[j])}`);
      i = j;
    }
    return out.join(',');
  })();

  const ours = new WeakSet();
  const done = new Set();
  const add = (family, src, descriptors) => {
    const face = new FontFace(family, src, descriptors);
    ours.add(face);
    document.fonts.add(face);
  };
  const kyuji = (family, bold) => {
    const name = /mincho|明朝|serif/i.test(family) ? 'Kyuji Mincho' : 'Kyuji Gothic';
    const weight = bold ? 'Bold' : 'Regular';
    return `local("${name} ${weight}"), local("${name.replace(' ', '')}-${weight}")`;
  };

  // Installed fonts: re-add the originals, then the Kyuji kanji over them, both
  // split into the same weight bands so a weight never selects only one of the two.
  const system = (family, faces) => {
    faces.forEach(([weight, names], i) => {
      const lo = i === 0 ? 1 : Math.floor((faces[i - 1][0] + weight) / 2) + 1;
      const hi = i === faces.length - 1 ? 1000 : Math.floor((weight + faces[i + 1][0]) / 2);
      const band = `${lo} ${hi}`;
      add(family, names.map((n) => `local("${n}")`).join(', '), { weight: band });
      add(family, kyuji(family, weight >= 600), { weight: band, unicodeRange: range });
    });
  };

  // Web fonts the page declares: mirror each face's descriptors so the Kyuji
  // face is chosen for exactly the same requests as the page's own.
  const scan = () => {
    for (const face of document.fonts) {
      if (ours.has(face)) continue;
      const family = face.family.replace(/^["']|["']$/g, '');
      const key = [family, face.weight, face.style, face.stretch].join('|');
      if (done.has(key) || done.has(`system|${family}`)) continue;
      done.add(key);
      const bold = parseInt(face.weight, 10) >= 600 || face.weight === 'bold';
      add(family, kyuji(family, bold),
        { weight: face.weight, style: face.style, stretch: face.stretch, unicodeRange: range });
    }
  };

  // The Kyuji fonts draw shinjitai until trad is on. Turning it on everywhere is
  // what switches them, including when they are the browser's default fonts, so
  // disabling this script brings back shinjitai on every page.
  const trad = document.createElement('style');
  trad.textContent = '*, *::before, *::after { font-variant-east-asian: traditional !important; }';
  document.documentElement.appendChild(trad);

  const declared = new Set([...document.fonts].map((f) => f.family.replace(/^["']|["']$/g, '')));
  for (const name of [...Object.keys(SYSTEM), ...Object.keys(ALIASES)]) {
    if (declared.has(name)) continue; // the page brings its own font under this name
    done.add(`system|${name}`);
    system(name, SYSTEM[ALIASES[name] || name]);
  }
  scan();
  document.fonts.addEventListener('loading', scan);
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('load', scan);
})();
