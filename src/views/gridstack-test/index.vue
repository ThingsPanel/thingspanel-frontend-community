<template>
  <div class="gridstack-test-page">
    <h1>Gridstack 渲染器测试页面</h1>
    
    <div class="test-section">
      <h2>渲染器注册状态</h2>
      <div class="status-info">
        <p><strong>工厂状态:</strong> {{ factoryStatus }}</p>
        <p><strong>已注册渲染器:</strong> {{ registeredRenderers.join(', ') }}</p>
        <p><strong>Gridstack 是否已注册:</strong> {{ isGridstackRegistered ? '是' : '否' }}</p>
      </div>
    </div>
    
    <div class="test-section">
      <h2>渲染器配置</h2>
      <div class="config-info">
        <p><strong>配置文件中的渲染器:</strong> {{ configRenderers.join(', ') }}</p>
        <p><strong>启用的渲染器:</strong> {{ enabledRenderers.join(', ') }}</p>
      </div>
    </div>
    
    <div class="test-section">
      <h2>错误信息</h2>
      <div class="error-info">
        <pre v-if="errorMessages.length > 0">{{ errorMessages.join('\n') }}</pre>
        <p v-else>暂无错误信息</p>
      </div>
    </div>
    
    <div class="test-section">
      <h2>测试操作</h2>
      <div class="test-actions">
        <button @click="testGridstackCreation">测试创建 Gridstack 渲染器</button>
        <button @click="refreshStatus">刷新状态</button>
      </div>
    </div>
    
    <div class="test-section" v-if="testResult">
      <h2>测试结果</h2>
      <div class="test-result">
        <pre>{{ testResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RendererFactory } from '@/components/panelv2/core/RendererFactory'
import { rendererAutoRegistry } from '@/components/panelv2/core/RendererAutoRegistry'
import { renderersConfig } from '@/components/panelv2/renderers/renderers.config'

// 响应式数据
const factoryStatus = ref('')
const registeredRenderers = ref<string[]>([])
const isGridstackRegistered = ref(false)
const configRenderers = ref<string[]>([])
const enabledRenderers = ref<string[]>([])
const errorMessages = ref<string[]>([])
const testResult = ref('')

// 创建工厂实例
const factory = new RendererFactory()

// 刷新状态
const refreshStatus = () => {
  try {
    // 获取工厂状态
    factoryStatus.value = `已注册 ${factory.getCount()} 个渲染器`
    registeredRenderers.value = factory.getRegisteredIds()
    isGridstackRegistered.value = factory.isRegistered('gridstack')
    
    // 获取配置信息
    configRenderers.value = renderersConfig.map(c => c.id)
    enabledRenderers.value = renderersConfig.filter(c => c.enabled !== false).map(c => c.id)
    
    console.log('状态刷新完成')
  } catch (error) {
    console.error('刷新状态失败:', error)
    errorMessages.value.push(`刷新状态失败: ${error}`)
  }
}

// 测试创建 Gridstack 渲染器
const testGridstackCreation = async () => {
  try {
    testResult.value = '正在测试...'
    
    // 首先尝试从工厂创建
    if (factory.isRegistered('gridstack')) {
      const renderer = factory.create('gridstack')
      testResult.value = `成功从工厂创建 Gridstack 渲染器:\n${JSON.stringify({
        id: renderer.id,
        name: renderer.name,
        version: renderer.version
      }, null, 2)}`
    } else {
      // 尝试手动加载和注册
      testResult.value += '\n工厂中未找到 gridstack，尝试手动加载...'
      
      const module = await rendererAutoRegistry.loadRenderer('gridstack')
      if (module) {
        testResult.value += `\n模块加载成功:\n${JSON.stringify({
          hasRendererClass: !!module.RendererClass,
          hasRendererInfo: !!module.RendererInfo,
          enabled: module.enabled,
          rendererInfo: module.RendererInfo
        }, null, 2)}`
        
        // 尝试注册
        const registered = await rendererAutoRegistry.registerRenderer('gridstack')
        testResult.value += `\n注册结果: ${registered ? '成功' : '失败'}`
        
        if (registered) {
          refreshStatus()
        }
      } else {
        testResult.value += '\n模块加载失败'
      }
    }
  } catch (error) {
    console.error('测试失败:', error)
    testResult.value = `测试失败: ${error}`
    errorMessages.value.push(`测试失败: ${error}`)
  }
}

// 初始化
onMounted(async () => {
  try {
    console.log('初始化测试页面...')
    
    // 设置工厂到自动注册器
    rendererAutoRegistry.setFactory(factory)
    
    // 添加配置
    rendererAutoRegistry.addRenderers(renderersConfig)
    
    // 尝试注册所有渲染器
    const result = await rendererAutoRegistry.registerAll()
    console.log('自动注册结果:', result)
    
    if (result.failed.length > 0) {
      errorMessages.value.push(`注册失败的渲染器: ${result.failed.join(', ')}`)
    }
    
    refreshStatus()
  } catch (error) {
    console.error('初始化失败:', error)
    errorMessages.value.push(`初始化失败: ${error}`)
  }
})
</script>

<style scoped>
.gridstack-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.test-section h2 {
  margin-top: 0;
  color: #333;
}

.status-info p,
.config-info p {
  margin: 8px 0;
}

.error-info pre,
.test-result pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
}

.test-actions {
  display: flex;
  gap: 10px;
}

.test-actions button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-actions button:hover {
  background: #0056b3;
}
</style>