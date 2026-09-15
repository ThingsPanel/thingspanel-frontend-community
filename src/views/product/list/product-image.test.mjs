import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const here = new URL('.', import.meta.url).pathname
const read = file => readFileSync(resolve(here, file), 'utf8')

test('product list renders the returned product image', () => {
  const source = read('index.vue')
  assert.match(source, /key:\s*'image_url'/)
  assert.match(source, /src=\{resolveProductImageUrl\(row\.image_url\)\}/)
})

test('product editor synchronizes an existing image into the upload control', () => {
  const source = read('components/upload-card.vue')
  assert.match(source, /watch\(\(\) => props\.value/)
  assert.match(source, /v-model:file-list="dataList"/)
  assert.match(source, /resolveBackendAbsoluteUrl\(getDemoServerUrl\(\)\)/)
  assert.doesNotMatch(source, /new URL\(getDemoServerUrl\(\)\)/)
  assert.doesNotMatch(source, /上传产品图片/)
  assert.match(source, /\^https\?:\\\/\\\//)
})

test('product images use the dedicated TOS upload type', () => {
  const source = read('components/table-action-modal.vue')
  const upload = read('components/upload-card.vue')

  assert.match(source, /source-type="product-image"/)
  assert.match(upload, /\/file\/up\?type=/)
})

test('product upload keeps the local preview path and emits a separate TOS URL', () => {
  const upload = read('components/upload-card.vue')
  const source = read('components/table-action-modal.vue')

  assert.match(source, /v-model:tos-value="formModel\.tos_image_url"/)
  assert.match(upload, /emit\('update:value', response\.data\.path\)/)
  assert.match(upload, /emit\('update:tosValue', response\.data\.tos_path\)/)
  assert.match(upload, /migrateLegacyProductImage/)
})
