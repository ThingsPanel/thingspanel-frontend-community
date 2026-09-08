import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const root = new URL('../src/', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const screens = [
  'views/product/update-package/index.vue',
  'views/product/update-ota/index.vue',
  'views/product/update-ota/components/device-register.vue',
  'views/product/update-ota/components/table-detail-modal.vue'
]

for (const screen of screens) {
  assert(!read(screen).includes("$t('common.action')"), `${screen} must use the translated actions key`)
}

assert(read('service/product/update-ota.ts').includes('deleteOtaTask'), 'OTA task deletion request is required')
assert(read('service/product/update-ota.ts').includes('deleteOtaPackage'), 'OTA upgrade deletion request is required')
const taskList = read('views/product/update-ota/components/device-register.vue')
assert(taskList.includes('deleteOtaTask'), 'OTA task list must expose deletion')
assert(taskList.includes('NPopconfirm'), 'OTA task deletion must require confirmation')
const otaList = read('views/product/update-ota/index.vue')
assert(otaList.includes('deleteOtaPackage'), 'OTA upgrade list must expose deletion')
assert(otaList.includes('NPopconfirm'), 'OTA upgrade deletion must require confirmation')
assert(otaList.includes('影响范围'), 'OTA upgrade deletion confirmation must explain impact scope')

console.log('PASS: OTA task action localization and deletion contract')
