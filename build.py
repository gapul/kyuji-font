"""Build a kyujitai display font from one face of a Source Han super OTC.

Text keeps its shinjitai codepoints. The cmap points each shinjitai codepoint
at the kyujitai glyph (data/chars.tsv), and contextual lookups appended to
ccmp pick word-dependent forms such as 弁当→辨當 and 弁論→辯論 (data/words.tsv).

usage: build.py SOURCE.ttc FACE_INDEX "Family Name" VERSION OUT.otf
"""
import sys
from pathlib import Path

from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTCollection

DATA = Path(__file__).resolve().parent / 'data'


def read_tsv(name):
    rows = []
    for line in (DATA / name).read_text(encoding='utf-8').splitlines():
        if line and not line.startswith('#'):
            k, v = line.split('\t')
            rows.append((k, v))
    return rows


def remap_cmap(font, chars):
    orig = font.getBestCmap()
    remap = {ord(k): orig[ord(v)] for k, v in chars
             if ord(k) in orig and ord(v) in orig and orig[ord(k)] != orig[ord(v)]}
    for table in font['cmap'].tables:
        if table.isUnicode():
            for cp, glyph in remap.items():
                if cp in table.cmap:
                    table.cmap[cp] = glyph
    return remap


def word_feature(cmap, words):
    def g(c):
        return cmap.get(ord(c))

    def ref(glyph):
        return '\\' + glyph.removeprefix('cid')  # CID-keyed: \12345

    first, second = [], []  # rewrite k[0] (look right) / k[1] (look left)
    for k, v in words:
        if not all(map(g, k + v)):
            continue
        if k[0] != v[0]:
            first.append(f"  sub {ref(g(k[0]))}' {ref(g(k[1]))} by {ref(g(v[0]))};")
        if k[1] != v[1]:
            # the left neighbour may already have been rewritten by the first lookup
            left = ' '.join(ref(x) for x in sorted({g(k[0]), g(v[0])}))
            second.append(f"  sub [{left}] {ref(g(k[1]))}' by {ref(g(v[1]))};")
    fea = ['lookup KyujiWordFirst {', *first, '} KyujiWordFirst;',
           'lookup KyujiWordSecond {', *second, '} KyujiWordSecond;',
           'feature ccmp { lookup KyujiWordFirst; lookup KyujiWordSecond; } ccmp;']
    return '\n'.join(fea), len(first) + len(second)


def shift_lookup_refs(obj, offset, seen):
    if id(obj) in seen or not hasattr(obj, '__dict__'):
        return
    seen.add(id(obj))
    if isinstance(getattr(obj, 'LookupListIndex', None), int):
        obj.LookupListIndex += offset
    for value in vars(obj).values():
        for item in value if isinstance(value, list) else [value]:
            shift_lookup_refs(item, offset, seen)


def append_ccmp(font, fea):
    """feaLib replaces GSUB wholesale; build aside and merge into the original."""
    orig = font['GSUB']
    addOpenTypeFeaturesFromString(font, fea, tables=['GSUB'])
    new, old = font['GSUB'].table, orig.table
    font['GSUB'] = orig

    offset = len(old.LookupList.Lookup)
    seen = set()
    for lookup in new.LookupList.Lookup:
        shift_lookup_refs(lookup, offset, seen)
    old.LookupList.Lookup += new.LookupList.Lookup
    old.LookupList.LookupCount = len(old.LookupList.Lookup)

    feat = next(r for r in new.FeatureList.FeatureRecord if r.FeatureTag == 'ccmp')
    ours = [i + offset for i in feat.Feature.LookupListIndex]
    feat.Feature.LookupListIndex = ours

    # Shapers use only the first ccmp a language system lists, so extend the
    # existing ones. ccmp rather than calt: it also runs in vertical text.
    records = old.FeatureList.FeatureRecord
    for r in records:
        if r.FeatureTag == 'ccmp':
            r.Feature.LookupListIndex += ours
            r.Feature.LookupCount = len(r.Feature.LookupListIndex)
    added = None
    for script in old.ScriptList.ScriptRecord:
        langs = [script.Script.DefaultLangSys] + [r.LangSys for r in script.Script.LangSysRecord]
        for ls in filter(None, langs):
            if any(records[i].FeatureTag == 'ccmp' for i in ls.FeatureIndex):
                continue
            if added is None:
                records.append(feat)
                old.FeatureList.FeatureCount = len(records)
                added = len(records) - 1
            ls.FeatureIndex.append(added)
            ls.FeatureCount = len(ls.FeatureIndex)


def rename(font, family, version):
    # OFL: modified versions must not use the Reserved Font Name "Source".
    weight = 'Bold' if font['OS/2'].usWeightClass >= 600 else 'Regular'
    ps = family.replace(' ', '') + '-' + weight
    name = font['name']
    base = name.getDebugName(4)
    for nid in (1, 2, 3, 4, 5, 6, 16, 17, 18, 21, 22, 25):
        name.removeNames(nameID=nid)
    notice = name.getDebugName(0) + f' Modified into {family} (kyujitai display) from {base}.'
    name.removeNames(nameID=0)
    for nid, s in ((0, notice), (1, family), (2, weight), (3, f'{version};{ps}'),
                   (4, f'{family} {weight}'), (5, f'Version {version}'), (6, ps)):
        name.setName(s, nid, 3, 1, 0x409)
        name.setName(s, nid, 1, 0, 0)  # macOS dedupes web fonts without these
    os2 = font['OS/2']
    os2.fsSelection = (os2.fsSelection & ~0b1100001) | (0b100000 if weight == 'Bold' else 0b1000000)
    font['head'].macStyle = 1 if weight == 'Bold' else 0
    cff = font['CFF '].cff
    cff.fontNames = [ps]
    top = cff.topDictIndex[0]
    top.FullName, top.FamilyName = f'{family} {weight}', family


def subset_to_face(font):
    """Drop the other regions' glyphs this face's cmap cannot reach."""
    opts = Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.name_languages = ['*']
    opts.name_legacy = True
    opts.notdef_outline = True
    opts.glyph_names = False
    opts.hinting = True
    subsetter = Subsetter(opts)
    subsetter.populate(unicodes=font.getBestCmap().keys())
    subsetter.subset(font)


def main():
    src, index, family, version, out = sys.argv[1:]
    font = TTCollection(src).fonts[int(index)]
    remapped = remap_cmap(font, read_tsv('chars.tsv'))
    fea, rules = word_feature(font.getBestCmap(), read_tsv('words.tsv'))
    append_ccmp(font, fea)
    rename(font, family, version)
    subset_to_face(font)
    font.recalcTimestamp = False  # reproducible output
    font.save(out)
    print(f'{out}: {len(remapped)} chars, {rules} word rules')


if __name__ == '__main__':
    main()
