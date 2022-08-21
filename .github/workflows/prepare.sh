# set up yarn
echo 'nodeLinker: node-modules' >> .yarnrc.yml
echo 'npmRegistryServer: https://registry.npmmirror.com' >> .yarnrc.yml

# remove ^ from package.json
# do not use sed -i, it behaves differently on Linux and MacOS
cat package.json | sed 's/\^//g' > package.json.tmp
mv -f package.json.tmp package.json

# remove development-related fields
# merge optionalDependencies into dependencies
node .github/workflows/prepare.cjs
