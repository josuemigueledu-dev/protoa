#!/bin/sh
# Copies the current app from main into b/<id>/ for the "Protoa (Arthur)" artifact.
# id = short hash of the last commit that touched apps/deutsch or shared. Prints the id.
set -e
cd "$(dirname "$0")"
REPO=../..
ID=$(git -C $REPO log -1 --format=%h -- apps/deutsch shared)
OUT=b/4fa445f  # one reused slot: the artifact holds at most 512 files and old builds cannot be deleted from here
rm -rf "$OUT" && mkdir -p "$OUT/css" "$OUT/js/lessons"
cp $REPO/apps/deutsch/css/*.css "$OUT/css/"
cp $REPO/shared/art/tokens.css "$OUT/css/tokens.css"
cp $REPO/apps/deutsch/js/*.js "$OUT/js/"
[ -d $REPO/apps/deutsch/js/lessons ] && cp $REPO/apps/deutsch/js/lessons/*.js "$OUT/js/lessons/"
cp $REPO/shared/orb/glorb.js "$OUT/js/glorb.js"
# Night Glass: pictures (art/night) and self-hosted fonts; font urls point at the build's own fonts/
# the pictures are shared by all builds at the artifact's root (art/night/), so each build stays small
if [ -d $REPO/apps/deutsch/art/night ]; then mkdir -p art && rm -rf art/night && cp -r $REPO/apps/deutsch/art/night art/;
  sed -i "s#\([(\`\"']\)art/night/#\1../../art/night/#g" "$OUT"/js/*.js; sed -i 's#\.\./art/night/#../../../art/night/#g' "$OUT"/css/*.css; fi
# fonts are shared at the root too (fonts/)
if [ -d $REPO/shared/fonts ]; then mkdir -p fonts && cp $REPO/shared/fonts/*.woff2 fonts/; sed -i 's#\.\./\.\./\.\./shared/fonts/#../../../fonts/#g' "$OUT"/css/*.css; fi
# stylesheet order, as index.html loads them (tokens first)
{ echo tokens; grep -o '<link rel="stylesheet" href="css/[^"]*"' $REPO/apps/deutsch/index.html | sed 's#.*href="css/##;s#\.css"$##'; } > "$OUT/css.txt"
# the app's own markup (between <body> and the first <script>), and its script and font order
sed -n '/<body>/,/<script/p' $REPO/apps/deutsch/index.html | sed '1d;$d' > "$OUT/body.html"
grep -o '<script src="[^"]*"' $REPO/apps/deutsch/index.html | sed 's/<script src="//;s/"$//;s#^js/##;s#.*/glorb.js#glorb.js#' > "$OUT/scripts.txt"
grep -o 'https://fonts.googleapis.com/css2[^"]*' $REPO/apps/deutsch/index.html | head -1 > "$OUT/fonts.txt"
# one stylesheet and one script per build (the artifact holds at most 512 files): same order as index.html
for c in $(cat "$OUT/css.txt"); do cat "$OUT/css/$c.css"; echo; done > "$OUT/app.css.tmp"
rm -rf "$OUT/css" && mkdir -p "$OUT/css" && mv "$OUT/app.css.tmp" "$OUT/css/app.css" && echo app > "$OUT/css.txt"
for j in $(cat "$OUT/scripts.txt"); do cat "$OUT/js/$j"; printf '
;
'; done > "$OUT/app.js.tmp"
rm -rf "$OUT/js" && mkdir -p "$OUT/js" && mv "$OUT/app.js.tmp" "$OUT/js/app.js" && echo app.js > "$OUT/scripts.txt"
# the cast's voices (rendered on this PC by docker/tts: render.py, then pack.py): a few sprites and their manifest
VOX=/c/Users/jm480/docker/tts/out/audio
if [ -f $VOX/manifest.json ]; then mkdir -p "$OUT/audio" && cp $VOX/*.mp3 $VOX/manifest.json "$OUT/audio/"; fi
echo "$ID"
