<!--
  Gridstack Toolbar Component
  Gridstack 渲染器的工具栏组件
-->
<template>
  <div class="gridstack-toolbar" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 主要操作按钮 -->
    <div class="toolbar-section">
      <button 
        class="toolbar-btn primary"
        title="添加新组件"
        @click="handleAddItem"
      >
        <i class="icon-plus"></i>
        <span>添加组件</span>
      </button>
      
      <button 
        class="toolbar-btn"
        title="清空所有组件"
        @click="handleClearAll"
      >
        <i class="icon-clear"></i>
        <span>清空</span>
      </button>
    </div>
    
    <!-- 布局操作 -->
    <div class="toolbar-section">
      <button 
        class="toolbar-btn"
        title="保存当前布局"
        @click="handleSaveLayout"
      >
        <i class="icon-save"></i>
        <span>保存布局</span>
      </button>
      
      <button 
        class="toolbar-btn"
        title="加载布局"
        @click="handleLoadLayout"
      >
        <i class="icon-load"></i>
        <span>加载布局</span>
      </button>
    </div>
    
    <!-- 网格配置 -->
    <div class="toolbar-section">
      <div class="config-group">
        <label>列数:</label>
        <select 
          v-model="gridColumns" 
          class="config-select"
          @change="handleColumnsChange"
        >
          <option value="6">6列</option>
          <option value="8">8列</option>
          <option value="10">10列</option>
          <option value="12">12列</option>
          <option value="16">16列</option>
          <option value="24">24列</option>
        </select>
      </div>
      
      <div class="config-group">
        <label>间距:</label>
        <select 
          v-model="gridMargin" 
          class="config-select"
          @change="handleMarginChange"
        >
          <option value="5">5px</option>
          <option value="10">10px</option>
          <option value="15">15px</option>
          <option value="20">20px</option>
        </select>
      </div>
    </div>
    
    <!-- 视图选项 -->
    <div class="toolbar-section">
      <div class="toggle-group">
        <label class="toggle-label">
          <input 
            v-model="showGrid" 
            type="checkbox"
            @change="handleShowGridChange"
          >
          <span class="toggle-text">显示网格</span>
        </label>
        
        <label class="toggle-label">
          <input 
            v-model="enableAnimation" 
            type="checkbox"
            @change="handleAnimationChange"
          >
          <span class="toggle-text">动画效果</span>
        </label>
      </div>
    </div>
    
    <!-- 状态信息 -->
    <div class="toolbar-section status-section">
      <div class="status-info">
        <span class="status-label">组件数量:</span>
        <span class="status-value">{{ itemCount }}</span>
      </div>
      
      <div class="status-info">
        <span class="status-label">网格:</span>
        <span class="status-value">{{ gridColumns }}列</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import type { BaseRenderer } from '../../types/renderer'

// Props
interface Props {
  renderer?: BaseRenderer | null
  itemCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  renderer: null,
  itemCount: 0
})

// Emits
interface Emits {
  (e: 'add-item'): void
  (e: 'clear-all'): void
  (e: 'save-layout'): void
  (e: 'load-layout'): void
  (e: 'config-change', config: any): void
}

const emit = defineEmits<Emits>()

// Store
const themeStore = useThemeStore()

// State
const gridColumns = ref(12)
const gridMargin = ref(10)
const showGrid = ref(false)
const enableAnimation = ref(true)

// Computed
const isDarkTheme = computed(() => themeStore.darkMode)

// Methods
const handleAddItem = () => {
  emit('add-item')
}

const handleClearAll = () => {
  if (confirm('确定要清空所有组件吗？此操作不可撤销。')) {
    emit('clear-all')
  }
}

const handleSaveLayout = () => {
  emit('save-layout')
}

const handleLoadLayout = () => {
  emit('load-layout')
}

const handleColumnsChange = () => {
  emit('config-change', {
    columns: parseInt(gridColumns.value.toString())
  })
}

const handleMarginChange = () => {
  emit('config-change', {
    margin: parseInt(gridMargin.value.toString())
  })
}

const handleShowGridChange = () => {
  emit('config-change', {
    showGrid: showGrid.value
  })
}

const handleAnimationChange = () => {
  emit('config-change', {
    animate: enableAnimation.value
  })
}

// Watch for renderer changes
watch(() => props.renderer, (newRenderer) => {
  if (newRenderer) {
    // 从渲染器获取当前配置
    const config = newRenderer.getConfig()
    if (config) {
      gridColumns.value = config.columns || 12
      gridMargin.value = config.margin || 10
      showGrid.value = config.showGrid || false
      enableAnimation.value = config.animate !== false
    }
  }
}, { immediate: true })
</script>

<style scoped>
.gridstack-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  flex-wrap: wrap;
  position: relative;
  z-index: 10;
}

.dark-theme.gridstack-toolbar {
  background: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-right: 1px solid #e1e5e9;
}

.dark-theme .toolbar-section {
  border-right-color: #404040;
}

.toolbar-section:last-child {
  border-right: none;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  color: #495057;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: #e9ecef;
  border-color: #ced4da;
}

.toolbar-btn.primary {
  background: #007bff;
  border-color: #007bff;
  color: #ffffff;
}

.toolbar-btn.primary:hover {
  background: #0056b3;
  border-color: #0056b3;
}

.dark-theme .toolbar-btn {
  background: #3a3a3a;
  border-color: #4a4a4a;
  color: #ffffff;
}

.dark-theme .toolbar-btn:hover {
  background: #4a4a4a;
  border-color: #5a5a5a;
}

.config-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-group label {
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
}

.dark-theme .config-group label {
  color: #b0b0b0;
}

.config-select {
  padding: 4px 8px;
  border: 1px solid #e1e5e9;
  border-radius: 3px;
  background: #ffffff;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
}

.config-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.dark-theme .config-select {
  background: #3a3a3a;
  border-color: #4a4a4a;
  color: #ffffff;
}

.toggle-group {
  display: flex;
  gap: 12px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #6c757d;
}

.dark-theme .toggle-label {
  color: #b0b0b0;
}

.toggle-label input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.toggle-text {
  white-space: nowrap;
}

.status-section {
  margin-left: auto;
  gap: 16px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-label {
  font-size: 12px;
  color: #6c757d;
}

.dark-theme .status-label {
  color: #b0b0b0;
}

.status-value {
  font-size: 12px;
  font-weight: 500;
  color: #007bff;
}

.dark-theme .status-value {
  color: #4dabf7;
}

/* 图标样式 */
.icon-plus::before { content: '+'; }
.icon-clear::before { content: '🗑'; }
.icon-save::before { content: '💾'; }
.icon-load::before { content: '📁'; }

/* 响应式设计 */
@media (max-width: 768px) {
  .gridstack-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .toolbar-section {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
    padding-bottom: 8px;
  }
  
  .toolbar-section:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .status-section {
    margin-left: 0;
    justify-content: space-between;
  }
}
</style>