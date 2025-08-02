<script setup lang="ts">
/**
 * Card 2.0 枚举控制组件
 * 提供多选项按钮控制功能，支持属性、遥测、命令数据发送
 */

import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { NButton, NText, NIcon, NSpace, NGrid, NGridItem, useMessage, useDialog } from 'naive-ui'
import * as ionicons5 from '@vicons/ionicons5'
import type { EnumControlConfig, ButtonOption } from './index'
import type { ComponentProps } from '../../types'
import { attributeDataPub, commandDataPub, telemetryDataPub } from '@/service/api/device'
import { createLogger } from '@/utils/logger'

const logger = createLogger('EnumControl')
const message = useMessage()
const dialog = useDialog()

// 组件属性
interface Props extends ComponentProps {
  config: EnumControlConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as EnumControlConfig)
})

// 响应式数据
const loading = ref(false)
const currentValue = ref<string | number>('')
const error = ref<string | null>(null)
const retryCount = ref(0)
const deviceInfo = ref<any>(null)
const containerRef = ref<HTMLElement>()
const buttonSize = ref(16)
const fontSize = ref(14)

// 计算属性
const containerStyle = computed(() => {
  const style = props.config.style?.container
  return {
    backgroundColor: style?.backgroundColor || 'transparent',
    border: style?.border?.show ? `${style.border.width}px solid ${style.border.color}` : 'none',
    borderRadius: `${style?.border?.radius || 4}px`,
    padding: `${style?.padding?.top || 16}px ${style?.padding?.right || 16}px ${style?.padding?.bottom || 16}px ${style?.padding?.left || 16}px`,
    alignItems: style?.align === 'start' ? 'flex-start' : style?.align === 'end' ? 'flex-end' : 'center',
    justifyContent: style?.verticalAlign === 'start' ? 'flex-start' : style?.verticalAlign === 'end' ? 'flex-end' : 'center'
  }
})

// 暂时注释掉未使用的计算属性
// const buttonStyle = computed(() => {
//   const style = props.config.style?.button
//   return {
//     fontSize: `${style?.font?.size || 14}px`,
//     fontWeight: style?.font?.weight || 'normal',
//     fontFamily: style?.font?.family || 'inherit'
//   }
// })

const deviceNameStyle = computed(() => {
  const style = props.config.style?.deviceName
  return {
    fontSize: `${style?.fontSize || 14}px`,
    color: style?.color || '#666666',
    fontWeight: style?.fontWeight || 'normal',
    margin: `${style?.margin || 8}px 0`
  }
})

const currentValueStyle = computed(() => {
  const style = props.config.style?.currentValue
  return {
    fontSize: `${style?.fontSize || 12}px`,
    color: style?.color || '#999999',
    fontWeight: style?.fontWeight || 'normal',
    margin: `${style?.margin || 8}px 0`
  }
})

const buttonOptions = computed(() => {
  return props.config.buttons?.options || []
})

const deviceName = computed(() => {
  if (props.config.basic?.customDeviceName) {
    return props.config.basic.customDeviceName
  }
  return deviceInfo.value?.name || (props as any).dataSource?.deviceSource?.[0]?.deviceName || '未知设备'
})

const deviceId = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.deviceId || ''
})

const metricsId = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.metricsId || props.config.data?.key || ''
})

const metricsType = computed(() => {
  return props.dataSource?.deviceSource?.[0]?.metricsType || props.config.data?.type || 'telemetry'
})

// const buttonSize = computed(() => {
//   return props.config.buttons?.size || 'medium'
// })

// const buttonShape = computed(() => {
//   return props.config.buttons?.shape || 'default'
// })

const isDisabled = computed(() => {
  return props.config.buttons?.disabled || false
})

const showDeviceName = computed(() => {
  return props.config.basic?.showDeviceName !== false
})

const showCurrentValue = computed(() => {
  return props.config.basic?.showCurrentValue !== false
})

// const currentValueLabel = computed(() => {
//   return props.config.basic?.currentValueLabel || '当前状态'
// })

const currentValueText = computed(() => {
  if (!showCurrentValue.value || currentValue.value === '') return ''
  
  const prefix = props.config.style?.currentValue?.prefix || ''
  const suffix = props.config.style?.currentValue?.suffix || ''
  
  // 查找对应的按钮标签
  const option = buttonOptions.value.find(opt => opt.value === currentValue.value)
  const displayValue = option ? option.label : currentValue.value
  
  return `${prefix}${displayValue}${suffix}`
})

const layoutDirection = computed(() => {
  return props.config.buttons?.direction || 'horizontal'
})

const buttonGap = computed(() => {
  return props.config.buttons?.gap || 8
})

const itemsPerRow = computed(() => {
  return props.config.buttons?.itemsPerRow || 4
})

// 辅助函数
/**
 * 格式化发送值
 */
const formatSendValue = (value: string | number): any => {
  const format = props.config.data?.format || 'string'
  
  switch (format) {
    case 'number':
      return Number(value)
    case 'boolean':
      return Boolean(value)
    case 'json':
      try {
        return JSON.parse(String(value))
      } catch {
        return value
      }
    default:
      return String(value)
  }
}

