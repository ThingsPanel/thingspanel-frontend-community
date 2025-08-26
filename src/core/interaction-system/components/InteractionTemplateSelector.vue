<template>
  <div class="interaction-template-selector">
    <!-- 模板分类选择 -->
    <div class="template-categories">
      <n-tabs v-model:value="activeCategory" type="line" size="small">
        <n-tab-pane
          v-for="category in templateCategories"
          :key="category.key"
          :name="category.key"
          :tab="category.label"
        >
          <!-- 模板网格 -->
          <div class="templates-grid">
            <n-card
              v-for="template in getTemplatesByCategory(category.key)"
              :key="template.id"
              size="small"
              hoverable
              class="template-card"
              @click="selectTemplate(template)"
            >
              <template #header>
                <div class="template-header">
                  <n-icon class="template-icon" :color="template.color">
                    <component :is="template.icon" />
                  </n-icon>
                  <span class="template-name">{{ template.name }}</span>
                </div>
              </template>

              <div class="template-content">
                <p class="template-description">{{ template.description }}</p>

                <!-- 交互事件预览 -->
                <div class="template-events">
                  <n-tag
                    v-for="event in template.config.map(c => c.event)"
                    :key="event"
                    size="small"
                    :type="getEventTagType(event)"
                    round
                  >
                    {{ getEventDisplayName(event) }}
                  </n-tag>
                </div>

                <!-- 动作数量显示 -->
                <div class="template-stats">
                  <n-text depth="3" style="font-size: 12px">
                    {{ getTotalActionsCount(template.config) }} {{ t('interaction.template.actions') }}
                  </n-text>
                </div>
              </div>

              <template #action>
                <n-space size="small" justify="space-between">
                  <n-button size="tiny" quaternary @click.stop="showTemplatePreview(template)">
                    <template #icon>
                      <n-icon><EyeOutline /></n-icon>
                    </template>
                    {{ t('interaction.template.preview') }}
                  </n-button>

                  <n-button size="tiny" type="primary" @click.stop="selectTemplate(template)">
                    {{ t('interaction.template.select') }}
                  </n-button>
                </n-space>
              </template>
            </n-card>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 自定义模板上传 -->
    <div class="custom-template-section">
      <n-divider dashed>
        <n-text depth="3">{{ t('interaction.template.customTemplate') }}</n-text>
      </n-divider>

      <n-space vertical size="small">
        <n-upload :show-file-list="false" accept=".json" :before-upload="handleCustomTemplateUpload">
          <n-button dashed size="small">
            <template #icon>
              <n-icon><CloudUploadOutline /></n-icon>
            </template>
            {{ t('interaction.template.importTemplateFile') }}
          </n-button>
        </n-upload>

        <n-input
          v-model:value="customTemplateJson"
          type="textarea"
          :rows="4"
          :placeholder="t('interaction.placeholders.customTemplateJson')"
          size="small"
        />

        <n-space size="small">
          <n-button size="small" type="primary" :disabled="!customTemplateJson.trim()" @click="importCustomTemplate">
            {{ t('interaction.template.importConfig') }}
          </n-button>
          <n-button size="small" @click="customTemplateJson = ''">{{ t('interaction.template.clearInput') }}</n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 模板预览对话框 -->
    <n-modal
      v-model:show="showPreviewDialog"
      :title="t('interaction.template.templatePreview') + ': ' + (previewTemplate?.name || '')"
    >
      <n-card style="width: 600px" :bordered="false" size="huge">
        <InteractionTemplatePreview
          v-if="previewTemplate"
          :template="previewTemplate"
          @close="showPreviewDialog = false"
        />
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互模板选择器
 * 提供预设的交互模板供用户快速选择
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NTabs,
  NTabPane,
  NCard,
  NIcon,
  NTag,
  NText,
  NSpace,
  NButton,
  NDivider,
  NUpload,
  NInput,
  NModal,
  useMessage
} from 'naive-ui'
import {
  EyeOutline,
  CloudUploadOutline,
  FlashOutline,
  ColorPaletteOutline,
  PlayOutline,
  SettingsOutline,
  HeartOutline,
  StarOutline
} from '@vicons/ionicons5'

import type { InteractionConfig, InteractionEventType } from '@/card2.1/core/interaction-types'
import InteractionTemplatePreview from './InteractionTemplatePreview.vue'

interface InteractionTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: any
  color: string
  config: InteractionConfig[]
  tags?: string[]
}

