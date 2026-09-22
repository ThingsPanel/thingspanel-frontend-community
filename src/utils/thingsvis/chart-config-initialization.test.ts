import assert from 'node:assert/strict'
import test from 'node:test'
import { initializeAppChartConfigOnce } from './chart-config-initialization'

const webConfig = '{"nodes":[{"type":"media/ezuikit-player"}]}'

test('App 从未配置时使用 Web 配置初始化', () => {
  for (const emptyConfig of [null, undefined, '', '   ']) {
    const result = JSON.parse(initializeAppChartConfigOnce(emptyConfig, webConfig))
    assert.equal(result.nodes[0].type, 'media/ezuikit-player')
    assert.deepEqual(result.nodes[0].position, { x: 0, y: 0 })
    assert.deepEqual(result.nodes[0].size, { width: 240, height: 200 })
    assert.deepEqual(result.nodes[0].baseStyle.background, { color: 'transparent', opacity: 1 })
    assert.deepEqual(result.canvas, {
      mode: 'grid',
      width: 375,
      height: 844,
      background: { color: 'transparent' },
      gridCols: 4,
      gridRowHeight: 50,
      gridGap: 8,
      padding: 16,
      responsive: false
    })
  }
})

test('App 已有配置时不被后续 Web 保存覆盖', () => {
  const appConfig = '{"nodes":[{"type":"interaction/value-card"}]}'
  assert.equal(initializeAppChartConfigOnce(appConfig, webConfig), appConfig)

  const objectConfig = { nodes: [] }
  assert.equal(initializeAppChartConfigOnce(objectConfig, webConfig), JSON.stringify(objectConfig))
})
