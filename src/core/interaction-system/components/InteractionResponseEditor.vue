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

      <!-- 🔥 核心动作配置项（简化为2个） -->
      <template v-if="localResponse.action === 'navigateToUrl'">
        <n-form-item label="链接类型">
          <n-radio-group v-model:value="urlType" :disabled="readonly" @update:value="handleUrlTypeChange">
            <n-space>
              <n-radio value="external">外部链接</n-radio>
              <n-radio value="internal">内部菜单</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item v-if="urlType === 'external'" label="跳转地址">
          <n-input
            v-model:value="localResponse.value"
            placeholder="https://example.com 或 /relative-path"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>

        <n-form-item v-if="urlType === 'internal'" label="选择菜单">
          <n-select
            v-model:value="selectedMenuPath"
            :options="menuOptions"
            placeholder="选择要跳转的菜单项"
            :disabled="readonly"
            :loading="menuLoading"
            filterable
            @update:value="handleMenuPathChange"
          />
        </n-form-item>

        <n-form-item label="打开方式">
          <n-select
            v-model:value="navigationTarget"
            :options="navigationTargetOptions"
            :disabled="readonly"
            @update:value="handleNavigationTargetChange"
          />
        </n-form-item>

        <n-form-item v-if="navigationTarget === '_blank'" label="窗口特性">
          <n-input
            v-model:value="windowFeatures"
            placeholder="width=800,height=600,scrollbars=yes"
            :disabled="readonly"
            @update:value="handleWindowFeaturesChange"
          />
        </n-form-item>

        <n-form-item>
          <n-alert title="使用说明" type="info" size="small">
            <ul style="margin: 0; padding-left: 20px; font-size: 12px">
              <li v-if="urlType === 'external'">外部链接：支持完整URL和相对路径</li>
              <li v-if="urlType === 'external'">支持查询参数: /page?id=123&name=test</li>
              <li v-if="urlType === 'internal'">内部菜单：从系统菜单中选择跳转目标</li>
              <li>新窗口打开可配置窗口大小和特性</li>
            </ul>
          </n-alert>
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'updateComponentData'">
        <n-form-item label="目标组件">
          <n-select
            v-model:value="targetComponentId"
            :options="availableComponentOptions"
            placeholder="选择要更新数据的目标组件"
            :disabled="readonly"
            @update:value="handleTargetComponentChange"
          />
        </n-form-item>

        <n-form-item label="更新属性">
          <n-select
            v-model:value="targetProperty"
            :options="targetComponentPropertyOptions"
            placeholder="请先选择目标组件，然后选择要更新的属性"
            :disabled="readonly || !targetComponentId"
            filterable
            clearable
            @update:value="handleTargetPropertyChange"
          >
            <template #empty>
              <div style="padding: 12px; text-align: center; color: var(--text-color-3)">
                <div v-if="!targetComponentId">请先选择目标组件</div>
                <div v-else>
                  <div>目标组件暂无可更新属性</div>
                  <div style="font-size: 12px; margin-top: 4px">组件开发者需要暴露可更新的属性</div>
                </div>
              </div>
            </template>
          </n-select>
        </n-form-item>

        <n-form-item label="更新值">
          <n-input
            v-model:value="updateValue"
            placeholder="新的属性值"
            :disabled="readonly"
            @update:value="handleUpdateValueChange"
          />
        </n-form-item>

        <n-form-item label="更新模式">
          <n-select
            v-model:value="updateMode"
            :options="updateModeOptions"
            :disabled="readonly"
            @update:value="handleUpdateModeChange"
          />
        </n-form-item>

        <n-form-item>
          <n-alert title="使用说明" type="info" size="small">
            <ul style="margin: 0; padding-left: 20px; font-size: 12px">
              <li>目标组件：选择要更新数据的组件</li>
              <li>更新属性：组件的属性名，如title、content等</li>
              <li>更新值：要设置的新值</li>
              <li>覆盖：直接替换原值；追加：添加到原值后面；前置：添加到原值前面</li>
            </ul>
          </n-alert>
        </n-form-item>
      </template>

      <!-- 🔥 已移除其他动作配置项，保持简洁 -->

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

