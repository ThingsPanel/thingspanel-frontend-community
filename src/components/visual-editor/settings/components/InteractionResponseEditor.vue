<template>
  <div class="interaction-response-editor">
    <n-form label-placement="left" label-width="80" size="small">
      <!-- 动作类型选择 -->
      <n-form-item label="动作类型">
        <n-select
          v-model:value="localResponse.action"
          :options="actionTypeOptions"
          :disabled="readonly"
          @update:value="handleActionChange"
        />
      </n-form-item>

      <!-- 根据动作类型显示不同的配置项 -->
      <template v-if="localResponse.action === 'changeBackgroundColor'">
        <n-form-item label="背景颜色">
          <n-color-picker
            v-model:value="localResponse.value"
            :show-alpha="true"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeTextColor'">
        <n-form-item label="文字颜色">
          <n-color-picker
            v-model:value="localResponse.value"
            :show-alpha="false"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeBorderColor'">
        <n-form-item label="边框颜色">
          <n-color-picker
            v-model:value="localResponse.value"
            :show-alpha="false"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeSize'">
        <n-form-item label="宽度">
          <n-input-number
            v-model:value="sizeValue.width"
            :min="0"
            :max="2000"
            suffix="px"
            :disabled="readonly"
            @update:value="handleSizeChange"
          />
        </n-form-item>
        <n-form-item label="高度">
          <n-input-number
            v-model:value="sizeValue.height"
            :min="0"
            :max="2000"
            suffix="px"
            :disabled="readonly"
            @update:value="handleSizeChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeOpacity'">
        <n-form-item label="透明度">
          <n-slider
            v-model:value="localResponse.value"
            :min="0"
            :max="1"
            :step="0.01"
            :format-tooltip="value => `${Math.round(value * 100)}%`"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeTransform'">
        <n-form-item label="变换类型">
          <n-select
            v-model:value="transformType"
            :options="transformTypeOptions"
            :disabled="readonly"
            @update:value="handleTransformTypeChange"
          />
        </n-form-item>

        <n-form-item v-if="transformType === 'rotate'" label="旋转角度">
          <n-input-number
            v-model:value="transformValue"
            :min="-360"
            :max="360"
            suffix="deg"
            :disabled="readonly"
            @update:value="handleTransformValueChange"
          />
        </n-form-item>

        <n-form-item v-else-if="transformType === 'scale'" label="缩放倍数">
          <n-input-number
            v-model:value="transformValue"
            :min="0.1"
            :max="5"
            :step="0.1"
            :disabled="readonly"
            @update:value="handleTransformValueChange"
          />
        </n-form-item>

        <n-form-item v-else-if="transformType === 'translateX'" label="水平位移">
          <n-input-number
            v-model:value="transformValue"
            :min="-500"
            :max="500"
            suffix="px"
            :disabled="readonly"
            @update:value="handleTransformValueChange"
          />
        </n-form-item>

        <n-form-item v-else-if="transformType === 'translateY'" label="垂直位移">
          <n-input-number
            v-model:value="transformValue"
            :min="-500"
            :max="500"
            suffix="px"
            :disabled="readonly"
            @update:value="handleTransformValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeVisibility'">
        <n-form-item label="可见性">
          <n-select
            v-model:value="localResponse.value"
            :options="visibilityOptions"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'changeContent'">
        <n-form-item label="内容">
          <n-input
            v-model:value="localResponse.value"
            type="textarea"
            :rows="3"
            placeholder="输入新内容"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'triggerAnimation'">
        <n-form-item label="动画类型">
          <n-select
            v-model:value="animationType"
            :options="animationTypeOptions"
            :disabled="readonly"
            @update:value="handleAnimationTypeChange"
          />
        </n-form-item>

        <n-form-item label="持续时间">
          <n-input-number
            v-model:value="localResponse.duration"
            :min="100"
            :max="5000"
            :step="100"
            suffix="ms"
            :disabled="readonly"
            @update:value="handleDurationChange"
          />
        </n-form-item>

        <n-form-item label="缓动函数">
          <n-select
            v-model:value="localResponse.easing"
            :options="easingOptions"
            :disabled="readonly"
            @update:value="handleEasingChange"
          />
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'custom'">
        <n-form-item label="自定义值">
          <n-input
            v-model:value="customValueText"
            type="textarea"
            :rows="4"
            placeholder="输入JSON格式的自定义值"
            :disabled="readonly"
            @update:value="handleCustomValueChange"
          />
        </n-form-item>

        <n-form-item>
          <n-alert v-if="customValueError" type="error" size="small">
            {{ customValueError }}
          </n-alert>
        </n-form-item>
      </template>

      <!-- 通用配置项 -->
      <n-form-item v-if="showAdvancedOptions" label="延迟时间">
        <n-input-number
          v-model:value="localResponse.delay"
          :min="0"
          :max="10000"
          :step="100"
          suffix="ms"
          placeholder="无延迟"
          :disabled="readonly"
          @update:value="handleDelayChange"
        />
      </n-form-item>
    </n-form>

    <!-- 高级选项切换 -->
    <div class="advanced-toggle">
      <n-button text type="primary" size="small" @click="showAdvancedOptions = !showAdvancedOptions">
        <template #icon>
          <n-icon>
            <ChevronDownOutline v-if="!showAdvancedOptions" />
            <ChevronUpOutline v-else />
          </n-icon>
        </template>
        {{ showAdvancedOptions ? '隐藏' : '显示' }}高级选项
      </n-button>
    </div>

    <!-- 预览区域 -->
    <div v-if="!readonly" class="preview-section">
      <div class="preview-header">
        <span class="preview-title">效果预览</span>
        <n-button size="tiny" type="primary" :disabled="!canPreview" @click="previewEffect">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          预览
        </n-button>
      </div>

      <div class="preview-content">
        <div ref="previewElement" class="preview-element" :style="previewStyles">预览元素</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互响应动作编辑器
 * 用于配置具体的交互响应动作及其参数
 */

