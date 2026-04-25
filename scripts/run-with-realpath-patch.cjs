const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

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

const script = process.argv[2]

if (!script) {
  console.error('Usage: node scripts/run-with-realpath-patch.cjs <script> [...args]')
  process.exit(1)
}

process.argv = ['node', path.resolve(script), ...process.argv.slice(3)]
Module.runMain()
