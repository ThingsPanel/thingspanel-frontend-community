<template>
  <div class="simple-test">
    <h2>🔍 简单测试</h2>
    
    <div class="test-section">
      <h3>Card 2.1 组件注册测试</h3>
      <button @click="testCard21Registration">测试 Card 2.1 注册</button>
      <div v-if="testResult">
        <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>Widget Registry 测试</h3>
      <button @click="testWidgetRegistry">测试 Widget Registry</button>
      <div v-if="widgetResult">
        <pre>{{ JSON.stringify(widgetResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>Config Registry 测试</h3>
      <button @click="testConfigRegistry">测试 Config Registry</button>
      <div v-if="configResult">
        <pre>{{ JSON.stringify(configResult, null, 2) }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>强制重新加载</h3>
      <button @click="forceReload">强制重新加载</button>
    </div>

    <div class="test-section">
      <h3>组件渲染测试</h3>
      <button @click="testComponentRender">测试组件渲染</button>
      <div v-if="showTestComponent" class="component-test-container">
        <component 
          :is="testComponent" 
          :properties="testProperties"
          :metadata="{ test: true }"
        />
      </div>
    </div>

    <div class="test-section">
      <h3>配置组件测试</h3>
      <button @click="testConfigComponentRender">测试配置组件</button>
      <div v-if="showTestConfig" class="config-test-container">
        <component 
          :is="testConfigComponent" 
          v-model:modelValue="testConfigValue"
        />
        <div class="config-preview">
          <h4>配置值预览：</h4>
          <pre>{{ JSON.stringify(testConfigValue, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h3>数据源测试</h3>
      <button @click="testDataSource">测试数据源</button>
      <div v-if="dataSourceResult" class="test-result">
        <h4>数据源测试结果：</h4>
        <pre>{{ JSON.stringify(dataSourceResult, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, type Component } from 'vue'
import { useEditor } from '../hooks'
import { configRegistry } from '../settings/ConfigRegistry'
import componentRegistry from '@/card2.1'
import type { IConfigComponent } from '@/card2.1/core'

interface TestResult {
  success: boolean
  totalComponents?: number
  componentIds?: string[]
  digitIndicator?: any
  error?: string
}

interface WidgetResult {
  success: boolean
  totalWidgets?: number
  card2Widgets?: number
  widgetTypes?: string[]
  card2Types?: string[]
  error?: string
}

interface ConfigResult {
  success: boolean
  totalConfigs?: number
  configIds?: string[]
  digitConfig?: any
  error?: string
  debug?: any
}

// 测试结果
const testResult = ref<TestResult | null>(null)
const widgetResult = ref<WidgetResult | null>(null)
const configResult = ref<ConfigResult | null>(null)
const dataSourceResult = ref<any>(null)

// 测试组件
const testComponent = ref<any>(null)
const testConfigComponent = ref<any>(null)
const showTestComponent = ref(false)
const showTestConfig = ref(false)
const testProperties = ref({
  value: '45',
  unit: '%',
  title: '测试数据',
  color: 'blue',
  iconName: 'Water'
})
const testConfigValue = ref({
  value: '45',
  unit: '%',
  title: '测试数据',
  color: 'blue',
  iconName: 'Water'
})

const testCard21Registration = async () => {
  try {
    console.log('🔍 开始测试 Card 2.1 注册...')
    
    // 测试组件注册表
    const allComponents = componentRegistry.getAll()
    console.log('Card 2.1 注册表中的组件:', allComponents)
    
    // 测试特定组件 - 使用新的 type 属性
    const digitIndicator = allComponents.find(c => c.type === 'digit-indicator')
    console.log('数字指示器组件:', digitIndicator)
    
    testResult.value = {
      success: true,
      totalComponents: allComponents.length,
      componentIds: allComponents.map(c => c.type), // 使用 type 而不是 id
      digitIndicator: digitIndicator ? {
        type: digitIndicator.type,
        name: digitIndicator.name,
        hasComponent: !!digitIndicator.component,
        hasConfigComponent: !!digitIndicator.configComponent,
        properties: digitIndicator.properties
      } : null
    }
    
  } catch (error: any) {
    console.error('❌ Card 2.1 注册测试失败:', error)
    testResult.value = {
      success: false,
      error: error.message
    }
  }
}

const testWidgetRegistry = async () => {
  try {
    console.log('🔍 开始测试 Widget Registry...')
    
    // 直接导入 widgetRegistry，避免 useEditor 依赖
    const { widgetRegistry } = await import('../core/widget-registry')
    
    const allWidgets = widgetRegistry.getAllWidgets()
    console.log('Widget Registry 中的组件:', allWidgets)
    
    // 测试 Card 2.1 组件
    const card2Widgets = allWidgets.filter((w: any) => w.metadata?.isCard2Component)
    console.log('Card 2.1 组件:', card2Widgets)
    
    widgetResult.value = {
      success: true,
      totalWidgets: allWidgets.length,
      card2Widgets: card2Widgets.length,
      widgetTypes: allWidgets.map((w: any) => w.type),
      card2Types: card2Widgets.map((w: any) => w.type)
    }
    
  } catch (error: any) {
    console.error('❌ Widget Registry 测试失败:', error)
    widgetResult.value = {
      success: false,
      error: error.message
    }
  }
}

const testConfigRegistry = async () => {
  try {
    console.log('🔍 开始测试 Config Registry...')
    
    const allConfigs = configRegistry.getAll()
    console.log('Config Registry 中的配置:', allConfigs)
    
    // 测试特定配置
    const digitConfig = configRegistry.get('chart-digit')
    console.log('数字指示器配置组件:', digitConfig)
    
    // 添加更详细的调试信息
    console.log('🔍 检查 Card 2.1 组件定义...')
    const allComponents = componentRegistry.getAll()
    const digitIndicator = allComponents.find(c => c.type === 'digit-indicator')
    console.log('数字指示器组件定义:', digitIndicator)
    console.log('是否有配置组件:', !!digitIndicator?.configComponent)
    
    configResult.value = {
      success: true,
      totalConfigs: allConfigs.length,
      configIds: allConfigs.map(c => c.componentId),
      digitConfig: digitConfig ? {
        hasConfig: true,
        configType: typeof digitConfig
      } : {
        hasConfig: false
      },
      // 添加调试信息
      debug: {
        digitIndicatorExists: !!digitIndicator,
        hasConfigComponent: !!digitIndicator?.configComponent,
        configComponentType: typeof digitIndicator?.configComponent
      }
    }
    
  } catch (error: any) {
    console.error('❌ Config Registry 测试失败:', error)
    configResult.value = {
      success: false,
      error: error.message
    }
  }
}

const forceReload = async () => {
  try {
    console.log('🔍 强制重新加载...')
    
    // 清空注册表
    configRegistry.clear()
    
    // 重新导入 Card 2.1
    const card21Module = await import('@/card2.1')
    console.log('重新导入 Card 2.1:', card21Module)
    
    // 重新测试
    await testCard21Registration()
    await testWidgetRegistry()
    await testConfigRegistry()
    
    console.log('✅ 强制重新加载完成')
    
  } catch (error: any) {
    console.error('❌ 强制重新加载失败:', error)
  }
}

const testComponentRender = async () => {
  try {
    console.log('🔍 开始测试组件渲染...')
    
    // 获取组件定义
    const allComponents = componentRegistry.getAll()
    const digitIndicator = allComponents.find(c => c.type === 'digit-indicator')
    
    if (digitIndicator && digitIndicator.component) {
      testComponent.value = digitIndicator.component
      showTestComponent.value = true
      console.log('✅ 组件渲染测试成功')
    } else {
      throw new Error('找不到数字指示器组件')
    }
    
  } catch (error: any) {
    console.error('❌ 组件渲染测试失败:', error)
  }
}

const testConfigComponentRender = async () => {
  try {
    console.log('🔧 SimpleTest - 开始测试配置组件渲染')
    
    // 获取数字指示器组件定义
    const allComponents = componentRegistry.getAll()
    const digitIndicator = allComponents.find(c => c.type === 'digit-indicator')
    if (!digitIndicator) {
      throw new Error('找不到数字指示器组件定义')
    }
    
    console.log('🔧 SimpleTest - 数字指示器组件定义:', digitIndicator)
    
    // 获取配置组件
    let configComponent = configRegistry.get('digit-indicator')
    if (!configComponent) {
      // 如果从注册表获取失败，尝试直接从组件定义获取
      configComponent = digitIndicator.configComponent
      console.log('🔧 SimpleTest - 从组件定义获取配置组件:', configComponent)
    }
    
    if (!configComponent) {
      throw new Error('找不到数字指示器配置组件')
    }
    
    testConfigComponent.value = configComponent
    showTestConfig.value = true
    
    configResult.value = {
      success: true,
      digitConfig: configComponent,
      debug: {
        fromRegistry: !!configRegistry.get('digit-indicator'),
        fromDefinition: !!digitIndicator.configComponent
      }
    }
    
    console.log('✅ SimpleTest - 配置组件渲染测试成功')
  } catch (error: any) {
    console.error('❌ SimpleTest - 配置组件渲染测试失败:', error)
    configResult.value = {
      success: false,
      error: error.message,
      debug: { error: error.toString() }
    }
  }
}

const testDataSource = async () => {
  try {
    console.log('🔧 SimpleTest - 开始测试数据源')
    
    // 导入数据源管理器
    const { dataSourceManager } = await import('../core/data-source-manager')
    const { DataSourceType } = await import('../types/data-source')
    
    // 创建测试数据源
    const testDataSource: any = {
      type: DataSourceType.STATIC,
      enabled: true,
      name: '测试数据源',
      description: '测试用的静态数据源',
      data: {
        value: 88,
        unit: '°C',
        title: 'CPU温度'
      },
      refreshInterval: 0
    }
    
    // 订阅数据源
    const unsubscribe = dataSourceManager.subscribe(testDataSource, (value) => {
      console.log('🔧 SimpleTest - 收到数据源更新:', value)
      dataSourceResult.value = {
        success: true,
        dataSource: testDataSource,
        value: value,
        timestamp: new Date().toISOString()
      }
    })
    
    // 5秒后取消订阅
    setTimeout(() => {
      unsubscribe()
      console.log('🔧 SimpleTest - 数据源测试完成，已取消订阅')
    }, 5000)
    
    console.log('✅ SimpleTest - 数据源测试开始')
  } catch (error: any) {
    console.error('❌ SimpleTest - 数据源测试失败:', error)
    dataSourceResult.value = {
      success: false,
      error: error.message
    }
  }
}
</script>

<style scoped>
.simple-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  margin-bottom: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

pre {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.component-test-container {
  border: 1px solid #ddd;
  padding: 20px;
  margin-top: 10px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.config-test-container {
  border: 1px solid #ddd;
  padding: 20px;
  margin-top: 10px;
  background-color: #f9f9f9;
}

.config-preview {
  margin-top: 20px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}
</style> 