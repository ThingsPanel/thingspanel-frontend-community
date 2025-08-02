<script setup lang="ts">
/**
 * Card 2.0 数据发送组件
 * 基于原有 chart-dispatch 组件迁移而来，采用新的架构设计
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { NButton, NIcon, NText, NSpin, useMessage, useDialog } from 'naive-ui'
import * as ionicons5 from '@vicons/ionicons5'
import type { DispatchDataConfig } from './index'
import { attributeDataPub, commandDataPub, telemetryDataPub } from '@/service/api/device'

// 组件属性定义
interface Props {
  /** 组件配置 */
  config: DispatchDataConfig
  /** 数据源配置 */
  dataSource?: any
  /** 卡片实例 */
  card?: any
  /** 外部数据 */
  data?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as DispatchDataConfig),
  dataSource: undefined,
  card: undefined,
  data: undefined
})

// 响应式数据
const loading = ref(false)
const error = ref<string | null>(null)
const retryCount = ref(0)
const deviceInfo = ref<any>({})
const cardRef = ref<HTMLElement | null>(null)
const fontSize = ref('14px')
const iconSize = ref('24px')

// 消息和对话框实例
const message = useMessage()
const dialog = useDialog()

// ResizeObserver 实例
let resizeObserver: ResizeObserver | null = null

// 计算属性
const containerStyle = computed(() => {
  const style = props.config.style?.container
  if (!style) return {}
  
  return {
    backgroundColor: style.backgroundColor || 'transparent',
    border: style.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}` : 'none',
    borderRadius: `${style.border?.radius || 4}px`,
    padding: `${style.padding?.top || 16}px ${style.padding?.right || 16}px ${style.padding?.bottom || 16}px ${style.padding?.left || 16}px`,
    flexDirection: style.direction || 'column',
    alignItems: style.align === 'start' ? 'flex-start' : style.align === 'end' ? 'flex-end' : 'center',
    justifyContent: 'center',
    gap: `${style.gap || 12}px`,
    fontSize: fontSize.value
  }
})

const buttonStyle = computed(() => {
  const style = props.config.style?.button
  if (!style) return {}
  
  const boxShadow = style.shadow?.show 
    ? `${style.shadow.offsetX || 0}px ${style.shadow.offsetY || 2}px ${style.shadow.blur || 4}px ${style.shadow.color || 'rgba(0, 0, 0, 0.1)'}`
    : 'none'
  
  return {
    backgroundColor: style.backgroundColor || '#ff4d4f',
    color: style.color || '#ffffff',
    border: style.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}` : 'none',
    borderRadius: `${style.border?.radius || 8}px`,
    boxShadow,
    '--n-color-hover': style.hoverBackgroundColor || '#ff7875',
    '--n-color-pressed': style.hoverBackgroundColor || '#ff7875'
  }
})

const deviceNameStyle = computed(() => {
  const style = props.config.style?.deviceName
  if (!style) return {}
  
  return {
    fontSize: `${style.fontSize || 14}px`,
    color: style.color || '#666666',
    fontWeight: style.fontWeight || 'normal'
  }
})

const buttonTextStyle = computed(() => {
  const style = props.config.style?.buttonText
  if (!style) return {}
  
  return {
    fontSize: `${style.fontSize || 12}px`,
    color: style.color || '#666666',
    fontWeight: style.fontWeight || 'normal'
  }
})

const buttonIcon = computed(() => {
  const iconName = props.config.button?.icon || 'Play'
  return (ionicons5 as any)[iconName] || ionicons5.Play
})

const buttonText = computed(() => {
  return props.config.button?.text || '发送数据'
})

const deviceName = computed(() => {
  if (props.config.basic?.customDeviceName) {
    return props.config.basic.customDeviceName
  }
  return deviceInfo.value.deviceName || props.dataSource?.deviceSource?.[0]?.name || '设备1'
})

const deviceId = computed(() => {
  return deviceInfo.value.deviceId || props.dataSource?.deviceSource?.[0]?.deviceId
})

const buttonSize = computed(() => {
  return props.config.button?.size || 'medium'
})

const isDisabled = computed(() => {
  return props.config.button?.disabled || loading.value || !deviceId.value
})

const showDeviceName = computed(() => {
  return props.config.basic?.showDeviceName !== false
})

