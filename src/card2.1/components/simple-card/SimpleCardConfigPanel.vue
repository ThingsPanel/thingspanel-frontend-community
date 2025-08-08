<template>
  <!-- 简单卡片组件配置面板 -->
  <div class="simple-card-config-panel">
    <h3 class="config-title">简单卡片配置</h3>

    <!-- 基础显示配置 -->
    <div class="config-section">
      <h4 class="section-title">基础显示</h4>
      <div class="form-group">
        <label>卡片标题</label>
        <input v-model="config.title" type="text" placeholder="请输入卡片标题" class="form-input" />
      </div>
      <div class="form-group">
        <label>显示数值</label>
        <input v-model="config.value" type="text" placeholder="请输入显示数值" class="form-input" />
      </div>
      <div class="form-group">
        <label>数值单位</label>
        <input v-model="config.unit" type="text" placeholder="如：°C、%、kg" class="form-input" />
      </div>
      <div class="form-group">
        <label>描述文字</label>
        <textarea v-model="config.description" placeholder="请输入描述文字" class="form-textarea" rows="3"></textarea>
      </div>
    </div>

    <!-- 样式配置 -->
    <div class="config-section">
      <h4 class="section-title">样式设置</h4>
      <div class="form-group">
        <label>背景颜色</label>
        <input v-model="config.backgroundColor" type="color" class="form-color" />
        <input v-model="config.backgroundColor" type="text" placeholder="#f8f9fa" class="form-input" />
      </div>
      <div class="form-group">
        <label>文字颜色</label>
        <input v-model="config.textColor" type="color" class="form-color" />
        <input v-model="config.textColor" type="text" placeholder="#333333" class="form-input" />
      </div>
      <div class="form-group">
        <label>字体大小</label>
        <input v-model="config.fontSize" type="text" placeholder="16px" class="form-input" />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="config-actions">
      <button class="btn btn-secondary" @click="resetConfig">重置配置</button>
      <button class="btn btn-primary" @click="applyConfig">应用配置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// 配置接口定义
interface SimpleCardConfig {
  title: string
  value: string
  unit: string
  description: string
  backgroundColor: string
  textColor: string
  fontSize: string
}

// 默认配置
const defaultConfig: SimpleCardConfig = {
  title: '简单卡片',
  value: '0',
  unit: '',
  description: '一个简单的数据展示卡片组件',
  backgroundColor: '#f8f9fa',
  textColor: '#333333',
  fontSize: '16px'
}

// 响应式配置
const config = ref<SimpleCardConfig>({ ...defaultConfig })

// 组件属性
const props = defineProps<{
  modelValue?: Partial<SimpleCardConfig>
}>()

// 组件事件
const emit = defineEmits<{
  'update:modelValue': [value: SimpleCardConfig]
  'config-change': [value: SimpleCardConfig]
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

// 监听配置变化，向父组件发送更新
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
  console.log('✅ [SimpleCard] 配置已应用:', config.value)
}

// 组件挂载时初始化
onMounted(() => {
  console.log('🚀 [SimpleCard] 配置面板已加载')
})
</script>

<style scoped>
.simple-card-config-panel {
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.config-title {
  margin: 0 0 20px 0;
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #52c41a;
  padding-bottom: 8px;
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border-left: 4px solid #52c41a;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 1em;
  font-weight: 600;
  color: #52c41a;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9em;
  font-weight: 500;
  color: #666;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 0.9em;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #52c41a;
  box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-color {
  width: 50px;
  height: 32px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.config-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #52c41a;
  color: white;
}

.btn-primary:hover {
  background: #389e0d;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simple-card-config-panel {
    padding: 16px;
  }

  .config-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
