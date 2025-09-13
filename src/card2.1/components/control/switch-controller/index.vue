<template>
  <n-card 
    class="switch-controller" 
    :style="cardStyle"
    embedded
  >
    <div class="control-header">
      <div class="control-title">
        {{ displayData.title || config.title }}
      </div>
      <div v-if="config.showStatus" class="control-status" :class="{ active: switchValue }">
        {{ switchValue ? config.onText : config.offText }}
      </div>
    </div>
    
    <div class="control-body">
      <n-switch
        v-model:value="switchValue"
        :size="config.switchSize"
        :disabled="config.disabled"
        :loading="isUpdating"
        @update:value="handleSwitchChange"
      />
      
      <div v-if="config.showDescription" class="control-description">
        {{ displayData.description || config.description }}
      </div>
    </div>
    
    <div v-if="config.showLastUpdate && displayData.timestamp" class="last-update">
      上次操作：{{ formatTime(displayData.timestamp) }}
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 开关控制器组件
 * 用于控制设备的开关状态
 */

import { ref, computed, watch } from 'vue'
import { NCard, NSwitch, useMessage } from 'naive-ui'
import { useCard2Props } from '@/card2.1/hooks'
import type { SwitchControllerConfig } from './settingConfig'

// 组件属性接口
interface Props {
  config: SwitchControllerConfig
  data?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 组件事件
interface Emits {
  (e: 'control', payload: { action: 'toggle', value: boolean }): void
  (e: 'dataChange', data: Record<string, unknown>): void
}

const emit = defineEmits<Emits>()
const message = useMessage()

// 使用 Card 2.1 数据绑定
const { config, displayData } = useCard2Props(props)

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
  if (config.value.disabled) return
  
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
    
    if (config.value.showNotification) {
      message.success(`设备已${value ? '开启' : '关闭'}`)
    }
  } catch (error) {
    message.error('操作失败，请重试')
    switchValue.value = !value // 回滚状态
  } finally {
    isUpdating.value = false
  }
}

// 计算卡片样式
const cardStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
  border: `1px solid ${config.value.borderColor}`,
  borderRadius: `${config.value.borderRadius}px`,
  minHeight: '140px'
}))

// 格式化时间显示
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
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
</style>