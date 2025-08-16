/**
 * 新架构整合使用示例
 * 🔥 演示如何使用新的统一Visual Editor架构
 */

import { useVisualEditor } from './index'
import type { GraphData } from '@/components/visual-editor/types'

/**
 * 基本使用示例
 * 演示如何初始化和基本操作
 */
export async function basicUsageExample() {
  console.log('🎯 [Integration] 基本使用示例开始')

  // 1. 获取统一的编辑器系统
  const editor = useVisualEditor()

  try {
    // 2. 初始化系统
    await editor.initialize()

    console.log('✅ [Integration] 系统初始化完成')
    console.log('📊 [Integration] 系统状态:', editor.getStatus())

    // 3. 添加一个节点
    const sampleNode: GraphData = {
      id: 'example-node-1',
      type: 'UserInfoCard',
      position: { x: 100, y: 100 },
      data: {
        componentType: 'UserInfoCard',
        title: '示例用户信息卡片'
      }
    }

    await editor.addNode(sampleNode)
    console.log('✅ [Integration] 节点添加成功')

    // 4. 配置组件
    await editor.updateConfiguration('example-node-1', 'component', {
      properties: {
        username: '张三',
        email: 'zhangsan@example.com',
        status: 'online'
      },
      style: {
        width: 300,
        height: 200,
        backgroundColor: '#f5f5f5'
      }
    })
    console.log('✅ [Integration] 组件配置完成')

    // 5. 设置数据源
    await editor.updateConfiguration('example-node-1', 'dataSource', {
      type: 'static',
      config: {
        data: {
          user: {
            name: '张三',
            avatar: '/avatars/zhangsan.jpg',
            status: 'online',
            lastSeen: new Date().toISOString()
          }
        }
      },
      bindings: {
        user: {
          rawData: JSON.stringify({
            name: '张三',
            avatar: '/avatars/zhangsan.jpg',
            status: 'online'
          })
        }
      }
    })
    console.log('✅ [Integration] 数据源配置完成')

    // 6. 获取完整配置
    const fullConfig = editor.getConfiguration('example-node-1')
    console.log('📊 [Integration] 完整配置:', fullConfig)

    // 7. 获取当前运行时数据
    const runtimeData = editor.getRuntimeData('example-node-1')
    console.log('📊 [Integration] 运行时数据:', runtimeData)

    console.log('🎯 [Integration] 基本使用示例完成')
  } catch (error) {
    console.error('❌ [Integration] 基本使用示例失败:', error)
    throw error
  }
}

/**
 * Card2.1组件集成示例
 * 演示Card2.1组件的完整集成流程
 */
export async function card2IntegrationExample() {
  console.log('🎯 [Integration] Card2.1集成示例开始')

  const editor = useVisualEditor()

  try {
    await editor.initialize()

    // 1. 模拟Card2.1组件定义
    const card2Definition = {
      type: 'UserInfoCard',
      name: '用户信息卡片',
      description: '显示用户基本信息的卡片组件',
      version: '1.0.0',
      component: null, // 实际的Vue组件
      category: 'data-display',
      mainCategory: '数据展示',
      subCategory: '用户信息',
      icon: 'UserOutline',
      author: 'ThingsPanel',
      permission: 'public',
      dataSources: [
        {
          key: 'user',
          name: '用户数据',
          description: '用户基本信息数据源',
          supportedTypes: ['static', 'api'],
          required: true,
          fieldMappings: {
            name: {
              targetField: 'name',
              type: 'string',
              required: true,
              description: '用户姓名'
            },
            avatar: {
              targetField: 'avatar',
              type: 'string',
              required: false,
              description: '用户头像URL'
            },
            status: {
              targetField: 'status',
              type: 'string',
              required: false,
              description: '用户状态',
              defaultValue: 'offline'
            }
          }
        }
      ],
      config: {
        width: 300,
        height: 200,
        style: {
          borderRadius: '8px',
          padding: '16px'
        }
      }
    }

    // 2. 注册Card2.1组件
    editor.card2Adapter.registerCard2Component(card2Definition)
    console.log('✅ [Integration] Card2.1组件注册成功')

    // 3. 添加Card2.1组件到画布
    const card2Node: GraphData = {
      id: 'card2-example-1',
      type: 'UserInfoCard',
      position: { x: 200, y: 200 },
      data: {
        componentType: 'UserInfoCard',
        title: '用户信息卡片示例'
      }
    }

    await editor.addNode(card2Node)

    // 4. Card2.1组件会自动触发初始化配置
    editor.card2Adapter.onComponentAdded('card2-example-1', 'UserInfoCard')

    console.log('✅ [Integration] Card2.1组件添加完成')

    // 5. 配置数据源
    await editor.updateConfiguration('card2-example-1', 'dataSource', {
      type: 'static',
      config: {
        data: {
          user: {
            name: '李四',
            avatar: '/avatars/lisi.jpg',
            status: 'online',
            email: 'lisi@example.com',
            role: '管理员'
          }
        }
      },
      bindings: {
        user: {
          rawData: JSON.stringify({
            name: '李四',
            avatar: '/avatars/lisi.jpg',
            status: 'online'
          }),
          processedData: {
            name: '李四',
            avatar: '/avatars/lisi.jpg',
            status: 'online',
            statusColor: 'green'
          }
        }
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        isCard2Component: true
      }
    })

    // 6. 创建数据绑定
    const dataSourceConfig = editor.configService.getConfigurationSection('card2-example-1', 'dataSource')
    if (dataSourceConfig) {
      const dataBinding = await editor.card2Adapter.createDataBinding('card2-example-1', dataSourceConfig)
      console.log('✅ [Integration] 数据绑定创建成功:', dataBinding?.id)
    }

    // 7. 模拟数据更新
    setTimeout(() => {
      editor.card2Adapter.handleRuntimeDataUpdate('card2-example-1', {
        user: {
          name: '李四',
          avatar: '/avatars/lisi.jpg',
          status: 'away', // 状态变更
          lastSeen: new Date().toISOString()
        }
      })
      console.log('✅ [Integration] 运行时数据更新完成')
    }, 2000)

    console.log('🎯 [Integration] Card2.1集成示例完成')
  } catch (error) {
    console.error('❌ [Integration] Card2.1集成示例失败:', error)
    throw error
  }
}

