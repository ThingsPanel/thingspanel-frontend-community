<!--
  数据项卡片组件
  显示单个数据项的信息和操作按钮
-->
<template>
  <div class="data-item-card" :class="{ active: dataItem.isActive }">
    <n-space justify="space-between" align="center">
      <!-- 左侧：数据项信息 -->
      <n-space align="center" :size="12">
        <!-- 状态开关 -->
        <n-switch 
          :value="dataItem.isActive" 
          size="small"
          @update:value="handleToggle"
        />

        <!-- 数据项基本信息 -->
        <div class="item-info">
          <n-space align="center" :size="8">
            <n-text strong style="font-size: 12px">
              {{ dataItem.name }}
            </n-text>
            <n-tag :type="getTypeColor()" size="tiny" round>
              {{ dataItem.type?.toUpperCase() || 'JSON' }}
            </n-tag>
          </n-space>
          
          <n-text depth="3" style="font-size: 10px; margin-top: 2px; display: block">
            {{ getItemDescription() }}
          </n-text>
        </div>

        <!-- 状态指示器 -->
        <n-tag :type="getStatusType()" size="tiny">
          {{ getStatusText() }}
        </n-tag>
      </n-space>

      <!-- 右侧：操作按钮 -->
      <n-space :size="4">
        <!-- 查看按钮 -->
        <n-tooltip content="查看详情" placement="top">
          <n-button size="tiny" quaternary type="info" @click="handleView">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </n-tooltip>

        <!-- 测试按钮 -->
        <n-tooltip content="测试数据项" placement="top">
          <n-button 
            size="tiny" 
            quaternary 
            type="warning" 
            :loading="testing"
            @click="handleTest"
          >
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2m4-9h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2m-4-9V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-6 0h6" stroke="currentColor" stroke-width="2"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </n-tooltip>

        <!-- 编辑按钮 -->
        <n-tooltip content="编辑配置" placement="top">
          <n-button size="tiny" quaternary type="primary" @click="handleEdit">
            <template #icon>
              <n-icon size="12">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </n-tooltip>

        <!-- 删除按钮 -->
        <n-popconfirm @positive-click="handleDelete">
          <template #trigger>
            <n-tooltip content="删除数据项" placement="top">
              <n-button size="tiny" quaternary type="error">
                <template #icon>
                  <n-icon size="12">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </n-tooltip>
          </template>
          确定要删除数据项 "{{ dataItem.name }}" 吗？
        </n-popconfirm>
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据项卡片组件
 * 展示单个数据项的信息和操作
 */

import { ref, computed } from 'vue'
import { 
  NSpace, 
  NText, 
  NTag, 
  NButton, 
  NIcon, 
  NTooltip, 
  NPopconfirm,
  NSwitch
} from 'naive-ui'

// 导入类型
import type { RawDataItem } from '../modals/DataItemModal.vue'

// Props 定义
interface Props {
  dataItem: RawDataItem
}

