<template>
  <div class="basic-test-page">
    <h1>基础测试页面</h1>
    
    <div class="test-section">
      <h2>Vue 基础功能测试</h2>
      <p>计数器: {{ count }}</p>
      <button @click="increment">增加</button>
      <button @click="testConsole">测试控制台</button>
    </div>

    <div class="test-section">
      <h2>数据源配置组件测试</h2>
      <p>组件状态: {{ componentLoaded ? '✅ 已加载' : '❌ 未加载' }}</p>
      
      <!-- 尝试加载数据源配置组件 -->
      <div class="component-test">
        <DataSourceConfigForm
          v-if="componentLoaded"
          v-model="testConfig"
          :data-sources="testDataSources"
        />
        <div v-else>
          <p>组件加载中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

// 基础测试数据
const count = ref(0)
const componentLoaded = ref(false)

// 测试配置数据
const testConfig = ref({
  activeDataSourceKey: 'simple',
  dataSourceBindings: {
    simple: {
      message: 'Hello World',
      count: 42
    }
  }
})

const testDataSources = ref({
  simple: {
    key: 'simple',
    name: '简单数据源',
    description: '用于测试的简单数据源',
    defaultConfig: {
      message: 'Hello World',
      count: 42
    }
  }
})

// 动态导入组件
let DataSourceConfigForm: any = null

const increment = () => {
  count.value++
  console.log('🔢 计数器增加:', count.value)
}

const testConsole = () => {
  console.log('🧪 基础测试页面 - 控制台测试成功!')
  console.log('📊 当前计数:', count.value)
  console.log('🔧 测试配置:', testConfig.value)
  console.log('📋 测试数据源:', testDataSources.value)
}

onMounted(async () => {
  console.log('🎯 基础测试页面已挂载')
  
  try {
    // 动态导入组件
    const module = await import('@/core/data-source-system/components/DataSourceConfigForm.vue')
    DataSourceConfigForm = module.default
    
    await nextTick()
    componentLoaded.value = true
    console.log('✅ DataSourceConfigForm 组件加载成功')
  } catch (error) {
    console.error('❌ DataSourceConfigForm 组件加载失败:', error)
  }
})
</script>

<style scoped>
.basic-test-page {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.component-test {
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
}

button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

h1, h2 {
  color: #333;
}

p {
  margin: 8px 0;
}
</style>