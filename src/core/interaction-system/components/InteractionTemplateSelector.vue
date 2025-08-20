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
                  <n-text depth="3" style="font-size: 12px">{{ getTotalActionsCount(template.config) }} 个动作</n-text>
                </div>
              </div>

              <template #action>
                <n-space size="small" justify="space-between">
                  <n-button size="tiny" quaternary @click.stop="showTemplatePreview(template)">
                    <template #icon>
                      <n-icon><EyeOutline /></n-icon>
                    </template>
                    预览
                  </n-button>

                  <n-button size="tiny" type="primary" @click.stop="selectTemplate(template)">选择</n-button>
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
        <n-text depth="3">自定义模板</n-text>
      </n-divider>

      <n-space vertical size="small">
        <n-upload :show-file-list="false" accept=".json" :before-upload="handleCustomTemplateUpload">
          <n-button dashed size="small">
            <template #icon>
              <n-icon><CloudUploadOutline /></n-icon>
            </template>
            导入模板文件
          </n-button>
        </n-upload>

        <n-input
          v-model:value="customTemplateJson"
          type="textarea"
          :rows="4"
          placeholder="粘贴JSON格式的模板配置"
          size="small"
        />

        <n-space size="small">
          <n-button size="small" type="primary" :disabled="!customTemplateJson.trim()" @click="importCustomTemplate">
            导入配置
          </n-button>
          <n-button size="small" @click="customTemplateJson = ''">清空</n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 模板预览对话框 -->
    <n-modal v-model:show="showPreviewDialog" :title="`模板预览: ${previewTemplate?.name}`">
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

// 响应式状态
const activeCategory = ref('basic')
const customTemplateJson = ref('')
const showPreviewDialog = ref(false)
const previewTemplate = ref<InteractionTemplate | null>(null)

// 模板分类
const templateCategories = [
  { key: 'basic', label: '基础交互' },
  { key: 'visual', label: '视觉效果' },
  { key: 'animation', label: '动画效果' },
  { key: 'complex', label: '复合交互' },
  { key: 'user', label: '用户自定义' }
]

// 预设模板
const predefinedTemplates: InteractionTemplate[] = [
  // 基础交互模板
  {
    id: 'click-highlight',
    name: '点击高亮',
    description: '点击时改变背景颜色高亮显示',
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
        name: '点击高亮效果'
      }
    ]
  },
  {
    id: 'hover-scale',
    name: '悬停缩放',
    description: '鼠标悬停时轻微放大元素',
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
        name: '悬停缩放效果'
      }
    ]
  },

  // 视觉效果模板
  {
    id: 'rainbow-border',
    name: '彩虹边框',
    description: '点击时边框颜色循环变化',
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
        name: '彩虹边框效果'
      }
    ]
  },
  {
    id: 'fade-toggle',
    name: '淡入淡出',
    description: '点击切换元素的透明度',
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
        name: '透明度切换'
      }
    ]
  },

  // 动画效果模板
  {
    id: 'pulse-animation',
    name: '脉冲动画',
    description: '点击触发脉冲动画效果',
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
        name: '脉冲动画'
      }
    ]
  },
  {
    id: 'shake-animation',
    name: '摇摆动画',
    description: '失焦时触发摇摆动画',
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
        name: '摇摆提示'
      }
    ]
  },

  // 复合交互模板
  {
    id: 'complete-feedback',
    name: '完整反馈',
    description: '包含悬停、点击、聚焦的完整交互反馈',
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
        name: '悬停反馈'
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
        name: '点击反馈'
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
        name: '聚焦反馈'
      }
    ]
  }
]

// 用户自定义模板（从localStorage加载）
const userTemplates = ref<InteractionTemplate[]>([])

// 所有模板
const allTemplates = computed(() => [...predefinedTemplates, ...userTemplates.value])

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
    click: '点击',
    hover: '悬停',
    focus: '聚焦',
    blur: '失焦',
    custom: '自定义'
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
      message.success('模板文件已加载')
    } catch (error) {
      message.error('文件读取失败')
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
      throw new Error('无效的模板格式')
    }

    // 创建新的用户模板
    const newTemplate: InteractionTemplate = {
      id: `user-${Date.now()}`,
      name: templateData.name,
      description: templateData.description || '用户自定义模板',
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

    message.success(`模板 "${newTemplate.name}" 导入成功`)
  } catch (error) {
    message.error('模板格式错误，请检查JSON格式')
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