import { ref, computed, watch, onMounted } from 'vue'
import {
  NForm,
  NFormItem,
  NSelect,
  NColorPicker,
  NInputNumber,
  NSlider,
  NInput,
  NButton,
  NIcon,
  NAlert,
  useMessage
} from 'naive-ui'
import { ChevronDownOutline, ChevronUpOutline, PlayOutline } from '@vicons/ionicons5'

import type { InteractionResponse, InteractionActionType } from '@/card2.1/core/interaction-types'

interface Props {
  modelValue: InteractionResponse
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: InteractionResponse): void
  (e: 'update', value: InteractionResponse): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<Emits>()
const message = useMessage()

// 响应式状态
const localResponse = ref<InteractionResponse>({ ...props.modelValue })
const showAdvancedOptions = ref(false)
const previewElement = ref<HTMLElement>()

// 复合值状态
const sizeValue = ref({ width: 200, height: 150 })
const transformType = ref('rotate')
const transformValue = ref(0)
const animationType = ref('pulse')
const customValueText = ref('')
const customValueError = ref('')

// 动作类型选项
const actionTypeOptions = [
  { label: '改变背景颜色', value: 'changeBackgroundColor' },
  { label: '改变文字颜色', value: 'changeTextColor' },
  { label: '改变边框颜色', value: 'changeBorderColor' },
  { label: '改变大小', value: 'changeSize' },
  { label: '改变透明度', value: 'changeOpacity' },
  { label: '改变变换', value: 'changeTransform' },
  { label: '改变可见性', value: 'changeVisibility' },
  { label: '改变内容', value: 'changeContent' },
  { label: '触发动画', value: 'triggerAnimation' },
  { label: '自定义动作', value: 'custom' }
]

// 可见性选项
const visibilityOptions = [
  { label: '显示', value: 'visible' },
  { label: '隐藏', value: 'hidden' }
]

