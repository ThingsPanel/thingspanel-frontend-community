import test from 'node:test'
import assert from 'node:assert/strict'
import { historyWindowOptions, resolveHistoryWindow } from './history-filters.js'
const hour = 3600000

test('trend ranges use the same minimum aggregation as the web selector', () => {
  for (const [hours, expected] of [[1,'no_aggregate'],[3,'30s'],[6,'1m'],[12,'2m'],[24,'5m'],[72,'10m'],[168,'30m'],[360,'1h'],[720,'3h'],[1440,'6h'],[2160,'1d'],[4320,'7d'],[8760,'1mo']]) {
    assert.equal(resolveHistoryWindow(hours * hour, 'no_aggregate'), expected)
  }
})

test('custom ranges reject too-fine windows and preserve valid user selections', () => {
  assert.equal(resolveHistoryWindow(168 * hour + 1, '1m'), '1h')
  assert.equal(resolveHistoryWindow(60 * 24 * hour, '1h'), '6h')
  assert.equal(resolveHistoryWindow(7 * 24 * hour, '1d'), '1d')
  assert.equal(resolveHistoryWindow(hour, 'no_aggregate'), 'no_aggregate')
  const options = historyWindowOptions(7 * 24 * hour)
  assert.equal(options.find(option => option.value === 'no_aggregate').disabled, true)
  assert.equal(options.find(option => option.value === '1m').disabled, true)
  assert.equal(options.find(option => option.value === '30m').disabled, false)
})