interface Emits {
  (e: 'select', template: InteractionConfig): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()
const message = useMessage()
const { t } = useI18n()

// 响应式状态
const activeCategory = ref('basic')
const customTemplateJson = ref('')
const showPreviewDialog = ref(false)
const previewTemplate = ref<InteractionTemplate | null>(null)

// 模板分类
const templateCategories = computed(() => [
  { key: 'basic', label: t('interaction.template.basic') },
  { key: 'visual', label: t('interaction.template.visual') },
  { key: 'animation', label: t('interaction.template.animation') },
  { key: 'complex', label: t('interaction.template.complex') },
  { key: 'user', label: t('interaction.template.user') }
])

// 预设模板
const predefinedTemplates = computed((): InteractionTemplate[] => [
  // 基础交互模板
  {
    id: 'click-highlight',
    name: t('interaction.template.predefined.clickHighlight'),
    description: t('interaction.template.predefined.clickHighlightDesc'),
    category: 'basic',
    icon: FlashOutline,
    color: '#18a058',
    config: [
      {
        event: 'click',
        responses: [
          {
            action: 'changeBackgroundColor',
            value: '#ffeb3b',
            duration: 200
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.clickHighlightEffect')
      }
    ]
  },
  {
    id: 'hover-scale',
    name: t('interaction.template.predefined.hoverScale'),
    description: t('interaction.template.predefined.hoverScaleDesc'),
    category: 'basic',
    icon: SettingsOutline,
    color: '#2080f0',
    config: [
      {
        event: 'hover',
        responses: [
          {
            action: 'changeTransform',
            value: 'scale(1.05)',
            duration: 300,
            easing: 'ease-out'
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.hoverScaleEffect')
      }
    ]
  },

  // 视觉效果模板
  {
    id: 'rainbow-border',
    name: t('interaction.template.predefined.rainbowBorder'),
    description: t('interaction.template.predefined.rainbowBorderDesc'),
    category: 'visual',
    icon: ColorPaletteOutline,
    color: '#f0a020',
    config: [
      {
        event: 'click',
        responses: [
          {
            action: 'changeBorderColor',
            value: '#ff4757',
            duration: 200
          },
          {
            action: 'changeBorderColor',
            value: '#3742fa',
            duration: 200,
            delay: 200
          },
          {
            action: 'changeBorderColor',
            value: '#2ed573',
            duration: 200,
            delay: 400
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.rainbowBorderEffect')
      }
    ]
  },
  {
    id: 'fade-toggle',
    name: t('interaction.template.predefined.fadeToggle'),
    description: t('interaction.template.predefined.fadeToggleDesc'),
    category: 'visual',
    icon: EyeOutline,
    color: '#7c3aed',
    config: [
      {
        event: 'click',
        responses: [
          {
            action: 'changeOpacity',
            value: 0.3,
            duration: 500,
            easing: 'ease-in-out'
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.transparencyToggle')
      }
    ]
  },

  // 动画效果模板
  {
    id: 'pulse-animation',
    name: t('interaction.template.predefined.pulseAnimation'),
    description: t('interaction.template.predefined.pulseAnimationDesc'),
    category: 'animation',
    icon: HeartOutline,
    color: '#e74c3c',
    config: [
      {
        event: 'click',
        responses: [
          {
            action: 'triggerAnimation',
            value: 'pulse',
            duration: 1000,
            easing: 'ease-in-out'
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.pulseAnimationName')
      }
    ]
  },
  {
    id: 'shake-animation',
    name: t('interaction.template.predefined.shakeAnimation'),
    description: t('interaction.template.predefined.shakeAnimationDesc'),
    category: 'animation',
    icon: PlayOutline,
    color: '#f39c12',
    config: [
      {
        event: 'blur',
        responses: [
          {
            action: 'triggerAnimation',
            value: 'shake',
            duration: 600,
            easing: 'ease-in-out'
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.shakeTip')
      }
    ]
  },

  // 复合交互模板
  {
    id: 'complete-feedback',
    name: t('interaction.template.predefined.completeFeedback'),
    description: t('interaction.template.predefined.completeFeedbackDesc'),
    category: 'complex',
    icon: StarOutline,
    color: '#9b59b6',
    config: [
      {
        event: 'hover',
        responses: [
          {
            action: 'changeBackgroundColor',
            value: '#f8f9fa',
            duration: 200
          }
        ],
        enabled: true,
        priority: 3,
        name: t('interaction.template.predefined.hoverFeedback')
      },
      {
        event: 'click',
        responses: [
          {
            action: 'changeBackgroundColor',
            value: '#007bff',
            duration: 100
          },
          {
            action: 'changeTextColor',
            value: '#ffffff',
            duration: 100
          }
        ],
        enabled: true,
        priority: 2,
        name: t('interaction.template.predefined.clickFeedback')
      },
      {
        event: 'focus',
        responses: [
          {
            action: 'changeBorderColor',
            value: '#007bff',
            duration: 200
          }
        ],
        enabled: true,
        priority: 1,
        name: t('interaction.template.predefined.focusFeedback')
      }
    ]
  }
])

// 用户自定义模板（从localStorage加载）
const userTemplates = ref<InteractionTemplate[]>([])

// 所有模板
const allTemplates = computed(() => [...predefinedTemplates.value, ...userTemplates.value])

// 根据分类获取模板
const getTemplatesByCategory = (category: string) => {
  return allTemplates.value.filter(template => template.category === category)
}

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
    click: t('interaction.events.click'),
    hover: t('interaction.events.hover'),
    focus: t('interaction.events.focus'),
    blur: t('interaction.events.blur'),
    custom: t('interaction.events.custom')
  }
  return nameMap[event] || event
}

// 获取总动作数量
const getTotalActionsCount = (configs: InteractionConfig[]) => {
  return configs.reduce((total, config) => total + config.responses.length, 0)
}

// 选择模板
const selectTemplate = (template: InteractionTemplate) => {
  // 为每个配置项创建副本并发出选择事件
  template.config.forEach(config => {
    emit('select', { ...config })
  })
}

// 预览模板
const showTemplatePreview = (template: InteractionTemplate) => {
  previewTemplate.value = template
  showPreviewDialog.value = true
}

// 处理自定义模板上传
const handleCustomTemplateUpload = (data: { file: { file?: File } }) => {
  const file = data.file.file
  if (!file) return false

  const reader = new FileReader()
  reader.onload = e => {
    try {
      const content = e.target?.result as string
      customTemplateJson.value = content
      message.success(t('interaction.messages.templateFileLoaded'))
    } catch (error) {
      message.error(t('interaction.messages.fileReadFailed'))
    }
  }
  reader.readAsText(file)

  return false // 阻止默认上传行为
}

// 导入自定义模板
const importCustomTemplate = () => {
  try {
    const templateData = JSON.parse(customTemplateJson.value)

    // 验证模板格式
    if (!templateData.name || !templateData.config || !Array.isArray(templateData.config)) {
      throw new Error(t('interaction.messages.invalidTemplateFormat'))
    }

    // 创建新的用户模板
    const newTemplate: InteractionTemplate = {
      id: `user-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || t('interaction.template.predefined.userCustomTemplate'),
      category: 'user',
      icon: SettingsOutline,
      color: '#6c757d',
      config: templateData.config,
      tags: templateData.tags || []
    }

    // 添加到用户模板列表
    userTemplates.value.push(newTemplate)

    // 保存到localStorage
    saveUserTemplates()

    // 切换到用户自定义分类
    activeCategory.value = 'user'

    // 清空输入
    customTemplateJson.value = ''

    message.success(t('interaction.messages.templateImported'))
  } catch (error) {
    message.error(t('interaction.messages.templateFormatError'))
    console.error('模板导入错误:', error)
  }
}

// 保存用户模板到localStorage
const saveUserTemplates = () => {
  try {
    localStorage.setItem('interaction-user-templates', JSON.stringify(userTemplates.value))
  } catch (error) {
    console.error('保存用户模板失败:', error)
  }
}

// 加载用户模板从localStorage
const loadUserTemplates = () => {
  try {
    const saved = localStorage.getItem('interaction-user-templates')
    if (saved) {
      userTemplates.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载用户模板失败:', error)
  }
}

// 组件挂载时加载用户模板
loadUserTemplates()
</script>

<style scoped>
.interaction-template-selector {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
}

.template-categories {
  margin-bottom: 24px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.template-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.template-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--primary-color-hover);
}

.template-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-icon {
  font-size: 18px;
}

.template-name {
  font-weight: 600;
  color: var(--text-color);
}

.template-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-color-2);
  line-height: 1.4;
}

.template-events {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.template-stats {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.custom-template-section {
  padding: 16px;
  background: var(--body-color);
  border: 1px dashed var(--border-color);
  border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .template-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 滚动条样式 */
.interaction-template-selector::-webkit-scrollbar {
  width: 6px;
}

.interaction-template-selector::-webkit-scrollbar-track {
  background: var(--body-color);
  border-radius: 3px;
}

.interaction-template-selector::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.interaction-template-selector::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

/* 卡片动画 */
.template-card {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单样式 */
:deep(.n-upload) {
  width: 100%;
}

:deep(.n-input) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

/* 标签页样式 */
:deep(.n-tabs .n-tabs-content) {
  padding-top: 0;
}
</style>
