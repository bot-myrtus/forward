const { readFileSync, writeFileSync } = require('fs')

const source = JSON.parse(readFileSync('package.json', 'utf8'))
Object.assign(source.dependencies, source.optionalDependencies)

delete source.yakumo
delete source.scripts
delete source.workspaces
delete source.devDependencies
delete source.optionalDependencies

writeFileSync('package.json', JSON.stringify(source, null, 2))
