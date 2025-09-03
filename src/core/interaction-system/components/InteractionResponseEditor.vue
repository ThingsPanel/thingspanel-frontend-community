<template>
  <div class="interaction-response-editor">
    <n-form label-placement="left" label-width="80" size="small">
      <!-- 动作类型选择 -->
      <n-form-item :label="t('interaction.editor.actionType')">
        <n-select
          v-model:value="localResponse.action"
          :options="actionTypeOptions"
          :disabled="readonly"
          @update:value="handleActionChange"
        />
      </n-form-item>

      <!-- 🔥 核心动作配置项（简化为2个） -->
      <template v-if="localResponse.action === 'navigateToUrl'">
        <n-form-item :label="t('interaction.editor.linkType')">
          <n-radio-group v-model:value="urlType" :disabled="readonly" @update:value="handleUrlTypeChange">
            <n-space>
              <n-radio value="external">{{ t('interaction.linkTypes.external') }}</n-radio>
              <n-radio value="internal">{{ t('interaction.linkTypes.internal') }}</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>

        <n-form-item v-if="urlType === 'external'" :label="t('interaction.editor.jumpAddress')">
          <n-input
            v-model:value="localResponse.value"
            :placeholder="t('interaction.placeholders.enterUrl')"
            :disabled="readonly"
            @update:value="handleValueChange"
          />
        </n-form-item>

        <n-form-item v-if="urlType === 'internal'" :label="t('interaction.editor.selectMenu')">
          <n-select
            v-model:value="selectedMenuPath"
            :options="menuOptions"
            :placeholder="t('interaction.placeholders.selectMenuToJump')"
            :disabled="readonly"
            :loading="menuLoading"
            filterable
            @update:value="handleMenuPathChange"
          />
        </n-form-item>

        <n-form-item :label="t('interaction.editor.openMethod')">
          <n-select
            v-model:value="navigationTarget"
            :options="navigationTargetOptions"
            :disabled="readonly"
            @update:value="handleNavigationTargetChange"
          />
        </n-form-item>

        <n-form-item v-if="navigationTarget === '_blank'" :label="t('interaction.editor.windowFeatures')">
          <n-input
            v-model:value="windowFeatures"
            :placeholder="t('interaction.placeholders.windowFeatures')"
            :disabled="readonly"
            @update:value="handleWindowFeaturesChange"
          />
        </n-form-item>

        <n-form-item>
          <n-alert :title="t('interaction.editor.usage')" type="info" size="small">
            <ul style="margin: 0; padding-left: 20px; font-size: 12px">
              <li v-if="urlType === 'external'">{{ t('interaction.editor.usageExternal') }}</li>
              <li v-if="urlType === 'external'">{{ t('interaction.editor.usageQuery') }}</li>
              <li v-if="urlType === 'internal'">{{ t('interaction.editor.usageInternal') }}</li>
              <li>{{ t('interaction.editor.usageNewWindow') }}</li>
            </ul>
          </n-alert>
        </n-form-item>
      </template>

      <template v-else-if="localResponse.action === 'updateComponentData'">
        <n-form-item :label="t('interaction.editor.targetComponent')">
          <n-select
            v-model:value="targetComponentId"
            :options="availableComponentOptions"
            :placeholder="t('interaction.placeholders.selectComponentToModify')"
            :disabled="readonly"
            @update:value="handleTargetComponentChange"
          />
        </n-form-item>

        <n-form-item :label="t('interaction.editor.updateProperty')">
          <n-select
            v-model:value="targetProperty"
            :options="targetComponentPropertyOptions"
            :placeholder="t('interaction.messages.selectComponentFirst')"
            :disabled="readonly || !targetComponentId"
            filterable
            clearable
            @update:value="handleTargetPropertyChange"
          >
            <template #empty>
              <div style="padding: 12px; text-align: center; color: var(--text-color-3)">
                <div v-if="!targetComponentId">{{ t('interaction.messages.selectTargetComponentFirst') }}</div>
                <div v-else>
                  <div>{{ t('interaction.messages.noUpdatableProperties') }}</div>
                  <div style="font-size: 12px; margin-top: 4px">
                    {{ t('interaction.messages.noUpdatablePropertiesDesc') }}
                  </div>
                </div>
              </div>
            </template>
          </n-select>
        </n-form-item>

        <n-form-item :label="t('interaction.editor.updateValue')">
          <n-input
            v-model:value="updateValue"
            :placeholder="t('interaction.placeholders.enterNewPropertyValue')"
            :disabled="readonly"
            @update:value="handleUpdateValueChange"
          />
        </n-form-item>

        <n-form-item :label="t('interaction.editor.updateMode')">
          <n-select
            v-model:value="updateMode"
            :options="updateModeOptions"
            :disabled="readonly"
            @update:value="handleUpdateModeChange"
          />
        </n-form-item>

        <n-form-item>
          <n-alert :title="t('interaction.editor.usage')" type="info" size="small">
            <ul style="margin: 0; padding-left: 20px; font-size: 12px">
              <li>{{ t('interaction.editor.usageTargetComponent') }}</li>
              <li>{{ t('interaction.editor.usageUpdateProperty') }}</li>
              <li>{{ t('interaction.editor.usageUpdateValue') }}</li>
              <li>{{ t('interaction.editor.usageUpdateModes') }}</li>
            </ul>
          </n-alert>
        </n-form-item>
      </template>

      <!-- 🔥 已移除其他动作配置项，保持简洁 -->

      <!-- 通用配置项 -->
      <n-form-item v-if="showAdvancedOptions" :label="t('interaction.editor.delayTime')">
        <n-input-number
          v-model:value="localResponse.delay"
          :min="0"
          :max="10000"
          :step="100"
          suffix="ms"
          :placeholder="t('interaction.placeholders.noDelay')"
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
        {{ showAdvancedOptions ? t('interaction.editor.hideAdvanced') : t('interaction.editor.showAdvanced')
        }}{{ t('interaction.editor.advancedOptions') }}
      </n-button>
    </div>

    <!-- 预览区域 -->
    <div v-if="!readonly" class="preview-section">
      <div class="preview-header">
        <span class="preview-title">{{ t('interaction.editor.effectPreview') }}</span>
        <n-button size="tiny" type="primary" :disabled="!canPreview" @click="previewEffect">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          {{ t('interaction.template.preview') }}
        </n-button>
      </div>

      <div class="preview-content">
        <div ref="previewElement" class="preview-element" :style="previewStyles">
          {{ t('interaction.editor.previewElement') }}
        </div>
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
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

