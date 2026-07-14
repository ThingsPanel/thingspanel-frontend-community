import assert from 'node:assert/strict'
import test from 'node:test'
import { initializeAppChartConfigOnce } from './chart-config-initialization'

const webConfig = '{"nodes":[{"type":"media/ezuikit-player"}]}'

test('App 从未配置时使用 Web 配置初始化', () => {
  assert.equal(initializeAppChartConfigOnce(null, webConfig), webConfig)
  assert.equal(initializeAppChartConfigOnce(undefined, webConfig), webConfig)
  assert.equal(initializeAppChartConfigOnce('', webConfig), webConfig)
  assert.equal(initializeAppChartConfigOnce('   ', webConfig), webConfig)
})

test('App 已有配置时不被后续 Web 保存覆盖', () => {
  const appConfig = '{"nodes":[{"type":"interaction/value-card"}]}'
  assert.equal(initializeAppChartConfigOnce(appConfig, webConfig), appConfig)

  const objectConfig = { nodes: [] }
  assert.equal(initializeAppChartConfigOnce(objectConfig, webConfig), objectConfig)
})
