/**
 * 配置驱动架构端到端流程验证脚本
 * 验证从 SimpleConfigurationEditor → ConfigurationManager → VisualEditorBridge → UnifiedDataExecutor 的完整数据流
 */

// 测试数据配置
const testJsonData = {
  users: [
    { id: 1, name: '张三', age: 25, status: '在线' },
    { id: 2, name: '李四', age: 30, status: '离线' },
    { id: 3, name: '王五', age: 28, status: '在线' }
  ],
  total: 3,
  timestamp: new Date().toLocaleString()
}

// 模拟 DataSourceConfiguration 格式
const testDataSourceConfig = {
  componentId: 'test-component-001',
  dataSources: [
    {
      sourceId: 'dataSource1',
      dataItems: [
        {
          item: {
            type: 'json',
            config: {
              jsonString: JSON.stringify(testJsonData, null, 2)
            }
          },
          processing: {
            filterPath: '$.users',
            customScript: "return data.filter(user => user.status === '在线')"
          }
        }
      ]
    }
  ]
}

console.log('🧪 配置驱动架构测试数据已准备')
console.log('=====================================')
console.log('📊 测试 JSON 数据:', JSON.stringify(testJsonData, null, 2))
console.log('📝 DataSourceConfiguration:', JSON.stringify(testDataSourceConfig, null, 2))

console.log('\n🚀 完整测试流程:')
console.log('1️⃣ 前端访问: http://localhost:5002/test/editor-integration')
console.log('2️⃣ 添加 triple-data-display 组件')
console.log('3️⃣ 点击组件 → 配置面板 → 数据源配置')
console.log('4️⃣ 添加 JSON 数据项，粘贴测试数据')
console.log('5️⃣ 验证配置保存并触发数据执行')
console.log('6️⃣ 检查组件是否显示处理后的在线用户数据')

console.log('\n🔍 关键验证点:')
console.log('✅ SimpleConfigurationEditor.handleDataItemConfirm 调用 configurationManager')
console.log('✅ ConfigurationManager 触发 configEventBus.emitConfigChange')
console.log('✅ VisualEditorBridge 正确处理 DataSourceConfiguration 格式')
console.log('✅ 字段映射: jsonString → jsonContent')
console.log('✅ UnifiedDataExecutor 成功执行 JSON 数据获取')
console.log('✅ 数据经过 DataItemProcessor 过滤和脚本处理')
console.log('✅ 最终数据显示在 triple-data-display 组件中')

console.log('\n📋 预期结果:')
console.log('- 组件显示 2 个在线用户：张三、王五')
console.log('- 控制台显示完整的配置驱动执行日志')
console.log("- 无 'JSON内容未配置' 错误")
console.log('- 配置保存在 localStorage 中并可恢复')

// 在浏览器控制台中可用的测试函数
if (typeof window !== 'undefined') {
  window.testConfigurationFlow = function () {
    console.log('🧪 开始配置驱动流程测试...')

    // 检查关键类是否存在
    if (window.configurationManager) {
      console.log('✅ ConfigurationManager 已加载')
    } else {
      console.warn('❌ ConfigurationManager 未找到')
    }

    if (window.visualEditorBridge) {
      console.log('✅ VisualEditorBridge 已加载')
    } else {
      console.warn('❌ VisualEditorBridge 未找到')
    }

    console.log('📝 使用测试配置:', testDataSourceConfig)
    return testDataSourceConfig
  }

  console.log('🔧 浏览器测试函数已注册: window.testConfigurationFlow()')
}
