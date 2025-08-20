<!-- src/core/interaction-system/components/InteractionSettingsForm.vue -->
<template>
  <div class="interaction-settings-form">
    <!-- 表单标题 -->
    <div class="form-header">
      <h3 class="form-title">{{ $t('interaction.settings.title') || '交互配置' }}</h3>
      <n-space size="small">
        <n-button size="tiny" type="primary" :disabled="readonly" @click="addInteractionConfig">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          {{ $t('interaction.add') || '添加交互' }}
        </n-button>
        <n-button size="tiny" quaternary :disabled="!hasInteractions" @click="previewInteractions">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          {{ $t('interaction.preview') || '预览' }}
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
                {{ config.name || `${getEventDisplayName(config.event)}交互` }}
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
            <n-form-item label="触发事件">
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
                {{ showAdvancedOptions ? '收起' : '展开' }}高级选项
              </n-button>
            </div>

            <!-- 简化后的高级选项 - 条件渲染 -->
            <template v-if="showAdvancedOptions">
              <n-form-item label="优先级">
                <n-input-number
                  v-model:value="config.priority"
                  :min="0"
                  :max="100"
                  :disabled="readonly"
                  @update:value="handleInteractionChange"
                />
              </n-form-item>

              <n-form-item label="配置名称">
                <n-input
                  v-model:value="config.name"
                  placeholder="自定义交互名称"
                  :disabled="readonly"
                  @update:value="handleInteractionChange"
                />
              </n-form-item>
            </template>

            <!-- 跨组件目标选择 -->
            <n-form-item v-if="isInterComponentEvent(config.event)" label="目标组件">
              <n-select
                v-model:value="config.targetComponentId"
                :options="availableComponentOptions"
                placeholder="选择目标组件"
                :disabled="readonly"
                clearable
                @update:value="handleInteractionChange"
              />
            </n-form-item>

            <!-- 🔥 数据变化监听配置（增强版） -->
            <n-form-item v-if="config.event === 'dataChange'" label="监听属性">
              <n-select
                :value="config.watchedProperty"
                :options="availablePropertyOptions"
                placeholder="选择要监听的组件属性"
                :disabled="readonly"
                filterable
                clearable
                @update:value="value => handleWatchedPropertyChange(value, index)"
              >
                <template #empty>
                  <div style="padding: 12px; text-align: center; color: var(--text-color-3)">
                    <div>暂无可监听属性</div>
                    <div style="font-size: 12px; margin-top: 4px">组件开发者需要暴露可监听的属性</div>
                  </div>
                </template>
              </n-select>
            </n-form-item>

            <!-- 传统数据路径输入（作为备选） -->
            <n-form-item v-if="config.event === 'dataChange' && showAdvancedOptions" label="自定义路径">
              <n-input
                v-model:value="config.dataPath"
                placeholder="如: data.temperature 或 properties.value"
                :disabled="readonly"
                @update:value="handleInteractionChange"
              />
            </n-form-item>

            <!-- 🔥 只有「属性改变时」才显示执行条件 -->
            <n-form-item v-if="config.event === 'dataChange'" label="执行条件">
              <div class="condition-config">
                <n-select
                  :value="config.condition?.type"
                  :options="conditionTypeOptions"
                  placeholder="条件类型"
                  :disabled="readonly"
                  style="width: 120px"
                  @update:value="value => handleConditionTypeChange(value, index)"
                />
                <template v-if="config.condition?.type === 'comparison'">
                  <n-select
                    v-model:value="config.condition.operator"
                    :options="comparisonOperatorOptions"
                    placeholder="比较"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                  <n-input
                    v-model:value="config.condition.value"
                    placeholder="值"
                    :disabled="readonly"
                    style="flex: 1"
                    @update:value="handleInteractionChange"
                  />
                </template>
                <template v-else-if="config.condition?.type === 'range'">
                  <n-input
                    v-model:value="config.condition.minValue"
                    placeholder="最小值"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                  <span>~</span>
                  <n-input
                    v-model:value="config.condition.maxValue"
                    placeholder="最大值"
                    :disabled="readonly"
                    style="width: 80px"
                    @update:value="handleInteractionChange"
                  />
                </template>
                <template v-else-if="config.condition?.type === 'expression'">
                  <n-input
                    v-model:value="config.condition.expression"
                    placeholder="如: value > 99 && value < 200"
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
              <span class="section-title">响应动作</span>
              <n-button
                size="tiny"
                type="primary"
                dashed
                :disabled="readonly"
                @click="
                  () => {
                    console.log('[INTERACTION-DEBUG] 点击添加动作按钮(头部)')
                    addResponse(index)
                  }
                "
              >
                <template #icon>
                  <n-icon><AddOutline /></n-icon>
                </template>
                添加动作
              </n-button>
            </div>

            <div v-if="config.responses.length === 0" class="no-responses">
              <n-empty description="暂无响应动作" size="small">
                <template #extra>
                  <n-button
                    size="small"
                    :disabled="readonly"
                    @click="
                      () => {
                        console.log('[INTERACTION-DEBUG] 点击添加动作按钮(空状态)')
                        addResponse(index)
                      }
                    "
                  >
                    添加第一个动作
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
      <n-empty description="暂无交互配置" size="medium">
        <template #icon>
          <n-icon><FlashOutline /></n-icon>
        </template>
        <template #extra>
          <n-button type="primary" :disabled="readonly" @click="addInteractionConfig">创建第一个交互</n-button>
        </template>
      </n-empty>
    </div>

    <!-- 模板选择对话框 -->
    <n-modal v-model:show="showTemplateDialog" :title="$t('interaction.template.title') || '选择交互模板'">
      <n-card style="width: 600px" :bordered="false" size="huge">
        <InteractionTemplateSelector @select="applyTemplate" @cancel="showTemplateDialog = false" />
      </n-card>
    </n-modal>

    <!-- 预览对话框 -->
    <n-modal v-model:show="showPreviewDialog" :title="$t('interaction.preview.title') || '交互预览'">
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
    console.log('[INTERACTION-DEBUG] Visual Editor状态未注入，返回空组件列表')
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
const coreEventOptions = ref([
  { label: '点击', value: 'click' },
  { label: '悬停', value: 'hover' },
  { label: '显示时/隐藏时', value: 'visibility' },
  { label: '属性改变时', value: 'dataChange' }
])

