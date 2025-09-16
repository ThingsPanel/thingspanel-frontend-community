<template>
  <n-card class="counter-stats" :style="cardStyle" embedded>
    <div class="stats-content">
      <div class="stats-icon">
        <n-icon 
          :size="unifiedConfig.component?.iconSize || config.iconSize" 
          :color="unifiedConfig.component?.iconColor || config.iconColor"
        >
          <TrendingUp v-if="trend === 'up'" />
          <TrendingDown v-else-if="trend === 'down'" />
          <Remove v-else />
        </n-icon>
      </div>
      
      <div class="stats-data">
        <div class="stats-value" :style="valueStyle">
          {{ formatValue(displayData.value || unifiedConfig.component?.defaultValue || config.defaultValue) }}
        </div>
        
        <div class="stats-title">
          {{ displayData.title || unifiedConfig.component?.title || config.title }}
        </div>
        
        <div v-if="unifiedConfig.component?.showChange || config.showChange" class="stats-change" :class="{ positive: changeValue > 0, negative: changeValue < 0 }">
          {{ changeValue > 0 ? '+' : '' }}{{ changeValue }}%
        </div>
      </div>
    </div>
    
    <!-- 🔥 调试信息面板 -->
    <div v-if="isDevelopment" class="debug-info">
      <n-divider>🔍 调试信息 (counter-stats)</n-divider>
      <div class="debug-section">
        <span class="debug-label">统一配置值:</span>
        <pre class="debug-value">{{ JSON.stringify({
          title: unifiedConfig.component?.title,
          defaultValue: unifiedConfig.component?.defaultValue,
          showChange: unifiedConfig.component?.showChange
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
          change: changeValue
        }, null, 2) }}</pre>
      </div>

      <!-- 测试按钮 -->
      <div class="actions">
        <n-button size="small" @click="changeTitle">修改标题</n-button>
        <n-button size="small" @click="changeDefaultValue">修改数值</n-button>
        <n-button size="small" @click="toggleShowChange">切换变化显示</n-button>
        <n-button type="primary" size="small" @click="randomUpdate">随机更新</n-button>
        <n-button size="small" @click="resetToDefault">重置默认</n-button>
        <n-button type="warning" size="small" @click="testDataSource">测试数据源</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NIcon, NButton, NDivider, useMessage } from 'naive-ui'
import { TrendingUp, TrendingDown, Remove } from '@vicons/ionicons5'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { CounterStatsConfig } from './settingConfig'

// 组件属性接口 - 支持统一配置架构
interface Props {
  config: CounterStatsConfig  // 接收扁平的配置对象
  data?: Record<string, unknown>
  componentId?: string  // 🔥 新增：组件ID用于配置管理
}

// 组件事件 - 用于通知配置变更
interface Emits {
  (e: 'update:config', config: CounterStatsConfig): void
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
      console.log(`🔥 [counter-stats] 从Card2Wrapper获取初始配置:`, fullConfig)
      return fullConfig
    }
  } catch (error) {
    console.warn(`🔥 [counter-stats] 获取初始配置失败:`, error)
  }
  return undefined
}

// 🔥 使用增强的 Card 2.1 数据绑定，支持统一配置管理
const {
  config,
  displayData,
  unifiedConfig,
  updateUnifiedConfig,
  getFullConfiguration,
  // 🔥 新增：属性暴露功能
  exposeProperty,
  exposeProperties,
  exposePropertyWithWatch,
  getAllExposedProperties
} = useCard2Props({
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
    console.log(`🔥 [counter-stats] 统一配置变化 ${props.componentId}:`, {
      component: newUnifiedConfig?.component,
      title: newUnifiedConfig?.component?.title,
      defaultValue: newUnifiedConfig?.component?.defaultValue,
      showChange: newUnifiedConfig?.component?.showChange
    })
  },
  { deep: true, immediate: true }
)

// 🔥 新增：自动暴露组件属性 - 监听关键属性变化并暴露给交互系统
const exposeCurrentProperties = () => {
  const currentTitle = displayData.value.title || unifiedConfig.value.component?.title || config.value.title
  const currentValue = displayData.value.value || unifiedConfig.value.component?.defaultValue || config.value.defaultValue
  const currentChange = changeValue.value

  // 暴露属性值给交互系统
  exposeProperties({
    title: currentTitle,
    value: currentValue,
    change: currentChange
  })

  console.log(`🔥 [counter-stats] 暴露属性到交互系统 ${props.componentId}:`, {
    title: currentTitle,
    value: currentValue,
    change: currentChange
  })
}

// 🔥 监听显示数据变化，自动暴露属性
watch(
  () => displayData.value,
  () => {
    exposeCurrentProperties()
  },
  { deep: true, immediate: true }
)

