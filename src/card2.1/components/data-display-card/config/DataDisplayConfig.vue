<template>
  <div class="data-display-config">
    <n-form :model="formData" label-placement="left" label-width="100" size="small">
      <!-- 基础信息 -->
      <n-card title="基础信息" size="small" style="margin-bottom: 16px">
        <n-form-item label="卡片标题">
          <n-input v-model:value="formData.title" placeholder="请输入标题" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="显示标题">
          <n-switch v-model:value="formData.showTitle" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item v-if="formData.showTitle" label="副标题">
          <n-input v-model:value="formData.subtitle" placeholder="请输入副标题" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item v-if="formData.showTitle" label="显示副标题">
          <n-switch v-model:value="formData.showSubtitle" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="描述信息">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
            @update:value="handleUpdate"
          />
        </n-form-item>

        <n-form-item label="显示描述">
          <n-switch v-model:value="formData.showDescription" @update:value="handleUpdate" />
        </n-form-item>
      </n-card>

      <!-- 图标配置 -->
      <n-card title="图标配置" size="small" style="margin-bottom: 16px">
        <n-form-item label="显示图标">
          <n-switch v-model:value="formData.showIcon" @update:value="handleUpdate" />
        </n-form-item>

        <template v-if="formData.showIcon">
          <n-form-item label="图标类型">
            <n-select v-model:value="formData.iconType" :options="iconOptions" @update:value="handleUpdate" />
          </n-form-item>

          <n-form-item label="图标大小">
            <n-slider
              v-model:value="formData.iconSize"
              :min="16"
              :max="48"
              :step="2"
              :format-tooltip="value => `${value}px`"
              @update:value="handleUpdate"
            />
          </n-form-item>

          <n-form-item label="图标颜色">
            <n-color-picker v-model:value="formData.iconColor" :show-alpha="false" @update:value="handleUpdate" />
          </n-form-item>
        </template>
      </n-card>

      <!-- 数值配置 -->
      <n-card title="数值配置" size="small" style="margin-bottom: 16px">
        <n-form-item label="主要数值">
          <n-input v-model:value="formData.mainValue" placeholder="请输入数值" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="数值单位">
          <n-input v-model:value="formData.mainUnit" placeholder="如：次、个、%" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="数值格式">
          <n-select v-model:value="formData.valueFormat" :options="valueFormatOptions" @update:value="handleUpdate" />
        </n-form-item>
      </n-card>

      <!-- 趋势配置 -->
      <n-card title="趋势配置" size="small" style="margin-bottom: 16px">
        <n-form-item label="显示趋势">
          <n-switch v-model:value="formData.showTrend" @update:value="handleUpdate" />
        </n-form-item>

        <template v-if="formData.showTrend">
          <n-form-item label="趋势方向">
            <n-select
              v-model:value="formData.trendDirection"
              :options="trendDirectionOptions"
              @update:value="handleUpdate"
            />
          </n-form-item>

          <n-form-item label="趋势文本">
            <n-input v-model:value="formData.trendText" placeholder="如：较昨日 +5.2%" @update:value="handleUpdate" />
          </n-form-item>

          <n-form-item label="趋势颜色">
            <n-color-picker v-model:value="formData.trendColor" :show-alpha="false" @update:value="handleUpdate" />
          </n-form-item>
        </template>
      </n-card>

      <!-- 样式配置 -->
      <n-card title="样式配置" size="small" style="margin-bottom: 16px">
        <n-form-item label="背景颜色">
          <n-color-picker v-model:value="formData.backgroundColor" :show-alpha="true" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="文字颜色">
          <n-color-picker v-model:value="formData.textColor" :show-alpha="false" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="标题颜色">
          <n-color-picker v-model:value="formData.titleColor" :show-alpha="false" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="边框颜色">
          <n-color-picker v-model:value="formData.borderColor" :show-alpha="false" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="边框宽度">
          <n-slider
            v-model:value="formData.borderWidth"
            :min="0"
            :max="5"
            :step="1"
            :format-tooltip="value => `${value}px`"
            @update:value="handleUpdate"
          />
        </n-form-item>

        <n-form-item label="圆角大小">
          <n-slider
            v-model:value="formData.borderRadius"
            :min="0"
            :max="20"
            :step="1"
            :format-tooltip="value => `${value}px`"
            @update:value="handleUpdate"
          />
        </n-form-item>

        <n-form-item label="内边距">
          <n-slider
            v-model:value="formData.padding"
            :min="8"
            :max="32"
            :step="2"
            :format-tooltip="value => `${value}px`"
            @update:value="handleUpdate"
          />
        </n-form-item>

        <n-form-item label="最小高度">
          <n-slider
            v-model:value="formData.minHeight"
            :min="120"
            :max="400"
            :step="10"
            :format-tooltip="value => `${value}px`"
            @update:value="handleUpdate"
          />
        </n-form-item>
      </n-card>

      <!-- 布局配置 -->
      <n-card title="布局配置" size="small">
        <n-form-item label="布局方向">
          <n-select v-model:value="formData.layout" :options="layoutOptions" @update:value="handleUpdate" />
        </n-form-item>

        <n-form-item label="内容对齐">
          <n-select v-model:value="formData.contentAlign" :options="alignOptions" @update:value="handleUpdate" />
        </n-form-item>
      </n-card>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * DataDisplayCard配置表单
 * 提供丰富的配置选项
 */

