import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { compileTemplate, parse } from 'vue/compiler-sfc'
import { describe, expect, it } from 'vitest'

// A template syntax error (for example several statements in one @click without
// semicolons) only shows up when the page is opened, and takes the whole page down.
// Compiling every device page here catches it in the unit run.
const roots = ['src/views/device', 'src/views/automation', 'src/components/thingsvis']

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? vueFiles(path) : path.endsWith('.vue') ? [path] : []
  })
}

describe('device page templates compile', () => {
  const files = roots.flatMap(vueFiles)

  it('finds the device pages', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files)('%s', file => {
    const { descriptor, errors } = parse(readFileSync(file, 'utf8'), { filename: file })
    expect(errors.map(String)).toEqual([])
    if (descriptor.template) {
      const result = compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: file,
        compilerOptions: { prefixIdentifiers: true }
      })
      expect(result.errors.map(String)).toEqual([])
    }
  })
})
