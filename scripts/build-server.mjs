// Bundles the Node server (server/node.ts) into build/server.mjs — plain JavaScript,
// all npm dependencies included, so the host only needs Node (Hostinger entry file).
import { build } from 'rolldown'
import { rmSync } from 'node:fs'

rmSync('build', { recursive: true, force: true })
await build({
  input: 'server/node.ts',
  platform: 'node',
  // node:sqlite stays external (built into Node); everything else is bundled
  external: [/^node:/],
  output: {
    dir: 'build',
    format: 'esm',
    entryFileNames: 'server.mjs',
    chunkFileNames: 'chunks/[name]-[hash].mjs',
    // some CommonJS deps call require(); give ESM output a real require
    banner: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  logLevel: 'warn',
})
console.log('Built build/server.mjs')
