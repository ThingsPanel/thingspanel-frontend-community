<!-- src/core/interaction-system/components/InteractionSettingsForm.vue -->
<template>
  <div class="interaction-settings-form">
    <!-- 表单标题 -->
    <div class="form-header">
      <h3 class="form-title">{{ $t('interaction.settings.title') }}</h3>
      <n-space size="small">
        <n-button size="tiny" type="primary" :disabled="readonly" @click="addInteractionConfig">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          {{ $t('interaction.add') }}
        </n-button>
        <n-button size="tiny" quaternary :disabled="!hasInteractions" @click="previewInteractions">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          {{ $t('interaction.preview') }}
        </n-button>
      </n-space>
    </div>

    <!-- 交互配置列表 -->
    <div v-if="hasInteractions" class="interaction-list">
      <n-card
        v-for="(config, index) in localInteractionConfigs"
        :key="`interaction-${index}`"
        size="small"
        class="interaction-card"
        :class="{ disabled: !config.enabled }"
      >
        <!-- 交互配置头部 -->
        <template #header>
          <div class="interaction-header">
            <div class="interaction-info">
              <n-tag :type="getEventTagType(config.event)" size="small" round>
                {{ getEventDisplayName(config.event) }}
              </n-tag>
              <span class="interaction-title">
                {{ config.name || `${getEventDisplayName(config.event)}${$t('interaction.title')}` }}
              </span>
            </div>
            <div class="interaction-actions">
              <n-switch
                v-model:value="config.enabled"
                size="small"
                :disabled="readonly"
                @update:value="handleInteractionChange"
              />
              <n-dropdown
                :options="getInteractionActionOptions(index)"
                trigger="click"
                @select="key => handleInteractionAction(key, index)"
              >
                <n-button size="tiny" quaternary circle>
                  <template #icon>
                    <n-icon><EllipsisHorizontalOutline /></n-icon>
                  </template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
        </template>

        <!-- 交互配置内容 -->
        <div class="interaction-content">
          <!-- 事件配置 -->
          <n-form label-placement="left" label-width="80" size="small">
            <!-- 🔥 精简触发事件选择（添加事件处理） -->
            <n-form-item :label="$t('interaction.properties.triggerEvent')">
              <n-select
                v-model:value="config.event"
                :options="coreEventOptions"
                :disabled="readonly"
                @update:value="value => handleEventChange(value, index)"
              />
            </n-form-item>

            <!-- 🔥 简化界面 - 高级选项切换按钮 -->
            <div class="advanced-options-toggle">
              <n-button text type="primary" size="small" @click="showAdvancedOptions = !showAdvancedOptions">
                <template #icon>
                  <n-icon>
                    <ChevronDownOutline v-if="!showAdvancedOptions" />
                    <ChevronUpOutline v-else />
                  </n-icon>
                </template>
                {{
                  showAdvancedOptions
                    ? $t('interaction.settings.hideAdvanced')
                    : $t('interaction.settings.showAdvanced')
                }}{{ $t('interaction.settings.advancedOptions') }}
              </n-button>
            </div>

            <!-- 简化后的高级选项 - 条件渲染 -->
            <template v-if="showAdvancedOptions">
              <n-form-item :label="$t('interaction.properties.priority')">
                <n-input-number
                  v-model:value="config.priority"
                  :min="0"
                  :max="100"
                  :disabled="readonly"
                  @update:value="handleInteractionChange"
                />
              </n-form-item>

              <n-form-item :label="$t('interaction.properties.configName')">
                <n-input
                  v-model:value="config.name"
                  :placeholder="$t('interaction.placeholders.customInteractionName')"
                  :disabled="readonly"
                  @update:value="handleInteractionChange"
                />
              </n-form-item>
            </template>

            <!-- 跨组件目标选择 -->
            <n-form-item
              v-if="isInterComponentEvent(config.event)"
              :label="$t('interaction.properties.targetComponent')"
            >
              <n-select
                v-model:value="config.targetComponentId"
                :options="availableComponentOptions"
                :placeholder="$t('interaction.placeholders.selectComponentToModify')"
                :disabled="readonly"
                clearable
                @update:value="handleInteractionChange"
              />
            </n-form-item>

            <!-- 🔥 数据变化监听配置（增强版） -->
            <n-form-item v-if="config.event === 'dataChange'" :label="$t('interaction.properties.watchedProperty')">
              <n-select
                :value="config.watchedProperty"
                :options="availablePropertyOptions"
                :placeholder="$t('interaction.placeholders.selectWatchedProperty')"
                :disabled="readonly"
                filterable
                clearable
                @update:value="value => handleWatchedPropertyChange(value, index)"
              >
                <template #empty>
                  <div style="padding: 12px; text-align: center; color: var(--text-color-3)">
                    <div>{{ $t('interaction.messages.noWatchableProperties') }}</div>
                    <div style="font-size: 12px; margin-top: 4px">
                      {{ $t('interaction.messages.noWatchablePropertiesDesc') }}
                    </div>
                  </div>
                </template>
              </n-select>
            </n-form-item>

            <!-- 传统数据路径输入（作为备选） -->
            <n-form-item
              v-if="config.event === 'dataChange' && showAdvancedOptions"
              :label="$t('interaction.properties.dataPath')"
            >
              <n-input
                v-model:value="config.dataPath"
                placeholder="如: data.temperature 或 properties.value"
                :disabled="readonly"
                @update:value="handleInteractionChange"
              />
            </n-form-item>

            <!-- 🔥 只有「属性改变时」才显示执行条件 -->
            <n-form-item v-if="config.event === 'dataChange'" :label="$t('interaction.properties.executionCondition')">
              <div class="condition-config">
                <n-select
                  :value="config.condition?.type"
                  :options="conditionTypeOptions"
                  :placeholder="$t('interaction.placeholders.conditionType')"
                  :disabled="readonly"
                  style="width: 120px"
                  @update:value="value => handleConditionTypeChange(value, index)"
                />
                <template v-if="config.condition?.type === 'comparison'">
                  <n-select
                    v-model:value="config.condition.operator"
                    :options="comparisonOperatorOptions"
                    :placeholder="$t('interaction.placeholders.comparison')"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                  <n-input
                    v-model:value="config.condition.value"
                    :placeholder="$t('interaction.placeholders.value')"
                    :disabled="readonly"
                    style="flex: 1"
                    @update:value="handleInteractionChange"
                  />
                </template>
                <template v-else-if="config.condition?.type === 'range'">
                  <n-input
                    v-model:value="config.condition.minValue"
                    :placeholder="$t('interaction.placeholders.minValue')"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                  <span>~</span>
                  <n-input
                    v-model:value="config.condition.maxValue"
                    :placeholder="$t('interaction.placeholders.maxValue')"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                </template>
                <template v-else-if="config.condition?.type === 'expression'">
                  <n-input
                    v-model:value="config.condition.expression"
                    :placeholder="$t('interaction.placeholders.expressionValue')"
                    :disabled="readonly"
                    style="flex: 1"
                    @update:value="handleInteractionChange"
                  />
                </template>
              </div>
            </n-form-item>
          </n-form>

          <!-- 响应动作列表 -->
          <div class="responses-section">
            <div class="section-header">
              <span class="section-title">{{ $t('interaction.settings.responseActions') }}</span>
              <n-button
                size="tiny"
                type="primary"
                dashed
                :disabled="readonly"
                @click="
                  () => {
                    addResponse(index)
                  }
                "
              >
                <template #icon>
                  <n-icon><AddOutline /></n-icon>
                </template>
                {{ $t('interaction.settings.addAction') }}
              </n-button>
            </div>

            <div v-if="config.responses.length === 0" class="no-responses">
              <n-empty :description="$t('interaction.settings.noResponseActions')" size="small">
                <template #extra>
                  <n-button
                    size="small"
                    :disabled="readonly"
                    @click="
                      () => {
                        addResponse(index)
                      }
                    "
                  >
                    {{ $t('interaction.settings.addFirstAction') }}
                  </n-button>
                </template>
              </n-empty>
            </div>

            <div v-else class="responses-list">
              <n-card
                v-for="(response, responseIndex) in config.responses"
                :key="`response-${responseIndex}`"
                size="small"
                class="response-card"
              >
                <template #header>
                  <div class="response-header">
                    <n-tag size="small" type="info">
                      {{ getActionDisplayName(response.action) }}
                    </n-tag>
                    <n-button
                      size="tiny"
                      type="error"
                      quaternary
                      circle
                      :disabled="readonly"
                      @click="removeResponse(index, responseIndex)"
                    >
                      <template #icon>
                        <n-icon><TrashOutline /></n-icon>
                      </template>
                    </n-button>
                  </div>
                </template>

                <!-- 响应动作配置 -->
                <InteractionResponseEditor
                  v-model="config.responses[responseIndex]"
                  :readonly="readonly"
                  @update="handleInteractionChange"
                />
              </n-card>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-empty :description="$t('interaction.settings.noConfigs')" size="medium">
        <template #icon>
          <n-icon><FlashOutline /></n-icon>
        </template>
        <template #extra>
          <n-button type="primary" :disabled="readonly" @click="addInteractionConfig">
            {{ $t('interaction.settings.addConfig') }}
          </n-button>
        </template>
      </n-empty>
    </div>

    <!-- 模板选择对话框 -->
    <n-modal v-model:show="showTemplateDialog" :title="$t('interaction.template.title')">
      <n-card style="width: 600px" :bordered="false" size="huge">
        <InteractionTemplateSelector @select="applyTemplate" @cancel="showTemplateDialog = false" />
      </n-card>
    </n-modal>

    <!-- 预览对话框 -->
    <n-modal v-model:show="showPreviewDialog" :title="$t('interaction.preview.title')">
      <n-card style="width: 800px" :bordered="false" size="huge">
        <InteractionPreview
          :interactions="localInteractionConfigs"
          :component-id="componentId"
          @close="showPreviewDialog = false"
        />
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互设置表单组件
 * 提供完整的可视化交互配置界面
 */