/**
 * 数据流管理示例
 * 演示数据流管理器的使用
 */
export async function dataFlowExample() {
  console.log('🎯 [Integration] 数据流管理示例开始')

  const editor = useVisualEditor()

  try {
    await editor.initialize()

    // 1. 注册自定义副作用处理器
    editor.dataFlowManager.registerSideEffect({
      name: 'LoggerSideEffect',
      condition: () => true, // 监听所有操作
      execute: (action, context) => {
        console.log('📡 [Integration] 数据流副作用:', {
          action: action.type,
          target: action.targetId,
          timestamp: context.timestamp
        })
      }
    })

    // 2. 批量操作示例
    const batchActions = [
      {
        type: 'ADD_NODE' as const,
        data: {
          id: 'batch-node-1',
          type: 'TextWidget',
          position: { x: 50, y: 50 },
          data: { text: '批量节点1' }
        }
      },
      {
        type: 'ADD_NODE' as const,
        data: {
          id: 'batch-node-2',
          type: 'TextWidget',
          position: { x: 150, y: 50 },
          data: { text: '批量节点2' }
        }
      }
    ]

    await editor.dataFlowManager.handleBatchActions(batchActions)
    console.log('✅ [Integration] 批量操作完成')

    // 3. 监听数据流更新事件
    const unsubscribe = editor.dataFlowManager.onDataFlowUpdate(action => {
      console.log('📡 [Integration] 数据流更新事件:', action.type)
    })

    // 4. 配置更新操作
    await editor.updateConfiguration('batch-node-1', 'component', {
      properties: {
        text: '更新后的文本',
        fontSize: 16,
        color: '#333'
      }
    })

    // 5. 运行时数据操作
    await editor.dataFlowManager.handleUserAction({
      type: 'SET_RUNTIME_DATA',
      targetId: 'batch-node-1',
      data: {
        displayText: '实时显示文本',
        updateTime: new Date().toISOString()
      }
    })

    // 清理监听器
    setTimeout(() => {
      unsubscribe()
      console.log('✅ [Integration] 事件监听器清理完成')
    }, 5000)

    console.log('🎯 [Integration] 数据流管理示例完成')
  } catch (error) {
    console.error('❌ [Integration] 数据流管理示例失败:', error)
    throw error
  }
}

/**
 * 配置管理示例
 * 演示配置服务的高级功能
 */
