<template>
  <n-card 
    class="switch-controller" 
    :style="cardStyle"
    embedded
  >
    <div class="control-header">
      <div class="control-title">
        {{ displayData.title || unifiedConfig.component?.title || config.title }}
      </div>
      <div v-if="unifiedConfig.component?.showStatus || config.showStatus" class="control-status" :class="{ active: switchValue }">
        {{ switchValue ? (unifiedConfig.component?.onText || config.onText) : (unifiedConfig.component?.offText || config.offText) }}
      </div>
    </div>
    
    <div class="control-body">
      <n-switch
        v-model:value="switchValue"
        :size="unifiedConfig.component?.switchSize || config.switchSize"
        :disabled="unifiedConfig.component?.disabled || config.disabled"
        :loading="isUpdating"
        @update:value="handleSwitchChange"
      />
      
      <div v-if="unifiedConfig.component?.showDescription || config.showDescription" class="control-description">
        {{ displayData.description || unifiedConfig.component?.description || config.description }}
      </div>
    </div>
    
    <div v-if="(unifiedConfig.component?.showLastUpdate || config.showLastUpdate) && displayData.timestamp" class="last-update">
      上次操作：{{ formatTime(displayData.timestamp) }}
    </div>
    
    <!-- 🔥 调试信息面板 -->
    <div v-if="isDevelopment" class="debug-info">
      <n-divider>🔍 调试信息 (switch-controller)</n-divider>
      <div class="debug-section">
        <span class="debug-label">统一配置值:</span>
        <pre class="debug-value">{{ JSON.stringify({
          title: unifiedConfig.component?.title,
          disabled: unifiedConfig.component?.disabled,
          showStatus: unifiedConfig.component?.showStatus,
          showDescription: unifiedConfig.component?.showDescription
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
          description: displayData.description,
          switchValue: switchValue,
          isUpdating: isUpdating
        }, null, 2) }}</pre>
      </div>

      <!-- 测试按钮 -->
      <div class="actions">
        <n-button size="small" @click="changeTitle">修改标题</n-button>
        <n-button size="small" @click="toggleDisabled">切换禁用</n-button>
        <n-button size="small" @click="toggleShowStatus">切换状态显示</n-button>
        <n-button size="small" @click="toggleShowDescription">切换描述显示</n-button>
        <n-button type="primary" size="small" @click="randomUpdate">随机更新</n-button>
        <n-button size="small" @click="resetToDefault">重置默认</n-button>
        <n-button type="warning" size="small" @click="testDataSource">测试数据源</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 开关控制器组件
 * 用于控制设备的开关状态
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NCard, NSwitch, NButton, NDivider, useMessage } from 'naive-ui'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { SwitchControllerConfig } from './settingConfig'

// 组件属性接口 - 支持统一配置架构
interface Props {
  config: SwitchControllerConfig  // 接收扁平的配置对象
  data?: Record<string, unknown>
  componentId?: string  // 🔥 新增：组件ID用于配置管理
}

// 组件事件
interface Emits {
  (e: 'control', payload: { action: 'toggle', value: boolean }): void
  (e: 'dataChange', data: Record<string, unknown>): void
  (e: 'update:config', config: SwitchControllerConfig): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void  // 🔥 新增：统一配置变更事件
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()
const message = useMessage()

// 🔥 获取初始统一配置 - 从Card2Wrapper的统一配置架构获取
function getInitialUnifiedConfig(): UnifiedCard2Configuration | undefined {
  if (!props.componentId) return undefined
  
  try {
    // 通过DOM查找Card2Wrapper实例获取完整配置
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      console.log(`🔥 [switch-controller] 从Card2Wrapper获取初始配置:`, fullConfig)
      return fullConfig
    }
  } catch (error) {
    console.warn(`🔥 [switch-controller] 获取初始配置失败:`, error)
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

// 🔥 调试信息 - 监控配置变化
watch(
  () => unifiedConfig.value,
  (newUnifiedConfig) => {
    console.log(`🔥 [switch-controller] 统一配置变化 ${props.componentId}:`, {
      component: newUnifiedConfig?.component,
      title: newUnifiedConfig?.component?.title,
      disabled: newUnifiedConfig?.component?.disabled,
      showStatus: newUnifiedConfig?.component?.showStatus
    })
  },
  { deep: true, immediate: true }
)

// 🔥 修复递归更新：优化外部配置更新事件处理，避免重复更新
const handleExternalConfigUpdate = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.componentId && layer === 'component') {
    console.log(`🔥 [switch-controller] 接收到外部配置更新事件:`, config)
    
    // 🔥 修复：检查配置是否真的发生了变化，避免重复更新
    const currentComponent = unifiedConfig.value.component
    if (JSON.stringify(currentComponent) !== JSON.stringify(config)) {
      console.log(`🔥 [switch-controller] 配置确实发生变化，应用更新`)
      updateUnifiedConfig({ component: config })
    } else {
      console.log(`🔥 [switch-controller] 配置无变化，跳过更新`)
    }
  }
}

// 🔥 修复递归更新：移除危险的定时同步机制，避免配置循环更新
// 原来的定时同步会每100ms检查配置变化并触发更新，导致无限循环
// 现在只依赖事件驱动的配置同步

