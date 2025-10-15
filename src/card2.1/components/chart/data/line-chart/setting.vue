<template>
  <n-space vertical :size="16">
    <!-- 基础配置 -->
    <n-card title="基础配置" size="small">
      <n-space vertical :size="12">
        <n-form-item label="图表标题">
          <n-input
            v-model:value="localConfig.title"
            placeholder="数据趋势"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示图例">
          <n-switch
            v-model:value="localConfig.showLegend"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="平滑曲线">
          <n-switch
            v-model:value="localConfig.smooth"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示面积">
          <n-switch
            v-model:value="localConfig.showArea"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示网格">
          <n-switch
            v-model:value="localConfig.showGrid"
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
            placeholder="时间"
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
        <n-form-item label="线条颜色">
          <n-color-picker
            v-model:value="localConfig.lineColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="面积颜色">
          <n-color-picker
            v-model:value="localConfig.areaColor"
            :show-alpha="true"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="显示数据点">
          <n-switch
            v-model:value="localConfig.showDataPoints"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item v-if="localConfig.showDataPoints" label="数据点大小">
          <n-input-number
            v-model:value="localConfig.dataPointSize"
            :min="2"
            :max="20"
            :step="1"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </n-space>
    </n-card>

    <!-- 动画配置 -->
    <n-card title="动画配置" size="small">
      <n-form-item label="动画时长 (ms)">
        <n-input-number
          v-model:value="localConfig.animationDuration"
          :min="0"
          :max="5000"
          :step="100"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * 折线图组件配置面板
 */

import { ref, watch } from 'vue'
import { NSpace, NCard, NFormItem, NInput, NInputNumber, NSwitch, NColorPicker } from 'naive-ui'
import type { LineChartCustomize } from './settingConfig'

// Props 和 emits
const props = defineProps<{
  config: LineChartCustomize
}>()

const emit = defineEmits<{
  (e: 'update:config', config: LineChartCustomize): void
}>()

// 本地配置
const localConfig = ref<LineChartCustomize>({ ...props.config })

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
