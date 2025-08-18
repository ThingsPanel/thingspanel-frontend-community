<!-- src/components/visual-editor/settings/components/InteractionSettingsForm.vue -->
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
            <n-form-item label="触发事件">
              <n-select
                v-model:value="config.event"
                :options="eventTypeOptions"
                :disabled="readonly"
                @update:value="handleInteractionChange"
              />
            </n-form-item>

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
          </n-form>

          <!-- 响应动作列表 -->
          <div class="responses-section">
            <div class="section-header">
              <span class="section-title">响应动作</span>
              <n-button size="tiny" type="primary" dashed :disabled="readonly" @click="addResponse(index)">
                <template #icon>
                  <n-icon><AddOutline /></n-icon>
                </template>
                添加动作
              </n-button>
            </div>

            <div v-if="config.responses.length === 0" class="no-responses">
              <n-empty description="暂无响应动作" size="small">
                <template #extra>
                  <n-button size="small" :disabled="readonly" @click="addResponse(index)">添加第一个动作</n-button>
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

import { ref, computed, watch, onMounted, nextTick } from 'vue'
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
  SettingsOutline
} from '@vicons/ionicons5'

// 导入交互系统相关类型和工具
import type {
  InteractionConfig,
  InteractionEventType,
  InteractionActionType,
  InteractionResponse
} from '@/card2.1/core/interaction-types'
import { interactionManager } from '@/card2.1/core/interaction-manager'

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

// 响应式状态
const localInteractionConfigs = ref<InteractionConfig[]>([])
const showTemplateDialog = ref(false)
const showPreviewDialog = ref(false)

// 计算属性
const hasInteractions = computed(() => localInteractionConfigs.value.length > 0)

// 事件类型选项
const eventTypeOptions = ref([
  { label: '点击', value: 'click' },
  { label: '悬停', value: 'hover' },
  { label: '聚焦', value: 'focus' },
  { label: '失焦', value: 'blur' },
  { label: '自定义', value: 'custom' }
])

// 动作类型选项
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
  { label: '自定义动作', value: 'custom' }
])

// 获取事件标签类型
const getEventTagType = (event: InteractionEventType) => {
  const typeMap = {
    click: 'success',
    hover: 'info',
    focus: 'warning',
    blur: 'default',
    custom: 'error'
  }
  return typeMap[event] || 'default'
}

// 获取事件显示名称
const getEventDisplayName = (event: InteractionEventType) => {
  const nameMap = {
    click: '点击',
    hover: '悬停',
    focus: '聚焦',
    blur: '失焦',
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

// 添加交互配置
const addInteractionConfig = () => {
  const newConfig: InteractionConfig = {
    event: 'click',
    responses: [],
    enabled: true,
    priority: 1,
    name: `交互配置 ${localInteractionConfigs.value.length + 1}`
  }

  localInteractionConfigs.value.push(newConfig)
  handleInteractionChange()
}

// 添加响应动作
const addResponse = (configIndex: number) => {
  const newResponse: InteractionResponse = {
    action: 'changeBackgroundColor',
    value: '#ff6b6b'
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
</style>