export async function configurationExample() {
  console.log('🎯 [Integration] 配置管理示例开始')

  const editor = useVisualEditor()

  try {
    await editor.initialize()

    // 1. 配置变更监听
    const unsubscribe = editor.configService.onConfigurationChange(event => {
      console.log('📡 [Integration] 配置变更事件:', {
        widgetId: event.widgetId,
        section: event.section,
        timestamp: event.timestamp
      })
    })

    // 2. 添加测试节点
    await editor.addNode({
      id: 'config-test-node',
      type: 'DataCard',
      position: { x: 300, y: 100 },
      data: { title: '配置测试卡片' }
    })

    // 3. 分步配置设置
    await editor.updateConfiguration('config-test-node', 'base', {
      title: '数据卡片',
      opacity: 0.9,
      visible: true,
      locked: false,
      zIndex: 10
    })

    await editor.updateConfiguration('config-test-node', 'component', {
      properties: {
        chartType: 'line',
        dataPoints: 100,
        refreshRate: 5000
      },
      style: {
        width: 400,
        height: 300,
        borderRadius: '12px'
      }
    })

    // 4. 复杂数据源配置
    await editor.updateConfiguration('config-test-node', 'dataSource', {
      type: 'api',
      config: {
        url: '/api/chart-data',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        refreshInterval: 30000
      },
      bindings: {
        chartData: {
          rawData: '[]',
          processedData: [],
          fieldMappings: {
            'data.points': 'chartData',
            'data.labels': 'chartLabels'
          }
        }
      },
      metadata: {
        lastFetch: null,
        fetchCount: 0
      }
    })

    // 5. 配置持久化
    await editor.configService.saveConfiguration('config-test-node')
    console.log('✅ [Integration] 配置保存完成')

    // 6. 配置加载
    const loadedConfig = await editor.configService.loadConfiguration('config-test-node')
    console.log('📊 [Integration] 加载的配置:', loadedConfig)

    // 7. 批量配置更新
    await editor.configService.batchUpdateConfiguration([
      {
        widgetId: 'config-test-node',
        section: 'component',
        data: {
          properties: {
            ...editor.getConfiguration('config-test-node').component?.properties,
            theme: 'dark',
            animation: true
          }
        }
      }
    ])

    // 清理监听器
    setTimeout(() => {
      unsubscribe()
      console.log('✅ [Integration] 配置监听器清理完成')
    }, 3000)

    console.log('🎯 [Integration] 配置管理示例完成')
  } catch (error) {
    console.error('❌ [Integration] 配置管理示例失败:', error)
    throw error
  }
}

/**
 * 完整的系统集成示例
 * 模拟实际使用场景
 */
export async function fullSystemExample() {
  console.log('🎯 [Integration] 完整系统示例开始')

  const editor = useVisualEditor()

  try {
    // 1. 系统初始化
    await editor.initialize()
    console.log('✅ [Integration] 系统初始化完成')

    // 2. 创建仪表板场景
    const dashboardNodes = [
      {
        id: 'header-title',
        type: 'TitleWidget',
        position: { x: 20, y: 20 },
        data: { title: '物联网设备监控仪表板' }
      },
      {
        id: 'device-status-card',
        type: 'StatusCard',
        position: { x: 20, y: 80 },
        data: { title: '设备状态' }
      },
      {
        id: 'temperature-chart',
        type: 'LineChart',
        position: { x: 320, y: 80 },
        data: { title: '温度趋势' }
      },
      {
        id: 'user-info',
        type: 'UserInfoCard',
        position: { x: 20, y: 300 },
        data: { title: '用户信息' }
      }
    ]

    // 3. 批量添加节点
    for (const node of dashboardNodes) {
      await editor.addNode(node as GraphData)
    }
    console.log('✅ [Integration] 仪表板节点创建完成')

    // 4. 配置每个组件
    // 标题组件
    await editor.updateConfiguration('header-title', 'component', {
      properties: {
        text: '物联网设备监控仪表板',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
      },
      style: {
        width: 600,
        height: 50,
        color: '#1890ff'
      }
    })

    // 设备状态卡片
    await editor.updateConfiguration('device-status-card', 'dataSource', {
      type: 'websocket',
      config: {
        url: 'ws://localhost:8080/device-status',
        reconnectInterval: 5000
      },
      bindings: {
        deviceStatus: {
          rawData: '{"online": 15, "offline": 3, "total": 18}',
          processedData: {
            online: 15,
            offline: 3,
            total: 18,
            onlineRate: '83.3%'
          }
        }
      }
    })

    // 温度图表
    await editor.updateConfiguration('temperature-chart', 'dataSource', {
      type: 'api',
      config: {
        url: '/api/temperature-data',
        method: 'GET',
        refreshInterval: 10000
      },
      bindings: {
        chartData: {
          rawData: '[]',
          processedData: {
            labels: [],
            datasets: [
              {
                label: '温度(°C)',
                data: [],
                borderColor: '#ff4d4f',
                backgroundColor: 'rgba(255, 77, 79, 0.1)'
              }
            ]
          }
        }
      }
    })

    // 5. 保存所有配置
    await editor.saveAll()
    console.log('✅ [Integration] 所有配置保存完成')

    // 6. 模拟实时数据更新
    const updateInterval = setInterval(() => {
      // 更新设备状态
      editor.card2Adapter.handleRuntimeDataUpdate('device-status-card', {
        online: Math.floor(Math.random() * 20) + 10,
        offline: Math.floor(Math.random() * 5),
        lastUpdate: new Date().toISOString()
      })

      // 更新温度数据
      const newTemp = 20 + Math.random() * 10
      editor.card2Adapter.handleRuntimeDataUpdate('temperature-chart', {
        temperature: newTemp,
        timestamp: new Date().toISOString()
      })
    }, 3000)

    // 7. 系统状态监控
    setInterval(() => {
      const status = editor.getStatus()
      console.log('📊 [Integration] 系统状态:', status)
    }, 10000)

    // 清理定时器
    setTimeout(() => {
      clearInterval(updateInterval)
      console.log('✅ [Integration] 数据更新定时器清理完成')
    }, 30000)

    console.log('🎯 [Integration] 完整系统示例完成')
  } catch (error) {
    console.error('❌ [Integration] 完整系统示例失败:', error)
    throw error
  }
}

