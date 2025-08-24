<template>
  <div class="triple-data-display-config">
    <!-- 三数据源配置表单 -->
    <n-form :model="localConfig" label-placement="left" :label-width="80">
      <n-form-item label="标题">
        <n-input v-model:value="localConfig.title" placeholder="组件标题" @update:value="handleConfigChange" />
      </n-form-item>

      <n-form-item label="主题色">
        <n-color-picker v-model:value="localConfig.themeColor" @update:value="handleConfigChange" />
      </n-form-item>

      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="localConfig.fontSize"
          :min="12"
          :max="24"
          suffix="px"
          @update:value="handleConfigChange"
        />
      </n-form-item>

      <n-form-item label="显示边框">
        <n-switch v-model:value="localConfig.showBorder" @update:value="handleConfigChange" />
      </n-form-item>

      <n-form-item label="布局模式">
        <n-select v-model:value="localConfig.layout" :options="layoutOptions" @update:value="handleConfigChange" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 三数据源显示组件配置面板
 * 三个数据源组件的配置示例
 */

import { reactive, watch, nextTick } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker, NSelect } from 'naive-ui'

// 配置接口
interface TripleDataDisplayConfig {
  title: string
  themeColor: string
  fontSize: number
  showBorder: boolean
  layout: 'grid' | 'horizontal' | 'vertical'
}

// Props定义
interface Props {
  modelValue?: TripleDataDisplayConfig
  config?: TripleDataDisplayConfig
  widget?: any
  readonly?: boolean
}

// Emits定义
interface Emits {
  (e: 'update:modelValue', config: TripleDataDisplayConfig): void
  (e: 'update:config', config: TripleDataDisplayConfig): void
  (e: 'change', value: TripleDataDisplayConfig, oldValue: TripleDataDisplayConfig): void
  (e: 'update', config: TripleDataDisplayConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 布局选项
const layoutOptions = [
  { label: '网格布局', value: 'grid' },
  { label: '水平布局', value: 'horizontal' },
  { label: '垂直布局', value: 'vertical' }
]

// 获取默认配置
const getDefaultConfig = (): TripleDataDisplayConfig => ({
  title: '三数据源综合显示',
  themeColor: '#f0a020',
  fontSize: 14,
  showBorder: true,
  layout: 'grid'
})

// 本地配置状态
const localConfig = reactive<TripleDataDisplayConfig>(props.modelValue || props.config || getDefaultConfig())

// 防循环更新标志
let isUpdatingFromProps = false

// 监听props配置变化
watch(
  [() => props.modelValue, () => props.config],
  ([newModelValue, newConfig]) => {
    if (isUpdatingFromProps) return

    const sourceConfig = newModelValue || newConfig
    if (sourceConfig) {
      isUpdatingFromProps = true
      try {
        Object.assign(localConfig, {
          title: sourceConfig.title || getDefaultConfig().title,
          themeColor: sourceConfig.themeColor || getDefaultConfig().themeColor,
          fontSize: sourceConfig.fontSize || getDefaultConfig().fontSize,
          showBorder: sourceConfig.showBorder ?? getDefaultConfig().showBorder,
          layout: sourceConfig.layout || getDefaultConfig().layout
        })
      } finally {
        nextTick(() => {
          setTimeout(() => {
            isUpdatingFromProps = false
          }, 10)
        })
      }
    }
  },
  { deep: true, immediate: true }
)

// 配置变更处理
const handleConfigChange = () => {
  if (isUpdatingFromProps) return

  const newValue = { ...localConfig }

  // 发送更新事件
  emit('update:modelValue', newValue)
  emit('update:config', newValue)
  emit('change', newValue, newValue)
  emit('update', newValue)
}
</script>

<style scoped>
.triple-data-display-config {
  padding: 16px;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}
</style>
