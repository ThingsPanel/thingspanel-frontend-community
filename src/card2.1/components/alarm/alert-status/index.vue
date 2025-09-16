<template>
  <n-card class="alert-status" embedded>
    <div class="content">
      <!-- 🔥 直接显示 props.data 转成的字符串 -->
      <div class="field-group">
        <label class="field-label">🔥 数据源数据:</label>
        <div class="field-value">{{ JSON.stringify(props.data) }}</div>
      </div>

      <!-- 标题显示 -->
      <div class="field-group">
        <label class="field-label">标题:</label>
        <div class="field-value">{{ getDisplayValue('title', '未设置') }}</div>
        <n-button size="tiny" @click="changeTitle">修改标题</n-button>
      </div>

      <!-- 金额显示 -->
      <div class="field-group">
        <label class="field-label">金额:</label>
        <div class="field-value">{{ getDisplayValue('amount', 0) }}</div>
        <n-button size="tiny" @click="changeAmount">修改金额</n-button>
      </div>

      <!-- 简介显示 -->
      <div class="field-group">
        <label class="field-label">简介:</label>
        <div class="field-value">{{ getDisplayValue('description', '无描述') }}</div>
        <n-button size="tiny" @click="changeDescription">修改简介</n-button>
      </div>
      
      <!-- 数据源调试信息 -->
      <div class="debug-info">
        <n-divider>🔍 调试信息</n-divider>
        <div class="debug-section">
          <span class="debug-label">统一配置值:</span>
          <pre class="debug-value">{{ JSON.stringify({
            title: unifiedConfig.component?.title,
            amount: unifiedConfig.component?.amount,
            description: unifiedConfig.component?.description
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">数据源值:</span>
          <pre class="debug-value">{{ JSON.stringify(props.data, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">最终显示值（数据源优先）:</span>
          <pre class="debug-value">{{ JSON.stringify({
            title: getDisplayValue('title', '未设置'),
            amount: getDisplayValue('amount', 0),
            description: getDisplayValue('description', '无描述')
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">数据来源分析:</span>
          <pre class="debug-value">{{ JSON.stringify({
            title: getDataSource('title'),
            amount: getDataSource('amount'),
            description: getDataSource('description')
          }, null, 2) }}</pre>
        </div>
      </div>

      <!-- 测试按钮 -->
      <div class="actions">
        <n-button type="primary" size="small" @click="randomUpdate">随机更新所有值</n-button>
        <n-button size="small" @click="resetToDefault">重置为默认值</n-button>
        <n-button type="warning" size="small" @click="testDataSource">测试数据源</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 告警状态组件 - 统一配置管理版本
 * 🔥 采用新的统一配置架构：所有配置归集到卡片级别
 */

import { watch, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NButton, useMessage } from 'naive-ui'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { AlertStatusCustomize } from './settingConfig'

// 组件属性接口 - 支持统一配置架构
interface Props { 
  config: AlertStatusCustomize  // 接收扁平的配置对象
  data?: Record<string, unknown>
  componentId?: string  // 🔥 新增：组件ID用于配置管理
}

// 组件事件 - 用于通知配置变更
interface Emits {
  (e: 'update:config', config: AlertStatusCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void  // 🔥 新增：统一配置变更事件
}

const props = withDefaults(defineProps<Props>(), { 
  data: () => ({}) 
})

const emit = defineEmits<Emits>()

// 🔥 获取初始统一配置 - 从Card2Wrapper的统一配置架构获取
function getInitialUnifiedConfig(): UnifiedCard2Configuration | undefined {
  if (!props.componentId) return undefined
  
  try {
    // 通过DOM查找Card2Wrapper实例获取完整配置
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      console.log(`🔥 [alert-status] 从Card2Wrapper获取初始配置:`, fullConfig)
      return fullConfig
    }
  } catch (error) {
    console.warn(`🔥 [alert-status] 获取初始配置失败:`, error)
  }
  return undefined
}

// 🔥 使用增强的 Card 2.1 数据绑定，支持统一配置管理
const { config, displayData, unifiedConfig, updateUnifiedConfig, getFullConfiguration } = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId,
  initialUnifiedConfig: getInitialUnifiedConfig()  // 🔥 传递初始统一配置
})

const message = useMessage()

// 🔥 核心数据获取函数：优先使用数据源数据，回退到配置数据
const getDisplayValue = (field: string, defaultValue: any) => {
  // 1. 优先使用数据源数据（这是执行结果）
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    console.log(`🎯 [alert-status] 字段${field}使用数据源数据:`, props.data[field])
    return String(props.data[field])
  }

  // 2. 回退到统一配置中的组件配置
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    console.log(`🎯 [alert-status] 字段${field}使用配置数据:`, unifiedConfig.value.component[field])
    return String(unifiedConfig.value.component[field])
  }

  // 3. 使用默认值
  console.log(`🎯 [alert-status] 字段${field}使用默认值:`, defaultValue)
  return String(defaultValue)
}

// 🔥 数据来源分析函数：判断数据来自哪里
const getDataSource = (field: string) => {
  // 检查数据源数据
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    return `数据源: ${props.data[field]}`
  }

  // 检查配置数据
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    return `配置: ${unifiedConfig.value.component[field]}`
  }

  // 默认值
  return '使用默认值'
}

// 🔥 修复递归更新：深度比较函数，替代JSON.stringify避免proxy序列化问题
const isConfigEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!isConfigEqual(a[key], b[key])) return false
    }
    
    return true
  }
  
  return false
}

// 🔥 调试信息 - 监控配置变化
watch(
  () => unifiedConfig.value,
  (newUnifiedConfig) => {
    console.log(`🔥 [alert-status] 统一配置变化 ${props.componentId}:`, {
      component: newUnifiedConfig?.component,
      title: newUnifiedConfig?.component?.title,
      amount: newUnifiedConfig?.component?.amount,
      description: newUnifiedConfig?.component?.description
    })
  },
  { deep: true, immediate: true }
)

// 🔥 监听外部配置更新事件
const handleExternalConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.componentId && layer === 'component') {
    console.log(`🔥 [alert-status] 接收到外部配置更新事件:`, config)
    // 手动同步到内部统一配置
    updateUnifiedConfig({ component: config })
  }
}

