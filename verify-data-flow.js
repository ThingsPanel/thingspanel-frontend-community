/**
 * 数据流验证脚本
 * 在浏览器控制台中运行此脚本来测试完整的数据流
 * 
 * 使用方法：
 * 1. 打开 http://localhost:5002/visualization/visual-editor-details
 * 2. 打开浏览器控制台
 * 3. 复制粘贴此脚本并执行
 */

async function verifyDataFlow() {
    console.log('🚀 开始完整数据流验证...')
    
    try {
        // 1. 验证 UnifiedDataExecutor 是否可用
        if (!window.unifiedDataExecutor) {
            console.error('❌ UnifiedDataExecutor 未在全局范围内可用')
            return false
        }
        console.log('✅ UnifiedDataExecutor 可用')
        
        // 2. 验证 VisualEditorBridge 是否可用
        if (!window.visualEditorBridge) {
            console.error('❌ VisualEditorBridge 未在全局范围内可用')
            return false
        }
        console.log('✅ VisualEditorBridge 可用')
        
        // 3. 测试 JSON 数据源执行
        const jsonConfig = {
            id: 'test-json-source',
            type: 'json',
            enabled: true,
            config: {
                jsonContent: JSON.stringify({
                    temperature: 25,
                    humidity: 60,
                    pressure: 1013,
                    status: 'normal',
                    timestamp: new Date().toISOString(),
                    testId: Math.random().toString(36).substring(2, 10)
                }, null, 2)
            }
        }
        
        console.log('🧪 测试JSON数据源配置:', jsonConfig)
        
        const result = await window.unifiedDataExecutor.execute(jsonConfig)
        
        if (result.success) {
            console.log('✅ JSON数据源执行成功!')
            console.log('📊 返回数据:', result.data)
            console.log('⏱️ 执行时间:', result.metadata?.responseTime + 'ms')
            return true
        } else {
            console.error('❌ JSON数据源执行失败:', result.error)
            return false
        }
        
    } catch (error) {
        console.error('❌ 数据流验证过程中出现错误:', error)
        return false
    }
}

// 运行验证
verifyDataFlow().then(success => {
    if (success) {
        console.log('🎉 数据流验证完全成功！现在可以在UI中点击"生成测试数据"按钮了')
    } else {
        console.log('❌ 数据流验证失败，需要进一步调试')
    }
})

// 额外的测试函数 - 测试 VisualEditorBridge
async function testVisualEditorBridge() {
    console.log('🔧 测试 VisualEditorBridge 转换逻辑...')
    
    const mockConfig = {
        rawDataList: [{
            name: "测试JSON数据源",
            type: 'json',
            config: {
                jsonContent: JSON.stringify({
                    sensor: "test-sensor",
                    value: Math.random() * 100
                }, null, 2)
            },
            enabled: true
        }],
        finalProcessingType: 'concat-array'
    }
    
    try {
        const result = await window.visualEditorBridge.updateComponentExecutor(
            'test-component-123',
            'test-type',
            mockConfig
        )
        
        console.log('✅ VisualEditorBridge 测试成功:', result)
        return true
    } catch (error) {
        console.error('❌ VisualEditorBridge 测试失败:', error)
        return false
    }
}

console.log(`
📋 数据流验证脚本已加载！
🔧 可用函数：
   - verifyDataFlow() - 验证完整数据流
   - testVisualEditorBridge() - 测试VisualEditorBridge
`)