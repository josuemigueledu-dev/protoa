#!/bin/sh
# Copies the current app from main into b/<id>/ for the "Protoa (Arthur)" artifact.
# id = short hash of the last commit that touched apps/deutsch or shared. Prints the id.
set -e
cd "$(dirname "$0")"
REPO=../..
ID=$(git -C $REPO log -1 --format=%h -- apps/deutsch shared)
OUT=b/$ID
rm -rf "$OUT" && mkdir -p "$OUT/css" "$OUT/js"
cp $REPO/apps/deutsch/css/*.css "$OUT/css/"
cp $REPO/shared/art/tokens.css "$OUT/css/tokens.css"
cp $REPO/apps/deutsch/js/*.js "$OUT/js/"
cp $REPO/shared/orb/glorb.js "$OUT/js/glorb.js"
# the app's own markup (between <body> and the first <script>), and its script and font order
sed -n '/<body>/,/<script/p' $REPO/apps/deutsch/index.html | sed '1d;$d' > "$OUT/body.html"
grep -o '<script src="[^"]*"' $REPO/apps/deutsch/index.html | sed 's/<script src="//;s/"$//;s#.*/##' > "$OUT/scripts.txt"
grep -o 'https://fonts.googleapis.com/css2[^"]*' $REPO/apps/deutsch/index.html | head -1 > "$OUT/fonts.txt"
echo "$ID"
