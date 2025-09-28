<template>
  <div class="digit-indicator-setting">
    <n-form :model="config" label-placement="left" label-width="auto" size="small">

      <!-- 图标样式 -->
      <n-divider title-placement="left">
        <span class="section-title">📱 图标样式</span>
      </n-divider>

      <n-form-item label="">
        <IconSelector
          :default-icon="config.iconName"
          @icon-selected="handleIconSelect"
        />
      </n-form-item>

      <!-- 风格套装选择 -->
      <n-divider title-placement="left">
        <span class="section-title">🎨 视觉风格</span>
      </n-divider>

      <n-form-item label="">
        <n-space vertical style="width: 100%;">
          <n-grid :cols="2" :x-gap="8" :y-gap="8">
            <n-grid-item v-for="preset in stylePresets" :key="preset.name">
              <n-card
                size="small"
                hoverable
                class="preset-card"
                @click="applyPreset(preset)"
              >
                <div class="preset-content">
                  <div class="preset-name">{{ preset.name }}</div>
                  <div class="preset-description">{{ preset.description }}</div>
                  <div class="preset-preview">
                    <div
                      class="color-dot icon-color"
                      :style="{ backgroundColor: preset.value.iconColor }"
                    ></div>
                    <div
                      class="color-dot value-color"
                      :style="{ backgroundColor: preset.value.valueColor }"
                    ></div>
                    <div
                      class="color-dot unit-color"
                      :style="{ backgroundColor: preset.value.unitColor }"
                    ></div>
                  </div>
                </div>
              </n-card>
            </n-grid-item>
          </n-grid>

          <n-button
            size="small"
            type="tertiary"
            @click="openJsonEditor"
            style="align-self: flex-start; margin-top: 8px;"
          >
            🔧 高级定制 (JSON)
          </n-button>
        </n-space>
      </n-form-item>

      <!-- 性能选项 -->
      <n-divider title-placement="left">
        <span class="section-title">⚡ 性能选项</span>
      </n-divider>

      <n-form-item label="悬停效果">
        <n-switch v-model:value="config.enableHover" />
        <template #feedback>
          <span class="help-text">启用会更好看但可能影响性能，关闭可提升渲染性能</span>
        </template>
      </n-form-item>

      <!-- JSON编辑器模态框 -->
      <n-modal
        v-model:show="showJsonEditor"
        preset="card"
        title="高级配置 - JSON编辑"
        style="width: 600px;"
      >
        <n-space vertical>
          <n-input
            v-model:value="jsonConfigText"
            type="textarea"
            :rows="15"
            placeholder="编辑配置JSON..."
            style="font-family: monospace; font-size: 12px;"
          />
          <n-space justify="end">
            <n-button @click="showJsonEditor = false">取消</n-button>
            <n-button type="primary" @click="applyJsonConfig">应用配置</n-button>
          </n-space>
        </n-space>
      </n-modal>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 数字指示器组件配置表单 - 简化版
 * 专注样式配置，去除冗余功能
 */

import { ref, watch, nextTick } from 'vue'
import {
  NForm,
  NFormItem,
  NDivider,
  NSpace,
  NButton,
  NModal,
  NInput,
  NCard,
  NGrid,
  NGridItem,
  NSwitch
} from 'naive-ui'
import IconSelector from '@/components/common/icon-selector.vue'
import type { DigitIndicatorCustomize } from './settingConfig'
import { customConfig } from './settingConfig'

// Props
interface Props {
  modelValue?: DigitIndicatorCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ ...customConfig }),
  readonly: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: DigitIndicatorCustomize): void
  (e: 'change', value: DigitIndicatorCustomize): void
}

const emit = defineEmits<Emits>()

// 配置数据
const config = ref<DigitIndicatorCustomize>({ ...props.modelValue })

// 防止循环更新的标记
const isUpdatingFromProps = ref(false)

// 图标选择处理器
const handleIconSelect = (iconName: string) => {
  config.value.iconName = iconName
}

