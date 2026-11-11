import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { build, type Plugin, type ResolvedConfig } from 'vite'

// The admin bundle's manual chunks can pull chart/editor libraries into the
// small mobile host. Build it independently while retaining one deploy artifact.
export function setupMpDeviceBuild(): Plugin {
  let config: ResolvedConfig
  let written = false
  return {
    name: 'thingspanel-mp-device-build',
    apply: 'build',
    configResolved(value) {
      config = value
    },
    async closeBundle() {
      // writeBundle marks successful output; closeBundle also runs on failures.
      if (!written) return
      await build({
        root: config.root,
        configFile: resolve(config.root, 'vite.mp-device.config.ts'),
        mode: config.mode,
        base: config.base,
        build: {
          outDir: config.build.outDir,
          emptyOutDir: false,
          copyPublicDir: false,
          assetsDir: 'mp-device/assets',
          manifest: 'mp-device/manifest.json'
        }
      })
      const output = resolve(config.root, config.build.outDir)
      const manifest = JSON.parse(await readFile(resolve(output, 'mp-device/manifest.json'), 'utf8'))
      const entry = manifest['mp-device/index.html']
      if (!entry?.isEntry) throw new Error('Missing mini-program build entry')
      const files = new Set<string>()
      const visited = new Set<string>()
      const visit = (key: string) => {
        if (visited.has(key)) return
        visited.add(key)
        const chunk = manifest[key]
        files.add(chunk.file)
        for (const file of chunk.css || []) files.add(file)
        for (const imported of chunk.imports || []) visit(imported)
      }
      visit('mp-device/index.html')
      const sizes = await Promise.all(
        [...files].map(async file => {
          const contents = await readFile(resolve(output, file))
          return gzipSync(Uint8Array.from(contents)).length
        })
      )
      const bytes = sizes.reduce((sum, size) => sum + size, 0)
      if (bytes > 128 * 1024) throw new Error(`Mini-program initial JS/CSS exceeds 128 KiB gzip: ${bytes} bytes`)
      config.logger.info(`Mini-program initial JS/CSS: ${(bytes / 1024).toFixed(1)} KiB gzip`)
    },
    writeBundle() {
      written = true
    },
    buildStart() {
      written = false
    }
  }
}
