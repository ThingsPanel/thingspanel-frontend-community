<template>
  <div class="interaction-simple">
    <!-- 简洁列表 + 添加按钮 -->
    <div class="interaction-header">
      <h4 class="section-title">{{ t('interaction.wizard.title') }}</h4>
      <n-button size="small" type="primary" @click="showAddModal = true">
        <template #icon>
          <n-icon><FlashOutline /></n-icon>
        </template>
        {{ t('interaction.wizard.addInteraction') }}
      </n-button>
    </div>

    <!-- 交互列表 -->
    <div class="interactions-list">
      <div v-if="interactions.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">{{ t('interaction.wizard.noInteractions') }}</div>
        <div class="empty-desc">{{ t('interaction.wizard.noInteractionsDesc') }}</div>
      </div>

      <div v-else>
        <div v-for="(interaction, index) in interactions" :key="index" class="interaction-item">
          <div class="interaction-summary">
            <div class="summary-badge" :class="getEventType(interaction.event)">
              {{ getEventLabel(interaction.event) }}
            </div>
            <div class="summary-text">
              <div class="summary-title">{{ getSummaryTitle(interaction) }}</div>
              <div class="summary-desc">{{ getSummaryDesc(interaction) }}</div>
            </div>
            <div class="summary-actions">
              <n-switch v-model:value="interaction.enabled" size="small" />
              <n-button size="tiny" quaternary @click="editInteraction(index)">{{ t('interaction.edit') }}</n-button>
              <n-button size="tiny" quaternary @click="deleteInteraction(index)">
                <template #icon>
                  <n-icon><TrashOutline /></n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <n-modal
      v-model:show="showAddModal"
      :title="editingIndex >= 0 ? t('interaction.wizard.editInteraction') : t('interaction.wizard.addInteraction')"
    >
      <n-card style="width: 600px" :bordered="false">
        <n-form :model="currentInteraction" label-placement="left" label-width="auto">
          <!-- 触发条件 -->
          <n-form-item :label="t('interaction.events.title')">
            <n-select
              v-model:value="currentInteraction.event"
              :options="eventOptions"
              :placeholder="t('interaction.placeholders.selectTriggerCondition')"
            />
          </n-form-item>

          <!-- 动作类型 -->
          <n-form-item :label="t('interaction.actions.title')">
            <n-select
              v-model:value="currentActionType"
              :options="actionTypeOptions"
              :placeholder="t('interaction.placeholders.selectAction')"
              @update:value="handleActionTypeChange"
            />
          </n-form-item>

          <!-- URL跳转配置 -->
          <template v-if="currentActionType === 'jump'">
            <n-form-item :label="t('interaction.properties.linkType')">
              <n-radio-group v-model:value="urlType" @update:value="handleUrlTypeChange">
                <n-space>
                  <n-radio value="external">{{ t('interaction.linkTypes.external') }}</n-radio>
                  <n-radio value="internal">{{ t('interaction.linkTypes.internal') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <n-form-item v-if="urlType === 'external'" :label="t('interaction.properties.jumpAddress')">
              <n-input v-model:value="currentInteraction.url" :placeholder="t('interaction.placeholders.enterUrl')" />
            </n-form-item>

            <n-form-item v-if="urlType === 'internal'" :label="t('interaction.properties.selectMenu')">
              <n-select
                v-model:value="selectedMenuPath"
                :options="menuOptions"
                :placeholder="t('interaction.placeholders.selectMenuToJump')"
                :loading="menuLoading"
                filterable
                @update:value="handleMenuPathChange"
              />
            </n-form-item>

            <n-form-item :label="t('interaction.properties.openMethod')">
              <n-radio-group v-model:value="currentInteraction.target">
                <n-radio value="_self">{{ t('interaction.openMethods.currentWindow') }}</n-radio>
                <n-radio value="_blank">{{ t('interaction.openMethods.newWindow') }}</n-radio>
              </n-radio-group>
            </n-form-item>
          </template>

          <!-- 🔥 数据变化时的属性选择和条件配置 -->
          <template v-if="currentInteraction.event === 'dataChange'">
            <n-form-item :label="t('interaction.properties.watchedProperty')">
              <n-select
                v-model:value="currentWatchedProperty"
                :options="availablePropertyOptions"
                :placeholder="t('interaction.placeholders.selectWatchedProperty')"
                @update:value="handleWatchedPropertyChange"
              />
            </n-form-item>

            <n-form-item :label="t('interaction.properties.executionCondition')">
              <n-space>
                <n-select
                  v-model:value="currentConditionType"
                  :options="conditionTypeOptions"
                  :placeholder="t('interaction.placeholders.conditionType')"
                  style="width: 120px"
                  @update:value="handleConditionTypeChange"
                />
                <template v-if="currentConditionType === 'comparison'">
                  <n-select
                    v-model:value="currentConditionOperator"
                    :options="comparisonOperatorOptions"
                    :placeholder="t('interaction.placeholders.comparison')"
                    style="width: 100px"
                  />
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.value')"
                    style="width: 120px"
                  />
                </template>
                <template v-else-if="currentConditionType === 'range'">
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.rangeValue')"
                    style="width: 120px"
                  />
                </template>
                <template v-else-if="currentConditionType === 'expression'">
                  <n-input
                    v-model:value="currentConditionValue"
                    :placeholder="t('interaction.placeholders.expressionValue')"
                    style="width: 200px"
                  />
                </template>
              </n-space>
            </n-form-item>
          </template>

          <!-- 属性修改配置 -->
          <template v-if="currentActionType === 'modify'">
            <!-- 🔥 替换为新的二级联动组件属性选择器 -->
            <n-form-item :label="t('interaction.properties.modifyProperty')">
              <ComponentPropertySelector
                v-model:value="currentTargetPropertyBinding"
                :placeholder="t('interaction.placeholders.selectPropertyToModify')"
                :current-component-id="props.componentId"
                @change="handleTargetPropertyChange"
              />
            </n-form-item>
            <n-form-item :label="t('interaction.properties.newValue')">
              <n-input
                v-model:value="currentInteraction.updateValue"
                :placeholder="t('interaction.placeholders.enterNewPropertyValue')"
              />
            </n-form-item>
          </template>
        </n-form>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showAddModal = false">{{ t('interaction.cancel') }}</n-button>
            <n-button type="primary" @click="saveInteraction">{{ t('interaction.confirm') }}</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互配置组件 - 简洁弹窗版
 * 特点：列表 + 弹窗，简单直接
 */

import { ref, computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
// 🔒 导入属性暴露管理器用于安全的属性访问
import { propertyExposureManager, type PropertyAccessContext } from '@/card2.1/core2/property'
import {
  NSpace,
  NButton,
  NIcon,
  NInput,
  NSelect,
  NSwitch,
  NRadioGroup,
  NRadio,
  NModal,
  NCard,
  NForm,
  NFormItem,
  useMessage
} from 'naive-ui'
import { FlashOutline, TrashOutline } from '@vicons/ionicons5'
import { fetchGetUserRoutes } from '@/service/api/route'
// 🔥 简化：移除复杂的属性暴露系统，使用简单的属性访问
import { useEditorStore } from '@/store/modules/editor'
// 🔥 新增：交互执行引擎
import { createInteractionEngine } from '../interaction-engine'
// 🔥 新增：导入二级联动组件属性选择器
import ComponentPropertySelector from '@/core/data-architecture/components/common/ComponentPropertySelector.vue'
// 🔥 新增：导入配置管理器，用于监听属性选择器
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

interface Props {
  modelValue?: any[]
  componentId?: string
  componentType?: string
}

interface Emits {
  (e: 'update:modelValue', value: any[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 🔥 直接使用 useEditorStore 获取当前画布组件（修复空数组问题）
const editorStore = useEditorStore()

// 保持向后兼容
const visualEditorState = {
  getAvailableComponents: () => {
    return editorStore.nodes || []
  }
}

// 状态
const interactions = ref(props.modelValue || [])
const showAddModal = ref(false)
const editingIndex = ref(-1)

// 🔥 关键修复：监听外部传入的modelValue变化，确保组件内部数据同步
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      interactions.value = [...newValue] // 🔥 使用展开语法确保响应式更新
    }
  },
  { immediate: true, deep: true }
)
const currentInteraction = ref({
  event: 'click',
  enabled: true,
  priority: 1,
  url: '',
  target: '_blank',
  targetComponentId: '',
  targetProperty: '',
  updateValue: ''
})
const currentActionType = ref('')

// 🔥 恢复内部菜单选择功能
const urlType = ref<'external' | 'internal'>('external')
const selectedMenuPath = ref('')
const menuOptions = ref<{ label: string; value: string }[]>([])
const menuLoading = ref(false)
const message = useMessage()
const { t } = useI18n()

// 🔥 恢复数据变化配置状态
const currentWatchedProperty = ref('')
const currentConditionType = ref('')
const currentConditionOperator = ref('')
const currentConditionValue = ref('')

// 🔥 新增：目标属性绑定状态（替换原来的分离选择）
const currentTargetPropertyBinding = ref('')
const currentTargetPropertyInfo = ref<any>(null)

// ✅ 正确的3个事件选项
const eventOptions = computed(() => [
  { label: t('interaction.events.click'), value: 'click' },
  { label: t('interaction.events.hover'), value: 'hover' },
  { label: t('interaction.events.dataChange'), value: 'dataChange' }
])

// 🔥 恢复数据变化时的属性选择和条件配置
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

// ✅ 正确的2个动作选项
const actionTypeOptions = computed(() => [
  { label: t('interaction.summary.pageJump'), value: 'jump' },
  { label: t('interaction.summary.modifyProperty'), value: 'modify' }
])

// ✅ 动态获取当前画布上的组件（用于目标组件选择）
const componentOptions = computed(() => {
  try {
    const components = visualEditorState.getAvailableComponents() || []

    const options = components.map(comp => {
      // 🔥 直接使用组件ID，在显示中标识当前组件
      const isCurrentComponent = comp.id === props.componentId
      const displayName = isCurrentComponent
        ? `📍 ${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...) - 当前组件`
        : `🔧 ${comp.type || 'unknown'} (${comp.id.slice(0, 8)}...)`

      return {
        label: displayName,
        value: comp.id, // 🔥 直接使用实际组件ID，移除 "self" 概念
        componentType: comp.type,
        isCurrentComponent
      }
    })

    return options
  } catch (error) {
    console.error(`🔥 [InteractionCardWizard] componentOptions 生成失败:`, error)
    // 失败时至少返回当前组件
    return [
      {
        label: `📍 ${props.componentType || 'unknown'} (当前组件)`,
        value: props.componentId || 'unknown',
        componentType: props.componentType || 'unknown',
        isCurrentComponent: true
      }
    ]
  }
})

// 🔒 安全的目标属性选项（使用ref支持异步更新）
const targetPropertyOptions = ref<any[]>([])

// 🔒 异步更新目标属性选项的函数
const updateTargetPropertyOptions = async () => {
  if (!currentInteraction.value.targetComponentId) {
    targetPropertyOptions.value = []
    return
  }

  // 🔥 移除 "self" 概念，直接根据组件ID查找
  const components = visualEditorState.getAvailableComponents()
  const targetComponent = components.find(comp => comp.id === currentInteraction.value.targetComponentId)

  if (!targetComponent) {
    targetPropertyOptions.value = []
    return
  }

  // 转换为选择器选项格式，按分组组织
  const groupedOptions: any[] = []
  const groups: Record<string, any[]> = {}

  // 🔒 第一步：安全获取白名单属性（替换不安全的exposedProperties访问）
  await getWhitelistedProperties(targetComponent, groups)

  // 🔥 第二步：从组件定义获取可修改属性声明
  if (targetComponent.metadata?.card2Definition?.interactionCapabilities?.watchableProperties) {
    const watchableProps = targetComponent.metadata.card2Definition.interactionCapabilities.watchableProperties
    const definitionGroup = '组件属性 (定义)'

    if (!groups[definitionGroup]) {
      groups[definitionGroup] = []
    }

    Object.entries(watchableProps).forEach(([propName, propInfo]: [string, any]) => {
      groups[definitionGroup].push({
        label: `${propInfo.label || propName} (${propInfo.description || propInfo.type})`,
        value: propName,
        property: {
          name: propName,
          label: propInfo.label || propName,
          type: propInfo.type,
          description: propInfo.description,
          defaultValue: propInfo.defaultValue,
          isComponentProperty: true
        }
      })
    })
  }

  // 🔥 第三步：添加基础配置级别的属性（只暴露 deviceId 和 metricsList）
  const baseGroup = '基础配置'
  if (!groups[baseGroup]) {
    groups[baseGroup] = []
  }

  groups[baseGroup].push(
    {
      label: '设备ID (关联的设备ID，用于数据源自动配置)',
      value: 'base.deviceId',
      property: {
        name: 'deviceId',
        label: '设备ID',
        type: 'string',
        description: '关联的设备ID，用于数据源自动配置和设备模板',
        isCore: true,
        group: '设备配置'
      }
    },
    {
      label: '指标列表 (选择的设备指标列表)',
      value: 'base.metricsList',
      property: {
        name: 'metricsList',
        label: '指标列表',
        type: 'array',
        description: '选择的设备指标列表，用于数据获取和显示',
        isCore: true,
        group: '设备配置'
      }
    }
  )

  // 🔥 第四步：如果没有定义，提供通用属性fallback
  if (Object.keys(groups).length === 1 && groups[baseGroup]) {
    const fallbackGroup = '通用属性 (fallback)'
    if (!groups[fallbackGroup]) {
      groups[fallbackGroup] = []
    }

    const universalProperties = [
      { name: 'title', label: '标题', type: 'string', description: '组件标题' },
      { name: 'visible', label: '可见性', type: 'boolean', description: '组件是否可见' },
      { name: 'opacity', label: '透明度', type: 'number', description: '组件透明度' },
      { name: 'backgroundColor', label: '背景色', type: 'string', description: '组件背景颜色' }
    ]

    universalProperties.forEach(prop => {
      groups[fallbackGroup].push({
        label: `${prop.label} (${prop.description})`,
        value: prop.name,
        property: {
          name: prop.name,
          label: prop.label,
          type: prop.type,
          description: prop.description,
          isFallback: true
        }
      })
    })
  }

  // 🔒 转换为分组选项格式，确保基础配置排在前面
  const safeGroupOrder = ['🔒 白名单属性 (安全)', '组件属性 (定义)', '基础配置', '通用属性 (fallback)']
  safeGroupOrder.forEach(groupName => {
    if (groups[groupName] && groups[groupName].length > 0) {
      groupedOptions.push({
        type: 'group',
        label: groupName,
        key: groupName,
        children: groups[groupName]
      })
    }
  })

  const options = groupedOptions.length > 0 ? groupedOptions : []

  targetPropertyOptions.value = options
}

// 🔒 监听目标组件ID变化，自动更新属性选项
watch(
  () => currentInteraction.value.targetComponentId,
  () => {
    updateTargetPropertyOptions()
  },
  { immediate: true }
)

// 🔥 可用属性选项 - 直接基于当前组件ID获取配置属性（与ComponentPropertySelector逻辑一致）
const availablePropertyOptions = computed(() => {
  if (!props.componentId) {
    console.error(`🚨 [InteractionCardWizard] 监听属性选择器：缺少componentId!`, {
      props: props,
      componentId: props.componentId,
      componentType: props.componentType
    })
    return []
  }

  // 🔥 直接从配置管理器获取当前组件配置
  const config = configurationIntegrationBridge.getConfiguration(props.componentId)

  if (!config) {
    console.error(`🚨 [InteractionCardWizard] 无法获取组件 ${props.componentId} 的配置，生成标准属性!`)
    // 🔥 即使无配置，也要生成标准属性
  } else {
  }

  const options: any[] = []

  // 🔥 基础层标准属性定义 - 与ComponentPropertySelector保持一致
  const standardBaseProperties = [
    // 显示配置
    { path: 'showTitle', displayPath: '显示标题', type: 'boolean' },
    { path: 'title', displayPath: '标题', type: 'string' },
    { path: 'visible', displayPath: '可见性', type: 'boolean' },
    { path: 'opacity', displayPath: '透明度', type: 'number' },

    // 样式配置
    { path: 'backgroundColor', displayPath: '背景颜色', type: 'string' },
    { path: 'borderWidth', displayPath: '边框宽度', type: 'number' },
    { path: 'borderColor', displayPath: '边框颜色', type: 'string' },
    { path: 'borderStyle', displayPath: '边框样式', type: 'string' },
    { path: 'borderRadius', displayPath: '圆角大小', type: 'number' },
    { path: 'boxShadow', displayPath: '阴影效果', type: 'string' },

    // 布局配置
    { path: 'padding', displayPath: '内边距', type: 'object' },
    { path: 'margin', displayPath: '外边距', type: 'object' },

    // 设备关联配置 (核心必需)
    { path: 'deviceId', displayPath: '设备ID', type: 'string' },
    { path: 'metricsList', displayPath: '指标列表', type: 'array' }
  ]

  // 添加所有标准基础属性
  standardBaseProperties.forEach(prop => {
    const currentValue = config?.base?.[prop.path] // 🔥 使用可选链，即使config为空也不报错
    const option = {
      label: `[基础] ${prop.displayPath} (${prop.type})`,
      value: `base.${prop.path}`, // 🔥 修复：监听属性使用简单路径，不需要组件ID
      property: {
        name: prop.path,
        label: prop.displayPath,
        type: prop.type,
        currentValue: currentValue
      }
    }
    options.push(option)
  })

  // Component层标准属性
  const standardComponentProperties = [
    { path: 'properties', displayPath: '组件属性', type: 'object' },
    { path: 'styles', displayPath: '组件样式', type: 'object' },
    { path: 'behavior', displayPath: '组件行为', type: 'object' }
  ]

  standardComponentProperties.forEach(prop => {
    const currentValue = config?.component?.[prop.path] // 🔥 使用可选链，即使config为空也不报错
    const option = {
      label: `[组件] ${prop.displayPath} (${prop.type})`,
      value: `component.${prop.path}`, // 🔥 修复：监听属性使用简单路径，不需要组件ID
      property: {
        name: prop.path,
        label: prop.displayPath,
        type: prop.type,
        currentValue: currentValue
      }
    }
    options.push(option)
  })

  return options
})

// ✅ 正确的事件类型样式 (3种)
const getEventType = (event: string) => {
  const typeMap = {
    click: 'click',
    hover: 'hover',
    dataChange: 'condition'
  }
  return typeMap[event] || 'default'
}

// ✅ 正确的事件标签 (3种)
const getEventLabel = (event: string) => {
  const labelMap = {
    click: t('interaction.events.click'),
    hover: t('interaction.events.hover'),
    dataChange: t('interaction.events.dataChange')
  }
  return labelMap[event] || event
}

// 获取摘要标题
const getSummaryTitle = (interaction: any) => {
  const actionType = getActionType(interaction)
  if (actionType === 'jump') {
    return t('interaction.summary.pageJump')
  } else if (actionType === 'modify') {
    return t('interaction.summary.modifyProperty')
  }
  return t('interaction.summary.customAction')
}

// 获取摘要描述
const getSummaryDesc = (interaction: any) => {
  const event = getEventLabel(interaction.event)
  const actionType = getActionType(interaction)

  // 🔥 数据变化事件需要显示监听属性和条件
  if (interaction.event === 'dataChange') {
    const watchedProperty = interaction.watchedProperty || t('interaction.empty.notSpecified')
    let conditionDesc = t('interaction.empty.noCondition')

    if (interaction.condition) {
      const conditionType = interaction.condition.type
      const value = interaction.condition.value

      if (conditionType === 'comparison') {
        const operator = interaction.condition.operator
        const operatorMap = {
          equals: t('interaction.operators.equals'),
          notEquals: t('interaction.operators.notEquals'),
          greaterThan: t('interaction.operators.greaterThan'),
          greaterThanOrEqual: t('interaction.operators.greaterThanOrEqual'),
          lessThan: t('interaction.operators.lessThan'),
          lessThanOrEqual: t('interaction.operators.lessThanOrEqual'),
          contains: t('interaction.operators.contains'),
          startsWith: t('interaction.operators.startsWith'),
          endsWith: t('interaction.operators.endsWith')
        }
        conditionDesc = `${operatorMap[operator] || operator} ${value}`
      } else if (conditionType === 'range') {
        conditionDesc = `${t('interaction.summary.range')} ${value}`
      } else if (conditionType === 'expression') {
        conditionDesc = `${t('interaction.summary.expression')} ${value}`
      }
    }

    let baseDesc = `${t('interaction.summary.listening')} ${watchedProperty} (${conditionDesc})`

    // 添加动作描述
    if (actionType === 'jump') {
      const url = interaction.responses?.[0]?.value || ''
      if (url.startsWith('http') || url.startsWith('https')) {
        baseDesc += ` → ${t('interaction.summary.jumpToExternal')}`
      } else if (url.startsWith('/')) {
        baseDesc += ` → ${t('interaction.summary.jumpToInternal')}`
      } else {
        baseDesc += ` → ${t('interaction.summary.jumpTo')} ${url}`
      }
    } else if (actionType === 'modify') {
      const target = interaction.responses?.[0]?.targetComponentId || t('interaction.empty.component')
      const property = interaction.responses?.[0]?.targetProperty || t('interaction.empty.property')
      baseDesc += ` → ${t('interaction.summary.modify')}${target}的${property}`
    }

    return baseDesc
  }

  if (actionType === 'jump') {
    const url = interaction.responses?.[0]?.value || ''
    // 🔥 区分内部菜单和外部链接
    if (url.startsWith('http') || url.startsWith('https')) {
      return `${event}${t('interaction.summary.whenClick')}: ${url}`
    } else if (url.startsWith('/')) {
      return `${event}${t('interaction.summary.whenHover')}: ${url}`
    }
    return `${event}${t('interaction.summary.whenEvent')} ${url}`
  } else if (actionType === 'modify') {
    const target = interaction.responses?.[0]?.targetComponentId || t('interaction.empty.component')
    const property = interaction.responses?.[0]?.targetProperty || t('interaction.empty.property')
    return `${event}${t('interaction.summary.whenEventModify')}${target}的${property}`
  }

  return `${event}${t('interaction.summary.whenEventCustom')}`
}

// 获取动作类型
const getActionType = (interaction: any) => {
  const firstResponse = interaction.responses?.[0]
  if (!firstResponse) return 'none'

  // 支持新的动作类型
  if (firstResponse.action === 'jump') return 'jump'
  if (firstResponse.action === 'modify') return 'modify'

  // 向后兼容旧的动作类型
  if (firstResponse.action === 'navigateToUrl') return 'jump'
  if (firstResponse.action === 'updateComponentData') return 'modify'

  return 'custom'
}

// 🔒 安全的属性获取函数 - 基于白名单访问组件属性
const getWhitelistedProperties = async (targetComponent: any, groups: Record<string, any[]>) => {
  if (!targetComponent?.type) return

  try {
    // 获取组件的白名单属性配置
    const whitelistedProperties = propertyExposureManager.getWhitelistedProperties(targetComponent.type, 'public', {
      source: 'interaction'
    })

    if (Object.keys(whitelistedProperties).length === 0) {
      return
    }

    const whitelistGroup = '🔒 白名单属性 (安全)'

    if (!groups[whitelistGroup]) {
      groups[whitelistGroup] = []
    }

    // 从组件的暴露属性中获取当前值
    const exposedProps = targetComponent.metadata?.exposedProperties || {}

    for (const [propertyName, config] of Object.entries(whitelistedProperties)) {
      const exposedName = config.alias || propertyName
      const currentValue = exposedProps[exposedName]

      // 使用属性暴露管理器验证访问权限
      const accessContext: PropertyAccessContext = {
        accessType: 'read',
        timestamp: Date.now(),
        source: 'interaction'
      }

      const accessResult = propertyExposureManager.getExposedProperty(
        targetComponent.type,
        targetComponent.id,
        propertyName,
        currentValue,
        accessContext
      )

      if (accessResult.allowed) {
        groups[whitelistGroup].push({
          label: `${exposedName} (${config.description})${currentValue !== undefined ? ` - 当前: ${String(currentValue)}` : ''}`,
          value: exposedName,
          property: {
            name: exposedName,
            label: exposedName,
            type: config.type,
            description: config.description,
            source: 'whitelist',
            readonly: config.readonly,
            level: config.level
          }
        })
      }
    }
  } catch (error) {
    console.error(`❌ [InteractionCardWizard] 获取白名单属性失败: ${targetComponent.type}`, error)
  }
}

// 编辑交互
const editInteraction = (index: number) => {
  editingIndex.value = index
  const interaction = interactions.value[index]

  // 填充当前表单
  currentInteraction.value = {
    event: interaction.event,
    enabled: interaction.enabled,
    priority: interaction.priority,
    url: '',
    target: '_blank',
    targetComponentId: '',
    targetProperty: '',
    updateValue: ''
  }

  // 🔥 重置数据变化相关状态
  currentWatchedProperty.value = ''
  currentConditionType.value = ''
  currentConditionOperator.value = ''
  currentConditionValue.value = ''

  // 🔥 重置目标属性绑定状态
  currentTargetPropertyBinding.value = ''
  currentTargetPropertyInfo.value = null

  // 🔥 如果是数据变化事件，加载监听属性和条件配置
  if (interaction.event === 'dataChange') {
    currentWatchedProperty.value = interaction.watchedProperty || ''

    if (interaction.condition) {
      currentConditionType.value = interaction.condition.type || ''

      if (interaction.condition.type === 'comparison') {
        currentConditionOperator.value = interaction.condition.operator || ''
        currentConditionValue.value = interaction.condition.value || ''
      } else if (interaction.condition.type === 'range' || interaction.condition.type === 'expression') {
        currentConditionValue.value = interaction.condition.value || ''
      }
    }
  }

  // 根据响应类型填充表单
  const firstResponse = interaction.responses?.[0]
  if (firstResponse) {
    // 处理新的跳转格式
    if (firstResponse.action === 'jump') {
      currentActionType.value = 'jump'

      if (firstResponse.jumpConfig) {
        // 新格式：使用 jumpConfig
        const jumpConfig = firstResponse.jumpConfig
        urlType.value = jumpConfig.jumpType
        currentInteraction.value.target = jumpConfig.target || '_self'

        if (jumpConfig.jumpType === 'external') {
          currentInteraction.value.url = jumpConfig.url || ''
        } else {
          selectedMenuPath.value = jumpConfig.internalPath || ''
          currentInteraction.value.url = jumpConfig.internalPath || ''
          loadMenuOptions()
        }
      } else {
        // 向后兼容旧格式
        const url = firstResponse.value || ''
        currentInteraction.value.url = url
        currentInteraction.value.target = firstResponse.target || '_blank'

        if (url && (url.startsWith('http') || url.startsWith('https'))) {
          urlType.value = 'external'
        } else if (url) {
          urlType.value = 'internal'
          selectedMenuPath.value = url
          loadMenuOptions()
        }
      }
    }
    // 处理旧的跳转格式
    else if (firstResponse.action === 'navigateToUrl') {
      currentActionType.value = 'jump'
      const url = firstResponse.value || ''
      currentInteraction.value.url = url
      currentInteraction.value.target = firstResponse.target || '_blank'

      if (url && (url.startsWith('http') || url.startsWith('https'))) {
        urlType.value = 'external'
      } else if (url) {
        urlType.value = 'internal'
        selectedMenuPath.value = url
        loadMenuOptions()
      }
    }
    // 处理新的修改格式
    else if (firstResponse.action === 'modify') {
      currentActionType.value = 'modify'

      if (firstResponse.modifyConfig) {
        // 新格式：使用 modifyConfig
        const modifyConfig = firstResponse.modifyConfig
        currentInteraction.value.targetComponentId = modifyConfig.targetComponentId || ''
        currentInteraction.value.targetProperty = modifyConfig.targetProperty || ''
        currentInteraction.value.updateValue = modifyConfig.updateValue || ''

        // 🔥 构建目标属性绑定路径
        if (modifyConfig.targetComponentId && modifyConfig.targetProperty) {
          currentTargetPropertyBinding.value = `${modifyConfig.targetComponentId}.${modifyConfig.targetProperty}`
        }
      } else {
        // 向后兼容旧格式
        currentInteraction.value.targetComponentId = firstResponse.targetComponentId || ''
        currentInteraction.value.targetProperty = firstResponse.targetProperty || ''
        currentInteraction.value.updateValue = firstResponse.updateValue || ''

        // 🔥 构建目标属性绑定路径
        if (firstResponse.targetComponentId && firstResponse.targetProperty) {
          currentTargetPropertyBinding.value = `${firstResponse.targetComponentId}.${firstResponse.targetProperty}`
        }
      }
    }
    // 处理旧的修改格式
    else if (firstResponse.action === 'updateComponentData') {
      currentActionType.value = 'modify'
      currentInteraction.value.targetComponentId = firstResponse.targetComponentId || ''
      currentInteraction.value.targetProperty = firstResponse.targetProperty || ''
      currentInteraction.value.updateValue = firstResponse.updateValue || ''

      // 🔥 构建目标属性绑定路径
      if (firstResponse.targetComponentId && firstResponse.targetProperty) {
        currentTargetPropertyBinding.value = `${firstResponse.targetComponentId}.${firstResponse.targetProperty}`
      }
    }
  }

  showAddModal.value = true
}

// 删除交互
const deleteInteraction = (index: number) => {
  interactions.value.splice(index, 1)
  emit('update:modelValue', interactions.value)
}

// 🔥 数据变化相关处理函数
const handleWatchedPropertyChange = (bindingPath: string, propertyInfo?: any) => {
  currentWatchedProperty.value = bindingPath

  // 🔥 可选：如果需要使用属性信息进行额外处理
  if (propertyInfo) {
  }
}

// 🔥 新增：目标属性绑定变化处理
const handleTargetPropertyChange = (bindingPath: string, propertyInfo?: any) => {
  currentTargetPropertyBinding.value = bindingPath
  currentTargetPropertyInfo.value = propertyInfo

  // 解析绑定路径更新原有字段（向后兼容）
  if (bindingPath && propertyInfo) {
    currentInteraction.value.targetComponentId = propertyInfo.componentId
    currentInteraction.value.targetProperty = `${propertyInfo.layer}.${propertyInfo.propertyName}`
  } else {
    currentInteraction.value.targetComponentId = ''
    currentInteraction.value.targetProperty = ''
  }
}

const handleConditionTypeChange = (value: string) => {
  currentConditionType.value = value
  // 重置条件值
  currentConditionOperator.value = ''
  currentConditionValue.value = ''
}

// 🔥 内部菜单相关处理函数
const handleUrlTypeChange = () => {
  if (urlType.value === 'internal') {
    // 切换到内部菜单时，加载菜单选项
    // 强制重新加载菜单（不检查缓存）
    menuOptions.value = [] // 清空缓存
    loadMenuOptions()
    // 清空外部链接
    currentInteraction.value.url = ''
  } else {
    // 切换到外部链接时，清空菜单选择
    selectedMenuPath.value = ''
  }
}

const handleMenuPathChange = () => {
  currentInteraction.value.url = selectedMenuPath.value
}

const loadMenuOptions = async () => {
  menuLoading.value = true
  try {
    const result = await fetchGetUserRoutes()
    if (result && result.data && result.data.list) {
      // 将路由数据转换为选项格式
      const flattened = flattenRoutes(result.data.list)
      menuOptions.value = flattened

      // 如果没有菜单项，说明扁平化函数有问题
      if (flattened.length === 0) {
        message.error(t('interaction.messages.menuDataProcessFailed'))
      }
    } else {
      message.error(t('interaction.messages.menuDataAbnormal'))
    }
  } catch (error) {
    message.error(t('interaction.messages.menuLoadFailed') + ': ' + error.message)
  } finally {
    menuLoading.value = false
  }
}

// 扁平化路由数据，适配新的数据结构（path + meta.title）
const flattenRoutes = (routes: any[]): { label: string; value: string }[] => {
  const options: { label: string; value: string }[] = []

  // 递归处理函数
  const processRoute = (route: any, parentTitle = '') => {
    // 新数据结构：path 作为路径，meta.title 作为标题
    const path = route.path
    const title = route.meta?.title || route.meta?.i18nKey || route.name

    // 生成显示标签（如果有父级，用 / 分隔）
    const displayLabel = parentTitle ? `${parentTitle} / ${title}` : title
    // 如果有路径和标题，并且不是隐藏菜单项，就添加到选项中
    if (path && title && !route.meta?.hideInMenu) {
      const option = { label: displayLabel, value: path }
      options.push(option)
    }
    // 递归处理所有子路由
    if (route.children && Array.isArray(route.children) && route.children.length > 0) {
      route.children.forEach(child => processRoute(child, displayLabel))
    }
  }

  // 处理所有顶级路由
  routes.forEach(route => processRoute(route))
  return options
}

// 处理动作类型变化
const handleActionTypeChange = (value: string) => {
  currentActionType.value = value
  // 重置相关字段
  if (value === 'jump') {
    urlType.value = 'external'
    currentInteraction.value.url = 'https://example.com'
    currentInteraction.value.target = '_blank'
    selectedMenuPath.value = ''
  } else if (value === 'modify') {
    currentInteraction.value.targetComponentId = ''
    currentInteraction.value.targetProperty = 'backgroundColor'
    currentInteraction.value.updateValue = '#ff0000'
  }
}

// 保存交互
const saveInteraction = () => {
  const interaction: any = {
    event: currentInteraction.value.event,
    enabled: currentInteraction.value.enabled,
    priority: currentInteraction.value.priority,
    responses: []
  }

  // 🔥 如果是数据变化事件，保存监听属性和条件配置
  if (currentInteraction.value.event === 'dataChange') {
    interaction.watchedProperty = currentWatchedProperty.value

    // 构建条件配置
    if (currentConditionType.value) {
      interaction.condition = {
        type: currentConditionType.value
      }

      if (currentConditionType.value === 'comparison') {
        interaction.condition.operator = currentConditionOperator.value
        interaction.condition.value = currentConditionValue.value
      } else if (currentConditionType.value === 'range' || currentConditionType.value === 'expression') {
        interaction.condition.value = currentConditionValue.value
      }
    }
  }

  // 根据动作类型构建响应
  if (currentActionType.value === 'jump') {
    // 生成新的跳转配置格式
    const jumpConfig = {
      jumpType: urlType.value === 'external' ? 'external' : 'internal',
      target: currentInteraction.value.target || '_self'
    }

    if (urlType.value === 'external') {
      jumpConfig.url = currentInteraction.value.url
    } else {
      jumpConfig.internalPath = selectedMenuPath.value || currentInteraction.value.url
    }

    interaction.responses = [
      {
        action: 'jump',
        jumpConfig: jumpConfig,
        // 向后兼容旧格式
        value: currentInteraction.value.url,
        target: currentInteraction.value.target
      }
    ]
  } else if (currentActionType.value === 'modify') {
    // 🔥 优先使用新的绑定路径，解析出组件ID和属性路径
    let targetComponentId = currentInteraction.value.targetComponentId
    let targetProperty = currentInteraction.value.targetProperty

    if (currentTargetPropertyBinding.value && currentTargetPropertyInfo.value) {
      // 使用新的绑定路径信息
      targetComponentId = currentTargetPropertyInfo.value.componentId
      targetProperty = `${currentTargetPropertyInfo.value.layer}.${currentTargetPropertyInfo.value.propertyName}`
    }

    // 生成新的修改配置格式
    const modifyConfig = {
      targetComponentId: targetComponentId,
      targetProperty: targetProperty,
      updateValue: currentInteraction.value.updateValue,
      updateMode: 'replace',
      // 🔥 新增：保存完整的绑定路径信息
      bindingPath: currentTargetPropertyBinding.value
    }

    interaction.responses = [
      {
        action: 'modify',
        modifyConfig: modifyConfig,
        // 向后兼容旧格式
        targetComponentId: targetComponentId,
        targetProperty: targetProperty,
        updateValue: currentInteraction.value.updateValue
      }
    ]
  }

  if (editingIndex.value >= 0) {
    // 编辑模式
    interactions.value[editingIndex.value] = interaction
    editingIndex.value = -1
  } else {
    // 添加模式
    interactions.value.push(interaction)
  }

  emit('update:modelValue', interactions.value)
  showAddModal.value = false

  // 重置表单
  currentInteraction.value = {
    event: 'click',
    enabled: true,
    priority: 1,
    url: '',
    target: '_blank',
    targetComponentId: '',
    targetProperty: '',
    updateValue: ''
  }
  currentActionType.value = ''
  urlType.value = 'external'
  selectedMenuPath.value = ''

  // 🔥 重置数据变化相关状态
  currentWatchedProperty.value = ''
  currentConditionType.value = ''
  currentConditionOperator.value = ''
  currentConditionValue.value = ''

  // 🔥 重置目标属性绑定状态
  currentTargetPropertyBinding.value = ''
  currentTargetPropertyInfo.value = null
}
</script>

<style scoped>
.interaction-simple {
  padding: 16px;
  height: 100%;
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-color-3);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-color-2);
}

.empty-desc {
  font-size: 12px;
}

/* 交互列表 */
.interactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.interaction-item {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.interaction-summary {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.summary-badge.click {
  background: var(--success-color-suppl);
  color: var(--success-color);
}

.summary-badge.hover {
  background: var(--info-color-suppl);
  color: var(--info-color);
}

.summary-badge.condition {
  background: var(--warning-color-suppl);
  color: var(--warning-color);
}

.summary-text {
  flex: 1;
}

.summary-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.summary-desc {
  font-size: 12px;
  color: var(--text-color-3);
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