/**
 * 错误处理和恢复示例
 */
export async function errorHandlingExample() {
  console.log('🎯 [Integration] 错误处理示例开始')

  const editor = useVisualEditor()

  try {
    await editor.initialize()

    // 1. 监听错误事件
    const unsubscribeError = editor.dataFlowManager.onError((action, error) => {
      console.error('📡 [Integration] 捕获数据流错误:', {
        actionType: action.type,
        targetId: action.targetId,
        error: error.message
      })

      // 实现错误恢复逻辑
      // 例如：显示用户友好的错误提示、回滚状态等
    })

    // 2. 故意触发错误 - 无效的操作
    try {
      await editor.dataFlowManager.handleUserAction({
        type: 'UPDATE_CONFIGURATION',
        // 缺少 targetId 会触发验证错误
        data: { section: 'component', config: {} }
      })
    } catch (error) {
      console.log('✅ [Integration] 成功捕获验证错误')
    }

    // 3. 故意触发错误 - 无效的配置
    try {
      await editor.updateConfiguration('non-existent-node', 'dataSource', {
        type: 'invalid-type' as any, // 无效的数据源类型
        config: {},
        bindings: {}
      })
    } catch (error) {
      console.log('✅ [Integration] 成功捕获配置错误')
    }

    // 4. 测试系统恢复能力
    await editor.addNode({
      id: 'recovery-test-node',
      type: 'TestWidget',
      position: { x: 100, y: 100 },
      data: { test: true }
    })

    // 正常的操作应该继续工作
    await editor.updateConfiguration('recovery-test-node', 'base', {
      title: '恢复测试节点',
      visible: true
    })

    console.log('✅ [Integration] 系统恢复正常')

    // 清理监听器
    setTimeout(() => {
      unsubscribeError()
      console.log('✅ [Integration] 错误监听器清理完成')
    }, 2000)

    console.log('🎯 [Integration] 错误处理示例完成')
  } catch (error) {
    console.error('❌ [Integration] 错误处理示例失败:', error)
    throw error
  }
}

/**
 * 运行所有示例
 */
export async function runAllExamples() {
  console.log('🚀 [Integration] 开始运行所有整合示例')

  try {
    // 按顺序运行示例
    await basicUsageExample()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await card2IntegrationExample()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await dataFlowExample()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await configurationExample()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await errorHandlingExample()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 最后运行完整系统示例
    await fullSystemExample()

    console.log('🎉 [Integration] 所有整合示例运行完成！')
  } catch (error) {
    console.error('💥 [Integration] 整合示例运行失败:', error)
    throw error
  }
}

// 导出便捷的测试函数
export const IntegrationExamples = {
  basic: basicUsageExample,
  card2: card2IntegrationExample,
  dataFlow: dataFlowExample,
  configuration: configurationExample,
  fullSystem: fullSystemExample,
  errorHandling: errorHandlingExample,
  runAll: runAllExamples
}
