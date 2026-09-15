import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const pngSize = path => {
  const data = readFileSync(new URL(path, root))
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  return [data.readUInt32BE(16), data.readUInt32BE(20)]
}

assert.match(read('index.html'), /%VITE_BASE_URL%brand\/ygsoul-cloud-favicon-v2\.png/)
assert.match(read('.env'), /VITE_APP_TITLE=幽光云/)
assert.match(read('.env'), /VITE_BRAND_LOGO_URL=\/tp\/brand\/ygsoul-cloud-logo-v2\.png/)
assert.match(read('.env'), /VITE_BRAND_FAVICON_URL=\/tp\/brand\/ygsoul-cloud-favicon-v2\.png/)
assert.match(read('.env.production'), /VITE_THINGSVIS_STUDIO_URL=\/main\/main\.html/)
assert.match(read('src/plugins/loading.ts'), /brand\/ygsoul-cloud-logo-v2\.png/)
assert.doesNotMatch(read('src/plugins/loading.ts'), /svg-icon\/logo\.svg\?raw/)
assert.match(read('src/store/modules/sys-setting/index.ts'), /ThingsPanel.*幽光云/)
assert.match(read('src/components/common/system-logo.vue'), /import\.meta\.env\.BASE_URL/)
assert.ok(existsSync(new URL('public/brand/ygsoul-cloud-logo-v2.png', root)))
assert.ok(existsSync(new URL('public/brand/ygsoul-cloud-favicon-v2.png', root)))
assert.deepEqual(pngSize('public/brand/ygsoul-cloud-logo-v2.png'), [256, 256])
assert.deepEqual(pngSize('public/brand/ygsoul-cloud-favicon-v2.png'), [64, 64])

console.log('PASS: 幽光云品牌标识契约')