import { ref, computed, watch, onMounted, nextTick, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NButton,
  NIcon,
  NSpace,
  NForm,
  NFormItem,
  NSelect,
  NInputNumber,
  NInput,
  NSwitch,
  NTag,
  NDropdown,
  NEmpty,
  NModal,
  NRadioGroup,
  NRadio,
  NTooltip,
  NCollapseItem,
  useMessage
} from 'naive-ui'
import {
  AddOutline,
  PlayOutline,
  EllipsisHorizontalOutline,
  TrashOutline,
  FlashOutline,
  CopyOutline,
  DocumentOutline,
  SettingsOutline,
  InformationCircleOutline,
  ChevronDownOutline,
  ChevronUpOutline
} from '@vicons/ionicons5'

// 导入交互系统相关类型和工具
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionActionType,
  InteractionResponse,
  InteractionTriggerType,
  ConditionConfig,
  ComparisonOperator
} from '@/card2.1/core/interaction-types'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import { propertyExposureRegistry } from '@/card2.1/core/property-exposure'

// 导入子组件
import InteractionResponseEditor from './InteractionResponseEditor.vue'
import InteractionTemplateSelector from './InteractionTemplateSelector.vue'
import InteractionPreview from './InteractionPreview.vue'

interface Props {
  /** 组件ID */
  componentId?: string
  /** 组件类型 */
  componentType?: string
  /** 当前交互配置 */
  modelValue?: InteractionConfig[]
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示高级功能 */
  showAdvanced?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: InteractionConfig[]): void
  (e: 'change', value: InteractionConfig[]): void
  (e: 'validate', result: { valid: boolean; errors: string[] }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  readonly: false,
  showAdvanced: true
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()

// 🔥 注入Visual Editor状态获取组件列表
const visualEditorState = inject<{ getAvailableComponents: () => any[] }>('visualEditorState', {
  getAvailableComponents: () => {
    return []
  }
})

// 响应式状态
const localInteractionConfigs = ref<InteractionConfig[]>([])
const showTemplateDialog = ref(false)
const showPreviewDialog = ref(false)
const showAdvancedOptions = ref(false) // 控制高级选项显示

// 计算属性
const hasInteractions = computed(() => localInteractionConfigs.value.length > 0)

// 🔥 4个核心触发事件（简化后）
const coreEventOptions = computed(() => [
  { label: t('interaction.events.click'), value: 'click' },
  { label: t('interaction.events.hover'), value: 'hover' },
  { label: t('interaction.events.visibility'), value: 'visibility' },
  { label: t('interaction.events.dataChange'), value: 'dataChange' }
])

// 保留原有选项用于向后兼容
const eventTypeOptions = computed(() => [
  { label: t('interaction.events.click'), value: 'click' },
  { label: t('interaction.events.hover'), value: 'hover' },
  { label: t('interaction.events.focus'), value: 'focus' },
  { label: t('interaction.events.blur'), value: 'blur' },
  { label: t('interaction.events.dataChange'), value: 'dataChange' },
  { label: t('interaction.events.conditional'), value: 'conditional' },
  { label: t('interaction.events.crossComponent'), value: 'crossComponent' },
  { label: t('interaction.events.custom'), value: 'custom' }
])

// 🔥 4个核心动作（用户要求简化）
const coreActionOptions = computed(() => [
  { label: t('interaction.actions.navigateToUrl'), value: 'navigateToUrl', category: 'navigation' },
  { label: t('interaction.actions.changeVisibility'), value: 'changeVisibility', category: 'visibility' },
  { label: t('interaction.actions.updateComponentData'), value: 'updateComponentData', category: 'property' },
  { label: t('interaction.actions.triggerAnimation'), value: 'triggerAnimation', category: 'animation' }
])

// 保留完整选项用于向后兼容
const actionTypeOptions = computed(() => [
  { label: t('interaction.actions.changeBackgroundColor'), value: 'changeBackgroundColor' },
  { label: t('interaction.actions.changeTextColor'), value: 'changeTextColor' },
  { label: t('interaction.actions.changeBorderColor'), value: 'changeBorderColor' },
  { label: t('interaction.actions.changeSize'), value: 'changeSize' },
  { label: t('interaction.actions.changeOpacity'), value: 'changeOpacity' },
  { label: t('interaction.actions.changeTransform'), value: 'changeTransform' },
  { label: t('interaction.actions.changeVisibility'), value: 'changeVisibility' },
  { label: t('interaction.actions.changeContent'), value: 'changeContent' },
  { label: t('interaction.actions.triggerAnimation'), value: 'triggerAnimation' },
  { label: t('interaction.actions.navigateToUrl'), value: 'navigateToUrl' },
  { label: t('interaction.actions.updateComponentData'), value: 'updateComponentData' },
  { label: t('interaction.actions.flashColor'), value: 'flashColor' },
  { label: t('interaction.actions.conditionalStyle'), value: 'conditionalStyle' },
  { label: t('interaction.actions.callFunction'), value: 'callFunction' },
  { label: t('interaction.actions.custom'), value: 'custom' }
])

// 条件类型选项
const conditionTypeOptions = computed(() => [
  { label: t('interaction.conditions.comparison'), value: 'comparison' },
  { label: t('interaction.conditions.range'), value: 'range' },
  { label: t('interaction.conditions.expression'), value: 'expression' }
])

// 比较运算符选项
const comparisonOperatorOptions = computed(() => [
  { label: t('interaction.operators.equals'), value: 'equals' },
  { label: t('interaction.operators.notEquals'), value: 'notEquals' },
  { label: t('interaction.operators.greaterThan'), value: 'greaterThan' },
  { label: t('interaction.operators.greaterThanOrEqual'), value: 'greaterThanOrEqual' },
  { label: t('interaction.operators.lessThan'), value: 'lessThan' },
  { label: t('interaction.operators.lessThanOrEqual'), value: 'lessThanOrEqual' },
  { label: t('interaction.operators.contains'), value: 'contains' },
  { label: t('interaction.operators.startsWith'), value: 'startsWith' },
  { label: t('interaction.operators.endsWith'), value: 'endsWith' }
])

// 🔥 动态获取可用组件选项
const availableComponentOptions = computed(() => {
  const components = visualEditorState.getAvailableComponents()
  return components.map(comp => ({
    label: comp.label || `${comp.name} (${comp.id.slice(0, 8)}...)`,
    value: comp.id
  }))
})

// 🔥 可用属性选项 - 基于组件类型动态获取
const availablePropertyOptions = computed(() => {
  if (!props.componentType) {
    return []
  }
  // 从属性暴露注册表获取当前组件类型的可监听属性
  const componentExposure = propertyExposureRegistry.getComponentExposure(props.componentType)
  if (!componentExposure || !componentExposure.listenableProperties) {
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
      property // 保存完整属性信息供后续使用
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

  return groupedOptions
})

// 获取事件标签类型（支持新的核心事件）
const getEventTagType = (event: InteractionEventType) => {
  const typeMap = {
    click: 'success',
    hover: 'info',
    focus: 'warning',
    blur: 'default',
    visibility: 'primary', // 新增
    dataChange: 'primary',
    conditional: 'warning',
    crossComponent: 'info',
    custom: 'error'
  }
  return typeMap[event] || 'default'
}

// 获取事件显示名称（支持新的核心事件）
const getEventDisplayName = (event: InteractionEventType) => {
  const nameMap = {
    click: t('interaction.events.click'),
    hover: t('interaction.events.hover'),
    focus: t('interaction.events.focus'),
    blur: t('interaction.events.blur'),
    visibility: t('interaction.events.visibility'), // 新增
    dataChange: t('interaction.events.dataChange'), // 更新显示名称
    conditional: t('interaction.events.conditional'),
    crossComponent: t('interaction.events.crossComponent'),
    custom: t('interaction.events.custom')
  }
  return nameMap[event] || event
}

// 获取动作显示名称
const getActionDisplayName = (action: InteractionActionType) => {
  const nameMap = {
    changeBackgroundColor: t('interaction.actions.changeBackgroundColor'),
    changeTextColor: t('interaction.actions.changeTextColor'),
    changeBorderColor: t('interaction.actions.changeBorderColor'),
    changeSize: t('interaction.actions.changeSize'),
    changeOpacity: t('interaction.actions.changeOpacity'),
    changeTransform: t('interaction.actions.changeTransform'),
    changeVisibility: t('interaction.actions.changeVisibility'),
    changeContent: t('interaction.actions.changeContent'),
    triggerAnimation: t('interaction.actions.triggerAnimation'),
    navigateToUrl: t('interaction.actions.navigateToUrl'),
    updateComponentData: t('interaction.actions.updateComponentData'),
    flashColor: t('interaction.actions.flashColor'),
    conditionalStyle: t('interaction.actions.conditionalStyle'),
    callFunction: t('interaction.actions.callFunction'),
    custom: t('interaction.actions.custom')
  }
  return nameMap[action] || action
}

// 获取交互动作选项
const getInteractionActionOptions = (index: number) => [
  {
    label: t('interaction.settings.copyConfig'),
    key: 'copy',
    icon: CopyOutline
  },
  {
    label: t('interaction.settings.copyAsTemplate'),
    key: 'duplicate',
    icon: DocumentOutline
  },
  {
    type: 'divider'
  },
  {
    label: t('interaction.settings.advancedSettings'),
    key: 'advanced',
    icon: SettingsOutline
  },
  {
    type: 'divider'
  },
  {
    label: t('interaction.settings.deleteConfig'),
    key: 'delete',
    icon: TrashOutline
  }
]

// 判断是否为跨组件事件
const isInterComponentEvent = (event: InteractionEventType) => {
  return event === 'crossComponent' || event === 'updateComponentData'
}

// 🔥 根据触发类型过滤事件选项
const getFilteredEventOptions = (triggerType: InteractionTriggerType) => {
  if (triggerType === 'node') {
    // 节点触发：主要是点击、悬停等节点级别事件
    return eventTypeOptions.value.filter(option =>
      ['click', 'hover', 'dataChange', 'conditional'].includes(option.value)
    )
  } else if (triggerType === 'component') {
    // 组件触发：包括所有事件，特别是内部元素交互
    return eventTypeOptions.value
  } else {
    // 默认返回所有选项
    return eventTypeOptions.value
  }
}

// 🔥 初始化配置条件（确保安全访问）
const initializeCondition = (config: InteractionConfig) => {
  if (!config.condition) {
    config.condition = {
      type: 'comparison',
      operator: 'greaterThan',
      value: ''
    }
  }
}

// 🔥 处理条件类型变化
const handleConditionTypeChange = (value: string, configIndex: number) => {
  const config = localInteractionConfigs.value[configIndex]
  // 确保 condition 对象存在
  if (!config.condition) {
    initializeCondition(config)
  }
  // 更新条件类型
  if (config.condition) {
    config.condition.type = value as any
  }
  handleInteractionChange()
}

// 🔥 处理事件类型变化
const handleEventChange = (eventType: string, configIndex: number) => {
  const config = localInteractionConfigs.value[configIndex]
  config.event = eventType as any

  // 如果是 dataChange 事件，确保初始化条件和源组件类型
  if (eventType === 'dataChange') {
    initializeCondition(config)
    // 设置源组件类型用于属性验证
    config.sourceComponentType = props.componentType
  }

  handleInteractionChange()
}

// 🔥 处理监听属性变化
const handleWatchedPropertyChange = (propertyName: string | null, configIndex: number) => {
  const config = localInteractionConfigs.value[configIndex]

  // 更新监听的属性名
  config.watchedProperty = propertyName || undefined

  // 如果设置了属性，同时设置源组件类型
  if (propertyName && props.componentType) {
    config.sourceComponentType = props.componentType

    // 获取属性的详细信息
    const componentExposure = propertyExposureRegistry.getComponentExposure(props.componentType)
    const property = componentExposure?.listenableProperties?.find(p => p.name === propertyName)

    if (property) {
      // 根据属性类型自动设置合适的条件配置
      if (!config.condition) {
        initializeCondition(config)
      }

      if (config.condition) {
        // 根据属性类型设置默认的比较条件
        switch (property.type) {
          case 'number':
            config.condition.type = 'comparison'
            config.condition.operator = 'greaterThan'
            config.condition.value = property.defaultValue || 0
            break
          case 'string':
            config.condition.type = 'comparison'
            config.condition.operator = 'equals'
            config.condition.value = property.defaultValue || ''
            break
          case 'boolean':
            config.condition.type = 'comparison'
            config.condition.operator = 'equals'
            config.condition.value = property.defaultValue || false
            break
          default:
            // 保持当前配置
            break
        }
      }
    }
  }

  handleInteractionChange()
}

// 🔥 添加交互配置（简化版，只有 dataChange 才初始化条件）
const addInteractionConfig = () => {
  const newConfig: InteractionConfig = {
    event: 'click', // 默认为点击事件
    responses: [],
    enabled: true,
    priority: 1,
    name: `${t('interaction.title')} ${localInteractionConfigs.value.length + 1}`
  }

  // 只有 dataChange 事件才初始化条件
  if (newConfig.event === 'dataChange') {
    initializeCondition(newConfig)
  }

  localInteractionConfigs.value.push(newConfig)
  handleInteractionChange()
}

// 添加响应动作（使用核心动作）
const addResponse = (configIndex: number) => {
  const newResponse: InteractionResponse = {
    action: 'navigateToUrl', // 默认为页面跳转
    value: 'https://example.com'
  }
  localInteractionConfigs.value[configIndex].responses.push(newResponse)

  handleInteractionChange()
}

// 删除响应动作
const removeResponse = (configIndex: number, responseIndex: number) => {
  localInteractionConfigs.value[configIndex].responses.splice(responseIndex, 1)
  handleInteractionChange()
}

// 处理交互配置变化
const handleInteractionChange = () => {
  // 防抖处理，避免过频繁的更新
  nextTick(() => {
    emit('update:modelValue', [...localInteractionConfigs.value])
    emit('change', [...localInteractionConfigs.value])

    // 验证配置
    validateInteractions()
  })
}

// 处理交互动作
const handleInteractionAction = (action: string, index: number) => {
  switch (action) {
    case 'copy':
      copyInteractionConfig(index)
      break
    case 'duplicate':
      duplicateInteractionConfig(index)
      break
    case 'advanced':
      openAdvancedSettings(index)
      break
    case 'delete':
      deleteInteractionConfig(index)
      break
  }
}

// 复制交互配置
const copyInteractionConfig = (index: number) => {
  const config = localInteractionConfigs.value[index]
  const copiedConfig: InteractionConfig = {
    ...config,
    name: `${config.name} (${t('interaction.settings.configCopy')})`,
    responses: config.responses.map(r => ({ ...r }))
  }

  localInteractionConfigs.value.splice(index + 1, 0, copiedConfig)
  handleInteractionChange()
  message.success(t('interaction.messages.configCopied'))
}

// 复制为模板
const duplicateInteractionConfig = (index: number) => {
  // TODO: 实现保存为模板功能
  message.info(t('interaction.settings.templateDevelopment'))
}

// 打开高级设置
const openAdvancedSettings = (index: number) => {
  // TODO: 实现高级设置对话框
  message.info(t('interaction.settings.advancedDevelopment'))
}

// 删除交互配置
const deleteInteractionConfig = (index: number) => {
  localInteractionConfigs.value.splice(index, 1)
  handleInteractionChange()
  message.success(t('interaction.messages.configDeleted'))
}

// 应用模板
const applyTemplate = (template: InteractionConfig) => {
  localInteractionConfigs.value.push({
    ...template,
    name: `${template.name} (${t('interaction.settings.templateFromTemplate')})`
  })
  handleInteractionChange()
  showTemplateDialog.value = false
  message.success(t('interaction.messages.templateApplied'))
}

// 预览交互
const previewInteractions = () => {
  showPreviewDialog.value = true
}

// 验证交互配置
const validateInteractions = () => {
  const errors: string[] = []

  localInteractionConfigs.value.forEach((config, index) => {
    if (!config.event) {
      errors.push(
        t('interaction.settings.validationError', {
          index: index + 1,
          error: t('interaction.settings.validationMissingEvent')
        })
      )
    }

    if (config.responses.length === 0) {
      errors.push(
        t('interaction.settings.validationError', {
          index: index + 1,
          error: t('interaction.settings.validationMissingResponse')
        })
      )
    }

    config.responses.forEach((response, responseIndex) => {
      if (!response.action) {
        errors.push(
          t('interaction.settings.validationError', {
            index: index + 1,
            error:
              t('interaction.settings.actionCount', { index: responseIndex + 1 }) +
              ': ' +
              t('interaction.settings.validationMissingAction')
          })
        )
      }

      if (response.value === undefined || response.value === null) {
        errors.push(
          t('interaction.settings.validationError', {
            index: index + 1,
            error:
              t('interaction.settings.actionCount', { index: responseIndex + 1 }) +
              ': ' +
              t('interaction.settings.validationMissingValue')
          })
        )
      }
    })
  })

  emit('validate', {
    valid: errors.length === 0,
    errors
  })
}

// 监听外部配置变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(localInteractionConfigs.value)) {
      localInteractionConfigs.value = newValue.map(config => ({ ...config }))
    }
  },
  { immediate: true, deep: true }
)

