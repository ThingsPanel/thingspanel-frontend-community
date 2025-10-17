<!--
  配置组件包装器
  支持原有的配置组件在新系统中正常工作，提供兼容的注入模式
-->

<script setup lang="ts">
import { ref, reactive, provide, watch, onMounted, onUnmounted, computed, nextTick, type Component } from 'vue'
import type { IConfigCtx } from '@/card2.1/core2/legacy'
import type { IComponentDefinition } from '@/card2.1/core2'
import { createLogger } from '@/utils/logger'
import { smartDeepClone } from '@/utils/deep-clone'

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
  // 是否启用兼容模式
  legacyMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  preview: false,
  legacyMode: true
})

// ====== Emits 定义 ======
interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'config-change': [value: Record<string, any>]
  'validation-change': [isValid: boolean, errors: string[]]
  'component-loaded': [component: Component | null]
  'component-error': [error: string]
  'config-reset': [value: Record<string, any>]
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
// 参考原始 config-ctx.vue 的实现模式
const configContext: IConfigCtx = {
  config: internalConfig,
  view: props.preview
}

// 提供配置上下文给子组件
provide('config-ctx', configContext)

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
    emit('component-loaded', component)
    logger.info('配置组件加载成功')
  } catch (err: any) {
    error.value = err.message || '配置组件加载失败'
    emit('component-error', error.value)
    logger.error('配置组件加载失败:', err)
  } finally {
    isLoading.value = false
  }
}

// ====== 配置值同步 ======

// 监听外部配置变化，同步到内部状态
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && typeof newValue === 'object') {
      // 避免循环更新
      const currentStr = JSON.stringify(internalConfig)
      const newStr = JSON.stringify(newValue)
      if (currentStr !== newStr) {
        logger.debug('外部配置更新，同步到内部:', newValue)
        // 清空现有配置，然后重新赋值
        Object.keys(internalConfig).forEach(key => delete internalConfig[key])
        Object.assign(internalConfig, newValue)
      }
    }
  },
  { deep: true, immediate: true }
)

// 监听内部配置变化，向外传递（参考原始 config-ctx.vue 的实现）
watch(
  internalConfig,
  newValue => {
    // 防止循环更新
    const currentStr = JSON.stringify(newValue)
    const propsStr = JSON.stringify(props.modelValue)
    if (currentStr !== propsStr) {
      logger.debug('内部配置更新，向外传递:', newValue)
      // 🔥 使用智能深拷贝，自动处理Vue响应式对象
      const clonedValue = smartDeepClone(newValue)
      emit('update:modelValue', clonedValue)
      emit('config-change', clonedValue)
    }
  },
  { deep: true }
)

// 监听预览模式变化，更新上下文
watch(
  () => props.preview,
  newPreview => {
    configContext.view = newPreview
  }
)

// ====== 默认配置处理 ======

/**
 * 应用组件定义中的默认配置
 */
function applyDefaultConfig(force: boolean = false) {
  if (!props.componentDefinition?.properties) return

  const defaults: Record<string, any> = {}
  const overrides: Record<string, any> = {}

  Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
    if (prop && typeof prop === 'object' && 'default' in prop) {
      const hasExistingValue =
        key in internalConfig && internalConfig[key] !== undefined && internalConfig[key] !== null

      if (force) {
        // 强制模式：覆盖所有值
        overrides[key] = prop.default
      } else if (!hasExistingValue) {
        // 正常模式：只设置空值
        defaults[key] = prop.default
      }
    }
  })

  // 应用默认值
  if (Object.keys(defaults).length > 0) {
    Object.assign(internalConfig, defaults)
    logger.info('应用默认配置:', defaults)
  }

  // 应用强制覆盖值
  if (Object.keys(overrides).length > 0) {
    Object.assign(internalConfig, overrides)
    logger.info('强制应用默认配置:', overrides)
  }
}

/**
 * 智能合并配置
 * 根据配置项的优先级和来源智能合并配置
 */