// 🔥 注入Visual Editor状态获取组件列表
const visualEditorState = inject<{ getAvailableComponents: () => any[] }>('visualEditorState', {
  getAvailableComponents: () => {
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
const actionTypeOptions = computed(() => [
  { label: t('interaction.actions.navigateToUrl'), value: 'navigateToUrl', category: 'navigation' },
  { label: t('interaction.actions.updateComponentData'), value: 'updateComponentData', category: 'property' }
])

// 🔥 极简版：仅保留最核心的URL跳转和属性修改功能

// 🔥 导航目标选项
const navigationTargetOptions = computed(() => [
  { label: t('interaction.openMethods.currentWindow'), value: '_self' },
  { label: t('interaction.openMethods.newWindow'), value: '_blank' },
  { label: t('interaction.openMethods.parentWindow'), value: '_parent' },
  { label: t('interaction.openMethods.topWindow'), value: '_top' }
])

// 🔥 动态获取可用组件选项
const availableComponentOptions = computed(() => {
  const components = visualEditorState.getAvailableComponents()

  return components.map(comp => ({
    label: comp.label || `${comp.name} (${comp.id.slice(0, 8)}...)`,
    value: comp.id,
    type: comp.type // 保存组件类型，用于获取属性
  }))
})

// 🔥 根据目标组件获取可更新属性选项
const targetComponentPropertyOptions = computed(() => {
  if (!targetComponentId.value) {
    return []
  }

  // 根据组件ID找到组件类型
  const components = visualEditorState.getAvailableComponents()
  const targetComponent = components.find(comp => comp.id === targetComponentId.value)

  if (!targetComponent) {
    return []
  }


  // 获取该组件类型的可监听属性（作为可更新属性使用）
  const componentExposure = propertyExposureRegistry.getComponentExposure(targetComponent.type)

  if (!componentExposure || !componentExposure.listenableProperties) {
    return []
  }

  // 转换为选择器选项格式，按分组组织
  const groupedOptions: any[] = []
  const groups: Record<string, any[]> = {}

  componentExposure.listenableProperties.forEach(property => {
    const group = property.group || t('interaction.empty.otherGroup')
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
  return options
})

// 🔥 更新模式选项
const updateModeOptions = computed(() => [
  { label: t('interaction.updateModes.replace'), value: 'replace' },
  { label: t('interaction.updateModes.append'), value: 'append' },
  { label: t('interaction.updateModes.prepend'), value: 'prepend' }
])

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


  // 🔥 2个核心动作的默认值
  const defaultValues: Record<string, any> = {
    navigateToUrl: 'https://example.com',
    updateComponentData: ''
  }

  localResponse.value.value = defaultValues[localResponse.value.action]


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
    message.error(t('interaction.messages.menuLoadFailed'))
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
        message.success(t('interaction.preview.jumpTo', { url: localResponse.value.value }))
        return
      case 'updateComponentData':
        // 跨组件数据更新预览提示
        const targetComp = targetComponentId.value || t('interaction.empty.component')
        const targetProp = targetProperty.value || t('interaction.empty.property')
        const updateVal = updateValue.value || t('interaction.placeholders.value')
        message.info(
          t('interaction.preview.willUpdate', { component: targetComp, property: targetProp, value: updateVal })
        )
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

        message.success(t('interaction.preview.flashPreview', { color, times, duration }))
        return
    }

    // 延迟恢复
    setTimeout(() => {
      element.style.cssText = originalStyle
      if (localResponse.value.action === 'changeContent') {
        element.textContent = t('interaction.editor.previewElement')
      }
    }, localResponse.value.duration || 1000)

    message.success(t('interaction.messages.previewEffectApplied'))
  } catch (error) {
    message.error(t('interaction.messages.previewFailed'))
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