// 🔥 定时同步Card2Wrapper的配置（作为备用机制）
const syncFromCard2Wrapper = () => {
  if (!props.componentId) return
  
  try {
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      if (fullConfig?.component) {
        const currentComponent = unifiedConfig.value.component
        // 🔥 修复递归更新：使用深度比较替代JSON.stringify，避免proxy对象和复杂数据的序列化问题
        if (!isConfigEqual(currentComponent, fullConfig.component)) {
          console.log(`🔥 [alert-status] 定时同步Card2Wrapper配置:`, fullConfig.component)
          updateUnifiedConfig({ component: fullConfig.component })
        }
      }
    }
  } catch (error) {
    console.warn(`🔥 [alert-status] 同步Card2Wrapper配置失败:`, error)
  }
}

let syncTimer: number | null = null

// 监听配置更新事件
onMounted(() => {
  window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  console.log(`🔥 [alert-status] 开始监听外部配置更新 ${props.componentId}`)
  
  // 启动定时同步（每100ms检查一次）
  syncTimer = setInterval(syncFromCard2Wrapper, 100)
  console.log(`🔥 [alert-status] 启动定时同步机制`)
})

onUnmounted(() => {
  window.removeEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  
  // 清理定时器
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
})

// 🔥 本地更新配置函数 - 同步到Card2Wrapper的统一配置仓库
const updateConfig = (partialCustomize: Partial<AlertStatusCustomize>) => {
  const newConfig: AlertStatusCustomize = {
    ...unifiedConfig.value.component,  // 🔥 基于当前统一配置
    ...partialCustomize
  }
  
  console.log(`🔥 [alert-status] 组件内部更新配置:`, newConfig)
  
  // 🔥 关键：直接更新Card2Wrapper的统一配置，而不是内部的
  if (props.componentId) {
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
      console.log(`🔥 [alert-status] 通过Card2Wrapper更新配置`)
      ;(cardElement as any).__vueParentComponent.exposed.updateConfig('component', newConfig)
      return // 不更新内部配置，让定时同步来处理
    }
  }
  
  // 备用：如果找不到Card2Wrapper，更新内部配置
  console.log(`🔥 [alert-status] 备用：更新内部统一配置`)
  updateUnifiedConfig({ component: newConfig })
  
  // 🔥 发出更新事件
  emit('update:config', newConfig)
}

// 修改标题
const changeTitle = () => {
  const newTitle = config.value.title === '告警状态' ? '新的标题' : '告警状态'
  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

// 修改金额
const changeAmount = () => {
  const newAmount = config.value.amount === 0 ? Math.floor(Math.random() * 10000) : 0
  updateConfig({ amount: newAmount })
  message.success(`金额已更改为: ${newAmount}`)
}

// 修改简介
const changeDescription = () => {
  const descriptions = ['系统运行正常', '数据更新中', '监控中...', '状态良好']
  const currentIndex = descriptions.indexOf(config.value.description)
  const newDescription = descriptions[(currentIndex + 1) % descriptions.length]
  updateConfig({ description: newDescription })
  message.success(`简介已更改为: ${newDescription}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 50000),
    description: `随机描述 ${new Date().toLocaleTimeString()}`
  }
  
  updateConfig(newConfig)
  message.success('所有配置已随机更新')
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = {
    title: '告警状态',
    amount: 0,
    description: '系统运行正常'
  }
  
  updateConfig(defaultConfig)
  message.info('已重置为默认值')
}

// 测试数据源
const testDataSource = () => {
  console.log('🔍 数据源测试信息:')
  console.log('1. 组件ID:', props.componentId)
  console.log('2. 原始数据源数据:', props.data)
  console.log('3. 当前配置:', config.value)
  console.log('4. 计算后的显示数据:', displayData.value)
  console.log('5. 统一配置:', unifiedConfig.value)
  
  message.info('数据源测试信息已输出到控制台，请按F12查看')
}

// 🔥 导出统一配置管理功能，供外部访问
const expose = {
  getFullConfiguration,
  updateUnifiedConfig
}

defineExpose(expose)
</script>

<style scoped>
/* 主容器样式 */
.alert-status {
  height: 100%;
  padding: 16px;
}

/* 内容区域 */
.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* 字段组样式 */
.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.field-label {
  font-size: 12px;
  color: var(--text-color-2);
  min-width: 40px;
  font-weight: 500;
}

.field-value {
  flex: 1;
  font-size: 13px;
  color: var(--text-color-1);
  padding: 4px 8px;
  background: var(--input-color);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  min-height: 20px;
  word-break: break-all;
}

/* 调试信息区域 */
.debug-info {
  margin: 16px 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  font-size: 11px;
}

.debug-section {
  margin-bottom: 8px;
}

.debug-label {
  display: block;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.debug-value {
  background: var(--input-color);
  padding: 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  line-height: 1.4;
  max-height: 100px;
  overflow-y: auto;
  color: var(--text-color-1);
  white-space: pre-wrap;
}

/* 操作按钮区域 */
.actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.actions .n-button {
  flex: 1;
  min-width: 80px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .alert-status {
    padding: 12px;
  }
  
  .field-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .field-label {
    min-width: auto;
  }
  
  .field-value {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>