// 监听配置更新事件
onMounted(() => {
  window.addEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  console.log(`🔥 [switch-controller] 开始监听外部配置更新 ${props.componentId}`)
  
  // 🔥 修复：移除定时同步机制，避免循环更新
  // 配置同步现在完全依赖事件驱动，不再主动轮询
  console.log(`🔥 [switch-controller] 配置同步改为纯事件驱动模式`)
})

onUnmounted(() => {
  window.removeEventListener('card2-config-update', handleExternalConfigUpdate as EventListener)
  console.log(`🔥 [switch-controller] 停止监听配置更新 ${props.componentId}`)
})

// 🔥 修复递归更新：本地更新配置函数，避免通过Card2Wrapper触发循环
const updateConfig = (partialCustomize: Partial<SwitchControllerConfig>) => {
  const newConfig: SwitchControllerConfig = {
    ...unifiedConfig.value.component,  // 🔥 基于当前统一配置
    ...partialCustomize
  }
  
  console.log(`🔥 [switch-controller] 组件内部更新配置:`, newConfig)
  
  // 🔥 修复：直接更新内部配置，不再通过Card2Wrapper触发外部更新
  // 这样避免了: 内部更新 → Card2Wrapper → 事件 → 回到内部更新 的循环
  updateUnifiedConfig({ component: newConfig })
  
  // 🔥 发出更新事件
  emit('update:config', newConfig)
  
  // 🔥 如果需要同步到外部，使用事件机制而不是直接调用
  // 这样可以让外部系统决定是否需要处理这个更新
  if (props.componentId) {
    window.dispatchEvent(new CustomEvent('component-config-update', {
      detail: { componentId: props.componentId, config: newConfig, source: 'internal' }
    }))
  }
}

// 开关状态
const switchValue = ref(false)
const isUpdating = ref(false)

// 监听数据变化更新开关状态
watch(() => displayData.value.value, (newValue) => {
  if (typeof newValue === 'boolean') {
    switchValue.value = newValue
  }
}, { immediate: true })

// 处理开关变化
const handleSwitchChange = async (value: boolean) => {
  if ((unifiedConfig.value.component?.disabled || config.value.disabled)) return
  
  isUpdating.value = true
  
  try {
    // 发送控制事件
    emit('control', {
      action: 'toggle',
      value
    })
    
    // 更新数据
    emit('dataChange', {
      value,
      timestamp: Date.now()
    })
    
    if ((unifiedConfig.value.component?.showNotification || config.value.showNotification)) {
      message.success(`设备已${value ? '开启' : '关闭'}`)
    }
  } catch (error) {
    message.error('操作失败，请重试')
    switchValue.value = !value // 回滚状态
  } finally {
    isUpdating.value = false
  }
}

// 计算卡片样式 - 🔥 使用统一配置
const cardStyle = computed(() => ({
  backgroundColor: unifiedConfig.value.component?.backgroundColor || config.value.backgroundColor,
  border: `1px solid ${unifiedConfig.value.component?.borderColor || config.value.borderColor}`,
  borderRadius: `${unifiedConfig.value.component?.borderRadius || config.value.borderRadius}px`,
  minHeight: '140px'
}))

// 格式化时间显示
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 测试按钮 - 修改标题
const changeTitle = () => {
  const newTitle = (unifiedConfig.value.component?.title || config.value.title) === '开关控制器' ? '新的标题' : '开关控制器'
  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

// 测试按钮 - 切换禁用状态
const toggleDisabled = () => {
  const newDisabled = !(unifiedConfig.value.component?.disabled || config.value.disabled)
  updateConfig({ disabled: newDisabled })
  message.success(`控制器已${newDisabled ? '禁用' : '启用'}`)
}

// 测试按钮 - 切换状态显示
const toggleShowStatus = () => {
  const newShowStatus = !(unifiedConfig.value.component?.showStatus || config.value.showStatus)
  updateConfig({ showStatus: newShowStatus })
  message.success(`状态显示已${newShowStatus ? '开启' : '关闭'}`)
}

// 测试按钮 - 切换描述显示
const toggleShowDescription = () => {
  const newShowDescription = !(unifiedConfig.value.component?.showDescription || config.value.showDescription)
  updateConfig({ showDescription: newShowDescription })
  message.success(`描述显示已${newShowDescription ? '开启' : '关闭'}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    disabled: Math.random() > 0.5,
    showStatus: Math.random() > 0.5,
    showDescription: Math.random() > 0.5,
    description: `随机描述 ${new Date().toLocaleTimeString()}`
  }
  
  updateConfig(newConfig)
  message.success('所有配置已随机更新')
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = {
    title: '开关控制器',
    disabled: false,
    showStatus: true,
    showDescription: true,
    description: '控制设备开关状态'
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
  console.log('6. 开关状态:', switchValue.value)
  
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
.switch-controller {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.control-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color-1);
}

.control-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--error-color-suppl);
  color: var(--error-color);
  transition: all 0.3s ease;
}

.control-status.active {
  background-color: var(--success-color-suppl);
  color: var(--success-color);
}

.control-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.control-description {
  font-size: 12px;
  color: var(--text-color-3);
  text-align: center;
  max-width: 200px;
}

.last-update {
  font-size: 10px;
  color: var(--text-color-3);
  text-align: center;
  padding-top: 8px;
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