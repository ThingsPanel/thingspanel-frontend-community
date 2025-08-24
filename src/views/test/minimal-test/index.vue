<template>
  <div class="minimal-test">
    <h1>最小化测试</h1>
    
    <div class="test-info">
      <p>页面加载时间: {{ loadTime }}</p>
      <p>计数器: {{ counter }}</p>
      <button @click="increment">点击增加</button>
      <button @click="logTest">测试日志</button>
    </div>

    <div class="component-test">
      <h2>组件测试</h2>
      <p>组件状态: {{ componentStatus }}</p>
      
      <div v-if="showComponent">
        <TestComponent :message="testMessage" @update="handleUpdate" />
      </div>
      
      <button @click="toggleComponent">切换组件显示</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 定义一个简单的测试组件
const TestComponent = {
  props: ['message'],
  emits: ['update'],
  template: `
    <div style="padding: 10px; border: 1px solid #ccc; margin: 10px 0;">
      <p>接收到的消息: {{ message }}</p>
      <input 
        :value="message" 
        @input="$emit('update', $event.target.value)"
        style="padding: 4px; border: 1px solid #ddd;"
      />
      <p>这是一个测试组件</p>
    </div>
  `,
  mounted() {
    console.log('✅ TestComponent 挂载成功, message:', this.message)
  }
}

const loadTime = ref('')
const counter = ref(0)
const componentStatus = ref('未加载')
const showComponent = ref(false)
const testMessage = ref('Hello Test')

const increment = () => {
  counter.value++
  console.log('🔢 计数器:', counter.value)
}

const logTest = () => {
  console.log('🧪 最小化测试页面日志测试')
  console.log('📊 当前状态:', {
    loadTime: loadTime.value,
    counter: counter.value,
    componentStatus: componentStatus.value,
    showComponent: showComponent.value,
    testMessage: testMessage.value
  })
}

const toggleComponent = () => {
  showComponent.value = !showComponent.value
  componentStatus.value = showComponent.value ? '已显示' : '已隐藏'
  console.log('🔄 组件状态切换:', componentStatus.value)
}

const handleUpdate = (value: string) => {
  testMessage.value = value
  console.log('📝 消息更新:', value)
}

onMounted(() => {
  loadTime.value = new Date().toLocaleTimeString()
  componentStatus.value = '已加载'
  console.log('🎯 最小化测试页面挂载完成')
  console.log('⏰ 加载时间:', loadTime.value)
})
</script>

<style scoped>
.minimal-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.test-info, .component-test {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

button {
  margin: 5px;
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
</style>