/**
 * 防抖处理
 */
let debounceTimer: NodeJS.Timeout | null = null
const debounceAction = (action: () => void) => {
  if (!props.config.interaction?.debounce?.enabled) {
    action()
    return
  }
  
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  debounceTimer = setTimeout(action, props.config.interaction.debounce.delay || 300)
}

/**
 * 发送数据
 */
const sendData = async (value: string | number) => {
  if (!deviceId.value || !metricsId.value) {
    const errorMsg = '设备ID或指标ID未配置'
    error.value = errorMsg
    message.error(errorMsg)
    return false
  }

  const maxRetries = props.config.advanced?.retry?.enabled ? props.config.advanced.retry.maxRetries || 3 : 1
  const retryDelay = props.config.advanced?.retry?.retryDelay || 1000

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      loading.value = true
      error.value = null

      const formattedValue = formatSendValue(value)
      const payload = {
        device_id: deviceId.value,
        value: JSON.stringify({
          [metricsId.value]: formattedValue
        })
      }

      // 根据数据类型发送
      switch (metricsType.value) {
        case 'attributes':
          await attributeDataPub(payload)
          break
        case 'telemetry':
          await telemetryDataPub(payload)
          break
        case 'command':
          await commandDataPub(payload)
          break
        default:
          throw new Error(`不支持的数据类型: ${metricsType.value}`)
      }

      // 成功后更新当前值
      currentValue.value = value
      retryCount.value = 0
      
      // 显示成功消息
      const successMsg = props.config.interaction?.feedback?.successMessage || '操作成功'
      message.success(successMsg)
      
      return true
    } catch (err: any) {
      logger.error('发送数据失败:', err)
      
      if (attempt === maxRetries - 1) {
        // 最后一次重试失败
        const errorMsg = props.config.interaction?.feedback?.errorMessage || '操作失败'
        error.value = err.message || errorMsg
        message.error(error.value)
        retryCount.value = attempt + 1
        return false
      } else {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        retryCount.value = attempt + 1
      }
    } finally {
      loading.value = false
    }
  }
  
  return false
}

/**
 * 处理按钮点击
 */
const handleButtonClick = async (option: ButtonOption) => {
  if (isDisabled.value || option.disabled || loading.value) {
    return
  }

  const action = async () => {
    // 如果启用确认对话框
    if (props.config.interaction?.confirm?.enabled) {
      const confirmed = await new Promise<boolean>((resolve) => {
        dialog.warning({
          title: props.config.interaction?.confirm?.title || '确认操作',
          content: props.config.interaction?.confirm?.content || '确定要执行此操作吗？',
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => resolve(true),
          onNegativeClick: () => resolve(false)
        })
      })
      
      if (!confirmed) return
    }

    await sendData(option.value)
  }

  debounceAction(action)
}

/**
 * 获取按钮样式
 */
const getButtonStyle = (option: ButtonOption, isActive: boolean) => {
  const style = props.config.style?.button
  const baseStyle = {
    backgroundColor: isActive 
      ? (style?.activeBackgroundColor || '#1890ff')
      : (option.color || style?.backgroundColor || '#f5f5f5'),
    color: isActive 
      ? (style?.activeColor || '#ffffff')
      : (style?.color || '#333333'),
    border: style?.border?.show 
      ? `${style.border.width}px solid ${isActive ? (style.border.activeColor || '#1890ff') : (style.border.color || '#d9d9d9')}`
      : 'none',
    borderRadius: `${style?.border?.radius || 4}px`,
    fontSize: `${style?.font?.size || 14}px`,
    fontWeight: style?.font?.weight || 'normal',
    fontFamily: style?.font?.family || 'inherit',
    transition: props.config.interaction?.animation?.enabled 
      ? `all ${props.config.interaction.animation.duration || 200}ms ${props.config.interaction.animation.easing || 'ease-in-out'}`
      : 'none'
  }

  if (style?.shadow?.show) {
    baseStyle.boxShadow = `${style.shadow.offsetX || 0}px ${style.shadow.offsetY || 2}px ${style.shadow.blur || 4}px ${style.shadow.color || 'rgba(0, 0, 0, 0.1)'}`
  }

  return baseStyle
}

/**
 * 获取按钮图标
 */
const getButtonIcon = (option: ButtonOption) => {
  if (!option.icon) return null
  return (ionicons5 as any)[option.icon] || null
}

/**
 * 容器尺寸变化处理
 */
const handleResize = () => {
  if (!containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  const minSize = props.config.advanced?.responsive?.enabled ? 16 : 14
  const maxSize = props.config.advanced?.responsive?.enabled ? 24 : 16
  
  // 根据容器大小调整字体
  const scale = Math.min(rect.width / 300, rect.height / 200)
  fontSize.value = Math.max(minSize, Math.min(maxSize, 14 * scale))
  buttonSize.value = Math.max(16, Math.min(20, 16 * scale))
}

/**
 * 更新设备信息
 */
const updateDeviceInfo = (info: any) => {
  deviceInfo.value = info
}

/**
 * 更新数据
 */
const updateData = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
  if (!metricsId || !data || typeof data !== 'object') {
    logger.warn('无效的数据更新:', { deviceId, metricsId, data })
    return
  }

  if (data[metricsId] !== undefined && data[metricsId] !== null && data[metricsId] !== '') {
    currentValue.value = data[metricsId]
    error.value = null
    logger.info('数据更新成功:', { metricsId, value: data[metricsId] })
  }
}