// Emits 定义
interface Emits {
  (e: 'edit', itemId: string): void
  (e: 'delete', itemId: string): void
  (e: 'view', itemId: string): void
  (e: 'test', itemId: string): void
  (e: 'toggle', itemId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 测试状态 */
const testing = ref(false)

// ========== 计算属性 ==========

/**
 * 获取类型颜色
 */
function getTypeColor(): string {
  switch (props.dataItem.type) {
    case 'json':
      return 'default'
    case 'http':
      return 'warning'
    case 'websocket':
      return 'error'
    default:
      return 'info'
  }
}

/**
 * 获取状态类型
 */
function getStatusType(): string {
  if (props.dataItem.isActive) {
    return 'success'
  }
  return 'default'
}

/**
 * 获取状态文本
 */
function getStatusText(): string {
  if (props.dataItem.isActive) {
    return '运行中'
  }
  return '已停止'
}

/**
 * 获取数据项描述
 */
function getItemDescription(): string {
  const item = props.dataItem
  
  switch (item.type) {
    case 'json':
      return '静态JSON数据'
      
    case 'http':
      const httpConfig = item.config?.httpConfig
      if (httpConfig) {
        return `${httpConfig.method} ${httpConfig.url || '未配置URL'}`
      }
      return 'HTTP请求'
      
    case 'websocket':
      const wsConfig = item.config?.websocketConfig
      if (wsConfig) {
        return `WebSocket: ${wsConfig.url || '未配置URL'}`
      }
      return 'WebSocket连接'
      
    default:
      return '未知类型'
  }
}

// ========== 事件处理器 ==========

/**
 * 处理切换状态
 */
function handleToggle(value: boolean): void {
  emit('toggle', props.dataItem.id)
  console.log(`🔄 [DataItemCard] 切换状态: ${props.dataItem.name} -> ${value}`)
}

/**
 * 处理查看
 */
function handleView(): void {
  emit('view', props.dataItem.id)
  console.log(`👁️ [DataItemCard] 查看数据项: ${props.dataItem.name}`)
}

/**
 * 处理测试
 */
async function handleTest(): Promise<void> {
  testing.value = true
  
  try {
    console.log(`🧪 [DataItemCard] 开始测试: ${props.dataItem.name}`)
    
    // 模拟测试过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('test', props.dataItem.id)
    console.log(`✅ [DataItemCard] 测试完成: ${props.dataItem.name}`)
    
  } catch (error) {
    console.error(`❌ [DataItemCard] 测试失败: ${props.dataItem.name}`, error)
  } finally {
    testing.value = false
  }
}

/**
 * 处理编辑
 */
function handleEdit(): void {
  emit('edit', props.dataItem.id)
  console.log(`✏️ [DataItemCard] 编辑数据项: ${props.dataItem.name}`)
}

/**
 * 处理删除
 */
function handleDelete(): void {
  emit('delete', props.dataItem.id)
  console.log(`🗑️ [DataItemCard] 删除数据项: ${props.dataItem.name}`)
}
</script>

<style scoped>
/* 数据项卡片样式 */
.data-item-card {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 12px;
  transition: all 0.2s ease;
  user-select: none;
}

.data-item-card:hover {
  border-color: var(--primary-color-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* 活跃状态样式 */
.data-item-card.active {
  border-color: var(--success-color);
  background: var(--success-color-light);
}

.data-item-card.active:hover {
  border-color: var(--success-color-hover);
}

/* 数据项信息样式 */
.item-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  flex: 1;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* 按钮悬停效果 */
.action-buttons :deep(.n-button) {
  transition: all 0.2s ease;
}

.action-buttons :deep(.n-button:hover) {
  transform: scale(1.1);
}

/* 状态开关样式 */
.status-switch :deep(.n-switch) {
  flex-shrink: 0;
}

/* 类型标签样式 */
.type-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 4px;
}

/* 状态标签样式 */
.status-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-item-card {
    padding: 6px 8px;
  }
  
  .item-info {
    min-width: 120px;
  }
  
  .action-buttons {
    gap: 2px;
  }
  
  .action-buttons :deep(.n-button) {
    min-width: 24px;
    padding: 2px;
  }
}

/* 明暗主题适配 */
[data-theme="dark"] .data-item-card {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .data-item-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--primary-color-hover);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .data-item-card.active {
  background: rgba(24, 160, 88, 0.2);
  border-color: var(--success-color);
}

[data-theme="light"] .data-item-card {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .data-item-card:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: var(--primary-color-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

[data-theme="light"] .data-item-card.active {
  background: rgba(24, 160, 88, 0.1);
  border-color: var(--success-color);
}

/* 加载状态样式 */
.data-item-card :deep(.n-button--loading) {
  opacity: 0.8;
}

/* 禁用状态样式 */
.data-item-card.disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 性能优化 */
.data-item-card {
  contain: layout style;
}

/* 焦点状态 */
.data-item-card:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-hover);
}
</style>