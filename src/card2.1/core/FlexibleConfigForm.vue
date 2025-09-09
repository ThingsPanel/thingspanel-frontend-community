<template>
  <div class="flexible-config-form">
    <!-- 模式指示器 -->
    <div v-if="showModeIndicator" class="mode-indicator">
      <n-tag :type="getModeTagType()" size="small">
        {{ getModeLabel() }}
      </n-tag>
    </div>

    <!-- 自动表单生成器 -->
    <AutoFormGenerator
      v-model="configValues"
      :ts-config="tsConfig"
      :vue-config="vueConfig"
      :mode="detectedMode"
      :readonly="readonly"
      @change="handleConfigChange"
      @validate="handleValidate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NTag } from 'naive-ui'
import type { Component } from 'vue'
import AutoFormGenerator from './AutoFormGenerator.vue'
import type { TSConfig, ConfigMode, ConfigValues } from './config-types'
import { FlexibleConfigManager } from './config-manager'

interface Props {
  // 组件类型（用于自动检测配置）
  componentType?: string

  // 直接传入配置（可选）
  tsConfig?: TSConfig
  vueConfig?: Component

  // 当前配置值
  modelValue?: ConfigValues

  // 是否只读
  readonly?: boolean

  // 是否显示模式指示器
  showModeIndicator?: boolean
}

interface Emits {
  (event: 'update:modelValue', value: ConfigValues): void
  (event: 'change', value: ConfigValues): void
  (event: 'validate', result: { valid: boolean; errors: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  readonly: false,
  showModeIndicator: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const configValues = ref<ConfigValues>({})
const tsConfig = ref<TSConfig>()
const vueConfig = ref<Component>()

// 检测到的配置模式
const detectedMode = computed<ConfigMode>(() => {
  try {
    return FlexibleConfigManager.detectConfigMode(vueConfig.value, tsConfig.value)
  } catch {
    return 'vue-only'
  }
})

// 模式标签类型
const getModeTagType = () => {
  switch (detectedMode.value) {
    case 'ts-only':
      return 'info'
    case 'vue-only':
      return 'success'
    case 'hybrid':
      return 'warning'
    default:
      return 'default'
  }
}

// 模式标签文本
const getModeLabel = () => {
  switch (detectedMode.value) {
    case 'ts-only':
      return 'TS配置'
    case 'vue-only':
      return 'Vue配置'
    case 'hybrid':
      return '混合配置'
    default:
      return '未知模式'
  }
}

// 自动检测组件配置
const detectComponentConfig = async () => {
  if (!props.componentType) return

  try {
    // 尝试动态导入TS配置
    try {
      // 使用动态导入，支持任意组件类型
      const tsConfigPath = `/src/card2.1/components/${props.componentType}/config.ts`
      const tsModule = await import(/* @vite-ignore */ tsConfigPath)

      if (tsModule.testComponentTSConfig || tsModule.default) {
        tsConfig.value = tsModule.testComponentTSConfig || tsModule.default
      }
    } catch (e) {}

    // 尝试动态导入Vue配置
    try {
      const vueConfigPath = `/src/card2.1/components/${props.componentType}/config.vue`
      const vueModule = await import(/* @vite-ignore */ vueConfigPath)

      if (vueModule.default) {
        vueConfig.value = vueModule.default
      }
    } catch (e) {}
  } catch (error) {}
}

// 处理配置变化
const handleConfigChange = (newValues: ConfigValues) => {
  configValues.value = { ...newValues }
  emit('update:modelValue', newValues)
  emit('change', newValues)
}

// 处理验证结果
const handleValidate = (result: { valid: boolean; errors: string[] }) => {
  emit('validate', result)
}

// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      configValues.value = { ...newValue }
    }
  },
  { immediate: true, deep: true }
)

// 监听组件类型变化
watch(
  () => props.componentType,
  () => {
    detectComponentConfig()
  },
  { immediate: true }
)

// 监听直接传入的配置
watch(
  () => [props.tsConfig, props.vueConfig],
  () => {
    if (props.tsConfig) tsConfig.value = props.tsConfig
    if (props.vueConfig) vueConfig.value = props.vueConfig
  },
  { immediate: true }
)

// 组件挂载
onMounted(() => {
  // 设置初始值
  if (props.modelValue) {
    configValues.value = { ...props.modelValue }
  }
})
</script>

<style scoped>
.flexible-config-form {
  width: 100%;
}

.mode-indicator {
  margin-bottom: 12px;
  text-align: right;
}
</style>
