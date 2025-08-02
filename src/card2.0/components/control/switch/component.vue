<script setup lang="ts">
/**
 * Card 2.0 开关控制组件
 * 基于原有 chart-switch 组件迁移而来，采用新的架构设计
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { NSwitch, NCard, NSpin, NText, useMessage, useDialog } from 'naive-ui'
import type { SwitchConfig } from './index'
import { telemetryDataCurrentKeys, getAttributeDatasKey, publishAttributeData, publishTelemetryData } from '@/service/api/device'

// 组件属性定义
interface Props {
  /** 组件配置 */
  config: SwitchConfig
  /** 数据源配置 */
  dataSource?: any
  /** 卡片实例 */
  card?: any
  /** 外部数据 */
  data?: any
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({} as SwitchConfig),
  dataSource: undefined,
  card: undefined,
  data: undefined
})

// 响应式数据
const loading = ref(false)
const switchValue = ref(false)
const detail = ref<any>({})
const error = ref<string | null>(null)
const retryCount = ref(0)
const maxRetries = 3

// 消息和对话框实例
const message = useMessage()
const dialog = useDialog()

// 计算属性
const containerStyle = computed(() => {
  const style = props.config.style?.container
  if (!style) return {}
  
  return {
    backgroundColor: style.backgroundColor || 'transparent',
    border: style.border?.show ? `${style.border.width || 1}px solid ${style.border.color || '#d9d9d9'}` : 'none',
    borderRadius: `${style.border?.radius || 4}px`,
    padding: `${style.padding?.top || 16}px ${style.padding?.right || 16}px ${style.padding?.bottom || 16}px ${style.padding?.left || 16}px`,
    textAlign: style.textAlign || 'center',
    display: 'flex',
    flexDirection: style.textAlign === 'center' ? 'column' : 'row',
    alignItems: style.verticalAlign === 'top' ? 'flex-start' : style.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    justifyContent: style.textAlign === 'left' ? 'flex-start' : style.textAlign === 'right' ? 'flex-end' : 'center',
    gap: `${props.config.style?.label?.spacing || 20}px`
  }
})

const switchStyle = computed(() => {
  const style = props.config.style?.switch
  if (!style) return {}
  
  return {
    '--n-rail-color-active': style.activeColor || '#18a058',
    '--n-rail-color': style.railColor || '#e0e0e6'
  }
})

const labelStyle = computed(() => {
  const style = props.config.style?.label
  if (!style) return {}
  
  return {
    fontSize: `${style.fontSize || 14}px`,
    color: style.color || '#333333',
    fontWeight: style.fontWeight || 'normal'
  }
})

const switchSize = computed(() => {
  return props.config.switch?.size || 'medium'
})

const isDisabled = computed(() => {
  return props.config.switch?.disabled || false
})

const isRound = computed(() => {
  return props.config.switch?.round !== false
})

const showLabel = computed(() => {
  return props.config.basic?.showLabel !== false
})

const labelText = computed(() => {
  return props.config.basic?.label || props.config.basic?.title || '开关控制'
})

const indicatorText = computed(() => {
  if (!props.config.indicator?.show) return ''
  return switchValue.value 
    ? (props.config.indicator?.activeText || '开启')
    : (props.config.indicator?.inactiveText || '关闭')
})

// 辅助函数
/**
 * 获取开关值
 * @param data 原始数据
 * @returns 开关状态
 */
const getSwitchValue = (data: any): boolean => {
  if (data === null || data === undefined) return false
  
  const mapping = props.config.mapping
  const activeValue = mapping?.activeValue ?? 1
  const inactiveValue = mapping?.inactiveValue ?? 0
  
  // 根据数据类型进行转换
  switch (mapping?.dataType) {
    case 'boolean':
      return Boolean(data)
    case 'string':
      return String(data) === String(activeValue)
    case 'number':
    default:
      return Number(data) === Number(activeValue)
  }
}

/**
 * 转换开关值为发送值
 * @param value 开关状态
 * @returns 发送的值
 */
