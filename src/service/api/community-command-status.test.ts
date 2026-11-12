import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  communityCommandLabel,
  communityCommandReason,
  createCommunityCommandPageLoader
} from './community-command-status'
test('canonical unknown replaces legacy pending and cannot be reported as success', async () => {
  const loader = createCommunityCommandPageLoader(
    async () => ({ data: { value: [{ message_id: 'id', status: '0' }], count: 1 } }),
    async () => ({ data: { status: 'unknown', error_message: 'broker publication outcome unknown' } })
  )
  const result = await loader.load({})
  assert.equal(result.data.value[0].status, 'unknown')
  assert.equal(result.data.value[0].error_message, '设备通道未确认发布结果')
  assert.equal(communityCommandLabel('unknown'), '结果未知')
  assert.match(communityCommandLabel('0'), /待确认/)
  assert.match(communityCommandLabel('2'), /失败/)
  assert.doesNotMatch(communityCommandReason('token=secret'), /secret/)
})
test('bounded unique receipt requests; failed reads retain pending, no repeated polling', async () => {
  let calls = 0
  const rows = Array.from({ length: 6 }, (_, index) => ({ message_id: String(index), status: '0' }))
  const loader = createCommunityCommandPageLoader(
    async () => ({ data: { list: [...rows, rows[0]] } }),
    async () => {
      calls++
      throw new Error('offline')
    }
  )
  const result = await loader.load({})
  assert.equal(calls, 4)
  assert.ok(result.data.list.every(row => row.status === '0'))
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(calls, 4)
})
test('late page response is ignored after newer page or unmount', async () => {
  let finish!: (value: any) => void
  const loader = createCommunityCommandPageLoader(
    async () => ({ data: [{ message_id: 'id', status: '0' }] }),
    () =>
      new Promise(resolve => {
        finish = resolve
      })
  )
  const old = loader.load({})
  await Promise.resolve()
  loader.invalidate()
  finish({ data: { status: 'device_reported_success' } })
  assert.equal((await old).error, true)
})