// 变换类型选项
const transformTypeOptions = [
  { label: '旋转', value: 'rotate' },
  { label: '缩放', value: 'scale' },
  { label: '水平位移', value: 'translateX' },
  { label: '垂直位移', value: 'translateY' }
]

// 动画类型选项
const animationTypeOptions = [
  { label: '脉冲', value: 'pulse' },
  { label: '闪烁', value: 'flash' },
  { label: '摇摆', value: 'shake' },
  { label: '弹跳', value: 'bounce' },
  { label: '渐变', value: 'fadeIn' }
]

// 缓动函数选项
const easingOptions = [
  { label: '线性', value: 'linear' },
  { label: '缓入', value: 'ease-in' },
  { label: '缓出', value: 'ease-out' },
  { label: '缓入缓出', value: 'ease-in-out' }
]

// 计算属性
const canPreview = computed(() => {
  return localResponse.value.action && localResponse.value.value !== undefined
})

const previewStyles = computed(() => {
  const styles: Record<string, any> = {
    transition: 'all 0.3s ease',
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--card-color)',
    color: 'var(--text-color)',
    textAlign: 'center',
    userSelect: 'none'
  }

  // 根据动作类型应用预览样式
  switch (localResponse.value.action) {
    case 'changeBackgroundColor':
      styles.backgroundColor = localResponse.value.value
      break
    case 'changeTextColor':
      styles.color = localResponse.value.value
      break
    case 'changeBorderColor':
      styles.borderColor = localResponse.value.value
      break
    case 'changeOpacity':
      styles.opacity = localResponse.value.value
      break
    case 'changeVisibility':
      styles.visibility = localResponse.value.value
      break
  }

  return styles
})

// 初始化复合值
const initializeComplexValues = () => {
  // 初始化尺寸值
  if (localResponse.value.action === 'changeSize' && localResponse.value.value) {
    const size = localResponse.value.value as { width?: number; height?: number }
    sizeValue.value = {
      width: size.width || 200,
      height: size.height || 150
    }
  }

  // 初始化变换值
  if (localResponse.value.action === 'changeTransform' && localResponse.value.value) {
    const transform = localResponse.value.value as string
    if (transform.includes('rotate')) {
      transformType.value = 'rotate'
      transformValue.value = parseFloat(transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/)?.[1] || '0')
    } else if (transform.includes('scale')) {
      transformType.value = 'scale'
      transformValue.value = parseFloat(transform.match(/scale\((-?\d+(?:\.\d+)?)\)/)?.[1] || '1')
    } else if (transform.includes('translateX')) {
      transformType.value = 'translateX'
      transformValue.value = parseFloat(transform.match(/translateX\((-?\d+(?:\.\d+)?)px\)/)?.[1] || '0')
    } else if (transform.includes('translateY')) {
      transformType.value = 'translateY'
      transformValue.value = parseFloat(transform.match(/translateY\((-?\d+(?:\.\d+)?)px\)/)?.[1] || '0')
    }
  }

  // 初始化动画类型
  if (localResponse.value.action === 'triggerAnimation') {
    animationType.value = (localResponse.value.value as string) || 'pulse'
  }

  // 初始化自定义值
  if (localResponse.value.action === 'custom') {
    try {
      customValueText.value = JSON.stringify(localResponse.value.value, null, 2)
    } catch {
      customValueText.value = String(localResponse.value.value || '')
    }
  }
}

// 事件处理函数
const handleActionChange = () => {
  // 重置值当动作类型改变时
  const defaultValues: Record<InteractionActionType, any> = {
    changeBackgroundColor: '#ff6b6b',
    changeTextColor: '#333333',
    changeBorderColor: '#18a058',
    changeSize: { width: 200, height: 150 },
    changeOpacity: 0.8,
    changeTransform: 'rotate(0deg)',
    changeVisibility: 'visible',
    changeContent: '新内容',
    triggerAnimation: 'pulse',
    custom: {}
  }

  localResponse.value.value = defaultValues[localResponse.value.action]

  // 重新初始化复合值
  initializeComplexValues()

  emitUpdate()
}