const showButtonText = computed(() => {
  return props.config.style?.buttonText?.position !== 'none'
})

const iconColor = computed(() => {
  return props.config.style?.button?.iconColor || '#ffffff'
})

// 辅助函数
/**
 * 格式化发送数据
 * @param value 原始值
 * @param format 格式类型
 * @returns 格式化后的值
 */
const formatSendValue = (value: string, format: string = 'string'): any => {
  switch (format) {
    case 'number':
      return Number(value)
    case 'boolean':
      return value === 'true' || value === '1'
    case 'json':
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    case 'string':
    default:
      return value
  }
}

/**
 * 防抖处理
 */
let debounceTimer: NodeJS.Timeout | null = null
const debounceAction = (action: () => void) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  const delay = props.config.interaction?.debounce?.enabled 
    ? (props.config.interaction?.debounce?.delay || 300)
    : 0
    
  if (delay > 0) {
    debounceTimer = setTimeout(action, delay)
  } else {
    action()
  }
}

/**
 * 发送数据
 */
const sendData = async () => {
  if (!deviceId.value) {
    const errorMsg = props.config.interaction?.feedback?.errorMessage || '设备配置不完整'
    message.error(errorMsg)
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const dataConfig = props.config.data
    const sendValue = formatSendValue(
      dataConfig?.value || '1',
      dataConfig?.format || 'string'
    )
    
    const payload = {
      device_id: deviceId.value,
      value: sendValue
    }
    
    // 如果指定了键名，使用键值对格式
    if (dataConfig?.key) {
      payload.value = {
        [dataConfig.key]: sendValue
      }
    }
    
    let response
    const dataType = dataConfig?.type || 'telemetry'
    
    switch (dataType) {
      case 'attributes':
        response = await attributeDataPub(payload)
        break
      case 'telemetry':
        response = await telemetryDataPub(payload)
        break
      case 'command':
        response = await commandDataPub(payload)
        break
      default:
        throw new Error('不支持的数据类型')
    }
    
    if (response?.code === 200) {
      const successMsg = props.config.interaction?.feedback?.successMessage || '数据发送成功'
      message.success(successMsg)
    } else {
      throw new Error(response?.message || '发送失败')
    }
    
    retryCount.value = 0
  } catch (err) {
    console.error('发送数据失败:', err)
    error.value = (err as Error).message
    
    // 重试逻辑
    const retryConfig = props.config.advanced?.retry
    if (retryConfig?.enabled && retryCount.value < (retryConfig.maxRetries || 3)) {
      retryCount.value++
      setTimeout(() => {
        sendData()
      }, retryConfig.retryDelay || 1000)
    } else {
      const errorMsg = props.config.interaction?.feedback?.errorMessage || '数据发送失败'
      message.error(`${errorMsg}: ${(err as Error).message}`)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 处理按钮点击
 */
const handleButtonClick = () => {
  // 如果启用了确认对话框
  if (props.config.interaction?.confirm?.enabled) {
    const title = props.config.interaction.confirm.title || '确认操作'
    const content = props.config.interaction.confirm.content || '确定要发送数据吗？'
    
    dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        debounceAction(sendData)
      }
    })
  } else {
    debounceAction(sendData)
  }
}

/**
 * 处理容器尺寸变化
 */
const handleResize = (entries: ResizeObserverEntry[]) => {
  if (!props.config.advanced?.responsive?.enabled) return
  
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const minDimension = Math.min(width, height)
    const minSize = props.config.advanced?.responsive?.minSize || 24
    const maxSize = props.config.advanced?.responsive?.maxSize || 64
    
    // 根据容器尺寸动态调整字体和图标大小
    const scaleFactor = Math.max(0.5, Math.min(2, minDimension / 100))
    fontSize.value = `${Math.max(minSize * 0.5, Math.min(maxSize * 0.5, 14 * scaleFactor))}px`
    iconSize.value = `${Math.max(minSize, Math.min(maxSize, 24 * scaleFactor))}px`
  }
}

/**
 * 更新设备信息
 * @param newData 新数据
 */
const updateDeviceInfo = (newData: any) => {
  if (newData && typeof newData === 'object') {
    deviceInfo.value = { ...deviceInfo.value, ...newData }
  }
}

/**
 * 刷新数据
 */
