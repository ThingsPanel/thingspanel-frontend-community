<template>
  <div class="interaction-test-panel">
    <div class="test-panel-header">
      <h3>🧪 交互系统测试</h3>
      <button class="test-close-btn" @click="$emit('close')">×</button>
    </div>
    <div class="test-panel-content">
      <div class="test-control-group">
        <label>选择组件:</label>
        <select v-model="selectedTestComponent" class="test-select">
          <option value="">请选择要测试的组件</option>
          <option v-for="node in availableComponents" :key="node.id" :value="node.id">
            {{ node.name }} ({{ node.id }})
          </option>
        </select>
      </div>

      <div class="test-control-group">
        <label>交互动作:</label>
        <select v-model="selectedTestAction" class="test-select">
          <option value="changeBackgroundColor">改变背景颜色</option>
          <option value="changeTextColor">改变文字颜色</option>
          <option value="changeBorderColor">改变边框颜色</option>
          <option value="changeSize">改变大小</option>
          <option value="changeOpacity">改变透明度</option>
          <option value="triggerAnimation">触发动画</option>
        </select>
      </div>

      <div class="test-control-group">
        <label>动作参数:</label>
        <input v-model="testActionValue" :placeholder="getTestActionPlaceholder()" class="test-input" />
      </div>

      <div class="test-actions">
        <button class="test-btn test-btn-primary" :disabled="!selectedTestComponent" @click="executeTestInteraction">
          执行交互
        </button>
        <button class="test-btn test-btn-secondary" :disabled="!selectedTestComponent" @click="resetTestComponent">
          重置组件
        </button>
        <button class="test-btn test-btn-success" @click="$emit('run-system-test')">系统测试</button>
      </div>

      <div class="test-help">
        <h4>参数示例:</h4>
        <ul>
          <li>
            <strong>颜色:</strong>
            #ff6b6b, #4ecdc4, #45b7d1
          </li>
          <li>
            <strong>尺寸:</strong>
            300x200, 400x300
          </li>
          <li>
            <strong>透明度:</strong>
            0.5, 0.8, 1.0
          </li>
          <li>
            <strong>动画时长:</strong>
            1000, 2000 (毫秒)
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  stateManager?: any
}

interface Emits {
  (e: 'close'): void
  (e: 'test-interaction', componentId: string, action: string, value: any): void
  (e: 'reset-component', componentId: string): void
  (e: 'run-system-test'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 测试状态
const selectedTestComponent = ref('')
const selectedTestAction = ref('changeBackgroundColor')
const testActionValue = ref('#ff6b6b')

// 可用组件列表
const availableComponents = computed(() => {
  if (!props.stateManager || !props.stateManager.nodes) {
    return []
  }

  return props.stateManager.nodes.map((node: any) => ({
    id: node.id,
    type: node.type,
    name: node.metadata?.name || node.type
  }))
})

// 获取参数提示文本
const getTestActionPlaceholder = () => {
  switch (selectedTestAction.value) {
    case 'changeBackgroundColor':
    case 'changeTextColor':
    case 'changeBorderColor':
      return '输入颜色值，如：#ff6b6b'
    case 'changeSize':
      return '输入尺寸，如：300x200'
    case 'changeOpacity':
      return '输入透明度，如：0.5'
    case 'triggerAnimation':
      return '输入动画时长(ms)，如：1000'
    default:
      return '输入参数值'
  }
}

// 执行交互测试
const executeTestInteraction = () => {
  if (!selectedTestComponent.value || !selectedTestAction.value) {
    return
  }

  let processedValue: any = testActionValue.value

  // 根据动作类型处理参数值
  switch (selectedTestAction.value) {
    case 'changeSize':
      if (testActionValue.value.includes('x')) {
        const [width, height] = testActionValue.value.split('x').map(Number)
        processedValue = { width, height }
      } else {
        processedValue = { width: 300, height: 200 }
      }
      break
    case 'changeOpacity':
      processedValue = parseFloat(testActionValue.value) || 0.8
      break
    case 'triggerAnimation':
      processedValue = parseInt(testActionValue.value) || 1000
      break
  }

  emit('test-interaction', selectedTestComponent.value, selectedTestAction.value, processedValue)
}

// 重置组件
const resetTestComponent = () => {
  if (selectedTestComponent.value) {
    emit('reset-component', selectedTestComponent.value)
  }
}
</script>

<style scoped>
.interaction-test-panel {
  position: absolute;
  top: 60px;
  right: 10px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border: 1px solid #e1e5e9;
}

.test-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.test-panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.test-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.test-close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.test-panel-content {
  padding: 20px;
}

.test-control-group {
  margin-bottom: 16px;
}

.test-control-group label {
  display: block;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
  font-size: 14px;
}

.test-select,
.test-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.test-select:focus,
.test-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.test-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.test-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-btn-primary {
  background: #4a90e2;
  color: white;
}

.test-btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.test-btn-secondary {
  background: #6c757d;
  color: white;
}

.test-btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.test-btn-success {
  background: #28a745;
  color: white;
}

.test-btn-success:hover {
  background: #218838;
}

.test-help {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #4a90e2;
}

.test-help h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #333;
}

.test-help ul {
  margin: 0;
  padding-left: 16px;
}

.test-help li {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.test-help strong {
  color: #333;
}
</style>
