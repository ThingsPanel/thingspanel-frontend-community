import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const page = read('src/views/device/manage/index.vue')
const table = read('src/components/data-table-page/index.vue')

assert(page.includes("label: () => $t('custom.devicePage.delete')") || page.includes("label: () => $t('common.delete')"), 'device delete action is required')
assert(table.includes('top-right-icon'), 'card view must render actions in the top-right slot')
assert(table.includes("key: 'actions'"), 'list view must render an actions column')

console.log('PASS: device management delete action contract')