const handleValueChange = () => {
  emitUpdate()
}

const handleSizeChange = () => {
  localResponse.value.value = { ...sizeValue.value }
  emitUpdate()
}

const handleTransformTypeChange = () => {
  transformValue.value = 0
  handleTransformValueChange()
}

const handleTransformValueChange = () => {
  const transformMap = {
    rotate: `rotate(${transformValue.value}deg)`,
    scale: `scale(${transformValue.value})`,
    translateX: `translateX(${transformValue.value}px)`,
    translateY: `translateY(${transformValue.value}px)`
  }

  localResponse.value.value = transformMap[transformType.value]
  emitUpdate()
}

const handleAnimationTypeChange = () => {
  localResponse.value.value = animationType.value
  emitUpdate()
}

const handleDurationChange = () => {
  emitUpdate()
}

const handleEasingChange = () => {
  emitUpdate()
}

const handleDelayChange = () => {
  emitUpdate()
}

const handleCustomValueChange = () => {
  try {
    localResponse.value.value = JSON.parse(customValueText.value)
    customValueError.value = ''
  } catch (error) {
    customValueError.value = '无效的JSON格式'
    // 保持原值不变
  }
  emitUpdate()
}

// 预览效果
const previewEffect = () => {
  if (!previewElement.value || !canPreview.value) return

  const element = previewElement.value
  const originalStyle = element.style.cssText

  try {
    // 应用效果
    switch (localResponse.value.action) {
      case 'changeBackgroundColor':
        element.style.backgroundColor = localResponse.value.value
        break
      case 'changeTextColor':
        element.style.color = localResponse.value.value
        break
      case 'changeBorderColor':
        element.style.borderColor = localResponse.value.value
        break
      case 'changeSize':
        const size = localResponse.value.value as { width?: number; height?: number }
        if (size.width) element.style.width = `${size.width}px`
        if (size.height) element.style.height = `${size.height}px`
        break
      case 'changeOpacity':
        element.style.opacity = String(localResponse.value.value)
        break
      case 'changeTransform':
        element.style.transform = localResponse.value.value
        break
      case 'changeVisibility':
        element.style.visibility = localResponse.value.value
        break
      case 'changeContent':
        element.textContent = localResponse.value.value
        break
      case 'triggerAnimation':
        element.style.animation = `${localResponse.value.value} ${localResponse.value.duration || 1000}ms ${localResponse.value.easing || 'ease'}`
        break
    }

    // 延迟恢复
    setTimeout(() => {
      element.style.cssText = originalStyle
      if (localResponse.value.action === 'changeContent') {
        element.textContent = '预览元素'
      }
    }, localResponse.value.duration || 1000)

    message.success('预览效果已应用')
  } catch (error) {
    message.error('预览失败')
    console.error('预览错误:', error)
  }
}

// 发出更新事件
const emitUpdate = () => {
  emit('update:modelValue', { ...localResponse.value })
  emit('update', { ...localResponse.value })
}

// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    if (JSON.stringify(newValue) !== JSON.stringify(localResponse.value)) {
      localResponse.value = { ...newValue }
      initializeComplexValues()
    }
  },
  { deep: true }
)

// 组件挂载时初始化
onMounted(() => {
  initializeComplexValues()
})
</script>

<style scoped>
.interaction-response-editor {
  width: 100%;
}

.advanced-toggle {
  margin: 12px 0;
  text-align: center;
}

.preview-section {
  margin-top: 16px;
  padding: 12px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
}

.preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
}

.preview-element {
  min-width: 100px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

/* 表单样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
  font-weight: 500;
}

/* 输入控件样式 */
:deep(.n-input),
:deep(.n-input-number),
:deep(.n-select) {
  width: 100%;
}

/* 滑块样式 */
:deep(.n-slider) {
  margin: 8px 0;
}

/* 颜色选择器样式 */
:deep(.n-color-picker) {
  width: 100%;
}
</style>
