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

test('横向网格按源像素宽度映射到手机列并向上取整保证可读', () => {
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
      { id: 'brightness', grid: { x: 0, y: 0, w: 4, h: 2, static: false, isDraggable: true, isResizable: true } },
      { id: 'switch', grid: { x: 0, y: 2, w: 4, h: 2, static: false, isDraggable: true, isResizable: true } },
      { id: 'slider', grid: { x: 0, y: 4, w: 4, h: 2, static: false, isDraggable: true, isResizable: true } }
    ]
  )
  assert.equal(result.nodes[0].size.width, 343)
  assert.equal(result.nodes[2].position.y, 200)
})

test('自动生成 App 网格时 320px Web Value 不会被缩成一列', () => {
  const result = normalizeAppChartConfig({
    canvas: { mode: 'fixed', width: 1920, height: 1080 },
    nodes: [{ id: 'web-value-320', type: 'interaction/value-card', position: { x: 0, y: 0 }, size: { width: 320, height: 160 } }]
  })

  assert.deepEqual(
    (({ x, y, w, h }: any) => ({ x, y, w, h }))(result.nodes[0].grid),
    { x: 0, y: 0, w: 4, h: 3 }
  )
  assert.equal(result.nodes[0].size.width, 343)
})

test('手机网格按padding和gap计算可读span边界', () => {
  const normalizeWidth = (width: number) => normalizeAppChartConfig({
    canvas: { mode: 'fixed', width: 1920, height: 1080 },
    nodes: [{ id: `web-value-${width}`, type: 'interaction/value-card', size: { width, height: 160 } }]
  }).nodes[0]

  const width160 = normalizeWidth(160)
  const width187 = normalizeWidth(187)
  assert.equal(width160.grid.w, 2)
  assert.equal(width160.size.width, 167.5)
  assert.equal(width187.grid.w, 3)
  assert.equal(width187.size.width, 255.25)
})

test('自动重排先把源网格列宽换算成像素再映射手机列', () => {
  const result = normalizeAppChartConfig({
    canvas: { mode: 'grid', width: 1920, height: 1080, gridCols: 24 },
    nodes: [{ id: 'web-grid-value', type: 'interaction/value-card', grid: { x: 0, y: 0, w: 4, h: 3 } }]
  })

  assert.equal(result.nodes[0].grid.w, 4)
  assert.equal(result.nodes[0].size.width, 343)
})

test('后续 Web 新节点可读且不覆盖 App 自定义布局、两个本地节点或删除标记', () => {
  const appConfig = {
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    appSync: { version: 1, webNodeIds: ['overridden-web', 'deleted-web'], tombstones: ['deleted-web'], orphanedNodeIds: [] },
    nodes: [
      {
        id: 'overridden-web', type: 'interaction/value-card', grid: { x: 2, y: 3, w: 2, h: 1 },
        position: { x: 187.5, y: 150 }, size: { width: 187.5, height: 50 },
        sync: { source: 'web', sourceNodeId: 'overridden-web', state: 'overridden' }
      },
      { id: 'app-local-a', type: 'basic/text', grid: { x: 0, y: 4, w: 2, h: 1 }, sync: { source: 'app', state: 'local' } },
      { id: 'app-local-b', type: 'basic/text', grid: { x: 2, y: 5, w: 2, h: 1 }, sync: { source: 'app', state: 'local' } }
    ]
  }
  const appBefore = structuredClone(appConfig)
  const webConfig = JSON.stringify({
    canvas: { mode: 'fixed', width: 1920, height: 1080 },
    nodes: [
      { id: 'overridden-web', type: 'interaction/value-card', size: { width: 320, height: 160 } },
      { id: 'deleted-web', type: 'basic/text', size: { width: 320, height: 160 } },
      { id: 'new-web-value', type: 'interaction/value-card', size: { width: 320, height: 160 } }
    ]
  })

  const result = JSON.parse(syncAppChartConfigFromWeb(appConfig, webConfig))
  const overridden = result.nodes.find((node: any) => node.id === 'overridden-web')
  const localNodes = result.nodes.filter((node: any) => node.sync?.source === 'app')
  const added = result.nodes.find((node: any) => node.id === 'new-web-value')
  const gridGeometry = (grid: any) => ({ x: grid.x, y: grid.y, w: grid.w, h: grid.h })

  assert.deepEqual(gridGeometry(overridden.grid), gridGeometry(appBefore.nodes[0].grid))
  assert.equal(overridden.sync.state, 'overridden')
  assert.deepEqual(localNodes.map((node: any) => node.id), ['app-local-a', 'app-local-b'])
  assert.deepEqual(localNodes.map((node: any) => gridGeometry(node.grid)), appBefore.nodes.slice(1).map((node: any) => gridGeometry(node.grid)))
  assert.equal(result.nodes.some((node: any) => node.id === 'deleted-web'), false)
  assert.deepEqual(result.appSync.tombstones, ['deleted-web'])
  assert.equal(added.grid.w, 4)
  assert.equal(added.sync.source, 'web')
  assert.deepEqual(appConfig, appBefore)
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
