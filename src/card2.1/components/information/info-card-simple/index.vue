<template>
  <n-card 
    class="info-card-simple" 
    :style="cardStyle"
    embedded
  >
    <div class="info-content">
      <div v-if="unifiedConfig.component?.showIcon || config.showIcon" class="info-icon">
        <n-icon 
          :size="unifiedConfig.component?.iconSize || config.iconSize" 
          :color="unifiedConfig.component?.iconColor || config.iconColor"
        >
          <Information />
        </n-icon>
      </div>
      
      <div class="info-text">
        <div v-if="unifiedConfig.component?.showTitle || config.showTitle" class="info-title">
          {{ displayData.title || unifiedConfig.component?.title || config.title }}
        </div>
        
        <div class="info-value" :style="valueStyle">
          {{ displayData.value || unifiedConfig.component?.defaultValue || config.defaultValue }}
        </div>
        
        <div v-if="unifiedConfig.component?.showSubtext || config.showSubtext" class="info-subtext">
          {{ displayData.subtext || unifiedConfig.component?.subtext || config.subtext }}
        </div>
      </div>
    </div>
    
    <div v-if="(unifiedConfig.component?.showUpdateTime || config.showUpdateTime) && displayData.timestamp" class="update-time">
      {{ formatTime(displayData.timestamp) }}
    </div>
    
    <!-- 🔥 调试信息面板 -->
    <div v-if="isDevelopment" class="debug-info">
      <n-divider>🔍 调试信息 (info-card-simple)</n-divider>
      <div class="debug-section">
        <span class="debug-label">统一配置值:</span>
        <pre class="debug-value">{{ JSON.stringify({
          title: unifiedConfig.component?.title,
          defaultValue: unifiedConfig.component?.defaultValue,
          subtext: unifiedConfig.component?.subtext
        }, null, 2) }}</pre>
      </div>
      <div class="debug-section">
        <span class="debug-label">数据源值:</span>
        <pre class="debug-value">{{ JSON.stringify(props.data, null, 2) }}</pre>
      </div>
      <div class="debug-section">
        <span class="debug-label">最终显示值:</span>
        <pre class="debug-value">{{ JSON.stringify({
          title: displayData.title,
          value: displayData.value,
          subtext: displayData.subtext
        }, null, 2) }}</pre>
      </div>

      <!-- 测试按钮 -->
      <div class="actions">
        <n-button size="small" @click="changeTitle">修改标题</n-button>
        <n-button size="small" @click="changeDefaultValue">修改数值</n-button>
        <n-button size="small" @click="changeSubtext">修改副文本</n-button>
        <n-button type="primary" size="small" @click="randomUpdate">随机更新</n-button>
        <n-button size="small" @click="resetToDefault">重置默认</n-button>
        <n-button type="warning" size="small" @click="testDataSource">测试数据源</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 简单信息卡片组件
 * 用于显示基本信息和状态数据
 */

import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NIcon, useMessage } from 'naive-ui'
import { Information } from '@vicons/ionicons5'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { InfoCardSimpleConfig } from './settingConfig'

// 组件属性接口 - 支持统一配置架构
interface Props {
  config: InfoCardSimpleConfig  // 接收扁平的配置对象
  data?: Record<string, unknown>
  componentId?: string  // 🔥 新增：组件ID用于配置管理
}

// 组件事件 - 用于通知配置变更
interface Emits {
  (e: 'update:config', config: InfoCardSimpleConfig): void
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
      console.log(`🔥 [info-card-simple] 从Card2Wrapper获取初始配置:`, fullConfig)
      return fullConfig
    }
  } catch (error) {
    console.warn(`🔥 [info-card-simple] 获取初始配置失败:`, error)
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
    console.log(`🔥 [info-card-simple] 统一配置变化 ${props.componentId}:`, {
      component: newUnifiedConfig?.component,
      title: newUnifiedConfig?.component?.title,
      value: newUnifiedConfig?.component?.defaultValue,
      subtext: newUnifiedConfig?.component?.subtext
    })
  },
  { deep: true, immediate: true }
)

// 🔥 监听外部配置更新事件
const handleExternalConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.componentId && layer === 'component') {
    console.log(`🔥 [info-card-simple] 接收到外部配置更新事件:`, config)
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
          console.log(`🔥 [info-card-simple] 定时同步Card2Wrapper配置:`, fullConfig.component)
          updateUnifiedConfig({ component: fullConfig.component })
        }
      }
    }
  } catch (error) {
    console.warn(`🔥 [info-card-simple] 同步Card2Wrapper配置失败:`, error)
  }
}

