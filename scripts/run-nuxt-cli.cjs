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

const cliPath = path.resolve(process.cwd(), 'node_modules/nuxt/bin/nuxt.mjs')
process.argv = ['node', cliPath, ...process.argv.slice(2)]

import(pathToFileURL(cliPath).href).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