// 保留原有选项用于向后兼容
const eventTypeOptions = ref([
  { label: '点击', value: 'click' },
  { label: '悬停', value: 'hover' },
  { label: '聚焦', value: 'focus' },
  { label: '失焦', value: 'blur' },
  { label: '数据变化', value: 'dataChange' },
  { label: '条件触发', value: 'conditional' },
  { label: '跨组件', value: 'crossComponent' },
  { label: '自定义', value: 'custom' }
])

// 🔥 4个核心动作（用户要求简化）
const coreActionOptions = ref([
  { label: '跳转到URL', value: 'navigateToUrl', category: 'navigation' },
  { label: '修改可见性', value: 'changeVisibility', category: 'visibility' },
  { label: '修改组件属性', value: 'updateComponentData', category: 'property' },
  { label: '目标组件动效', value: 'triggerAnimation', category: 'animation' }
])

// 保留完整选项用于向后兼容
const actionTypeOptions = ref([
  { label: '改变背景颜色', value: 'changeBackgroundColor' },
  { label: '改变文字颜色', value: 'changeTextColor' },
  { label: '改变边框颜色', value: 'changeBorderColor' },
  { label: '改变大小', value: 'changeSize' },
  { label: '改变透明度', value: 'changeOpacity' },
  { label: '改变变换', value: 'changeTransform' },
  { label: '改变可见性', value: 'changeVisibility' },
  { label: '改变内容', value: 'changeContent' },
  { label: '触发动画', value: 'triggerAnimation' },
  { label: '跳转到URL', value: 'navigateToUrl' },
  { label: '修改组件数据', value: 'updateComponentData' },
  { label: '闪烁颜色', value: 'flashColor' },
  { label: '条件样式', value: 'conditionalStyle' },
  { label: '调用函数', value: 'callFunction' },
  { label: '自定义动作', value: 'custom' }
])

