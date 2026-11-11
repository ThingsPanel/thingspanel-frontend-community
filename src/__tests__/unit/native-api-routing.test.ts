import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')

// The release nginx and the Vite dev proxy must send the same /api/v2 prefixes to the native
// Encore service; a prefix missing from either one is answered 404 by the wrong server.
describe('native /api/v2 routing', () => {
  const nginx = read('nginx.conf')
  const proxy = read('build/config/proxy.ts')

  const nginxPrefixes = (() => {
    const groups = [
      ...nginx.matchAll(/location ~ \^\/api\/v2\/\(([^)]*)\)\(\/\|\$\)\s*\{\s*proxy_pass\s+http:\/\/encore-api:14000/g)
    ]
    return new Set(groups.flatMap(match => match[1].split('|')))
  })()

  const proxyPrefixes = (() => {
    const list = proxy.slice(proxy.indexOf('for (const prefix of ['), proxy.indexOf('proxy[`/api/v2/${prefix}`]'))
    return new Set([...list.matchAll(/'([a-z0-9-]+)'/g)].map(match => match[1]))
  })()

  it('lists the same prefixes in nginx and in the dev proxy', () => {
    expect(nginxPrefixes.size).toBeGreaterThan(10)
    expect([...nginxPrefixes].sort()).toEqual([...proxyPrefixes].sort())
  })

  it('routes the device, template, file and connector APIs to Encore', () => {
    for (const prefix of [
      'devices',
      'device-access-templates',
      'file-assets',
      'connection-providers',
      'reading-exports'
    ]) {
      expect(nginxPrefixes.has(prefix)).toBe(true)
    }
  })

  it('does not leave the notification routes to the Community backend', () => {
    expect(nginx).toMatch(/notification\[\^\/\]\*/)
  })
})