import { ref, computed, watch, onMounted, inject } from 'vue'
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
  NRadioGroup,
  NRadio,
  NSpace,
  useMessage
} from 'naive-ui'
import { ChevronDownOutline, ChevronUpOutline, PlayOutline } from '@vicons/ionicons5'

import type { InteractionResponse, InteractionActionType } from '@/card2.1/core/interaction-types'
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'
import { fetchGetUserRoutes } from '@/service/api/route'

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

// 🔥 注入Visual Editor状态获取组件列表
const visualEditorState = inject<{ getAvailableComponents: () => any[] }>('visualEditorState', {
  getAvailableComponents: () => {
    console.log('[INTERACTION-DEBUG] [ResponseEditor] Visual Editor状态未注入，返回空组件列表')
    return []
  }
})

// 响应式状态
const localResponse = ref<InteractionResponse>({ ...props.modelValue })
const showAdvancedOptions = ref(false)
const previewElement = ref<HTMLElement>()

// 🔥 极简版：最小状态管理

// 🔥 URL跳转相关状态
const navigationTarget = ref('_self')
const windowFeatures = ref('width=800,height=600,scrollbars=yes,resizable=yes')

// 🔥 跨组件数据更新相关状态
const targetComponentId = ref('')
const targetProperty = ref('')
const updateValue = ref('')
const updateMode = ref('replace')

// 🔥 闪烁颜色相关状态
const flashColor = ref('#ff0000')
const flashTimes = ref(3)
const flashDuration = ref(1000)

// 🔥 URL类型和菜单相关状态
const urlType = ref<'external' | 'internal'>('external')
const selectedMenuPath = ref('')
const menuOptions = ref<{ label: string; value: string }[]>([])
const menuLoading = ref(false)

// 🔥 2个核心动作选项（极简版：去掉动效，只保留最核心功能）
const actionTypeOptions = [
  { label: '跳转到URL', value: 'navigateToUrl', category: 'navigation' },
  { label: '修改组件属性', value: 'updateComponentData', category: 'property' }
]

// 🔥 极简版：仅保留最核心的URL跳转和属性修改功能

// 🔥 导航目标选项
const navigationTargetOptions = [
  { label: '当前窗口', value: '_self' },
  { label: '新窗口', value: '_blank' },
  { label: '父窗口', value: '_parent' },
  { label: '顶级窗口', value: '_top' }
]

// 🔥 动态获取可用组件选项
const availableComponentOptions = computed(() => {
  const components = visualEditorState.getAvailableComponents()

  console.log('[INTERACTION-DEBUG] [ResponseEditor] 计算可用组件选项:', {
    componentCount: components.length,
    components: components
  })

  return components.map(comp => ({
    label: comp.label || `${comp.name} (${comp.id.slice(0, 8)}...)`,
    value: comp.id,
    type: comp.type // 保存组件类型，用于获取属性
  }))
})

// 🔥 根据目标组件获取可更新属性选项
const targetComponentPropertyOptions = computed(() => {
  if (!targetComponentId.value) {
    console.log('[INTERACTION-DEBUG] [ResponseEditor] 未选择目标组件')
    return []
  }

  // 根据组件ID找到组件类型
  const components = visualEditorState.getAvailableComponents()
  const targetComponent = components.find(comp => comp.id === targetComponentId.value)

  if (!targetComponent) {
    console.log('[INTERACTION-DEBUG] [ResponseEditor] 未找到目标组件:', targetComponentId.value)
    return []
  }

  console.log('[INTERACTION-DEBUG] [ResponseEditor] 目标组件:', {
    id: targetComponent.id,
    type: targetComponent.type
  })

  // 获取该组件类型的可监听属性（作为可更新属性使用）
  const componentExposure = propertyExposureRegistry.getComponentExposure(targetComponent.type)

  if (!componentExposure || !componentExposure.listenableProperties) {
    console.log('[INTERACTION-DEBUG] [ResponseEditor] 目标组件无可更新属性')
    return []
  }

  // 转换为选择器选项格式，按分组组织
  const groupedOptions: any[] = []
  const groups: Record<string, any[]> = {}

  componentExposure.listenableProperties.forEach(property => {
    const group = property.group || '其他'
    if (!groups[group]) {
      groups[group] = []
    }

    groups[group].push({
      label: `${property.label}${property.description ? ` (${property.description})` : ''}`,
      value: property.name,
      property // 保存完整属性信息
    })
  })

  // 转换为分组选项格式
  Object.entries(groups).forEach(([groupName, options]) => {
    if (options.length > 0) {
      groupedOptions.push({
        type: 'group',
        label: groupName,
        key: groupName,
        children: options
      })
    }
  })

  const options = groupedOptions.length > 0 ? groupedOptions : []

  console.log('[INTERACTION-DEBUG] [ResponseEditor] 目标组件可更新属性:', options)
  return options
})

