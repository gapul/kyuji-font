{
  description = "Kyuji Mincho / Kyuji Gothic: Source Han fonts that display shinjitai text in kyujitai";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (s: f nixpkgs.legacyPackages.${s});
      version = "0.2.0";
    in
    {
      packages = forAll (pkgs:
        let
          python = pkgs.python3.withPackages (p: [ p.fonttools ]);
          serif = "${pkgs.source-han-serif}/share/fonts/truetype/SourceHanSerif.ttc";
          sans = "${pkgs.source-han-sans}/share/fonts/truetype/SourceHanSans.ttc";
          # Face indices of the Japanese (unsuffixed) faces in the super OTCs.
          faces = {
            KyujiMincho-Regular = { src = serif; index = 10; family = "Kyuji Mincho"; };
            KyujiMincho-Bold = { src = serif; index = 25; family = "Kyuji Mincho"; };
            KyujiGothic-Regular = { src = sans; index = 15; family = "Kyuji Gothic"; };
            KyujiGothic-Bold = { src = sans; index = 30; family = "Kyuji Gothic"; };
          };
          src = pkgs.lib.fileset.toSource {
            root = ./.;
            fileset = pkgs.lib.fileset.unions [ ./build.py ./check.py ./gen_userscript.py ./kyuji-font.user.js ./data ];
          };
          face = name: f: pkgs.runCommand name { nativeBuildInputs = [ python ]; } ''
            mkdir -p $out/share/fonts/opentype
            python3 ${src}/build.py ${f.src} ${toString f.index} "${f.family}" ${version} \
              $out/share/fonts/opentype/${name}.otf
          '';
          built = pkgs.lib.mapAttrs face faces;
        in
        built // {
          default = pkgs.symlinkJoin {
            name = "kyuji-fonts-${version}";
            paths = builtins.attrValues built;
            postBuild = ''
              install -Dm644 ${./OFL.txt} $out/share/doc/kyuji-fonts/OFL.txt
              PATH=${pkgs.harfbuzz.dev}/bin:$PATH ${python}/bin/python3 ${src}/check.py \
                $out/share/fonts/opentype/*.otf
              # the userscript's kanji list must follow data/
              ${python}/bin/python3 ${src}/gen_userscript.py --check
            '';
          };
        });

      devShells = forAll (pkgs: {
        default = pkgs.mkShell {
          packages = [ (pkgs.python3.withPackages (p: [ p.fonttools ])) pkgs.harfbuzz.dev ];
        };
      });
    };
}