const convertSwitchValue = (value: boolean): any => {
  const mapping = props.config.mapping
  const activeValue = mapping?.activeValue ?? 1
  const inactiveValue = mapping?.inactiveValue ?? 0
  
  return value ? activeValue : inactiveValue
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
 * 获取设备数据
 */
const fetchDeviceData = async () => {
  if (!props.dataSource?.device_id || !props.dataSource?.metricsType) {
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    let response
    if (props.dataSource.metricsType === 'telemetry') {
      response = await telemetryDataCurrentKeys({
        device_id: props.dataSource.device_id,
        keys: props.dataSource.keys || []
      })
    } else {
      response = await getAttributeDatasKey({
        device_id: props.dataSource.device_id,
        keys: props.dataSource.keys || []
      })
    }
    
    if (response?.data) {
      detail.value = response.data
      
      // 获取第一个键的值作为开关状态
      const keys = props.dataSource.keys || []
      if (keys.length > 0) {
        const firstKey = keys[0]
        const value = response.data[firstKey]
        switchValue.value = getSwitchValue(value)
      }
    }
    
    retryCount.value = 0
  } catch (err) {
    console.error('获取设备数据失败:', err)
    error.value = '获取数据失败'
    
    // 重试逻辑
    if (retryCount.value < maxRetries) {
      retryCount.value++
      setTimeout(() => {
        fetchDeviceData()
      }, 1000 * retryCount.value)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 发送开关控制命令
 * @param value 开关状态
 */
const sendSwitchCommand = async (value: boolean) => {
  if (!props.dataSource?.device_id || !props.dataSource?.keys?.length) {
    message.error('设备配置不完整')
    return
  }
  
  try {
    loading.value = true
    const sendValue = convertSwitchValue(value)
    const key = props.dataSource.keys[0]
    
    const data = {
      [key]: sendValue
    }
    
    let response
    if (props.dataSource.metricsType === 'telemetry') {
      response = await publishTelemetryData({
        device_id: props.dataSource.device_id,
        data
      })
    } else {
      response = await publishAttributeData({
        device_id: props.dataSource.device_id,
        data
      })
    }
    
    if (response?.code === 200) {
      message.success('操作成功')
      // 更新本地状态
      switchValue.value = value
      
      // 延迟刷新数据以确保服务器状态同步
      setTimeout(() => {
        fetchDeviceData()
      }, 500)
    } else {
      throw new Error(response?.message || '操作失败')
    }
  } catch (err) {
    console.error('发送控制命令失败:', err)
    message.error('操作失败: ' + (err as Error).message)
    // 恢复原状态
    switchValue.value = !value
  } finally {
    loading.value = false
  }
}

/**
 * 处理开关点击
 * @param value 新的开关状态
 */
const handleSwitchChange = (value: boolean) => {
  // 如果启用了确认对话框
  if (props.config.interaction?.confirm?.enabled) {
    const title = props.config.interaction.confirm.title || '确认操作'
    const content = props.config.interaction.confirm.content || '确定要切换开关状态吗？'
    
    dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        debounceAction(() => sendSwitchCommand(value))
      },
      onNegativeClick: () => {
        // 恢复原状态
        switchValue.value = !value
      }
    })
  } else {
    debounceAction(() => sendSwitchCommand(value))
  }
}

/**
 * 更新数据（供外部调用）
 * @param newData 新数据
 */
const updateData = (newData: any) => {
  if (newData && typeof newData === 'object') {
    detail.value = { ...detail.value, ...newData }
    
    // 更新开关状态
    const keys = props.dataSource?.keys || []
    if (keys.length > 0) {
      const firstKey = keys[0]
      if (newData[firstKey] !== undefined) {
        switchValue.value = getSwitchValue(newData[firstKey])
      }
    }
  }
}

/**
 * 刷新数据
 */
const refreshData = () => {
  fetchDeviceData()
}

// 监听器
watch(
  () => props.dataSource,
  () => {
    if (props.dataSource) {
      fetchDeviceData()
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      updateData(newData)
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  if (props.dataSource) {
    fetchDeviceData()
  }
})

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// 暴露方法供外部调用
defineExpose({
  updateData,
  refreshData,
  getSwitchValue: () => switchValue.value,
  setSwitchValue: (value: boolean) => {
    switchValue.value = value
  }
})
</script>

<template>
  <div class="switch-container" :style="containerStyle">
    <!-- 加载状态 -->
    <div v-if="loading && !switchValue" class="loading-wrapper">
      <NSpin size="small" />
      <NText depth="3">加载中...</NText>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-wrapper">
      <NText type="error">{{ error }}</NText>
      <NText 
        depth="3" 
        class="retry-text" 
        @click="refreshData"
      >
        点击重试
      </NText>
    </div>
    
    <!-- 正常显示 -->
    <template v-else>
      <!-- 标签（上方或左侧） -->
      <NText 
        v-if="showLabel && (config.style?.label?.position === 'top' || config.style?.label?.position === 'left')"
        :style="labelStyle"
        class="switch-label"
      >
        {{ labelText }}
      </NText>
      
      <!-- 开关控件 -->
      <div class="switch-wrapper">
        <NSwitch
          v-model:value="switchValue"
          :size="switchSize"
          :disabled="isDisabled || loading"
          :round="isRound"
          :style="switchStyle"
          :loading="loading"
          @update:value="handleSwitchChange"
        >
          <!-- 内部指示器 -->
          <template v-if="config.indicator?.show && config.indicator?.position === 'inside'" #checked>
            {{ config.indicator?.activeText || '开' }}
          </template>
          <template v-if="config.indicator?.show && config.indicator?.position === 'inside'" #unchecked>
            {{ config.indicator?.inactiveText || '关' }}
          </template>
        </NSwitch>
        
        <!-- 外部指示器 -->
        <NText 
          v-if="config.indicator?.show && config.indicator?.position === 'outside'"
          :style="labelStyle"
          class="switch-indicator"
        >
          {{ indicatorText }}
        </NText>
      </div>
      
      <!-- 标签（下方或右侧） -->
      <NText 
        v-if="showLabel && (config.style?.label?.position === 'bottom' || config.style?.label?.position === 'right' || !config.style?.label?.position)"
        :style="labelStyle"
        class="switch-label"
      >
        {{ labelText }}
      </NText>
    </template>
  </div>
</template>

<style scoped>
.switch-container {
  width: 100%;
  height: 100%;
  min-height: 60px;
  transition: all 0.3s ease;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 60px;
}

.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 60px;
}

.retry-text {
  cursor: pointer;
  text-decoration: underline;
}

.retry-text:hover {
  opacity: 0.8;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-label {
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.switch-indicator {
  font-size: 12px;
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .switch-container {
    min-height: 50px;
  }
  
  .switch-label {
    font-size: 12px;
  }
}

/* 动画效果 */
.switch-container * {
  transition: all 0.3s ease;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .switch-container {
    color: #ffffff;
  }
}
</style>