// 🔥 更新模式选项
const updateModeOptions = [
  { label: '覆盖', value: 'replace' },
  { label: '追加', value: 'append' },
  { label: '前置', value: 'prepend' }
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
    // 🔥 可见性现在通过属性修改处理，不再需要单独的预览
  }

  return styles
})

// 初始化复合值
const initializeComplexValues = () => {
  // 🔥 极简版：去掉所有复杂的初始化

  // 🔥 初始化URL跳转相关值
  if (localResponse.value.action === 'navigateToUrl') {
    const url = localResponse.value.value as string
    // 判断是外部链接还是内部路径
    if (url && (url.startsWith('http') || url.startsWith('https'))) {
      urlType.value = 'external'
    } else if (url) {
      urlType.value = 'internal'
      selectedMenuPath.value = url
    }

    if (localResponse.value.target) {
      navigationTarget.value = localResponse.value.target as string
    }
    if (localResponse.value.windowFeatures) {
      windowFeatures.value = localResponse.value.windowFeatures as string
    }
  }

  // 🔥 初始化跨组件数据更新相关值
  if (localResponse.value.action === 'updateComponentData' && localResponse.value.targetComponentId) {
    targetComponentId.value = localResponse.value.targetComponentId as string
    targetProperty.value = (localResponse.value.targetProperty as string) || ''
    updateValue.value = (localResponse.value.updateValue as string) || ''
    updateMode.value = (localResponse.value.updateMode as string) || 'replace'
  }

  // 🔥 初始化闪烁颜色相关值
  if (localResponse.value.action === 'flashColor' && localResponse.value.value) {
    if (typeof localResponse.value.value === 'object') {
      const config = localResponse.value.value
      flashColor.value = config.color || '#ff0000'
      flashTimes.value = config.times || 3
      flashDuration.value = config.duration || 1000
    } else {
      flashColor.value = (localResponse.value.value as string) || '#ff0000'
    }
  }
}

