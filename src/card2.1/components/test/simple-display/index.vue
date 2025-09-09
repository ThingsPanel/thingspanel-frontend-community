<script setup lang="ts">
/**
 * simple-display 主组件
 * 基于新的三文件结构标准
 */

import { computed, reactive, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SimpleDisplayConfig, SimpleDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  lastUpdate: string
}

// 组件props
interface Props {
  /** CustomConfig结构配置 */
  customConfig?: SimpleDisplayConfig
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  previewMode: false
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
  (e: 'config-change', config: SimpleDisplayConfig): void
}

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  lastUpdate: new Date().toISOString()
})

// 指标输入框的字符串值
const metricsInputValue = ref('')

/**
 * 获取当前设备ID - 直接从customConfig顶级字段读取
 */
const currentDeviceId = computed(() => {
  return props.customConfig?.deviceId || ''
})

/**
 * 获取当前指标列表 - 直接从customConfig顶级字段读取
 */
const currentMetricsList = computed(() => {
  if (props.customConfig?.metricsList && Array.isArray(props.customConfig.metricsList)) {
    return props.customConfig.metricsList.map(metric => 
      typeof metric === 'string' ? metric : (metric.name || metric.id || String(metric))
    )
  }
  return []
})

// 本地编辑状态
const localDeviceId = ref('')
const localMetricsList = ref<string[]>([])

/**
 * 获取组件配置
 */
const currentCustomize = computed((): SimpleDisplayCustomize => {
  return (
    props.customConfig?.customize || {
      title: '简单展示组件',
      content: '这是一个静态展示组件，不需要数据源',
      themeColor: '#2080f0',
      fontSize: 16,
      showIcon: true,
      iconName: '📊'
    }
  )
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

// 事件处理
const handleClick = () => {
  componentState.lastUpdate = new Date().toISOString()
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })
}

const handleMouseEnter = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'enter'
  })
}

const handleMouseLeave = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'leave'
  })
}

/**
 * 更新设备ID - 发送配置变更事件
 */
const updateDeviceId = (newDeviceId: string) => {
  localDeviceId.value = newDeviceId
  emitConfigChange()
}

/**
 * 更新指标列表 - 发送配置变更事件
 */
const updateMetricsList = (newMetricsList: string[]) => {
  localMetricsList.value = [...newMetricsList]
  emitConfigChange()
}

/**
 * 发送配置变更事件
 */
const emitConfigChange = () => {
  // 构建完整的新配置对象
  const newConfig: SimpleDisplayConfig = {
    ...props.customConfig,
    deviceId: localDeviceId.value,
    metricsList: localMetricsList.value
  }
  
  // 发送config-change事件
  emit('config-change', newConfig)
}

/**
 * 从输入框更新指标列表
 */
const updateMetricsFromInput = (value: string) => {
  metricsInputValue.value = value
  
  // 解析逗号分隔的指标
  const metrics = value
    .split(',')
    .map(m => m.trim())
    .filter(m => m.length > 0)
  
  updateMetricsList(metrics)
}

// 初始化本地状态
const initializeLocalState = () => {
  const currentMetrics = currentMetricsList.value
  localDeviceId.value = currentDeviceId.value
  localMetricsList.value = [...currentMetrics]
  metricsInputValue.value = currentMetrics.join(', ')
}

// 在组件挂载时初始化
onMounted(() => {
  initializeLocalState()
})

// 监听customConfig变化，同步到本地状态
watch(() => props.customConfig, (newConfig) => {
  if (newConfig) {
    const newDeviceId = newConfig.deviceId || ''
    const newMetrics = currentMetricsList.value
    
    // 只有当配置确实变化时才更新本地状态（避免循环）
    if (newDeviceId !== localDeviceId.value) {
      localDeviceId.value = newDeviceId
    }
    
    if (JSON.stringify(newMetrics) !== JSON.stringify(localMetricsList.value)) {
      localMetricsList.value = [...newMetrics]
      metricsInputValue.value = newMetrics.join(', ')
    }
  }
}, { deep: true })


// 暴露方法给父组件
defineExpose({
  componentState,
  currentCustomize
})
</script>

<template>
  <div
    class="simple-display"
    :style="{
      '--theme-color': currentCustomize.themeColor,
      '--font-size': currentCustomize.fontSize + 'px',
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 标题区域 -->
    <div class="display-header">
      <div v-if="currentCustomize.showIcon" class="display-icon">
        {{ currentCustomize.iconName }}
      </div>
      <h3 class="display-title">{{ currentCustomize.title }}</h3>
    </div>

    <!-- 内容区域 -->
    <div class="display-content">
      <p class="content-text">{{ currentCustomize.content }}</p>
    </div>

    <!-- 简单的设备配置输入 -->
    <div class="device-config-simple">
      <n-form-item label="设备ID:">
        <n-input
          v-model:value="localDeviceId"
          placeholder="请输入设备ID"
          size="small"
          clearable
          @update:value="updateDeviceId"
        />
      </n-form-item>
      
      <n-form-item label="指标:">
        <n-input
          v-model:value="metricsInputValue"
          placeholder="多个指标用逗号分隔"
          size="small"
          clearable
          @update:value="updateMetricsFromInput"
        />
      </n-form-item>
    </div>

    <!-- 状态指示器 -->
    <div class="status-indicator" :class="{ active: componentState.isActive }">
      <span class="status-dot"></span>
      <span class="status-text">{{ componentState.isActive ? '活跃' : '非活跃' }}</span>
    </div>
  </div>
</template>

<style scoped>
.simple-display {
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.simple-display:hover {
  border-color: var(--theme-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.display-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.display-icon {
  font-size: 24px;
  line-height: 1;
}

.display-title {
  margin: 0;
  color: var(--text-color);
  font-size: var(--font-size);
  font-weight: 600;
  flex: 1;
}

.display-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-text {
  margin: 0;
  color: var(--text-color-2);
  font-size: calc(var(--font-size) - 2px);
  line-height: 1.6;
  text-align: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-color-3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error-color);
  transition: background-color 0.3s ease;
}

.status-indicator.active .status-dot {
  background: var(--success-color);
}

.status-text {
  font-size: 12px;
}

/* 简单设备配置样式 */
.device-config-simple {
  margin: 16px 0;
  padding: 16px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.device-config-simple :deep(.n-form-item) {
  margin-bottom: 12px;
}

.device-config-simple :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.device-config-simple :deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color-2);
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simple-display {
    padding: 16px;
  }

  .display-header {
    gap: 8px;
  }

  .display-icon {
    font-size: 20px;
  }

  .device-config-simple {
    margin: 12px 0;
    padding: 12px;
  }
}
</style>
