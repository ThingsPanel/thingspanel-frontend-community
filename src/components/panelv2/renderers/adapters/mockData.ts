// 模拟数据 - 用于测试和开发
// Mock data for testing and development

import type { ExternalPanelData } from './GridAdapter'

/** Grid真实测试数据 */
export const realGridData: ExternalPanelData = {
  id: 'fb368f9b-dc2b-ef3e-d444-f304b9f8cf8b',
  name: 'home',
  config:
    '[{"x":6,"y":0,"w":3,"h":2,"minW":2,"minH":2,"i":1745306022634299,"data":{"cardId":"on-num","type":"builtin","title":"在线设备数","config":{},"layout":{"w":3,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":0,"y":0,"w":3,"h":2,"minW":2,"minH":2,"i":1745296008998001,"data":{"cardId":"access-num","type":"builtin","title":"设备总数","config":{},"layout":{"w":3,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":3,"y":0,"w":3,"h":2,"minW":2,"minH":2,"i":1745306021843058,"data":{"cardId":"off-num","type":"builtin","title":"离线设备数","config":{},"layout":{"w":3,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":9,"y":0,"w":3,"h":2,"minW":2,"minH":2,"i":1745327924610429,"data":{"cardId":"alarm-count","type":"builtin","title":"告警数量","config":{},"layout":{"w":3,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{"metricsOptions":[],"metricsOptionsFetched":false}],"deviceCount":1}},"moved":false},{"x":5,"y":2,"w":4,"h":5,"minW":2,"minH":2,"i":1745306025963299,"data":{"cardId":"trend-online","type":"builtin","title":"设备在线趋势","config":{},"layout":{"w":4,"h":3,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":3,"y":2,"w":2,"h":5,"minW":2,"minH":2,"i":1745499419664080,"data":{"cardId":"recently-visited","type":"builtin","title":"card.recentlyVisited.title","config":{},"layout":{"w":3,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":9,"y":2,"w":3,"h":5,"minW":2,"minH":2,"i":1745511461442040,"data":{"cardId":"app-download","type":"builtin","title":"下载移动端","config":{},"layout":{"w":2,"h":2,"minW":2,"minH":2},"basicSettings":{},"dataSource":{"origin":"device","isSupportTimeRange":true,"dataTimeRange":"1h","isSupportAggregate":true,"dataAggregateRange":"1m","systemSource":[],"deviceSource":[]}},"moved":false},{"x":9,"y":7,"w":3,"h":6,"minW":2,"minH":1,"i":1745511464685393,"data":{"cardId":"version-info","type":"builtin","title":"版本信息","config":{},"layout":{"w":3,"h":1,"minW":2,"minH":1},"basicSettings":{},"dataSource":{"origin":"system","systemSource":[{}],"deviceSource":[{}]}},"moved":false},{"x":0,"y":7,"w":6,"h":6,"minW":2,"minH":2,"i":1745502189663242,"data":{"cardId":"alarm-info","type":"builtin","title":"cards.alarmInfo.title","config":{},"layout":{"w":2,"h":2,"minW":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"device","isSupportTimeRange":true,"dataTimeRange":"1h","isSupportAggregate":true,"dataAggregateRange":"1m","systemSource":[],"deviceSource":[]}},"moved":false},{"x":6,"y":7,"w":3,"h":6,"minW":2,"minH":2,"i":1745420206359165,"data":{"cardId":"reported-data","type":"builtin","title":"cards.reportedData","config":{},"layout":{"w":2,"h":2,"minH":2,"minW":2},"basicSettings":{},"dataSource":{"origin":"device","isSupportTimeRange":true,"dataTimeRange":"1h","isSupportAggregate":true,"dataAggregateRange":"1m","systemSource":[],"deviceSource":[]}},"moved":false},{"x":0,"y":2,"w":3,"h":5,"minW":2,"minH":2,"i":1747138951002677,"data":{"cardId":"operation-guide","type":"builtin","title":"操作指引","config":{"guideList":[{"titleKey":"card.operationGuideCard.guideItems.addDevice.title","descriptionKey":"card.operationGuideCard.guideItems.addDevice.description","link":"/device/manage"},{"titleKey":"card.operationGuideCard.guideItems.configureDevice.title","descriptionKey":"card.operationGuideCard.guideItems.configureDevice.description","link":"/device/manage"},{"titleKey":"card.operationGuideCard.guideItems.createDashboard.title","descriptionKey":"card.operationGuideCard.guideItems.createDashboard.description","link":"/visualization/kanban"}],"guideListAdmin":[{"titleKey":"card.operationGuideAdmin.guideItems.createTenant.title","descriptionKey":"card.operationGuideAdmin.guideItems.createTenant.description","link":"/management/user"},{"titleKey":"card.operationGuideAdmin.guideItems.configureNotification.title","descriptionKey":"card.operationGuideAdmin.guideItems.configureNotification.description"},{"titleKey":"card.operationGuideAdmin.guideItems.configurePlugin.title","descriptionKey":"card.operationGuideAdmin.guideItems.configurePlugin.description"}]},"layout":{"w":3,"h":5,"minW":2,"minH":2},"basicSettings":{},"dataSource":{"origin":"system","isSupportTimeRange":false,"dataTimeRange":"","isSupportAggregate":false,"dataAggregateRange":"","systemSource":[],"deviceSource":[]}},"moved":false}]',
  tenant_id: '63a4b529',
  created_at: '2025-03-25T11:28:21.500215+08:00',
  updated_at: '2025-06-13T15:07:07.107459+08:00',
  home_flag: 'Y',
  description: '真实的Home面板数据',
  remark: null,
  menu_flag: ''
}