// 条件类型选项
const conditionTypeOptions = ref([
  { label: '比较条件', value: 'comparison' },
  { label: '范围条件', value: 'range' },
  { label: '表达式', value: 'expression' }
])

// 比较运算符选项
const comparisonOperatorOptions = ref([
  { label: '等于', value: 'equals' },
  { label: '不等于', value: 'notEquals' },
  { label: '大于', value: 'greaterThan' },
  { label: '大于等于', value: 'greaterThanOrEqual' },
  { label: '小于', value: 'lessThan' },
  { label: '小于等于', value: 'lessThanOrEqual' },
  { label: '包含', value: 'contains' },
  { label: '开头是', value: 'startsWith' },
  { label: '结尾是', value: 'endsWith' }
])

// 🔥 动态获取可用组件选项
const availableComponentOptions = computed(() => {
  const components = visualEditorState.getAvailableComponents()

  console.log('[INTERACTION-DEBUG] 计算可用组件选项:', {
    componentCount: components.length,
    components: components
  })

  return components.map(comp => ({
    label: comp.label || `${comp.name} (${comp.id.slice(0, 8)}...)`,
    value: comp.id
  }))
})

// 🔥 可用属性选项 - 基于组件类型动态获取
const availablePropertyOptions = computed(() => {
  console.log('[INTERACTION-DEBUG] availablePropertyOptions 计算:', {
    componentType: props.componentType,
    registryKeys: propertyExposureRegistry.getAllComponentTypes()
  })

  if (!props.componentType) {
    console.log('[INTERACTION-DEBUG] ❌ componentType 为空')
    return []
  }

  // 从属性暴露注册表获取当前组件类型的可监听属性
  const componentExposure = propertyExposureRegistry.getComponentExposure(props.componentType)

  console.log('[INTERACTION-DEBUG] 属性暴露查询结果:', {
    componentType: props.componentType,
    componentExposure: componentExposure,
    hasListenableProperties: !!componentExposure?.listenableProperties,
    listenablePropertiesLength: componentExposure?.listenableProperties?.length
  })

  if (!componentExposure || !componentExposure.listenableProperties) {
    console.log('[INTERACTION-DEBUG] ❌ 未找到可监听属性')
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
    click: '点击',
    hover: '悬停',
    focus: '聚焦',
    blur: '失焦',
    visibility: '显示时/隐藏时', // 新增
    dataChange: '属性改变时', // 更新显示名称
    conditional: '条件触发',
    crossComponent: '跨组件',
    custom: '自定义'
  }
  return nameMap[event] || event
}

// 获取动作显示名称
const getActionDisplayName = (action: InteractionActionType) => {
  const nameMap = {
    changeBackgroundColor: '背景颜色',
    changeTextColor: '文字颜色',
    changeBorderColor: '边框颜色',
    changeSize: '尺寸',
    changeOpacity: '透明度',
    changeTransform: '变换',
    changeVisibility: '可见性',
    changeContent: '内容',
    triggerAnimation: '动画',
    navigateToUrl: '跳转URL',
    updateComponentData: '更新数据',
    flashColor: '闪烁颜色',
    conditionalStyle: '条件样式',
    callFunction: '调用函数',
    custom: '自定义'
  }
  return nameMap[action] || action
}

// 获取交互动作选项
const getInteractionActionOptions = (index: number) => [
  {
    label: '复制配置',
    key: 'copy',
    icon: CopyOutline
  },
  {
    label: '复制为模板',
    key: 'duplicate',
    icon: DocumentOutline
  },
  {
    type: 'divider'
  },
  {
    label: '高级设置',
    key: 'advanced',
    icon: SettingsOutline
  },
  {
    type: 'divider'
  },
  {
    label: '删除配置',
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
        console.log('[INTERACTION-DEBUG] 设置条件前:', {
          currentConditionValue: config.condition.value,
          propertyDefaultValue: property.defaultValue,
          propertyType: property.type
        })

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

        console.log('[INTERACTION-DEBUG] 设置条件后:', {
          finalConditionValue: config.condition.value,
          conditionOperator: config.condition.operator
        })
      }

      console.log(`[INTERACTION-DEBUG] 设置监听属性: ${propertyName}`, {
        propertyType: property.type,
        defaultValue: property.defaultValue,
        condition: config.condition
      })
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
    name: `交互配置 ${localInteractionConfigs.value.length + 1}`
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
  console.log('[INTERACTION-DEBUG] 添加响应动作开始:', {
    configIndex,
    当前配置: localInteractionConfigs.value[configIndex],
    现有响应数量: localInteractionConfigs.value[configIndex]?.responses?.length || 0
  })

  const newResponse: InteractionResponse = {
    action: 'navigateToUrl', // 默认为页面跳转
    value: 'https://example.com'
  }

  console.log('[INTERACTION-DEBUG] 新建响应动作:', newResponse)

  localInteractionConfigs.value[configIndex].responses.push(newResponse)

  console.log('[INTERACTION-DEBUG] 添加后响应数量:', localInteractionConfigs.value[configIndex].responses.length)
  console.log('[INTERACTION-DEBUG] 完整配置:', localInteractionConfigs.value[configIndex])

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
    console.log('[INTERACTION-DEBUG] 配置变化:', {
      configCount: localInteractionConfigs.value.length,
      configs: localInteractionConfigs.value.map(c => ({
        event: c.event,
        responsesCount: c.responses?.length || 0,
        responses: c.responses
      }))
    })

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
    name: `${config.name} (副本)`,
    responses: config.responses.map(r => ({ ...r }))
  }

  localInteractionConfigs.value.splice(index + 1, 0, copiedConfig)
  handleInteractionChange()
  message.success('交互配置已复制')
}

