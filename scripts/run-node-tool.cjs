const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const originalRealpathSync = fs.realpathSync.bind(fs)
const originalRealpathNative = fs.realpathSync.native
  ? fs.realpathSync.native.bind(fs.realpathSync)
  : null

const safeRealpathSync = (target, ...args) => {
  try {
    return originalRealpathNative
      ? originalRealpathNative(target, ...args)
      : originalRealpathSync(target, ...args)
  } catch {
    return path.resolve(String(target))
  }
}

fs.realpathSync = safeRealpathSync
fs.realpathSync.native = safeRealpathSync

const [tool, ...toolArgs] = process.argv.slice(2)

if (!tool) {
  console.error('Usage: node scripts/run-node-tool.cjs <nuxt|eslint|vue-tsc> [...args]')
  process.exit(1)
}

const toolEntrypoints = {
  nuxt: 'node_modules/nuxt/bin/nuxt.mjs',
  eslint: 'node_modules/eslint/bin/eslint.js',
  'vue-tsc': 'node_modules/vue-tsc/bin/vue-tsc.js'
}

const entrypoint = toolEntrypoints[tool]

if (!entrypoint) {
  console.error(`Unknown tool: ${tool}`)
  process.exit(1)
}

const entrypointPath = path.resolve(process.cwd(), entrypoint)
process.argv = ['node', entrypointPath, ...toolArgs]

if (entrypointPath.endsWith('.mjs')) {
  import(pathToFileURL(entrypointPath).href).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
} else {
  require(entrypointPath)
}