import { reactive, watch, onMounted, nextTick, shallowReactive } from 'vue'

interface Props {
  widget?: any
  config?: any
  readonly?: boolean
}

interface Emits {
  (e: 'update', config: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 防止循环更新的标记
let isUpdating = false

/**
 * 表单数据结构 - 使用shallowReactive优化性能
 */
const formData = shallowReactive({
  // 基础信息
  title: '数据展示卡片',
  subtitle: '副标题',
  description: '这是一个数据展示卡片',
  showTitle: true,
  showSubtitle: false,
  showDescription: true,

  // 图标配置
  showIcon: true,
  iconType: 'stats-chart',
  iconSize: 24,
  iconColor: '#18a058',

  // 数值配置
  mainValue: '12,345',
  mainUnit: '次',
  valueFormat: 'number',

  // 趋势配置
  showTrend: true,
  trendDirection: 'up',
  trendText: '较昨日 +5.2%',
  trendColor: '#18a058',

  // 样式配置
  backgroundColor: '#ffffff',
  borderColor: '#e0e0e6',
  borderWidth: 1,
  borderRadius: 8,
  textColor: '#333333',
  titleColor: '#1a1a1a',
  subtitleColor: '#666666',
  padding: 16,
  minHeight: 200,

  // 布局配置
  layout: 'vertical',
  contentAlign: 'left'
})

/**
 * 选项配置
 */
const iconOptions = [
  { label: '统计图表', value: 'stats-chart' },
  { label: '饼图', value: 'pie-chart' },
  { label: '柱状图', value: 'bar-chart' },
  { label: '上升趋势', value: 'trending-up' },
  { label: '下降趋势', value: 'trending-down' }
]

const valueFormatOptions = [
  { label: '普通数字', value: 'number' },
  { label: '百分比', value: 'percentage' },
  { label: '货币', value: 'currency' }
]

const trendDirectionOptions = [
  { label: '上升', value: 'up' },
  { label: '下降', value: 'down' },
  { label: '持平', value: 'neutral' }
]

const layoutOptions = [
  { label: '垂直布局', value: 'vertical' },
  { label: '水平布局', value: 'horizontal' }
]

const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中对齐', value: 'center' },
  { label: '右对齐', value: 'right' }
]

/**
 * 处理配置更新 - 性能优化：防抖 + 防循环
 */
let updateTimer: number | null = null
const handleUpdate = () => {
  // 防止循环更新
  if (isUpdating) return

  if (updateTimer) {
    clearTimeout(updateTimer)
  }

  updateTimer = window.setTimeout(() => {
    const config = { ...formData }
    emit('update', config)
    updateTimer = null
  }, 300) // 增加到300ms防抖，减少高频操作
}

/**
 * 从props中初始化表单数据 - 性能优化：防止循环 + 批量更新
 */
const initializeFromProps = async () => {
  if (!props.config || isUpdating) return

  // 设置更新标记，防止循环
  isUpdating = true

  try {
    // 准备新的配置数据
    const newConfig = {
      title: props.config.title || '数据展示卡片',
      subtitle: props.config.subtitle || '副标题',
      description: props.config.description || '这是一个数据展示卡片',
      showTitle: props.config.showTitle ?? true,
      showSubtitle: props.config.showSubtitle ?? false,
      showDescription: props.config.showDescription ?? true,

      showIcon: props.config.showIcon ?? true,
      iconType: props.config.iconType || 'stats-chart',
      iconSize: props.config.iconSize || 24,
      iconColor: props.config.iconColor || '#18a058',

      mainValue: props.config.mainValue || '12,345',
      mainUnit: props.config.mainUnit || '次',
      valueFormat: props.config.valueFormat || 'number',

      showTrend: props.config.showTrend ?? true,
      trendDirection: props.config.trendDirection || 'up',
      trendText: props.config.trendText || '较昨日 +5.2%',
      trendColor: props.config.trendColor || '#18a058',

      backgroundColor: props.config.backgroundColor || '#ffffff',
      borderColor: props.config.borderColor || '#e0e0e6',
      borderWidth: props.config.borderWidth ?? 1,
      borderRadius: props.config.borderRadius ?? 8,
      textColor: props.config.textColor || '#333333',
      titleColor: props.config.titleColor || '#1a1a1a',
      subtitleColor: props.config.subtitleColor || '#666666',
      padding: props.config.padding ?? 16,
      minHeight: props.config.minHeight ?? 200,

      layout: props.config.layout || 'vertical',
      contentAlign: props.config.contentAlign || 'left'
    }

    // 智能diff：只更新变化的字段
    let hasChanges = false
    Object.keys(newConfig).forEach(key => {
      if (formData[key] !== newConfig[key]) {
        formData[key] = newConfig[key]
        hasChanges = true
      }
    })

    // 等待DOM更新完成
    await nextTick()
  } finally {
    // 延迟重置标记，确保更新完成
    setTimeout(() => {
      isUpdating = false
    }, 50)
  }
}

/**
 * 监听props变化 - 优化：减少不必要的深度监听
 */
watch(
  () => props.config,
  newConfig => {
    if (newConfig && !isUpdating) {
      initializeFromProps()
    }
  },
  { immediate: true } // 移除深度监听，提高性能
)

// 组件挂载时确保初始化
onMounted(() => {
  // 只在没有通过watch初始化时才手动初始化
  if (!isUpdating && props.config) {
    initializeFromProps()
  }
})

// 清理资源
onMounted(() => {
  return () => {
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    isUpdating = false
  }
})

// 移除调试日志，提高性能
</script>

<style scoped>
.data-display-config {
  padding: 12px;
  max-height: 600px;
  overflow-y: auto;
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

/* 卡片样式 */
:deep(.n-card .n-card__header) {
  padding: 12px 16px 8px 16px;
  font-size: 13px;
  font-weight: 600;
}

:deep(.n-card .n-card__content) {
  padding: 8px 16px 12px 16px;
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

/* 滚动条样式 */
.data-display-config::-webkit-scrollbar {
  width: 4px;
}

.data-display-config::-webkit-scrollbar-track {
  background: transparent;
}

.data-display-config::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.data-display-config::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
