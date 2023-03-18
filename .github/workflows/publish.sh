cd dist

cat package.json | jq ".version=\"0.0.0-$GITHUB_SHA\" | .private=false" > package.json.tmp
mv -f package.json.tmp package.json

cd ..
tar -czf dist.tgz dist
npm publish dist.tgz --access public --tag latest