// 完整视觉风格套装 - 包含所有样式属性（除悬停效果）
const stylePresets = [
  {
    name: '简约商务',
    description: '专业、干净、现代',
    value: {
      // 颜色搭配
      iconColor: '#595959',
      valueColor: '#262626',
      unitColor: '#8c8c8c',
      titleColor: '#bfbfbf',
      backgroundColor: '',
      // 尺寸设计
      iconSize: 40,
      valueSize: 28,
      unitSize: 14,
      titleSize: 12,
      padding: 12,
      // 视觉效果
      valueFontWeight: 500,
      showGradient: false
      // enableHover 由用户单独控制
    }
  },
  {
    name: '科技未来',
    description: '动感、科技、炫酷',
    value: {
      iconColor: '#1890ff',
      valueColor: '#1890ff',
      unitColor: '#52c41a',
      titleColor: '#666666',
      backgroundColor: 'rgba(24, 144, 255, 0.05)',
      iconSize: 52,
      valueSize: 36,
      unitSize: 16,
      titleSize: 14,
      padding: 18,
      valueFontWeight: 700,
      showGradient: true
    }
  },
  {
    name: '温馨家居',
    description: '温暖、舒适、亲和',
    value: {
      iconColor: '#ff7a45',
      valueColor: '#fa541c',
      unitColor: '#ff9c6e',
      titleColor: '#ad6800',
      backgroundColor: 'rgba(255, 122, 69, 0.08)',
      iconSize: 44,
      valueSize: 30,
      unitSize: 15,
      titleSize: 13,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: '自然清新',
    description: '清新、环保、生机',
    value: {
      iconColor: '#52c41a',
      valueColor: '#389e0d',
      unitColor: '#73d13d',
      titleColor: '#135200',
      backgroundColor: 'rgba(82, 196, 26, 0.06)',
      iconSize: 46,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: '警示醒目',
    description: '醒目、警示、重要',
    value: {
      iconColor: '#ff4d4f',
      valueColor: '#cf1322',
      unitColor: '#ff7875',
      titleColor: '#820014',
      backgroundColor: 'rgba(255, 77, 79, 0.08)',
      iconSize: 50,
      valueSize: 34,
      unitSize: 17,
      titleSize: 15,
      padding: 18,
      valueFontWeight: 700,
      showGradient: true
    }
  },
  {
    name: '优雅紫调',
    description: '优雅、神秘、高贵',
    value: {
      iconColor: '#722ed1',
      valueColor: '#531dab',
      unitColor: '#9254de',
      titleColor: '#391085',
      backgroundColor: 'rgba(114, 46, 209, 0.06)',
      iconSize: 48,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 600,
      showGradient: true
    }
  },
  {
    name: '极简黑白',
    description: '极简、现代、经典',
    value: {
      iconColor: '#000000',
      valueColor: '#000000',
      unitColor: '#666666',
      titleColor: '#999999',
      backgroundColor: '',
      iconSize: 42,
      valueSize: 30,
      unitSize: 14,
      titleSize: 12,
      padding: 14,
      valueFontWeight: 400,
      showGradient: false
    }
  },
  {
    name: '夜间模式',
    description: '深色、护眼、酷炫',
    value: {
      iconColor: '#177ddc',
      valueColor: '#91d5ff',
      unitColor: '#69c0ff',
      titleColor: '#40a9ff',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      iconSize: 48,
      valueSize: 32,
      unitSize: 16,
      titleSize: 14,
      padding: 16,
      valueFontWeight: 500,
      showGradient: true
    }
  }
]

// 应用预制风格 - 保留用户的悬停效果设置
const applyPreset = (preset: typeof stylePresets[0]) => {
  const currentHoverSetting = config.value.enableHover // 保存当前悬停设置
  Object.assign(config.value, preset.value)
  config.value.enableHover = currentHoverSetting // 恢复悬停设置
  emit('update:modelValue', { ...config.value })
  emit('change', { ...config.value })
}

// JSON配置编辑
const showJsonEditor = ref(false)
const jsonConfigText = ref('')

const openJsonEditor = () => {
  jsonConfigText.value = JSON.stringify(config.value, null, 2)
  showJsonEditor.value = true
}

const applyJsonConfig = () => {
  try {
    const newConfig = JSON.parse(jsonConfigText.value)
    Object.assign(config.value, newConfig)
    emit('update:modelValue', { ...config.value })
    emit('change', { ...config.value })
    showJsonEditor.value = false
  } catch (error) {
    // 简单的错误提示
    alert('JSON格式错误，请检查语法')
  }
}

// 监听配置变化并向上传递
watch(
  config,
  (newConfig) => {
    if (!props.readonly && !isUpdatingFromProps.value) {
      emit('update:modelValue', { ...newConfig })
      emit('change', { ...newConfig })
    }
  },
  { deep: true, immediate: true }
)

// 监听外部配置变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isUpdatingFromProps.value) {
      isUpdatingFromProps.value = true
      try {
        config.value = { ...newValue }
      } finally {
        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.digit-indicator-setting {
  padding: 16px;
}

/* 样式优化 */
.n-form-item {
  margin-bottom: 20px;
}

.n-divider {
  margin: 24px 0 20px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.help-text {
  font-size: 11px;
  color: var(--text-color-3);
  line-height: 1.4;
}

/* 风格预设卡片样式 */
.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-color);
}

.preset-content {
  text-align: center;
  padding: 4px;
}

.preset-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.preset-description {
  font-size: 11px;
  color: var(--text-color-2);
  margin-bottom: 8px;
  line-height: 1.3;
}

.preset-preview {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>