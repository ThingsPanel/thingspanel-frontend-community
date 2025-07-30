<template>
  <div class="grid-config-form">
    <div class="form-section">
      <h3 class="section-title">网格布局</h3>
      
      <div class="form-row">
        <label class="form-label">列数</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.columns" 
            type="number" 
            :min="1" 
            :max="24" 
            class="number-input"
          />
          <span class="form-hint">1-24列</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">行高</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.rowHeight" 
            type="number" 
            :min="20" 
            :max="200" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">间距</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.gap" 
            type="number" 
            :min="0" 
            :max="50" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">内边距</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.padding" 
            type="number" 
            :min="0" 
            :max="100" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">显示选项</h3>
      
      <div class="form-row">
        <label class="form-label">显示网格线</label>
        <div class="form-control">
          <label class="switch">
            <input v-model="localConfig.showGrid" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">交互设置</h3>
      
      <div class="form-row">
        <label class="form-label">启用磁吸</label>
        <div class="form-control">
          <label class="switch">
            <input v-model="localConfig.enableSnap" type="checkbox" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div v-if="localConfig.enableSnap" class="form-row">
        <label class="form-label">磁吸阈值</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.snapThreshold" 
            type="number" 
            :min="1" 
            :max="50" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="section-title">项目约束</h3>
      
      <div class="form-row">
        <label class="form-label">最小宽度</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.minItemWidth" 
            type="number" 
            :min="50" 
            :max="500" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>

      <div class="form-row">
        <label class="form-label">最小高度</label>
        <div class="form-control">
          <input 
            v-model.number="localConfig.minItemHeight" 
            type="number" 
            :min="30" 
            :max="300" 
            class="number-input"
          />
          <span class="form-hint">像素</span>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-secondary" @click="resetToDefault">重置默认</button>
      <button class="btn btn-primary" @click="applyConfig">应用配置</button>
    </div>

    <div class="config-preview">
      <h3 class="section-title">配置预览</h3>
      <pre class="config-json">{{ JSON.stringify(localConfig, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { GridConfig } from './types'

// Props定义
interface Props {
  config: GridConfig
}

const props = defineProps<Props>()

// 事件定义
interface Emits {
  'config-change': [config: GridConfig]
}

const emit = defineEmits<Emits>()

// 默认配置
const defaultConfig: GridConfig = {
  columns: 12,
  rowHeight: 60,
  gap: 8,
  showGrid: true,
  enableSnap: true,
  snapThreshold: 10,
  minItemWidth: 100,
  minItemHeight: 60,
  padding: 16
}

// 本地配置状态
const localConfig = ref<GridConfig>({ ...props.config })

// 监听外部配置变化
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

// 监听本地配置变化并发出事件
watch(localConfig, (newConfig) => {
  emit('config-change', { ...newConfig })
}, { deep: true })

// 重置为默认配置
const resetToDefault = () => {
  localConfig.value = { ...defaultConfig }
}

// 应用配置
const applyConfig = () => {
  emit('config-change', { ...localConfig.value })
}

// 验证配置
const configErrors = computed(() => {
  const errors: string[] = []
  
  if (localConfig.value.columns < 1 || localConfig.value.columns > 24) {
    errors.push('列数应在1-24之间')
  }
  
  if (localConfig.value.rowHeight < 20) {
    errors.push('行高不能小于20像素')
  }
  
  if (localConfig.value.gap < 0) {
    errors.push('间距不能为负数')
  }
  
  if (localConfig.value.minItemWidth < 50) {
    errors.push('最小项目宽度不能小于50像素')
  }
  
  if (localConfig.value.minItemHeight < 30) {
    errors.push('最小项目高度不能小于30像素')
  }
  
  return errors
})

// 配置是否有效
const isConfigValid = computed(() => configErrors.value.length === 0)
</script>

<style scoped>
.grid-config-form {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  max-height: 600px;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.form-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.number-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-hint {
  font-size: 12px;
  color: #999;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #1890ff;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.config-preview {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.config-json {
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 12px;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #666;
  max-height: 200px;
  overflow-y: auto;
  margin: 8px 0 0 0;
}
</style>