function smartMergeConfig(newConfig: Record<string, any>, source: 'user' | 'component' | 'system' = 'user') {
  if (!newConfig || typeof newConfig !== 'object') return

  const mergedConfig: Record<string, any> = {}

  Object.entries(newConfig).forEach(([key, value]) => {
    const prop = props.componentDefinition?.properties?.[key]
    const currentValue = internalConfig[key]

    // 判断是否应该更新值
    let shouldUpdate = true

    if (prop && typeof prop === 'object') {
      // 检查配置项的更新策略
      const updateStrategy = prop.updateStrategy || 'replace'

      switch (updateStrategy) {
        case 'merge':
          // 合并模式：对象类型进行深度合并
          if (typeof value === 'object' && typeof currentValue === 'object' && !Array.isArray(value)) {
            mergedConfig[key] = { ...currentValue, ...value }
          } else {
            mergedConfig[key] = value
          }
          break

        case 'append':
          // 追加模式：数组类型进行追加
          if (Array.isArray(currentValue) && Array.isArray(value)) {
            mergedConfig[key] = [...currentValue, ...value]
          } else {
            mergedConfig[key] = value
          }
          break

        case 'preserve':
          // 保持模式：如果当前有值则不更新
          if (currentValue === undefined || currentValue === null) {
            mergedConfig[key] = value
          } else {
            shouldUpdate = false
          }
          break

        case 'replace':
        default:
          // 替换模式：直接替换
          mergedConfig[key] = value
          break
      }
    } else {
      // 没有属性定义，直接替换
      mergedConfig[key] = value
    }

    // 根据来源和优先级决定是否更新
    if (shouldUpdate && source === 'system') {
      // 系统级配置有最高优先级
      mergedConfig[key] = value
    } else if (shouldUpdate && source === 'component' && currentValue === undefined) {
      // 组件级配置只在没有值时应用
      mergedConfig[key] = value
    } else if (shouldUpdate && source === 'user') {
      // 用户配置有中等优先级
      if (key in mergedConfig) {
        // 已经在合并配置中，使用合并结果
      } else {
        mergedConfig[key] = value
      }
    }
  })

  // 应用合并后的配置
  if (Object.keys(mergedConfig).length > 0) {
    Object.assign(internalConfig, mergedConfig)
    logger.info(`智能合并配置 (${source}):`, mergedConfig)
  }
}

/**
 * 检查并应用默认配置的最佳时机
 */
function checkAndApplyDefaults() {
  // 检查是否是首次加载
  const isFirstLoad = Object.keys(internalConfig).length === 0

  // 检查是否有组件定义变更
  const hasComponentChanged = props.componentDefinition?.id !== lastComponentId.value

  if (isFirstLoad || hasComponentChanged) {
    // 首次加载或组件变更时应用默认配置
    applyDefaultConfig(isFirstLoad)
    lastComponentId.value = props.componentDefinition?.id || ''
  }
}

// 记录上次的组件ID，用于检测组件变更
const lastComponentId = ref('')

// ====== 配置验证 ======

/**
 * 验证单个配置项
 */
