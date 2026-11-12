import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createProtocolSelection } from './protocol-selection'
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: () => void
  const promise = new Promise<T>((a, b) => {
    resolve = a
    reject = b
  })
  return { promise, resolve, reject }
}
function fixture() {
  const schemas = new Map<string, ReturnType<typeof deferred<string[]>>>()
  let data: any = { table: [{ register: 1 }] }
  let schema = ['register']
  let key = 0
  let busy = false
  let failed = false
  const loader = createProtocolSelection({
    schema: async (_, protocol) => {
      const d = deferred<string[]>()
      schemas.set(String(protocol), d)
      return d.promise
    },
    vouchers: async () => ({}),
    clear(reset) {
      schema = []
      key++
      failed = false
      if (reset) data = {}
    },
    commit(value) {
      schema = value
    },
    loading(value) {
      busy = value
    },
    failed() {
      failed = true
    }
  })
  return { loader, schemas, state: () => ({ data, schema, key, busy, failed }) }
}
test('switch clears table data immediately; no-schema latest choice wins over late old schema', async () => {
  const f = fixture()
  const old = f.loader.select('3', 'modbus')
  assert.deepEqual(f.state().data, {})
  assert.deepEqual(f.state().schema, [])
  const latest = f.loader.select('3', 'chirpstack')
  f.schemas.get('chirpstack')!.resolve([])
  await latest
  f.schemas.get('modbus')!.resolve(['register'])
  await old
  assert.deepEqual(f.state(), { data: {}, schema: [], key: 2, busy: false, failed: false })
})
test('failed selection retains no old fields; invalidation stops late callbacks after type/close', async () => {
  const f = fixture()
  const bad = f.loader.select('3', 'bad')
  f.schemas.get('bad')!.reject()
  await bad
  assert.equal(f.state().failed, true)
  assert.deepEqual(f.state().schema, [])
  const old = f.loader.select('3', 'old')
  f.loader.invalidate()
  f.schemas.get('old')!.resolve(['bad'])
  await old
  assert.deepEqual(f.state().schema, [])
  assert.equal(f.state().busy, false)
})
test('initial editing preserves saved config; explicit empty selection clears it', async () => {
  const f = fixture()
  const load = f.loader.select('3', 'modbus', false)
  f.schemas.get('modbus')!.resolve(['register'])
  await load
  assert.deepEqual(f.state().data, { table: [{ register: 1 }] })
  await f.loader.select('3', null)
  assert.deepEqual(f.state().data, {})
  assert.deepEqual(f.state().schema, [])
})
