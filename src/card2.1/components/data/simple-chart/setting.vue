<template>
  <div class="simple-chart-setting">
    <n-form :model="config" label-placement="left" label-width="80" size="small">
      <!-- 显示设置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">显示设置</span>
      </n-divider>
      
      <n-form-item label="显示标题">
        <n-switch v-model:value="config.showTitle" />
      </n-form-item>
      
      <n-form-item label="显示图例">
        <n-switch v-model:value="config.showLegend" />
      </n-form-item>
      
      <!-- 内容配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">内容配置</span>
      </n-divider>
      
      <n-form-item label="标题">
        <n-input v-model:value="config.title" placeholder="请输入图表标题" />
      </n-form-item>
      
      <n-form-item label="系列名称">
        <n-input v-model:value="config.seriesName" placeholder="请输入数据系列名称" />
      </n-form-item>
      
      <!-- 图表配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">图表配置</span>
      </n-divider>
      
      <n-form-item label="图表类型">
        <n-select
          v-model:value="config.chartType"
          :options="chartTypeOptions"
        />
      </n-form-item>
      
      <n-form-item label="图表高度">
        <n-input-number
          v-model:value="config.chartHeight"
          :min="150"
          :max="400"
          placeholder="200"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <n-form-item label="图表颜色">
        <n-color-picker v-model:value="config.chartColor" />
      </n-form-item>
      
      <n-form-item v-if="config.chartType === 'line'" label="平滑线条">
        <n-switch v-model:value="config.smoothLine" />
      </n-form-item>
      
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="config.fontSize"
          :min="10"
          :max="18"
          placeholder="12"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
      
      <!-- 样式配置 -->
      <n-divider title-placement="left">
        <span style="font-size: 12px; color: var(--text-color-2)">样式配置</span>
      </n-divider>
      
      <n-form-item label="背景颜色">
        <n-color-picker v-model:value="config.backgroundColor" />
      </n-form-item>
      
      <n-form-item label="边框颜色">
        <n-color-picker v-model:value="config.borderColor" />
      </n-form-item>
      
      <n-form-item label="圆角">
        <n-input-number
          v-model:value="config.borderRadius"
          :min="0"
          :max="20"
          placeholder="8"
        />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-color-3)">px</span>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单数据图表组件配置表单
 */

import { ref, watch } from 'vue'
import { 
  NForm, 
  NFormItem, 
  NSwitch, 
  NInput, 
  NInputNumber, 
  NColorPicker,
  NSelect,
  NDivider
} from 'naive-ui'
import type { SimpleChartCustomize } from './settingConfig'

// Props
interface Props {
  modelValue?: SimpleChartCustomize
  widget?: any
  config?: SimpleChartCustomize
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    // 显示控制
    showTitle: true,
    showLegend: true,
    
    // 内容配置
    title: '数据图表',
    seriesName: '数据系列',
    
    // 图表配置
    chartType: 'line' as const,
    chartHeight: 200,
    chartColor: 'var(--primary-color)',
    smoothLine: true,
    fontSize: 12,
    
    // 样式配置
    backgroundColor: 'transparent',
    borderColor: 'var(--border-color)',
    borderRadius: 8
  }),
  readonly: false
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: SimpleChartCustomize): void
  (e: 'change', value: SimpleChartCustomize): void
}

const emit = defineEmits<Emits>()

// 图表类型选项
const chartTypeOptions = [
  { label: '线图', value: 'line' },
  { label: '柱图', value: 'bar' }
]

// 配置数据
const config = ref<SimpleChartCustomize>({ ...props.modelValue })

// 监听配置变化并向上传递
watch(
  config,
  (newConfig) => {
    if (!props.readonly) {
      emit('update:modelValue', { ...newConfig })
      emit('change', { ...newConfig })
    }
  },
  { deep: true }
)

// 监听外部配置变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      config.value = { ...newValue }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.simple-chart-setting {
  padding: 16px;
}

.n-form-item :deep(.n-form-item-label) {
  font-size: 12px;
}

.n-divider {
  margin: 16px 0 12px 0;
}

.n-divider:first-child {
  margin-top: 0;
}
</style>