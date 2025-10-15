<template>
  <n-space vertical :size="16">
    <!-- 基础配置 -->
    <n-card title="基础配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="图表标题">
          <n-input
            v-model:value="localConfig.title"
            placeholder="数据对比"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示图例">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示标签">
          <n-switch
            v-model:value="localConfig.showLabel"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示网格">
          <n-switch
            v-model:value="localConfig.showGrid"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="柱宽度">
          <n-input
            v-model:value="localConfig.barWidth"
            placeholder="60% 或 20"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- 坐标轴配置 -->
    <n-card title="坐标轴配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="X轴标签">
          <n-input
            v-model:value="localConfig.xAxisLabel"
            placeholder="类别"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="Y轴标签">
          <n-input
            v-model:value="localConfig.yAxisLabel"
            placeholder="数值"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- 样式配置 -->
    <n-card title="样式配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="柱条颜色">
          <n-color-picker
            v-model:value="localConfig.barColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="使用渐变色">
          <n-switch
            v-model:value="localConfig.barGradient"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.barGradient" label="渐变终止颜色">
          <n-color-picker
            v-model:value="localConfig.barGradientColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- 动画配置 -->
    <n-card title="动画配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="动画时长 (ms)">
          <n-input-number
            v-model:value="localConfig.animationDuration"
            :min="0"
            :max="5000"
            :step="100"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="动画延迟 (ms)">
          <n-input-number
            v-model:value="localConfig.animationDelay"
            :min="0"
            :max="500"
            :step="10"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * 柱状图组件配置面板
 */

import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'
import type { BarChartCustomize } from './settingConfig'

// Props 和 emits
const props = defineProps<{
  config: BarChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: BarChartCustomize): void
}>()

// 本地配置
const localConfig = ref<BarChartCustomize>({ ...props.config })

// 配置变更处理
const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

// 监听外部配置变化
watch(
  () => props.config,
  (newConfig) => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)
</script>