// 事件处理函数
const handleActionChange = () => {
  console.log('[INTERACTION-DEBUG] ResponseEditor动作类型变化:', {
    oldAction: localResponse.value.action,
    newAction: localResponse.value.action
  })

  // 🔥 2个核心动作的默认值
  const defaultValues: Record<string, any> = {
    navigateToUrl: 'https://example.com',
    updateComponentData: ''
  }

  localResponse.value.value = defaultValues[localResponse.value.action]

  console.log('[INTERACTION-DEBUG] 应用默认值:', {
    action: localResponse.value.action,
    defaultValue: localResponse.value.value
  })

  // 🔥 简化版：重新初始化复合值
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

// 🔥 极简版：去除所有动画相关处理函数

const handleDelayChange = () => {
  emitUpdate()
}

// 🔥 移除自定义值处理函数（不在核心动作中）

// 🔥 URL跳转相关处理函数
const handleNavigationTargetChange = () => {
  localResponse.value.target = navigationTarget.value
  emitUpdate()
}

const handleWindowFeaturesChange = () => {
  localResponse.value.windowFeatures = windowFeatures.value
  emitUpdate()
}

// 🔥 跨组件数据更新相关处理函数
const handleTargetComponentChange = () => {
  console.log('[INTERACTION-DEBUG] [ResponseEditor] 目标组件变化:', {
    oldComponent: localResponse.value.targetComponentId,
    newComponent: targetComponentId.value
  })

  localResponse.value.targetComponentId = targetComponentId.value

  // 清空之前选择的属性，因为不同组件的属性不同
  targetProperty.value = ''
  localResponse.value.targetProperty = ''

  emitUpdate()
}

const handleTargetPropertyChange = () => {
  localResponse.value.targetProperty = targetProperty.value
  emitUpdate()
}

const handleUpdateValueChange = () => {
  localResponse.value.updateValue = updateValue.value
  emitUpdate()
}

const handleUpdateModeChange = () => {
  localResponse.value.updateMode = updateMode.value
  emitUpdate()
}

// 🔥 闪烁颜色相关处理函数
const handleFlashColorChange = () => {
  updateFlashConfig()
}

const handleFlashTimesChange = () => {
  updateFlashConfig()
}

const handleFlashDurationChange = () => {
  updateFlashConfig()
}

const updateFlashConfig = () => {
  localResponse.value.value = {
    color: flashColor.value,
    times: flashTimes.value,
    duration: flashDuration.value
  }
  emitUpdate()
}

// 🔥 URL类型和菜单相关处理函数
const handleUrlTypeChange = () => {
  if (urlType.value === 'internal') {
    // 切换到内部菜单时，加载菜单选项
    loadMenuOptions()
  } else {
    // 切换到外部链接时，清空菜单选择
    selectedMenuPath.value = ''
  }
}

const handleMenuPathChange = () => {
  localResponse.value.value = selectedMenuPath.value
  emitUpdate()
}

const loadMenuOptions = async () => {
  if (menuOptions.value.length > 0) return // 如果已经加载过，直接返回

  menuLoading.value = true
  try {
    const result = await fetchGetUserRoutes()
    if (result && result.data && result.data.list) {
      // 将路由数据转换为选项格式
      menuOptions.value = flattenRoutes(result.data.list)
    }
  } catch (error) {
    console.error('加载菜单失败:', error)
    message.error('加载菜单失败')
  } finally {
    menuLoading.value = false
  }
}

// 扁平化路由数据，转换为选项格式
const flattenRoutes = (routes: any[], prefix = ''): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = []

  for (const route of routes) {
    // 使用 param1 作为路径，description 作为标签
    const path = route.param1
    const title = route.description || route.multilingual || route.element_code
    const fullLabel = prefix ? `${prefix} / ${title}` : title

    if (path && title) {
      options.push({
        label: fullLabel,
        value: path
      })
    }

    // 递归处理子路由
    if (route.children && route.children.length > 0) {
      options.push(...flattenRoutes(route.children, fullLabel))
    }
  }

  return options
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
      // 🔥 移除 changeTransform 和 changeVisibility 预览（已合并或移除）
      case 'changeContent':
        element.textContent = localResponse.value.value
        break
      // 🔥 移除动画预览功能
      case 'navigateToUrl':
        // URL跳转预览提示
        message.success(`将跳转到: ${localResponse.value.value}`)
        return
      case 'updateComponentData':
        // 跨组件数据更新预览提示
        const targetComp = targetComponentId.value || '目标组件'
        const targetProp = targetProperty.value || '属性'
        const updateVal = updateValue.value || '值'
        message.info(`将更新 ${targetComp} 的 ${targetProp} 为: ${updateVal}`)
        return
      case 'flashColor':
        // 闪烁颜色预览效果
        const flashConfig = localResponse.value.value
        const color = flashConfig.color || flashColor.value
        const times = flashConfig.times || flashTimes.value
        const duration = flashConfig.duration || flashDuration.value

        let currentFlash = 0
        const originalBgColor = element.style.backgroundColor
        const flashInterval = duration / (times * 2)

        const interval = setInterval(() => {
          const isFlashOn = currentFlash % 2 === 0
          element.style.backgroundColor = isFlashOn ? color : originalBgColor

          currentFlash++
          if (currentFlash >= times * 2) {
            clearInterval(interval)
            element.style.backgroundColor = originalBgColor
          }
        }, flashInterval)

        message.success(`闪烁预览: ${color}, ${times}次, ${duration}ms`)
        return
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
  console.log('[INTERACTION-DEBUG] ResponseEditor发出更新事件:', {
    action: localResponse.value.action,
    value: localResponse.value.value,
    fullResponse: localResponse.value
  })

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
