<template>
  <!-- 开发演示组件配置面板 - 简化版 -->
  <div class="development-demo-config-panel">
    <h3 class="config-title">开发演示组件配置</h3>

    <!-- 基础配置 -->
    <div class="config-section">
      <h4 class="section-title">基础设置</h4>
      <div class="form-group">
        <label>标题</label>
        <input v-model="config.title" type="text" placeholder="请输入标题" class="form-input" />
      </div>
      <div class="form-group">
        <label>数值</label>
        <input v-model="config.value" type="text" placeholder="请输入数值" class="form-input" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea v-model="config.description" placeholder="请输入描述" class="form-textarea" rows="2"></textarea>
      </div>
    </div>

    <!-- 样式配置 -->
    <div class="config-section">
      <h4 class="section-title">样式设置</h4>
      <div class="form-group">
        <label>背景颜色</label>
        <input v-model="config.backgroundColor" type="color" class="form-color" />
      </div>
      <div class="form-group">
        <label>显示开发信息</label>
        <input v-model="config.showDevInfo" type="checkbox" class="form-checkbox" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="config-actions">
      <button class="btn btn-secondary" @click="resetConfig">重置</button>
      <button class="btn btn-primary" @click="applyConfig">应用</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// 简化的配置接口
interface DevelopmentDemoConfig {
  title: string
  value: string
  description: string
  backgroundColor: string
  showDevInfo: boolean
}

// 默认配置
const defaultConfig: DevelopmentDemoConfig = {
  title: '开发演示',
  value: '42',
  description: '这是一个简单的开发演示组件',
  backgroundColor: '#f8f9fa',
  showDevInfo: true
}

// 响应式配置
const config = ref<DevelopmentDemoConfig>({ ...defaultConfig })

// 组件属性
const props = defineProps<{
  modelValue?: Partial<DevelopmentDemoConfig>
}>()

// 组件事件
const emit = defineEmits<{
  'update:modelValue': [value: DevelopmentDemoConfig]
  'config-change': [value: DevelopmentDemoConfig]
}>()

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      config.value = { ...defaultConfig, ...newValue }
    }
  },
  { deep: true, immediate: true }
)

// 监听配置变化
watch(
  config,
  newConfig => {
    emit('update:modelValue', newConfig)
    emit('config-change', newConfig)
  },
  { deep: true }
)

// 重置配置
const resetConfig = () => {
  config.value = { ...defaultConfig }
}

// 应用配置
const applyConfig = () => {
  emit('config-change', config.value)
  console.log('✅ [DevelopmentDemo] 配置已应用:', config.value)
}

// 组件挂载时初始化
onMounted(() => {
  console.log('🚀 [DevelopmentDemo] 配置面板已加载')
})
</script>

<style scoped>
.development-demo-config-panel {
  padding: 16px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.config-title {
  margin: 0 0 16px 0;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
}

.config-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  font-weight: 600;
  color: #1890ff;
}

.form-group {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85em;
  font-weight: 500;
  color: #666;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.85em;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 40px;
}

.form-color {
  width: 40px;
  height: 28px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.form-checkbox {
  margin-right: 6px;
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.config-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #096dd9;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e8e8e8;
}
</style>
