<template>
  <div class="interaction-demo">
    <div class="demo-header">
      <h2>组件交互系统演示</h2>
      <p>这个演示展示了如何使用交互系统来控制组件的样式和行为</p>
    </div>

    <div class="demo-content">
      <!-- 交互控制器 -->
      <div class="controller-section">
        <h3>交互控制器</h3>
        <div class="controller-panel">
          <div class="control-group">
            <label>选择组件:</label>
            <select v-model="selectedComponentId" class="control-select">
              <option value="">请选择组件</option>
              <option value="data-mapping-test">数据映射测试组件</option>
            </select>
          </div>

          <div class="control-group">
            <label>交互事件:</label>
            <select v-model="selectedEvent" class="control-select">
              <option value="click">点击</option>
              <option value="hover">悬停</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <div class="control-group">
            <label>交互动作:</label>
            <select v-model="selectedAction" class="control-select">
              <option value="changeBackgroundColor">改变背景颜色</option>
              <option value="changeTextColor">改变文字颜色</option>
              <option value="changeSize">改变大小</option>
              <option value="changeOpacity">改变透明度</option>
              <option value="triggerAnimation">触发动画</option>
            </select>
          </div>

          <div class="control-group">
            <label>动作参数:</label>
            <input v-model="actionValue" :placeholder="getActionPlaceholder()" class="control-input" />
          </div>

          <div class="control-actions">
            <button class="btn btn-primary" @click="executeInteraction">执行交互</button>
            <button class="btn btn-secondary" @click="resetComponent">重置组件</button>
          </div>
        </div>
      </div>

      <!-- 受控组件展示 -->
      <div class="components-section">
        <h3>受控组件</h3>
        <div class="component-grid">
          <!-- 数据映射测试组件 -->
          <div class="component-item">
            <h4>数据映射测试组件</h4>
            <DataMappingTest
              :show-title="true"
              :title="'交互测试组件'"
              :array-data-source="sampleArrayData"
              :object-data-source="sampleObjectData"
              :array-mappings="sampleArrayMappings"
              :object-mappings="sampleObjectMappings"
              :show-debug-info="true"
            />
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="instructions-section">
        <h3>使用说明</h3>
        <div class="instructions">
          <ol>
            <li>在交互控制器中选择要控制的组件（如：data-mapping-test）</li>
            <li>选择交互事件类型（如：click、hover等）</li>
            <li>选择要执行的动作（如：改变背景颜色、改变大小等）</li>
            <li>配置动作参数（如：颜色值、尺寸等）</li>
            <li>点击"执行交互"按钮来触发交互</li>
            <li>观察组件的变化效果</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataMappingTest from './data-mapping-test/component.vue'
import { interactionManager } from '../core/interaction-manager'
import type { InteractionEventType, InteractionActionType } from '../core/interaction-types'

// 控制器的响应式数据
const selectedComponentId = ref('')
const selectedEvent = ref<InteractionEventType>('click')
const selectedAction = ref<InteractionActionType>('changeBackgroundColor')
const actionValue = ref('')

// 示例数据
const sampleArrayData = ref([
  { id: 1, name: '示例项目1', value: 100, status: 'active' },
  { id: 2, name: '示例项目2', value: 200, status: 'inactive' },
  { id: 3, name: '示例项目3', value: 300, status: 'active' }
])

const sampleObjectData = ref({
  project: {
    name: '示例项目',
    version: '1.0.0',
    description: '这是一个示例项目'
  },
  metrics: {
    performance: 95.5,
    reliability: 98.2,
    usability: 92.8
  }
})

const sampleArrayMappings = ref({
  field1Path: '0.name',
  field2Path: '1.value',
  field3Path: '2.status'
})

const sampleObjectMappings = ref({
  fieldAPath: 'project.name',
  fieldBPath: 'project.version',
  fieldCPath: 'metrics.performance'
})

// 获取动作参数的占位符
const getActionPlaceholder = () => {
  switch (selectedAction.value) {
    case 'changeBackgroundColor':
    case 'changeTextColor':
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

// 执行交互
const executeInteraction = () => {
  if (!selectedComponentId.value || !selectedEvent.value || !selectedAction.value) {
    alert('请选择组件、事件和动作')
    return
  }

  try {
    let value: any = actionValue.value

    // 根据动作类型处理参数值
    switch (selectedAction.value) {
      case 'changeSize':
        if (actionValue.value.includes('x')) {
          const [width, height] = actionValue.value.split('x').map(Number)
          value = { width, height }
        } else {
          value = { width: 300, height: 200 }
        }
        break
      case 'changeOpacity':
        value = parseFloat(actionValue.value) || 0.8
        break
      case 'triggerAnimation':
        value = parseInt(actionValue.value) || 1000
        break
    }

    const results = interactionManager.triggerEvent(selectedComponentId.value, selectedEvent.value, {
      action: selectedAction.value,
      value
    })

    console.log('交互执行结果:', results)

    if (results.some(r => r.success)) {
      alert('交互执行成功！')
    } else {
      alert('交互执行失败，请查看控制台')
    }
  } catch (error) {
    console.error('执行交互失败:', error)
    alert('执行交互失败: ' + error)
  }
}

// 重置组件
const resetComponent = () => {
  if (selectedComponentId.value) {
    interactionManager.resetComponentState(selectedComponentId.value)
    alert('组件已重置')
  } else {
    alert('请先选择组件')
  }
}
</script>

<style scoped>
.interaction-demo {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
}

.demo-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.demo-header p {
  color: #666;
  font-size: 16px;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.controller-section,
.components-section,
.instructions-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.controller-section h3,
.components-section h3,
.instructions-section h3 {
  color: #333;
  margin-bottom: 16px;
  font-size: 18px;
}

.controller-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.control-select,
.control-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.control-select:focus,
.control-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.control-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.component-grid {
  display: grid;
  gap: 24px;
}

.component-item {
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 16px;
  background: #fafbfc;
}

.component-item h4 {
  color: #555;
  margin-bottom: 12px;
  font-size: 14px;
}

.instructions {
  color: #555;
  line-height: 1.6;
}

.instructions ol {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interaction-demo {
    padding: 16px;
  }

  .controller-section,
  .components-section,
  .instructions-section {
    padding: 16px;
  }

  .control-actions {
    flex-direction: column;
  }
}
</style>
