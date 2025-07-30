// 简单测试数据 - 验证GridStack修复效果
export const simpleTestData = {
  id: 'test-panel',
  name: 'Simple Test Panel',
  config: JSON.stringify([
    {
      x: 0,
      y: 0,
      w: 3,
      h: 2,
      i: 'test-1',
      data: {
        cardId: 'device-count',
        type: 'builtin',
        title: '设备总数',
        config: {},
        layout: { w: 3, h: 2, minW: 2, minH: 2 }
      }
    },
    {
      x: 3,
      y: 0,
      w: 3,
      h: 2,
      i: 'test-2',
      data: {
        cardId: 'online-count',
        type: 'builtin',
        title: '在线设备',
        config: {},
        layout: { w: 3, h: 2, minW: 2, minH: 2 }
      }
    },
    {
      x: 6,
      y: 0,
      w: 3,
      h: 2,
      i: 'test-3',
      data: {
        cardId: 'offline-count',
        type: 'builtin',
        title: '离线设备',
        config: {},
        layout: { w: 3, h: 2, minW: 2, minH: 2 }
      }
    },
    {
      x: 0,
      y: 2,
      w: 6,
      h: 4,
      i: 'test-4',
      data: {
        cardId: 'device-trend',
        type: 'builtin',
        title: '设备趋势图',
        config: {},
        layout: { w: 6, h: 4, minW: 3, minH: 3 }
      }
    }
  ]),
  tenant_id: 'test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  home_flag: 'Y',
  description: '简单测试数据'
}