// 🔥 监听change值变化，使用带监听器的暴露方式
watch(
  () => changeValue.value,
  (newChange, oldChange) => {
    exposePropertyWithWatch('change', newChange)
    console.log(`🔥 [counter-stats] 变化率属性变更 ${props.componentId}:`, { newChange, oldChange })
  },
  { immediate: true }
)

// 🔥 监听外部配置更新事件
const handleExternalConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.componentId && layer === 'component') {
    console.log(`🔥 [counter-stats] 接收到外部配置更新事件:`, config)
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
          console.log(`🔥 [counter-stats] 定时同步Card2Wrapper配置:`, fullConfig.component)
          updateUnifiedConfig({ component: fullConfig.component })
        }
      }
    }
  } catch (error) {
    console.warn(`🔥 [counter-stats] 同步Card2Wrapper配置失败:`, error)
  }
}

let syncTimer: number | null = null

// 监听配置更新事件
onMounted(() => {
  window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  console.log(`🔥 [counter-stats] 开始监听外部配置更新 ${props.componentId}`)
  
  // 启动定时同步（每100ms检查一次）
  syncTimer = setInterval(syncFromCard2Wrapper, 100)
  console.log(`🔥 [counter-stats] 启动定时同步机制`)
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
const updateConfig = (partialCustomize: Partial<CounterStatsConfig>) => {
  const newConfig: CounterStatsConfig = {
    ...unifiedConfig.value.component,  // 🔥 基于当前统一配置
    ...partialCustomize
  }
  
  console.log(`🔥 [counter-stats] 组件内部更新配置:`, newConfig)
  
  // 🔥 关键：直接更新Card2Wrapper的统一配置，而不是内部的
  if (props.componentId) {
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.updateConfig) {
      console.log(`🔥 [counter-stats] 通过Card2Wrapper更新配置`)
      ;(cardElement as any).__vueParentComponent.exposed.updateConfig('component', newConfig)
      return // 不更新内部配置，让定时同步来处理
    }
  }
  
  // 备用：如果找不到Card2Wrapper，更新内部配置
  console.log(`🔥 [counter-stats] 备用：更新内部统一配置`)
  updateUnifiedConfig({ component: newConfig })
  
  // 🔥 发出更新事件
  emit('update:config', newConfig)
}

const changeValue = computed(() => displayData.value.change || 0)
const trend = computed(() => {
  if (changeValue.value > 0) return 'up'
  if (changeValue.value < 0) return 'down'
  return 'flat'
})

// 计算卡片样式 - 🔥 使用统一配置
const cardStyle = computed(() => ({
  backgroundColor: unifiedConfig.value.component?.backgroundColor || config.value.backgroundColor,
  border: `1px solid ${unifiedConfig.value.component?.borderColor || config.value.borderColor}`,
  borderRadius: `${unifiedConfig.value.component?.borderRadius || config.value.borderRadius}px`
}))

// 计算数值样式 - 🔥 使用统一配置
const valueStyle = computed(() => ({
  fontSize: `${unifiedConfig.value.component?.valueSize || config.value.valueSize}px`,
  fontWeight: (unifiedConfig.value.component?.valueBold || config.value.valueBold) ? 'bold' : 'normal',
  color: unifiedConfig.value.component?.valueColor || config.value.valueColor
}))

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value || '0')
}

// 测试按钮 - 修改标题
const changeTitle = () => {
  const newTitle = (unifiedConfig.value.component?.title || config.value.title) === '统计数据' ? '新的标题' : '统计数据'
  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

// 测试按钮 - 修改默认值
const changeDefaultValue = () => {
  const currentValue = unifiedConfig.value.component?.defaultValue || config.value.defaultValue
  const newValue = typeof currentValue === 'number' ? currentValue + 100 : 100
  updateConfig({ defaultValue: newValue })
  message.success(`默认值已更改为: ${newValue}`)
}

// 测试按钮 - 切换变化显示
const toggleShowChange = () => {
  const newShowChange = !(unifiedConfig.value.component?.showChange || config.value.showChange)
  updateConfig({ showChange: newShowChange })
  message.success(`变化显示已${newShowChange ? '开启' : '关闭'}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    defaultValue: Math.floor(Math.random() * 10000),
    showChange: Math.random() > 0.5
  }
  
  updateConfig(newConfig)
  message.success('所有配置已随机更新')
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = {
    title: '统计数据',
    defaultValue: 0,
    showChange: true
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
.counter-stats {
  height: 100%;
  padding: 16px;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.stats-icon {
  flex-shrink: 0;
}

.stats-data {
  flex: 1;
  min-width: 0;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-color-1);
  margin-bottom: 4px;
}

.stats-title {
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 4px;
}

.stats-change {
  font-size: 12px;
  font-weight: 500;
}

.stats-change.positive {
  color: var(--success-color);
}

.stats-change.negative {
  color: var(--error-color);
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