// 组件挂载时注册到交互管理器
onMounted(() => {
  if (props.componentId && localInteractionConfigs.value.length > 0) {
    interactionManager.registerComponent(props.componentId, localInteractionConfigs.value)
  }
})

// 监听配置变化，同步到交互管理器
watch(
  localInteractionConfigs,
  newConfigs => {
    if (props.componentId) {
      if (newConfigs.length > 0) {
        interactionManager.updateComponentConfigs(props.componentId, newConfigs)
      } else {
        interactionManager.unregisterComponent(props.componentId, [])
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.interaction-settings-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.form-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.interaction-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interaction-card {
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.interaction-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px var(--primary-color-hover);
}

.interaction-card.disabled {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.interaction-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interaction-title {
  font-weight: 500;
  color: var(--text-color);
}

.interaction-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interaction-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.responses-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-2);
}

.no-responses {
  padding: 16px;
  text-align: center;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-card {
  border: 1px dashed var(--border-color);
  background: var(--body-color);
  transition: all 0.2s ease;
}

.response-card:hover {
  border-color: var(--info-color);
  background: var(--info-color-suppl);
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .form-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .interaction-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .interaction-info {
    justify-content: center;
  }

  .interaction-actions {
    justify-content: space-between;
  }
}

/* 滚动条样式 */
.interaction-list::-webkit-scrollbar {
  width: 6px;
}

.interaction-list::-webkit-scrollbar-track {
  background: var(--body-color);
  border-radius: 3px;
}

.interaction-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.interaction-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 动画效果 */
.interaction-card {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
  font-weight: 500;
}

/* 卡片样式优化 */
:deep(.n-card .n-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

:deep(.n-card .n-card__content) {
  padding: 16px;
}

/* 按钮样式 */
:deep(.n-button) {
  border-radius: 6px;
}

/* 标签样式 */
:deep(.n-tag) {
  border-radius: 4px;
}

/* 空状态样式 */
:deep(.n-empty .n-empty__icon) {
  font-size: 48px;
  color: var(--text-color-3);
}

:deep(.n-empty .n-empty__description) {
  color: var(--text-color-2);
  margin: 12px 0;
}

/* 高级选项切换样式 */
.advanced-options-toggle {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.trigger-type-label {
  display: flex;
  align-items: center;
}

/* 条件配置样式 */
.condition-config {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.condition-config .n-select,
.condition-config .n-input {
  flex-shrink: 0;
}

.condition-config span {
  color: var(--text-color-2);
  font-weight: 500;
  font-size: 12px;
}

/* 响应式条件配置 */
@media (max-width: 768px) {
  .condition-config {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .condition-config .n-select,
  .condition-config .n-input {
    width: 100% !important;
    flex: none;
  }
}
</style>