function validateConfigItem(key: string, value: any, prop: any): string[] {
  const errors: string[] = []
  const label = prop.label || key

  // 检查必填项
  if (prop.required && (value === undefined || value === null || value === '')) {
    errors.push(`${label} 是必填项`)
    return errors // 必填项检查失败，跳过其他检查
  }

  // 如果值为空且非必填，跳过其他检查
  if (value === undefined || value === null || value === '') {
    return errors
  }

  // 检查类型
  if (prop.type) {
    const expectedType = prop.type
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (expectedType !== actualType) {
      // 特殊类型转换检查
      if (!(expectedType === 'number' && !isNaN(Number(value)))) {
        errors.push(`${label} 类型错误，期望 ${expectedType}，实际 ${actualType}`)
        return errors // 类型错误，跳过后续检查
      }
    }
  }

  // 数字类型的范围检查
  if (typeof value === 'number' || (prop.type === 'number' && !isNaN(Number(value)))) {
    const numValue = typeof value === 'number' ? value : Number(value)

    if (prop.min !== undefined && numValue < prop.min) {
      errors.push(`${label} 不能小于 ${prop.min}`)
    }
    if (prop.max !== undefined && numValue > prop.max) {
      errors.push(`${label} 不能大于 ${prop.max}`)
    }
    if (prop.step !== undefined && numValue % prop.step !== 0) {
      errors.push(`${label} 必须是 ${prop.step} 的倍数`)
    }
  }

  // 字符串类型的检查
  if (typeof value === 'string' || prop.type === 'string') {
    const strValue = String(value)

    if (prop.minLength !== undefined && strValue.length < prop.minLength) {
      errors.push(`${label} 长度不能小于 ${prop.minLength}`)
    }
    if (prop.maxLength !== undefined && strValue.length > prop.maxLength) {
      errors.push(`${label} 长度不能大于 ${prop.maxLength}`)
    }
    if (prop.pattern && !new RegExp(prop.pattern).test(strValue)) {
      errors.push(`${label} 格式不正确`)
    }
  }

  // 数组类型的检查
  if (Array.isArray(value) || prop.type === 'array') {
    const arrValue = Array.isArray(value) ? value : []

    if (prop.minItems !== undefined && arrValue.length < prop.minItems) {
      errors.push(`${label} 至少需要 ${prop.minItems} 项`)
    }
    if (prop.maxItems !== undefined && arrValue.length > prop.maxItems) {
      errors.push(`${label} 最多只能有 ${prop.maxItems} 项`)
    }
  }

  // 枚举值检查
  if (prop.enum && !prop.enum.includes(value)) {
    errors.push(`${label} 必须是以下值之一: ${prop.enum.join(', ')}`)
  }

  // 自定义验证函数
  if (prop.validator && typeof prop.validator === 'function') {
    try {
      const result = prop.validator(value)
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${label} 验证失败`)
      }
    } catch (err: any) {
      errors.push(`${label} 验证出错: ${err.message}`)
    }
  }

  return errors
}

/**
 * 验证当前配置
 */
function validateConfig() {
  const errors: string[] = []

  if (props.componentDefinition?.properties) {
    Object.entries(props.componentDefinition.properties).forEach(([key, prop]) => {
      if (prop && typeof prop === 'object') {
        const value = internalConfig[key]
        const itemErrors = validateConfigItem(key, value, prop)
        errors.push(...itemErrors)
      }
    })
  }

  // 自定义配置级别的验证
  if (props.componentDefinition?.validator && typeof props.componentDefinition.validator === 'function') {
    try {
      const result = props.componentDefinition.validator(internalConfig)
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : '配置验证失败')
      }
    } catch (err: any) {
      errors.push(`配置验证出错: ${err.message}`)
    }
  }

  validationErrors.value = errors
  emit('validation-change', isValid.value, errors)
}

/**
 * 异步验证配置
 */
async function validateConfigAsync(): Promise<boolean> {
  validateConfig() // 先执行同步验证

  // 如果有异步验证器
  if (props.componentDefinition?.asyncValidator && typeof props.componentDefinition.asyncValidator === 'function') {
    try {
      const result = await props.componentDefinition.asyncValidator(internalConfig)
      if (result !== true) {
        const asyncError = typeof result === 'string' ? result : '异步配置验证失败'
        validationErrors.value = [...validationErrors.value, asyncError]
        emit('validation-change', false, validationErrors.value)
        return false
      }
    } catch (err: any) {
      const asyncError = `异步配置验证出错: ${err.message}`
      validationErrors.value = [...validationErrors.value, asyncError]
      emit('validation-change', false, validationErrors.value)
      return false
    }
  }

  return isValid.value
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

  // 发送重置事件
  emit('config-reset', { ...internalConfig })

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
    hasDefaults: props.componentDefinition?.properties
      ? Object.keys(props.componentDefinition.properties).length > 0
      : false
  }
}

// ====== 生命周期 ======

onMounted(async () => {
  // 加载配置组件
  await loadConfigComponent()

  // 检查并应用默认配置（智能时机）
  checkAndApplyDefaults()

  // 初始验证
  await nextTick()
  validateConfig()
})

// 监听组件定义变化，重新应用默认配置
watch(
  () => props.componentDefinition,
  (newDefinition, oldDefinition) => {
    if (newDefinition?.id !== oldDefinition?.id) {
      logger.info('组件定义已变更，重新应用默认配置')
      checkAndApplyDefaults()
    }
  },
  { deep: true }
)

onUnmounted(() => {
  // 清理资源
  loadedComponent.value = null
})

// ====== 暴露给父组件的方法 ======
defineExpose({
  resetToDefaults,
  validateConfig,
  validateConfigAsync,
  getConfigSummary,
  isValid,
  validationErrors,
  validateConfigItem,
  applyDefaultConfig,
  smartMergeConfig,
  checkAndApplyDefaults
})
</script>

<template>
  <div class="config-wrapper">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="config-loading">
      <n-spin size="medium">
        <template #description>{{ $t('common.loading') }}配置组件...</template>
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
        <component :is="loadedComponent" ref="configRef" v-bind="$attrs" />
      </div>

      <!-- 调试信息（开发环境） -->
      <div v-if="process.env.NODE_ENV === 'development'" class="config-debug mt-4">
        <n-collapse>
          <n-collapse-item title="调试信息" name="debug">
            <div class="space-y-2 text-xs">
              <div>
                <strong>组件ID:</strong>
                {{ componentDefinition?.id }}
              </div>
              <div>
                <strong>配置项数量:</strong>
                {{ Object.keys(internalConfig).length }}
              </div>
              <div>
                <strong>验证状态:</strong>
                {{ isValid ? '通过' : '失败' }}
              </div>
              <div>
                <strong>错误数量:</strong>
                {{ validationErrors.length }}
              </div>
              <div>
                <strong>预览模式:</strong>
                {{ preview ? '是' : '否' }}
              </div>
              <div>
                <strong>兼容模式:</strong>
                {{ legacyMode ? '是' : '否' }}
              </div>

              <n-divider />

              <div><strong>当前配置:</strong></div>
              <pre class="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">{{
                JSON.stringify(internalConfig, null, 2)
              }}</pre>
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