// 复制为模板
const duplicateInteractionConfig = (index: number) => {
  // TODO: 实现保存为模板功能
  message.info('模板功能开发中...')
}

// 打开高级设置
const openAdvancedSettings = (index: number) => {
  // TODO: 实现高级设置对话框
  message.info('高级设置功能开发中...')
}

// 删除交互配置
const deleteInteractionConfig = (index: number) => {
  localInteractionConfigs.value.splice(index, 1)
  handleInteractionChange()
  message.success('交互配置已删除')
}

// 应用模板
const applyTemplate = (template: InteractionConfig) => {
  localInteractionConfigs.value.push({
    ...template,
    name: `${template.name} (来自模板)`
  })
  handleInteractionChange()
  showTemplateDialog.value = false
  message.success('模板已应用')
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
      errors.push(`交互配置 ${index + 1}: 缺少事件类型`)
    }

    if (config.responses.length === 0) {
      errors.push(`交互配置 ${index + 1}: 缺少响应动作`)
    }

    config.responses.forEach((response, responseIndex) => {
      if (!response.action) {
        errors.push(`交互配置 ${index + 1} 动作 ${responseIndex + 1}: 缺少动作类型`)
      }

      if (response.value === undefined || response.value === null) {
        errors.push(`交互配置 ${index + 1} 动作 ${responseIndex + 1}: 缺少动作值`)
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
  console.log('[INTERACTION-DEBUG] InteractionSettingsForm挂载:', {
    componentId: props.componentId,
    readonly: props.readonly,
    configsLength: localInteractionConfigs.value.length
  })

  if (props.componentId && localInteractionConfigs.value.length > 0) {
    interactionManager.registerComponent(props.componentId, localInteractionConfigs.value)
  }
})

// 监听配置变化，同步到交互管理器
watch(
  localInteractionConfigs,
  newConfigs => {
    console.log('[INTERACTION-DEBUG] 同步配置到InteractionManager:', {
      componentId: props.componentId,
      configCount: newConfigs.length,
      configs: newConfigs.map(c => ({
        event: c.event,
        responsesCount: c.responses?.length || 0,
        hasResponses: c.responses && c.responses.length > 0
      }))
    })

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
