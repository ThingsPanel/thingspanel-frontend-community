<!--
  配置组件包装器
  支持原有的配置组件在新系统中正常工作，提供兼容的注入模式
-->

<script setup lang="ts">
import { 
  ref, 
  reactive, 
  provide, 
  watch, 
  onMounted, 
  onUnmounted,
  computed,
  nextTick,
  type Component
} from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import type { IComponentDefinition } from '@/card2.1/core/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigWrapper')

// ====== Props 定义 ======
interface Props {
  // 组件定义
  componentDefinition?: IComponentDefinition
  // 配置组件（可以是 Vue 组件或异步组件）
  configComponent?: Component | (() => Promise<Component>)
  // 当前配置值
  modelValue?: Record<string, any>
  // 是否为预览模式
  preview?: boolean
  // 是否显示高级选项
  showAdvanced?: boolean
  // 是否启用兼容模式
  legacyMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  preview: false,
  showAdvanced: false,
  legacyMode: true
})

// ====== Emits 定义 ======
interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'config-change': [value: Record<string, any>]
  'validation-change': [isValid: boolean, errors: string[]]
}

const emit = defineEmits<Emits>()

// ====== 响应式状态 ======
const configRef = ref<Component>()
const isLoading = ref(false)
const error = ref<string | null>(null)
const loadedComponent = ref<Component | null>(null)

// 内部配置状态（响应式）
const internalConfig = reactive<Record<string, any>>({ ...props.modelValue })

// 验证状态
const validationErrors = ref<string[]>([])
const isValid = computed(() => validationErrors.value.length === 0)

// ====== 配置上下文创建 ======

// 创建兼容的配置上下文，供原有配置组件使用
const configContext = computed((): IConfigCtx => {
  return {
    config: internalConfig,
    view: props.preview
  }
})

// 提供配置上下文给子组件
provide('config-ctx', configContext.value)

// ====== 配置组件加载 ======

/**
 * 加载配置组件
 */
async function loadConfigComponent() {
  if (!props.configComponent) {
    logger.warn('没有提供配置组件')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    let component: Component

    // 处理异步组件
    if (typeof props.configComponent === 'function') {
      component = await props.configComponent()
      // 处理 default export
      if (component && typeof component === 'object' && 'default' in component) {
        component = (component as any).default
      }
    } else {
      component = props.configComponent
    }

    loadedComponent.value = component
    logger.info('配置组件加载成功')
  } catch (err: any) {
    error.value = err.message || '配置组件加载失败'
    logger.error('配置组件加载失败:', err)
  } finally {
    isLoading.value = false
  }
}

// ====== 配置值同步 ======

// 监听外部配置变化，同步到内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && typeof newValue === 'object') {
      Object.assign(internalConfig, newValue)
    }
  },
  { deep: true, immediate: true }
)

// 监听内部配置变化，向外传递
watch(
  internalConfig,
  (newValue) => {
    // 防止循环更新
    if (JSON.stringify(newValue) !== JSON.stringify(props.modelValue)) {
      emit('update:modelValue', { ...newValue })
      emit('config-change', { ...newValue })
    }
  },
  { deep: true }
)

// ====== 默认配置处理 ======

/**
 * 应用组件定义中的默认配置
 */
function applyDefaultConfig() {
  if (!props.componentDefinition?.properties) return

  const defaults: Record<string, any> = {}
  
  Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
    if (prop && typeof prop === 'object' && 'default' in prop && !(key in internalConfig)) {
      defaults[key] = prop.default
    }
  })

  if (Object.keys(defaults).length > 0) {
    Object.assign(internalConfig, defaults)
    logger.info('应用默认配置:', defaults)
  }
}

// ====== 配置验证 ======

/**
 * 验证当前配置
 */
function validateConfig() {
  const errors: string[] = []

  if (props.componentDefinition?.properties) {
    Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
      if (prop && typeof prop === 'object') {
        const value = internalConfig[key]
        
        // 检查必填项
        if (prop.required && (value === undefined || value === null || value === '')) {
          errors.push(`${prop.label || key} 是必填项`)
        }
        
        // 检查类型
        if (value !== undefined && prop.type) {
          const expectedType = prop.type
          const actualType = Array.isArray(value) ? 'array' : typeof value
          
          if (expectedType !== actualType) {
            errors.push(`${prop.label || key} 类型错误，期望 ${expectedType}，实际 ${actualType}`)
          }
        }
        
        // 检查范围（数字类型）
        if (typeof value === 'number' && prop.type === 'number') {
          if (prop.min !== undefined && value < prop.min) {
            errors.push(`${prop.label || key} 不能小于 ${prop.min}`)
          }
          if (prop.max !== undefined && value > prop.max) {
            errors.push(`${prop.label || key} 不能大于 ${prop.max}`)
          }
        }
        
        // 检查长度（字符串类型）
        if (typeof value === 'string' && prop.type === 'string') {
          if (prop.minLength !== undefined && value.length < prop.minLength) {
            errors.push(`${prop.label || key} 长度不能小于 ${prop.minLength}`)
          }
          if (prop.maxLength !== undefined && value.length > prop.maxLength) {
            errors.push(`${prop.label || key} 长度不能大于 ${prop.maxLength}`)
          }
        }
      }
    })
  }

  validationErrors.value = errors
  emit('validation-change', isValid.value, errors)
}

