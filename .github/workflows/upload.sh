repository=$1
variant=$2
release=$3

if [ -z "$release" ]; then
  release=$(curl \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Authorization: token $TOKEN" \
    https://api.github.com/repos/$repository/releases/latest \
  )
fi

name=$(cat package.json | jq -r '.name' | cut -d / -f 2)
tag_name=$(echo "$release" | jq -r '.tag_name')
upload_url=$(echo "$release" | jq -r '.upload_url' | cut -d '{' -f 1)

echo name: $name
echo tag_name: $tag_name
echo upload_url: $upload_url

output=$(curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/zip" \
  "$upload_url?name=$name-$tag_name-$variant.zip" \
  --data-binary @$RUNNER_TEMP/bundle.zip \
)

echo "::set-output name=asset::$output"
