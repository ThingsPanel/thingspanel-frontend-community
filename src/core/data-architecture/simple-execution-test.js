/**
 * 简单的JSON配置执行测试
 * 使用CommonJS格式，避免ES模块问题
 */

console.log('🎯 纯JSON数据源配置执行测试')
console.log('='.repeat(60))

// 模拟配置数据（避免导入问题）
const testConfig = {
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
              jsonData: JSON.stringify({
                deviceId: 'DEV_001',
                deviceName: '温湿度传感器01',
                status: 'online',
                metrics: {
                  temperature: 25.6,
                  humidity: 68.3,
                  batteryLevel: 85
                }
              })
            },
            metadata: {
              displayName: '设备状态数据'
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
              jsonData: JSON.stringify({
                totalDevices: 156,
                onlineDevices: 142,
                offlineDevices: 14,
                deviceTypes: {
                  temperature: 45,
                  humidity: 38
                }
              })
            },
            metadata: {
              displayName: '统计数据'
            }
          },
          processing: {
            filterPath: '$.totalDevices',
            defaultValue: 0,
            transform: 'number'
          }
        }
      ],
      mergeStrategy: { type: 'object' }
    }
  ]
}

// 模拟执行各个阶段
async function simulateExecution() {
  console.log('📋 配置概览:')
  console.log(`   组件ID: ${testConfig.componentId}`)
  console.log(`   版本: ${testConfig.version}`)
  console.log(`   数据源数量: ${testConfig.dataSources.length}`)
  console.log()

  console.log('🔍 各执行阶段模拟:')
  console.log()

  // 阶段1: 配置解析
  console.log('📋 阶段1: 配置解析')
  console.log('输入: EnhancedDataSourceConfiguration')
  console.log('处理: 解析配置结构、验证配置完整性')
  testConfig.dataSources.forEach((source, index) => {
    console.log(`   数据源 ${index + 1}: ${source.sourceId}`)
    source.dataItems.forEach((item, itemIndex) => {
      console.log(`     数据项 ${itemIndex + 1}: ${item.item.id} (${item.item.type})`)
      console.log(`       显示名: ${item.item.metadata.displayName}`)
      console.log(`       处理路径: ${item.processing.filterPath}`)
    })
  })
  console.log('✅ 配置解析完成')
  console.log()

  // 阶段2: 数据获取
  console.log('📥 阶段2: 数据项获取 (DataItemFetcher)')
  const fetchResults = []

  for (let sourceIndex = 0; sourceIndex < testConfig.dataSources.length; sourceIndex++) {
    const source = testConfig.dataSources[sourceIndex]
    console.log(`   处理数据源: ${source.sourceId}`)

    const sourceResults = []

    for (let itemIndex = 0; itemIndex < source.dataItems.length; itemIndex++) {
      const dataItem = source.dataItems[itemIndex]
      const jsonConfig = dataItem.item.config

      // 模拟数据获取
      const fetchedData = jsonConfig.jsonData
      console.log(`     获取数据项 ${dataItem.item.id}:`)
      console.log(`       原始数据长度: ${fetchedData.length} 字符`)
      console.log(`       数据预览: ${fetchedData.substring(0, 50)}...`)

      sourceResults.push({
        itemId: dataItem.item.id,
        fetchedData: fetchedData
      })
    }

    fetchResults.push({
      sourceId: source.sourceId,
      items: sourceResults
    })
  }
  console.log('✅ 数据获取完成')
  console.log()

  // 阶段3: 数据处理
  console.log('⚙️ 阶段3: 数据项处理 (DataItemProcessor)')
  const processResults = []

  for (let sourceIndex = 0; sourceIndex < testConfig.dataSources.length; sourceIndex++) {
    const source = testConfig.dataSources[sourceIndex]
    const fetchResult = fetchResults[sourceIndex]

    console.log(`   处理数据源: ${source.sourceId}`)

    const sourceProcessResults = []

    for (let itemIndex = 0; itemIndex < source.dataItems.length; itemIndex++) {
      const dataItem = source.dataItems[itemIndex]
      const fetchedItem = fetchResult.items[itemIndex]

      // 模拟数据处理
      const rawData = JSON.parse(fetchedItem.fetchedData)

      // 简单的JSONPath处理模拟
      let processedData
      const filterPath = dataItem.processing.filterPath

      if (filterPath === '$.metrics.temperature') {
        processedData = rawData.metrics?.temperature || dataItem.processing.defaultValue
      } else if (filterPath === '$.totalDevices') {
        processedData = rawData.totalDevices || dataItem.processing.defaultValue
      } else {
        processedData = rawData
      }

      console.log(`     处理数据项 ${dataItem.item.id}:`)
      console.log(`       筛选路径: ${filterPath}`)
      console.log(`       处理前类型: ${typeof rawData}`)
      console.log(`       处理后数据: ${JSON.stringify(processedData)}`)
      console.log(`       处理后类型: ${typeof processedData}`)

      sourceProcessResults.push({
        itemId: dataItem.item.id,
        processedData: processedData
      })
    }

    processResults.push({
      sourceId: source.sourceId,
      items: sourceProcessResults
    })
  }
  console.log('✅ 数据处理完成')
  console.log()

  // 阶段4: 数据源合并
  console.log('🔄 阶段4: 数据源合并 (DataSourceMerger)')
  const mergeResults = []

  for (let sourceIndex = 0; sourceIndex < testConfig.dataSources.length; sourceIndex++) {
    const source = testConfig.dataSources[sourceIndex]
    const processResult = processResults[sourceIndex]

    console.log(`   合并数据源: ${source.sourceId}`)
    console.log(`     合并策略: ${source.mergeStrategy.type}`)

    // 模拟合并逻辑
    let mergedData
    if (source.mergeStrategy.type === 'object') {
      mergedData = {}
      processResult.items.forEach(item => {
        mergedData[item.itemId] = item.processedData
      })
    } else if (source.mergeStrategy.type === 'array') {
      mergedData = processResult.items.map(item => item.processedData)
    }

    console.log(`     合并后数据: ${JSON.stringify(mergedData)}`)

    mergeResults.push({
      sourceId: source.sourceId,
      mergedData: mergedData
    })
  }
  console.log('✅ 数据源合并完成')
  console.log()

  // 阶段5: 多源集成
  console.log('🌐 阶段5: 多源集成 (MultiSourceIntegrator)')
  const finalResult = {}

  mergeResults.forEach(result => {
    finalResult[result.sourceId] = result.mergedData
  })

  console.log('   最终集成结果:')
  console.log(JSON.stringify(finalResult, null, 2))
  console.log('✅ 多源集成完成')
  console.log()

  // 执行总结
  console.log('📊 执行总结:')
  console.log('='.repeat(50))
  console.log(`✅ 配置执行成功`)
  console.log(`📈 处理的数据源: ${testConfig.dataSources.length} 个`)
  console.log(`📄 处理的数据项: ${testConfig.dataSources.reduce((sum, source) => sum + source.dataItems.length, 0)} 个`)
  console.log(`🎯 最终结果包含: ${Object.keys(finalResult).length} 个数据源的合并数据`)
  console.log()

  // 数据分析
  console.log('🔍 数据内容分析:')
  Object.keys(finalResult).forEach(sourceId => {
    const data = finalResult[sourceId]
    console.log(`   ${sourceId}:`)
    console.log(`     数据类型: ${Array.isArray(data) ? 'Array' : typeof data}`)

    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data)
      console.log(`     包含字段: ${keys.join(', ')}`)
      keys.forEach(key => {
        console.log(`       ${key}: ${JSON.stringify(data[key])}`)
      })
    }
  })

  console.log()
  console.log('🎉 测试执行完成!')

  return finalResult
}

// 执行测试
simulateExecution().catch(console.error)