// 监听配置变化，触发验证
watch(internalConfig, validateConfig, { deep: true })

// ====== 工具方法 ======

/**
 * 重置配置到默认值
 */
function resetToDefaults() {
  // 清空当前配置
  Object.keys(internalConfig).forEach(key => {
    delete internalConfig[key]
  })
  
  // 重新应用默认配置
  applyDefaultConfig()
  
  logger.info('配置已重置到默认值')
}

/**
 * 获取配置摘要信息
 */
function getConfigSummary() {
  return {
    total: Object.keys(internalConfig).length,
    hasErrors: !isValid.value,
    errorCount: validationErrors.value.length,
    hasDefaults: props.componentDefinition?.properties ? 
      Object.keys(props.componentDefinition.properties).length > 0 : false
  }
}

// ====== 生命周期 ======

onMounted(async () => {
  // 加载配置组件
  await loadConfigComponent()
  
  // 应用默认配置
  applyDefaultConfig()
  
  // 初始验证
  await nextTick()
  validateConfig()
})

onUnmounted(() => {
  // 清理资源
  loadedComponent.value = null
})

// ====== 暴露给父组件的方法 ======
defineExpose({
  resetToDefaults,
  validateConfig,
  getConfigSummary,
  isValid,
  validationErrors
})
</script>

<template>
  <div class="config-wrapper">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="config-loading">
      <n-spin size="medium">
        <template #description>
          {{ $t('common.loading') }}配置组件...
        </template>
      </n-spin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="config-error">
      <n-alert type="error" :title="$t('common.error')">
        {{ error }}
      </n-alert>
    </div>

    <!-- 配置组件渲染 -->
    <div v-else-if="loadedComponent" class="config-content">
      <!-- 验证错误提示 -->
      <div v-if="!isValid && validationErrors.length > 0" class="config-validation-errors mb-4">
        <n-alert type="warning" :title="$t('common.validationErrors')">
          <ul class="mt-2">
            <li v-for="error in validationErrors" :key="error" class="text-sm">
              {{ error }}
            </li>
          </ul>
        </n-alert>
      </div>

      <!-- 配置组件内容 -->
      <div class="config-component-wrapper">
        <component 
          :is="loadedComponent" 
          ref="configRef"
          v-bind="$attrs"
        />
      </div>

      <!-- 调试信息（开发环境） -->
      <div v-if="process.env.NODE_ENV === 'development'" class="config-debug mt-4">
        <n-collapse>
          <n-collapse-item title="调试信息" name="debug">
            <div class="space-y-2 text-xs">
              <div><strong>组件ID:</strong> {{ componentDefinition?.id }}</div>
              <div><strong>配置项数量:</strong> {{ Object.keys(internalConfig).length }}</div>
              <div><strong>验证状态:</strong> {{ isValid ? '通过' : '失败' }}</div>
              <div><strong>错误数量:</strong> {{ validationErrors.length }}</div>
              <div><strong>预览模式:</strong> {{ preview ? '是' : '否' }}</div>
              <div><strong>兼容模式:</strong> {{ legacyMode ? '是' : '否' }}</div>
              
              <n-divider />
              
              <div><strong>当前配置:</strong></div>
              <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(internalConfig, null, 2) }}</pre>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>
    </div>

    <!-- 无配置组件 -->
    <div v-else class="config-empty">
      <n-empty description="该组件没有可配置的选项" />
    </div>
  </div>
</template>

<style scoped>
.config-wrapper {
  @apply w-full;
}

.config-loading {
  @apply flex items-center justify-center py-8;
}

.config-error {
  @apply py-4;
}

.config-content {
  @apply space-y-4;
}

.config-component-wrapper {
  @apply w-full;
}

.config-validation-errors {
  @apply border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/20;
}

.config-empty {
  @apply py-8 text-center text-gray-500;
}

.config-debug {
  @apply border-t border-gray-200 pt-4;
}

/* 深层样式覆盖，确保内部组件样式正常 */
:deep(.n-form) {
  @apply w-full;
}

:deep(.n-form-item) {
  @apply mb-4;
}

:deep(.n-form-item-label) {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

:deep(.n-input),
:deep(.n-select),
:deep(.n-slider),
:deep(.n-color-picker) {
  @apply w-full;
}
</style>