/** Grid简单测试数据 */
export const simpleGridData: ExternalPanelData = {
  id: 'simple-test-panel',
  name: '简单测试面板',
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
        layout: { w: 3, h: 2, minH: 2, minW: 2 }
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
        layout: { w: 3, h: 2, minH: 2, minW: 2 }
      }
    },
    {
      x: 0,
      y: 2,
      w: 6,
      h: 4,
      i: 'test-3',
      data: {
        cardId: 'device-trend',
        type: 'builtin',
        title: '设备趋势图',
        config: {},
        layout: { w: 6, h: 4, minH: 2, minW: 2 }
      }
    }
  ]),
  tenant_id: 'test_tenant',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T12:00:00Z',
  home_flag: '0',
  description: '简单的测试面板数据',
  remark: 'Simple mock data for development'
}

/** Canvas模拟面板数据 */
export const mockCanvasData = {
  panelId: 'test-canvas-panel',
  panelName: 'Canvas测试面板',
  description: 'Canvas渲染器测试数据',
  layout: {
    width: 1200,
    height: 800,
    backgroundColor: '#f5f5f5',
    gridSize: 20,
    showGrid: true
  },
  components: [
    {
      id: 'comp_1',
      name: '状态指示器',
      type: 'indicator',
      deviceId: 'device_001',
      position: { x: 50, y: 50 },
      size: { width: 100, height: 60 },
      config: {
        shape: 'circle',
        activeColor: '#00ff00',
        inactiveColor: '#ff0000',
        showLabel: true,
        label: '设备状态'
      }
    },
    {
      id: 'comp_2',
      name: '数值显示',
      type: 'value-display',
      deviceId: 'device_002',
      position: { x: 200, y: 50 },
      size: { width: 150, height: 80 },
      config: {
        fontSize: 24,
        fontColor: '#333',
        backgroundColor: '#fff',
        border: true,
        unit: '°C',
        precision: 1
      }
    },
    {
      id: 'comp_3',
      name: '控制按钮',
      type: 'control-button',
      deviceId: 'device_003',
      position: { x: 400, y: 50 },
      size: { width: 120, height: 50 },
      config: {
        buttonText: '开关控制',
        buttonColor: '#007bff',
        command: 'toggle',
        confirmRequired: true
      }
    }
  ],
  metadata: {
    version: '1.0.0',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    author: 'test-user'
  }
}

/** 通用模拟数据导出 */
export const mockExternalData = realGridData // 使用真实数据作为默认测试数据

// 兼容性导出
export const mockGridData = simpleGridData

// 向后兼容
export const realGridStackData = realGridData
export const simpleGridStackData = simpleGridData
export const mockGridStackData = simpleGridData
