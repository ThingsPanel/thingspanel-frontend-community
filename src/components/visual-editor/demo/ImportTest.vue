<template>
  <div class="import-test">
    <h2>🔍 导入测试</h2>

    <div class="test-section">
      <h3>Card 2.1 组件导入测试</h3>
      <button @click="testImport">测试导入</button>
      <div v-if="importResult">
        <pre>{{ JSON.stringify(importResult, null, 2) }}</pre>
      </div>
    </div>

    <div class="test-section">
      <h3>组件渲染测试</h3>
      <button @click="testRender">测试渲染</button>
      <div v-if="showComponent" class="component-container">
        <component :is="testComponent" :properties="testProperties" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const importResult = ref(null)
const testComponent = ref(null)
const showComponent = ref(false)

const testProperties = {
  title: '测试标题',
  unit: '%',
  color: 'blue',
  iconName: 'Water',
  value: '45'
}

const testImport = async () => {
  try {
    console.log('🔍 开始测试 Card 2.1 组件导入...')

    // 测试导入 Card 2.1 注册表
    const componentRegistry = await import('@/card2.1')
    console.log('✅ Card 2.1 注册表导入成功:', componentRegistry)

    // 测试导入组件定义
    const digitIndicator = await import('@/card2.1/components/digit-indicator')
    console.log('✅ 数字指示器组件导入成功:', digitIndicator)

    // 测试导入具体组件
    const DigitIndicatorCard = await import('@/card2.1/components/digit-indicator/DigitIndicatorCard.vue')
    console.log('✅ DigitIndicatorCard 组件导入成功:', DigitIndicatorCard)

    // 测试导入配置组件
    const DigitIndicatorConfig = await import('@/card2.1/components/digit-indicator/DigitIndicatorConfig.vue')
    console.log('✅ DigitIndicatorConfig 组件导入成功:', DigitIndicatorConfig)

    importResult.value = {
      success: true,
      componentRegistry: !!componentRegistry,
      digitIndicator: !!digitIndicator,
      DigitIndicatorCard: !!DigitIndicatorCard,
      DigitIndicatorConfig: !!DigitIndicatorConfig
    }
  } catch (error) {
    console.error('❌ 导入测试失败:', error)
    importResult.value = {
      success: false,
      error: error.message
    }
  }
}

const testRender = async () => {
  try {
    console.log('🔍 开始测试组件渲染...')

    const DigitIndicatorCard = await import('@/card2.1/components/digit-indicator/DigitIndicatorCard.vue')
    testComponent.value = DigitIndicatorCard.default
    showComponent.value = true

    console.log('✅ 组件渲染测试成功')
  } catch (error) {
    console.error('❌ 组件渲染测试失败:', error)
  }
}
</script>

<style scoped>
.import-test {
  padding: 20px;
  max-width: 800px;
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

.component-container {
  border: 1px solid #ddd;
  padding: 20px;
  margin-top: 10px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