let syncTimer: number | null = null

// 监听配置更新事件
onMounted(() => {
  window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  console.log(`🔥 [info-card-simple] 开始监听外部配置更新 ${props.componentId}`)
  
  // 启动定时同步（每100ms检查一次）
  syncTimer = setInterval(syncFromCard2Wrapper, 100)
  console.log(`🔥 [info-card-simple] 启动定时同步机制`)
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
const updateConfig = (partialCustomize: Partial<InfoCardSimpleConfig>) => {
  const newConfig: InfoCardSimpleConfig = {
    ...unifiedConfig.value.component,  // 🔥 基于当前统一配置
    ...partialCustomize
  }
  
  console.log(`🔥 [info-card-simple] 组件内部更新配置:`, newConfig)
  
  // 🔥 关键：直接更新Card2Wrapper的统一配置，而不是内部的
  if (props.componentId) {
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
      console.log(`🔥 [info-card-simple] 通过Card2Wrapper更新配置`)
      ;(cardElement as any).__vueParentComponent.exposed.updateConfig('component', newConfig)
      return // 不更新内部配置，让定时同步来处理
    }
  }
  
  // 备用：如果找不到Card2Wrapper，更新内部配置
  console.log(`🔥 [info-card-simple] 备用：更新内部统一配置`)
  updateUnifiedConfig({ component: newConfig })
  
  // 🔥 发出更新事件
  emit('update:config', newConfig)
}

// 计算卡片样式 - 🔥 使用统一配置
const cardStyle = computed(() => ({
  backgroundColor: unifiedConfig.value.component?.backgroundColor || config.value.backgroundColor,
  border: `1px solid ${unifiedConfig.value.component?.borderColor || config.value.borderColor}`,
  borderRadius: `${unifiedConfig.value.component?.borderRadius || config.value.borderRadius}px`,
  minHeight: '120px'
}))

// 计算数值样式 - 🔥 使用统一配置
const valueStyle = computed(() => ({
  fontSize: `${unifiedConfig.value.component?.valueSize || config.value.valueSize}px`,
  fontWeight: (unifiedConfig.value.component?.valueBold || config.value.valueBold) ? 'bold' : 'normal',
  color: unifiedConfig.value.component?.valueColor || config.value.valueColor
}))

// 格式化时间显示
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 测试按钮 - 修改标题
const changeTitle = () => {
  const newTitle = (unifiedConfig.value.component?.title || config.value.title) === '信息卡片' ? '新的标题' : '信息卡片'
  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

// 测试按钮 - 修改默认值
const changeDefaultValue = () => {
  const currentValue = unifiedConfig.value.component?.defaultValue || config.value.defaultValue
  const newValue = currentValue === '暂无数据' ? '测试数据' : '暂无数据'
  updateConfig({ defaultValue: newValue })
  message.success(`默认值已更改为: ${newValue}`)
}

// 测试按钮 - 修改副文本
const changeSubtext = () => {
  const subtexts = ['副标题信息', '更新时间', '监控中...', '状态正常']
  const currentSubtext = unifiedConfig.value.component?.subtext || config.value.subtext
  const currentIndex = subtexts.indexOf(currentSubtext)
  const newSubtext = subtexts[(currentIndex + 1) % subtexts.length]
  updateConfig({ subtext: newSubtext })
  message.success(`副文本已更改为: ${newSubtext}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    defaultValue: `随机值 ${Math.floor(Math.random() * 1000)}`,
    subtext: `随机副文本 ${new Date().toLocaleTimeString()}`
  }
  
  updateConfig(newConfig)
  message.success('所有配置已随机更新')
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = {
    title: '信息卡片',
    defaultValue: '暂无数据',
    subtext: '副标题信息'
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

// 开发环境判断
const isDevelopment = computed(() => import.meta.env.DEV)

// 🔥 导出统一配置管理功能，供外部访问
const expose = {
  getFullConfiguration,
  updateUnifiedConfig
}

defineExpose(expose)
</script>

<style scoped>
.info-card-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.info-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 8px;
}

.info-icon {
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  min-width: 0;
}

.info-title {
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color-1);
  margin-bottom: 4px;
  word-break: break-all;
}

.info-subtext {
  font-size: 12px;
  color: var(--text-color-3);
}

.update-time {
  font-size: 10px;
  color: var(--text-color-3);
  text-align: right;
  padding: 4px 8px;
  border-top: 1px solid var(--divider-color);
}

/* 🔥 调试信息样式 */
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
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.actions .n-button {
  flex: 1;
  min-width: 80px;
}
</style>