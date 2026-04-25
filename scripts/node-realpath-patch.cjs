const fs = require('node:fs')
const path = require('node:path')

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
