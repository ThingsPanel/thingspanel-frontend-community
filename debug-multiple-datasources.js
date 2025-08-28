/**
 * 多数据源调试脚本
 * 用于检查为什么第2、3个数据源不显示的问题
 */

console.log('🔍 多数据源调试脚本')
console.log('=====================================')

// 在浏览器控制台中可用的调试函数
if (typeof window !== 'undefined') {
  // 调试函数1: 检查 ConfigurationManager 中的配置
  window.debugConfigurationManager = function (componentId = 'test-component') {
    console.log('🔧 检查 ConfigurationManager 配置:')

    if (window.configurationManager) {
      const config = window.configurationManager.getConfiguration(componentId)
      console.log('📝 完整配置:', config)

      if (config?.dataSource?.dataSources) {
        console.log('🔍 数据源详情:')
        config.dataSource.dataSources.forEach((ds, index) => {
          console.log(`  数据源 ${index + 1}:`, ds)
          console.log(`    - sourceId: ${ds.sourceId}`)
          console.log(`    - dataItems 数量: ${ds.dataItems?.length || 0}`)
          if (ds.dataItems) {
            ds.dataItems.forEach((item, itemIndex) => {
              console.log(`    - 数据项 ${itemIndex + 1}:`, item.item?.type, item.item?.config)
            })
          }
        })
      }
    } else {
      console.warn('❌ ConfigurationManager 未找到')
    }
  }

  // 调试函数2: 检查 VisualEditorBridge 的转换结果
  window.debugVisualEditorBridge = function (componentId = 'test-component') {
    console.log('🌉 检查 VisualEditorBridge 转换:')

    if (window.visualEditorBridge && window.configurationManager) {
      const config = window.configurationManager.getConfiguration(componentId)
      if (config?.dataSource) {
        console.log('📥 输入配置:', config.dataSource)

        // 模拟 VisualEditorBridge.convertConfigToRequirement 的调用
        try {
          // 这里需要手动调用转换逻辑来看结果
          console.log('🔄 需要手动检查 convertConfigToRequirement 方法的输出')
          console.log('💡 建议在 VisualEditorBridge.ts 的 convertConfigToRequirement 方法中添加更多日志')
        } catch (error) {
          console.error('❌ 转换失败:', error)
        }
      }
    }
  }

  // 调试函数3: 检查 SimpleDataBridge 缓存
  window.debugSimpleDataBridge = function (componentId = 'test-component') {
    console.log('💾 检查 SimpleDataBridge 缓存:')

    if (window.simpleDataBridge) {
      const cachedData = window.simpleDataBridge.getComponentData(componentId)
      console.log('📊 缓存数据:', cachedData)

      const stats = window.simpleDataBridge.getStats()
      console.log('📈 统计信息:', stats)

      // 清除缓存测试
      console.log('🧹 清除缓存并重新执行...')
      window.simpleDataBridge.clearComponentCache(componentId)
    } else {
      console.warn('❌ SimpleDataBridge 未找到')
    }
  }

  // 调试函数4: 完整的调试流程
  window.debugMultipleDataSources = function (componentId = 'test-component') {
    console.log('🚀 开始完整多数据源调试...')
    console.log('=====================================')

    console.log('\n1️⃣ 检查配置管理器:')
    window.debugConfigurationManager(componentId)

    console.log('\n2️⃣ 检查桥接器转换:')
    window.debugVisualEditorBridge(componentId)

    console.log('\n3️⃣ 检查数据桥接缓存:')
    window.debugSimpleDataBridge(componentId)

    console.log('\n✨ 调试完成！请检查上述输出找出问题所在')
  }

  console.log('🔧 调试函数已注册:')
  console.log('  - window.debugConfigurationManager(componentId)')
  console.log('  - window.debugVisualEditorBridge(componentId)')
  console.log('  - window.debugSimpleDataBridge(componentId)')
  console.log('  - window.debugMultipleDataSources(componentId) // 完整调试')
  console.log('')
  console.log('💡 使用方法:')
  console.log('  1. 在浏览器中配置多个数据源')
  console.log('  2. 打开开发者工具控制台')
  console.log("  3. 运行: debugMultipleDataSources('your-component-id')")
  console.log('  4. 查看详细的调试输出')
}

// 推测问题可能的原因
console.log('\n🤔 可能的问题原因:')
console.log('1. 配置保存问题 - 只保存了第一个数据源')
console.log('2. 缓存问题 - 缓存了第一个数据源的结果，阻止后续执行')
console.log('3. ID 冲突 - 多个数据源使用了相同的 componentId')
console.log('4. 事件触发问题 - 配置变化事件只触发了一次')
console.log('5. VisualEditorBridge 转换问题 - 转换逻辑有bug')
console.log('6. 界面显示问题 - 数据正确但UI没有更新')

console.log('\n📋 建议的调试步骤:')
console.log('1. 使用 debugMultipleDataSources() 检查配置是否正确保存')
console.log('2. 检查控制台是否有执行日志')
console.log('3. 检查网络面板是否有多次数据请求')
console.log('4. 尝试清除缓存后重新配置')
console.log('5. 检查组件是否使用了不同的 componentId')
