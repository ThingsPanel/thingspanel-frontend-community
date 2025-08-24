<template>
  <div class="simple-display-config">
    <!-- 简单配置表单 -->
    <n-form :model="localConfig" label-placement="left" :label-width="80">
      <n-form-item label="标题">
        <n-input v-model:value="localConfig.title" placeholder="组件标题" @update:value="handleConfigChange" />
      </n-form-item>

      <n-form-item label="内容">
        <n-input
          v-model:value="localConfig.content"
          type="textarea"
          placeholder="展示内容"
          :rows="3"
          @update:value="handleConfigChange"
        />
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

      <n-form-item label="显示图标">
        <n-switch v-model:value="localConfig.showIcon" @update:value="handleConfigChange" />
      </n-form-item>

      <n-form-item v-if="localConfig.showIcon" label="图标">
        <n-input
          v-model:value="localConfig.iconName"
          placeholder="输入emoji或图标"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单展示组件配置面板
 * 无数据源组件的配置示例
 */

import { reactive, watch, nextTick } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'

// 配置接口
interface SimpleDisplayConfig {
  title: string
  content: string
  themeColor: string
  fontSize: number
  showIcon: boolean
  iconName: string
}

// Props定义
interface Props {
  modelValue?: SimpleDisplayConfig
  config?: SimpleDisplayConfig
  widget?: any
  readonly?: boolean
}

// Emits定义
interface Emits {
  (e: 'update:modelValue', config: SimpleDisplayConfig): void
  (e: 'update:config', config: SimpleDisplayConfig): void
  (e: 'change', value: SimpleDisplayConfig, oldValue: SimpleDisplayConfig): void
  (e: 'update', config: SimpleDisplayConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()

// 获取默认配置
const getDefaultConfig = (): SimpleDisplayConfig => ({
  title: '简单展示组件',
  content: '这是一个静态展示组件，不需要数据源',
  themeColor: '#2080f0',
  fontSize: 16,
  showIcon: true,
  iconName: '📊'
})

// 本地配置状态
const localConfig = reactive<SimpleDisplayConfig>(props.modelValue || props.config || getDefaultConfig())

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
          content: sourceConfig.content || getDefaultConfig().content,
          themeColor: sourceConfig.themeColor || getDefaultConfig().themeColor,
          fontSize: sourceConfig.fontSize || getDefaultConfig().fontSize,
          showIcon: sourceConfig.showIcon ?? getDefaultConfig().showIcon,
          iconName: sourceConfig.iconName || getDefaultConfig().iconName
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
.simple-display-config {
  padding: 16px;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}
</style>