const refreshData = () => {
  // 数据发送组件通常不需要刷新数据
  if (props.dataSource) {
    updateDeviceInfo({
      deviceId: props.dataSource.deviceSource?.[0]?.deviceId,
      deviceName: props.dataSource.deviceSource?.[0]?.name
    })
  }
}

// 监听器
watch(
  () => props.dataSource,
  () => {
    if (props.dataSource) {
      updateDeviceInfo({
        deviceId: props.dataSource.deviceSource?.[0]?.deviceId,
        deviceName: props.dataSource.deviceSource?.[0]?.name
      })
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      updateDeviceInfo(newData)
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  if (cardRef.value && props.config.advanced?.responsive?.enabled) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
  
  // 初始化设备信息
  refreshData()
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// 暴露方法供外部调用
defineExpose({
  sendData,
  refreshData,
  updateDeviceInfo,
  getDeviceInfo: () => deviceInfo.value
})
</script>

<template>
  <div 
    ref="cardRef" 
    class="dispatch-data-container" 
    :style="containerStyle"
  >
    <!-- 设备名称（上方） -->
    <NText 
      v-if="showDeviceName && config.style?.deviceName?.position === 'top'"
      :style="deviceNameStyle"
      class="device-name"
    >
      {{ deviceName }}
    </NText>
    
    <!-- 按钮文本（上方） -->
    <NText 
      v-if="showButtonText && config.style?.buttonText?.position === 'top'"
      :style="buttonTextStyle"
      class="button-text"
    >
      {{ buttonText }}
    </NText>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 按钮文本（左侧） -->
      <NText 
        v-if="showButtonText && config.style?.buttonText?.position === 'left'"
        :style="buttonTextStyle"
        class="button-text"
      >
        {{ buttonText }}
      </NText>
      
      <!-- 发送按钮 -->
      <NButton
        :size="buttonSize"
        :disabled="isDisabled"
        :loading="loading"
        :style="buttonStyle"
        class="send-button"
        @click="handleButtonClick"
      >
        <template #icon>
          <NIcon :size="iconSize" :color="iconColor">
            <component :is="buttonIcon" />
          </NIcon>
        </template>
        <span v-if="config.button?.shape !== 'circle'" class="button-label">
          {{ buttonText }}
        </span>
      </NButton>
      
      <!-- 按钮文本（右侧） -->
      <NText 
        v-if="showButtonText && config.style?.buttonText?.position === 'right'"
        :style="buttonTextStyle"
        class="button-text"
      >
        {{ buttonText }}
      </NText>
    </div>
    
    <!-- 按钮文本（下方） -->
    <NText 
      v-if="showButtonText && (config.style?.buttonText?.position === 'bottom' || !config.style?.buttonText?.position)"
      :style="buttonTextStyle"
      class="button-text"
    >
      {{ buttonText }}
    </NText>
    
    <!-- 设备名称（下方） -->
    <NText 
      v-if="showDeviceName && (config.style?.deviceName?.position === 'bottom' || !config.style?.deviceName?.position)"
      :style="deviceNameStyle"
      class="device-name"
    >
      {{ deviceName }}
    </NText>
    
    <!-- 错误提示 -->
    <NText 
      v-if="error && !loading"
      type="error"
      class="error-text"
    >
      {{ error }}
    </NText>
  </div>
</template>

<style scoped>
.dispatch-data-container {
  width: 100%;
  height: 100%;
  min-height: 80px;
  display: flex;
  transition: all 0.3s ease;
}

.main-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.send-button {
  transition: all 0.3s ease;
  min-width: 60px;
  min-height: 40px;
}

.send-button:hover {
  transform: translateY(-1px);
}

.send-button:active {
  transform: translateY(0);
}

.button-label {
  margin-left: 8px;
}

.device-name {
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.button-text {
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-text {
  font-size: 12px;
  margin-top: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dispatch-data-container {
    min-height: 60px;
  }
  
  .send-button {
    min-width: 50px;
    min-height: 35px;
  }
  
  .device-name,
  .button-text {
    font-size: 12px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .dispatch-data-container {
    color: #ffffff;
  }
}

/* 动画效果 */
.dispatch-data-container * {
  transition: all 0.3s ease;
}

/* 加载状态样式 */
.send-button:loading {
  pointer-events: none;
}
</style>