/**
 * 刷新数据
 */
const refreshData = async () => {
  // 这里可以添加主动刷新数据的逻辑
  logger.info('刷新数据')
}

// 生命周期
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // 初始化尺寸
  nextTick(() => {
    handleResize()
  })
  
  // 监听容器尺寸变化
  if (props.config.advanced?.responsive?.enabled && containerRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  // 清理定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  // 清理尺寸观察器
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 监听配置变化
watch(
  () => props.config,
  () => {
    nextTick(() => {
      handleResize()
    })
  },
  { deep: true }
)

// 监听数据源变化
watch(
  () => props.dataSource,
  () => {
    // 数据源变化时重置状态
    currentValue.value = ''
    error.value = null
    retryCount.value = 0
  },
  { deep: true }
)

// 暴露方法给父组件
defineExpose({
  updateData,
  updateDeviceInfo,
  refreshData
})
</script>

<template>
  <div 
    ref="containerRef"
    class="enum-control-container"
    :style="containerStyle"
  >
    <!-- 设备名称（上方） -->
    <NText 
      v-if="showDeviceName && config.style?.deviceName?.position === 'top'"
      class="device-name"
      :style="deviceNameStyle"
    >
      {{ deviceName }}
    </NText>
    
    <!-- 当前值（上方） -->
    <NText 
      v-if="showCurrentValue && config.style?.currentValue?.position === 'top' && currentValueText"
      class="current-value"
      :style="currentValueStyle"
    >
      {{ currentValueText }}
    </NText>
    
    <!-- 按钮组 -->
    <div class="button-group" :class="{ vertical: layoutDirection === 'vertical' }">
      <template v-if="layoutDirection === 'horizontal'">
        <NGrid :cols="itemsPerRow" :x-gap="buttonGap" :y-gap="buttonGap">
          <NGridItem v-for="(option, index) in buttonOptions" :key="index">
            <NButton
              :size="props.config.buttons?.size || 'medium'"
              :disabled="isDisabled || option.disabled || loading"
              :loading="loading && currentValue === option.value"
              :style="getButtonStyle(option, currentValue === option.value)"
              class="enum-button"
              @click="handleButtonClick(option)"
            >
              <template v-if="getButtonIcon(option)" #icon>
                <NIcon :size="16">
                  <component :is="getButtonIcon(option)" />
                </NIcon>
              </template>
              {{ option.label }}
            </NButton>
          </NGridItem>
        </NGrid>
      </template>
      
      <template v-else>
        <NSpace vertical :size="buttonGap">
          <NButton
            v-for="(option, index) in buttonOptions"
            :key="index"
            :size="props.config.buttons?.size || 'medium'"
            :disabled="isDisabled || option.disabled || loading"
            :loading="loading && currentValue === option.value"
            :style="getButtonStyle(option, currentValue === option.value)"
            class="enum-button"
            @click="handleButtonClick(option)"
          >
            <template v-if="getButtonIcon(option)" #icon>
              <NIcon :size="16">
                <component :is="getButtonIcon(option)" />
              </NIcon>
            </template>
            {{ option.label }}
          </NButton>
        </NSpace>
      </template>
    </div>
    
    <!-- 当前值（下方） -->
    <NText 
      v-if="showCurrentValue && (config.style?.currentValue?.position === 'bottom' || !config.style?.currentValue?.position) && currentValueText"
      class="current-value"
      :style="currentValueStyle"
    >
      {{ currentValueText }}
    </NText>
    
    <!-- 设备名称（下方） -->
    <NText 
      v-if="showDeviceName && (config.style?.deviceName?.position === 'bottom' || !config.style?.deviceName?.position)"
      class="device-name"
      :style="deviceNameStyle"
    >
      {{ deviceName }}
    </NText>
    
    <!-- 错误提示 -->
    <NText v-if="error" type="error" class="error-message">
      {{ error }}
      <span v-if="retryCount > 0" class="retry-info">
        (重试 {{ retryCount }} 次)
      </span>
    </NText>
  </div>
</template>

<style scoped>
.enum-control-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.device-name {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.current-value {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.button-group {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.button-group.vertical {
  flex-direction: column;
}

.enum-button {
  width: 100%;
  transition: all 0.2s ease-in-out;
}

.enum-button:hover {
  transform: translateY(-1px);
}

.enum-button:active {
  transform: translateY(0);
}

.error-message {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
}

.retry-info {
  opacity: 0.7;
  font-size: 11px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .enum-control-container {
    padding: 8px;
  }
  
  .enum-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}

@media (max-width: 320px) {
  .button-group :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

/* 动画效果 */
.enum-button {
  position: relative;
  overflow: hidden;
}

.enum-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.enum-button:active::before {
  width: 200px;
  height: 200px;
}
</style>