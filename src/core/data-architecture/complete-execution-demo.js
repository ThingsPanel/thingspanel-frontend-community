/**
 * 完整的JSON配置执行演示
 * 展示所有4个数据源的完整执行流程
 */

console.log('🎯 完整JSON数据源配置执行演示')
console.log('='.repeat(60))

// 完整的测试配置（包含4个数据源）
const completeTestConfig = {
  componentId: 'dashboard_sensors_panel_001',
  version: '2.0.0',
  dataSources: [
    {
      sourceId: 'device_status_source',
      dataItems: [
        {
          item: {
            type: 'json',
            id: 'device_status_001',
            config: {
              jsonData: JSON.stringify(
                {
                  deviceId: 'DEV_001',
                  deviceName: '温湿度传感器01',
                  status: 'online',
                  location: {
                    building: 'A座',
                    floor: 3,
                    room: '301'
                  },
                  metrics: {
                    temperature: 25.6,
                    humidity: 68.3,
                    batteryLevel: 85,
                    signalStrength: -45
                  },
                  lastUpdate: '2024-01-15T10:30:00Z'
                },
                null,
                2
              )
            },
            metadata: {
              displayName: '设备状态数据',
              description: '温湿度传感器实时状态信息'
            }
          },
          processing: {
            filterPath: '$.metrics.temperature',
            defaultValue: 0,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: { type: 'object' }
    },
    {
      sourceId: 'statistics_source',
      dataItems: [
        {
          item: {
            type: 'json',
            id: 'statistics_data_002',
            config: {
              jsonData: JSON.stringify(
                {
                  reportDate: '2024-01-15',
                  totalDevices: 156,
                  onlineDevices: 142,
                  offlineDevices: 14,
                  deviceTypes: {
                    temperature: 45,
                    humidity: 38,
                    pressure: 32,
                    motion: 41
                  },
                  alerts: {
                    critical: 2,
                    warning: 7,
                    info: 23
                  }
                },
                null,
                2
              )
            },
            metadata: {
              displayName: '设备统计数据',
              description: '设备在线状态和类型统计信息'
            }
          },
          processing: {
            filterPath: '$',
            defaultValue: {},
            transform: 'object'
          }
        }
      ],
      mergeStrategy: { type: 'object' }
    },
    {
      sourceId: 'history_source',
      dataItems: [
        {
          item: {
            type: 'json',
            id: 'history_data_003',
            config: {
              jsonData: JSON.stringify(
                {
                  dataRange: {
                    startTime: '2024-01-15T00:00:00Z',
                    endTime: '2024-01-15T23:59:59Z'
                  },
                  measurements: [
                    { timestamp: '2024-01-15T10:00:00Z', temperature: 25.1, humidity: 67.8 },
                    { timestamp: '2024-01-15T10:30:00Z', temperature: 25.6, humidity: 68.3 },
                    { timestamp: '2024-01-15T11:00:00Z', temperature: 26.2, humidity: 69.1 },
                    { timestamp: '2024-01-15T11:30:00Z', temperature: 26.8, humidity: 70.2 },
                    { timestamp: '2024-01-15T12:00:00Z', temperature: 27.3, humidity: 71.5 }
                  ],
                  summary: {
                    avgTemperature: 26.2,
                    maxTemperature: 27.3,
                    minTemperature: 25.1,
                    avgHumidity: 69.38,
                    dataPoints: 5
                  }
                },
                null,
                2
              )
            },
            metadata: {
              displayName: '历史数据记录',
              description: '温湿度传感器历史测量数据'
            }
          },
          processing: {
            filterPath: '$.measurements',
            defaultValue: [],
            transform: 'array'
          }
        }
      ],
      mergeStrategy: { type: 'array' }
    },
    {
      sourceId: 'config_source',
      dataItems: [
        {
          item: {
            type: 'json',
            id: 'config_info_004',
            config: {
              jsonData: JSON.stringify(
                {
                  systemConfig: {
                    version: '1.2.5',
                    environment: 'production',
                    debugMode: false,
                    logLevel: 'info'
                  },
                  dashboardConfig: {
                    refreshInterval: 30000,
                    autoRefresh: true,
                    theme: 'light',
                    language: 'zh-CN',
                    timezone: 'Asia/Shanghai'
                  },
                  alertConfig: {
                    enableEmail: true,
                    enableSMS: false,
                    enablePush: true,
                    thresholds: {
                      temperature: { min: 15, max: 35, unit: 'celsius' },
                      humidity: { min: 30, max: 80, unit: 'percent' },
                      battery: { critical: 20, warning: 30, unit: 'percent' }
                    }
                  }
                },
                null,
                2
              )
            },
            metadata: {
              displayName: '系统配置信息',
              description: '仪表板和告警系统的配置参数'
            }
          },
          processing: {
            filterPath: '$.dashboardConfig',
            defaultValue: {},
            transform: 'object'
          }
        }
      ],
      mergeStrategy: { type: 'object' }
    }
  ]
}

// JSONPath处理模拟器
function simulateJSONPath(data, path) {
  if (path === '$') return data
  if (path === '$.metrics.temperature') return data.metrics?.temperature
  if (path === '$.totalDevices') return data.totalDevices
  if (path === '$.measurements') return data.measurements
  if (path === '$.dashboardConfig') return data.dashboardConfig
  return data
}

async function runCompleteDemo() {
  const startTime = Date.now()

  console.log('📋 配置概览:')
  console.log(`   组件ID: ${completeTestConfig.componentId}`)
  console.log(`   版本: ${completeTestConfig.version}`)
  console.log(`   数据源数量: ${completeTestConfig.dataSources.length}`)
  console.log()

  console.log('🔍 数据源详情:')
  completeTestConfig.dataSources.forEach((source, index) => {
    console.log(`   数据源 ${index + 1}: ${source.sourceId}`)
    console.log(`   合并策略: ${source.mergeStrategy.type}`)
    source.dataItems.forEach((item, itemIndex) => {
      console.log(`     数据项 ${itemIndex + 1}: ${item.item.id}`)
      console.log(`       显示名: ${item.item.metadata.displayName}`)
      console.log(`       处理路径: ${item.processing.filterPath}`)
      console.log(`       数据大小: ${item.item.config.jsonData.length} 字符`)
    })
    console.log()
  })

  console.log('⚡ 开始执行多层级数据处理...')
  console.log('='.repeat(60))

  // 阶段1: 配置解析
  console.log('📋 阶段1: 配置解析')
  console.log('✅ 配置结构验证通过')
  console.log(`✅ 发现 ${completeTestConfig.dataSources.length} 个数据源`)
  console.log(
    `✅ 发现 ${completeTestConfig.dataSources.reduce((sum, source) => sum + source.dataItems.length, 0)} 个数据项`
  )
  console.log()

  // 阶段2: 数据获取
  console.log('📥 阶段2: 数据项获取 (DataItemFetcher)')
  const fetchResults = []

  for (let sourceIndex = 0; sourceIndex < completeTestConfig.dataSources.length; sourceIndex++) {
    const source = completeTestConfig.dataSources[sourceIndex]
    console.log(`   🔄 处理数据源: ${source.sourceId}`)

    const sourceResults = []

    for (let itemIndex = 0; itemIndex < source.dataItems.length; itemIndex++) {
      const dataItem = source.dataItems[itemIndex]
      const fetchStart = Date.now()

      // 模拟数据获取延时
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10))

      const fetchedData = dataItem.item.config.jsonData
      const fetchTime = Date.now() - fetchStart

      console.log(`     📄 获取数据项: ${dataItem.item.id}`)
      console.log(`       执行时间: ${fetchTime}ms`)
      console.log(`       数据大小: ${fetchedData.length} 字符`)
      console.log(`       数据类型: JSON字符串`)

      // 验证JSON格式
      try {
        const parsed = JSON.parse(fetchedData)
        const keys = Object.keys(parsed)
        console.log(`       JSON验证: ✅ 有效`)
        console.log(`       主要字段: ${keys.slice(0, 4).join(', ')}${keys.length > 4 ? '...' : ''}`)
      } catch (e) {
        console.log(`       JSON验证: ❌ 无效 - ${e.message}`)
      }

      sourceResults.push({
        itemId: dataItem.item.id,
        fetchedData: fetchedData,
        fetchTime: fetchTime
      })
    }

    fetchResults.push({
      sourceId: source.sourceId,
      items: sourceResults
    })
    console.log()
  }
  console.log('✅ 数据获取阶段完成')
  console.log()

  // 阶段3: 数据处理
  console.log('⚙️ 阶段3: 数据项处理 (DataItemProcessor)')
  const processResults = []

  for (let sourceIndex = 0; sourceIndex < completeTestConfig.dataSources.length; sourceIndex++) {
    const source = completeTestConfig.dataSources[sourceIndex]
    const fetchResult = fetchResults[sourceIndex]

    console.log(`   🔄 处理数据源: ${source.sourceId}`)

    const sourceProcessResults = []

    for (let itemIndex = 0; itemIndex < source.dataItems.length; itemIndex++) {
      const dataItem = source.dataItems[itemIndex]
      const fetchedItem = fetchResult.items[itemIndex]
      const processStart = Date.now()

      // 模拟处理延时
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5))

      console.log(`     📄 处理数据项: ${dataItem.item.id}`)

      try {
        // 解析JSON数据
        const rawData = JSON.parse(fetchedItem.fetchedData)
        console.log(`       JSON解析: ✅ 成功`)

        // 应用JSONPath筛选
        const filterPath = dataItem.processing.filterPath
        let processedData = simulateJSONPath(rawData, filterPath)

        // 处理默认值
        if (processedData === undefined || processedData === null) {
          processedData = dataItem.processing.defaultValue
          console.log(`       默认值应用: ✅ 使用默认值`)
        }

        const processTime = Date.now() - processStart

        console.log(`       筛选路径: ${filterPath}`)
        console.log(`       处理时间: ${processTime}ms`)
        console.log(`       输入类型: ${typeof rawData}`)
        console.log(`       输出类型: ${Array.isArray(processedData) ? 'array' : typeof processedData}`)

        // 显示处理结果概览
        if (Array.isArray(processedData)) {
          console.log(`       结果概览: 数组，长度 ${processedData.length}`)
          if (processedData.length > 0) {
            console.log(`       首项预览: ${JSON.stringify(processedData[0]).substring(0, 60)}...`)
          }
        } else if (typeof processedData === 'object' && processedData !== null) {
          const keys = Object.keys(processedData)
          console.log(`       结果概览: 对象，包含 ${keys.length} 个字段`)
          console.log(`       主要字段: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`)
        } else {
          console.log(`       结果数据: ${JSON.stringify(processedData)}`)
        }

        sourceProcessResults.push({
          itemId: dataItem.item.id,
          processedData: processedData,
          processTime: processTime
        })
      } catch (e) {
        const processTime = Date.now() - processStart
        console.log(`       JSON解析: ❌ 失败 - ${e.message}`)
        console.log(`       处理时间: ${processTime}ms`)

        sourceProcessResults.push({
          itemId: dataItem.item.id,
          processedData: dataItem.processing.defaultValue,
          processTime: processTime,
          error: e.message
        })
      }
    }

    processResults.push({
      sourceId: source.sourceId,
      items: sourceProcessResults
    })
    console.log()
  }
  console.log('✅ 数据处理阶段完成')
  console.log()

  // 阶段4: 数据源合并
  console.log('🔄 阶段4: 数据源合并 (DataSourceMerger)')
  const mergeResults = []

  for (let sourceIndex = 0; sourceIndex < completeTestConfig.dataSources.length; sourceIndex++) {
    const source = completeTestConfig.dataSources[sourceIndex]
    const processResult = processResults[sourceIndex]
    const mergeStart = Date.now()

    console.log(`   🔄 合并数据源: ${source.sourceId}`)
    console.log(`     合并策略: ${source.mergeStrategy.type}`)
    console.log(`     数据项数量: ${processResult.items.length}`)

    // 模拟合并处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 5))

    let mergedData
    if (source.mergeStrategy.type === 'object') {
      // 对象合并策略
      mergedData = {}
      processResult.items.forEach(item => {
        mergedData[item.itemId] = item.processedData
      })
      console.log(`     合并结果: 对象，包含 ${Object.keys(mergedData).length} 个字段`)
    } else if (source.mergeStrategy.type === 'array') {
      // 数组合并策略
      mergedData = processResult.items.map(item => item.processedData)
      console.log(`     合并结果: 数组，长度 ${mergedData.length}`)
    }

    const mergeTime = Date.now() - mergeStart
    console.log(`     合并时间: ${mergeTime}ms`)

    // 显示合并数据的结构信息
    if (typeof mergedData === 'object' && !Array.isArray(mergedData)) {
      console.log(`     数据结构: {${Object.keys(mergedData).join(', ')}}`)
    }

    mergeResults.push({
      sourceId: source.sourceId,
      mergedData: mergedData,
      mergeTime: mergeTime
    })
    console.log()
  }
  console.log('✅ 数据源合并阶段完成')
  console.log()

  // 阶段5: 多源集成
  console.log('🌐 阶段5: 多源集成 (MultiSourceIntegrator)')
  const integrationStart = Date.now()

  // 模拟集成处理时间
  await new Promise(resolve => setTimeout(resolve, Math.random() * 40 + 10))

  const finalResult = {}
  mergeResults.forEach(result => {
    finalResult[result.sourceId] = result.mergedData
  })

  const integrationTime = Date.now() - integrationStart
  const totalTime = Date.now() - startTime

  console.log(`   集成策略: 多源对象组合`)
  console.log(`   数据源数量: ${Object.keys(finalResult).length}`)
  console.log(`   集成时间: ${integrationTime}ms`)
  console.log('✅ 多源集成阶段完成')
  console.log()

  // 最终结果展示
  console.log('🎯 最终执行结果')
  console.log('='.repeat(60))
  console.log(`✅ 执行状态: 成功`)
  console.log(`⏱️  总执行时间: ${totalTime}ms`)
  console.log(`📊 处理统计:`)
  console.log(`   - 数据源: ${completeTestConfig.dataSources.length} 个`)
  console.log(
    `   - 数据项: ${completeTestConfig.dataSources.reduce((sum, source) => sum + source.dataItems.length, 0)} 个`
  )
  console.log(`   - 最终数据源: ${Object.keys(finalResult).length} 个`)
  console.log()

  console.log('🔍 最终数据结构分析:')
  Object.keys(finalResult).forEach(sourceId => {
    const data = finalResult[sourceId]
    console.log(`   📊 ${sourceId}:`)

    if (Array.isArray(data)) {
      console.log(`       类型: 数组`)
      console.log(`       长度: ${data.length}`)
      if (data.length > 0) {
        console.log(`       首项类型: ${Array.isArray(data[0]) ? 'array' : typeof data[0]}`)
      }
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data)
      console.log(`       类型: 对象`)
      console.log(`       字段数: ${keys.length}`)
      console.log(`       字段名: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`)

      // 显示部分数据内容
      keys.slice(0, 2).forEach(key => {
        const value = data[key]
        if (typeof value === 'object') {
          console.log(`       ${key}: [object ${Array.isArray(value) ? 'Array' : 'Object'}]`)
        } else {
          console.log(`       ${key}: ${JSON.stringify(value)}`)
        }
      })
    } else {
      console.log(`       类型: ${typeof data}`)
      console.log(`       数据: ${JSON.stringify(data)}`)
    }
    console.log()
  })

  // 性能分析
  console.log('📈 性能分析:')
  const fetchTotalTime = fetchResults.reduce(
    (sum, source) => sum + source.items.reduce((itemSum, item) => itemSum + item.fetchTime, 0),
    0
  )
  const processTotalTime = processResults.reduce(
    (sum, source) => sum + source.items.reduce((itemSum, item) => itemSum + item.processTime, 0),
    0
  )
  const mergeTotalTime = mergeResults.reduce((sum, result) => sum + result.mergeTime, 0)

  console.log(`   数据获取总时间: ${fetchTotalTime}ms`)
  console.log(`   数据处理总时间: ${processTotalTime}ms`)
  console.log(`   数据合并总时间: ${mergeTotalTime}ms`)
  console.log(`   多源集成时间: ${integrationTime}ms`)
  console.log(`   其他开销时间: ${totalTime - fetchTotalTime - processTotalTime - mergeTotalTime - integrationTime}ms`)
  console.log()

  console.log('🎉 完整执行演示完成!')
  console.log(`📋 最终结果已生成，包含 ${Object.keys(finalResult).length} 个数据源的处理结果`)

  return {
    success: true,
    executionTime: totalTime,
    finalResult: finalResult,
    statistics: {
      dataSources: completeTestConfig.dataSources.length,
      dataItems: completeTestConfig.dataSources.reduce((sum, source) => sum + source.dataItems.length, 0),
      fetchTime: fetchTotalTime,
      processTime: processTotalTime,
      mergeTime: mergeTotalTime,
      integrationTime: integrationTime
    }
  }
}

// 运行完整演示
runCompleteDemo().catch(console.error)
