import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeAppChartConfig,
  prepareAppChartConfigForSave,
  syncAppChartConfigFromWeb
} from './chart-config-initialization'

const webConfig = '{"nodes":[{"type":"media/ezuikit-player"}]}'

test('App 从未配置时使用 Web 配置初始化', () => {
  for (const emptyConfig of [null, undefined, '', '   ']) {
    const result = JSON.parse(syncAppChartConfigFromWeb(emptyConfig, webConfig))
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

test('App 已有配置时保留本地布局并自动追加 Web 新节点', () => {
  const appConfig = {
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    nodes: [{ id: 'existing', type: 'interaction/value-card', grid: { x: 2, y: 3, w: 2, h: 1 } }]
  }
  const webConfigWithNewNode = JSON.stringify({
    canvas: { mode: 'grid', width: 1200, height: 400, gridCols: 12 },
    nodes: [
      { id: 'existing', type: 'interaction/value-card', grid: { x: 0, y: 0, w: 6, h: 1 } },
      { id: 'new-web-node', type: 'basic/text', grid: { x: 6, y: 0, w: 6, h: 1 } }
    ]
  })

  const result = JSON.parse(syncAppChartConfigFromWeb(appConfig, webConfigWithNewNode))
  assert.deepEqual(
    result.nodes.map((node: any) => node.id),
    ['existing', 'new-web-node']
  )
  assert.deepEqual(result.nodes[0].grid, {
    x: 2,
    y: 3,
    w: 2,
    h: 1,
    static: false,
    isDraggable: true,
    isResizable: true
  })
  assert.equal(result.nodes[1].sync.source, 'web')
  assert.equal(result.nodes[1].sync.state, 'inherited')
  assert.deepEqual(result.appSync.webNodeIds, ['existing', 'new-web-node'])

  const emptyAppResult = JSON.parse(syncAppChartConfigFromWeb({ nodes: [] }, webConfig))
  assert.equal(emptyAppResult.nodes[0].id, 'node-0')
  assert.equal(emptyAppResult.nodes[0].sync.source, 'web')
})

test('历史横向 App 配置迁移为竖向手机网格并重排节点', () => {
  const result = normalizeAppChartConfig({
    canvas: { mode: 'grid', width: 1200, height: 400, gridCols: 12, gridRowHeight: 50, gridGap: 10 },
    nodes: [
      { id: 'brightness', type: 'basic/value-card', grid: { x: 0, y: 0, w: 6, h: 2 } },
      { id: 'switch', type: 'interaction/basic-switch', grid: { x: 6, y: 0, w: 6, h: 2 } },
      { id: 'slider', type: 'interaction/basic-slider', grid: { x: 0, y: 2, w: 12, h: 2 } }
    ]
  })

  assert.deepEqual(result.canvas, {
    mode: 'grid',
    width: 375,
    height: 844,
    gridCols: 4,
    gridRowHeight: 50,
    gridGap: 8,
    padding: 16,
    responsive: false,
    background: { color: 'transparent' }
  })
  assert.deepEqual(
    result.nodes.map((node: any) => ({ id: node.id, grid: node.grid })),
    [
      { id: 'brightness', grid: { x: 0, y: 0, w: 2, h: 2, static: false, isDraggable: true, isResizable: true } },
      { id: 'switch', grid: { x: 2, y: 0, w: 2, h: 2, static: false, isDraggable: true, isResizable: true } },
      { id: 'slider', grid: { x: 0, y: 2, w: 4, h: 2, static: false, isDraggable: true, isResizable: true } }
    ]
  )
  assert.equal(result.nodes[0].size.width, 187.5)
  assert.equal(result.nodes[2].position.y, 100)
})

test('已有竖向 App 配置只关闭响应式，不重复重排', () => {
  const result = normalizeAppChartConfig({
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4, responsive: true },
    nodes: [{ id: 'card', type: 'basic/value-card', grid: { x: 1, y: 2, w: 2, h: 1 } }]
  })

  assert.equal(result.canvas.width, 375)
  assert.equal(result.canvas.height, 844)
  assert.equal(result.canvas.responsive, false)
  assert.equal(result.nodes[0].grid.x, 1)
  assert.equal(result.nodes[0].grid.y, 2)
})

test('Web 删除不会删除 App 节点，而是标记为 orphaned', () => {
  const appConfig = {
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    appSync: { version: 1, webNodeIds: ['keep', 'removed'], tombstones: [], orphanedNodeIds: [] },
    nodes: [
      {
        id: 'keep',
        type: 'basic/text',
        grid: { x: 0, y: 0, w: 2, h: 1 },
        sync: { source: 'web', sourceNodeId: 'keep', state: 'inherited' }
      },
      {
        id: 'removed',
        type: 'basic/text',
        grid: { x: 2, y: 0, w: 2, h: 1 },
        sync: { source: 'web', sourceNodeId: 'removed', state: 'inherited' }
      }
    ]
  }
  const webConfig = JSON.stringify({ nodes: [{ id: 'keep', type: 'basic/text' }] })
  const result = JSON.parse(syncAppChartConfigFromWeb(appConfig, webConfig))

  assert.deepEqual(
    result.nodes.map((node: any) => node.id),
    ['keep', 'removed']
  )
  assert.equal(result.nodes[1].sync.state, 'orphaned')
  assert.deepEqual(result.appSync.orphanedNodeIds, ['removed'])
})

test('App 删除继承节点会写入 tombstone，后续 Web 保存不会复活', () => {
  const previousAppConfig = {
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    appSync: { version: 1, webNodeIds: ['keep', 'removed'], tombstones: [], orphanedNodeIds: [] },
    nodes: [
      {
        id: 'keep',
        type: 'basic/text',
        grid: { x: 0, y: 0, w: 2, h: 1 },
        sync: { source: 'web', sourceNodeId: 'keep', state: 'inherited' }
      },
      {
        id: 'removed',
        type: 'basic/text',
        grid: { x: 2, y: 0, w: 2, h: 1 },
        sync: { source: 'web', sourceNodeId: 'removed', state: 'inherited' }
      }
    ]
  }
  const nextAppConfig = { ...previousAppConfig, nodes: [previousAppConfig.nodes[0]] }
  const saved = prepareAppChartConfigForSave(previousAppConfig, nextAppConfig)

  assert.deepEqual(saved.appSync.tombstones, ['removed'])
  const resynced = JSON.parse(
    syncAppChartConfigFromWeb(
      saved,
      JSON.stringify({
        nodes: [
          { id: 'keep', type: 'basic/text' },
          { id: 'removed', type: 'basic/text' }
        ]
      })
    )
  )
  assert.deepEqual(
    resynced.nodes.map((node: any) => node.id),
    ['keep']
  )
})

test('App 调整继承节点布局会记录 overridden 状态，本地节点标记为 local', () => {
  const previousAppConfig = {
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    appSync: { version: 1, webNodeIds: ['web-card'], tombstones: [], orphanedNodeIds: [] },
    nodes: [
      {
        id: 'web-card',
        type: 'basic/text',
        grid: { x: 0, y: 0, w: 2, h: 1 },
        sync: { source: 'web', sourceNodeId: 'web-card', state: 'inherited' }
      }
    ]
  }
  const nextAppConfig = {
    ...previousAppConfig,
    nodes: [
      { ...previousAppConfig.nodes[0], grid: { x: 2, y: 0, w: 2, h: 1 } },
      { id: 'app-only', type: 'basic/text', grid: { x: 0, y: 2, w: 4, h: 1 } }
    ]
  }
  const saved = prepareAppChartConfigForSave(previousAppConfig, nextAppConfig)

  assert.equal(saved.nodes[0].sync.state, 'overridden')
  assert.equal(saved.nodes[1].sync.source, 'app')
  assert.equal(saved.nodes[1].sync.state, 'local')
})
