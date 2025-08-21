<template>
  <div class="realtime-chart-config">
    <n-form :model="localConfig" :rules="formRules" label-placement="left" label-width="120px" size="small">
      <!-- 📈 图表基础配置 -->
      <n-card title="图表配置" size="small" class="config-section">
        <n-form-item label="图表标题" path="title">
          <n-input v-model:value="localConfig.title" placeholder="请输入图表标题" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="副标题" path="subtitle">
          <n-input v-model:value="localConfig.subtitle" placeholder="请输入副标题" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示副标题">
          <n-switch v-model:value="localConfig.showSubtitle" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="图表类型" path="chartType">
          <n-select
            v-model:value="localConfig.chartType"
            :options="chartTypeOptions"
            placeholder="请选择图表类型"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="图表高度" path="chartHeight">
          <n-input-number
            v-model:value="localConfig.chartHeight"
            :min="200"
            :max="800"
            placeholder="图表高度"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>
      </n-card>

      <!-- 📊 数据配置 -->
      <n-card title="数据配置" size="small" class="config-section">
        <n-form-item label="最大数据点" path="maxDataPoints">
          <n-input-number
            v-model:value="localConfig.maxDataPoints"
            :min="10"
            :max="500"
            placeholder="最大数据点数量"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="更新间隔" path="updateInterval">
          <n-input-number
            v-model:value="localConfig.updateInterval"
            :min="500"
            :max="60000"
            :step="500"
            placeholder="更新间隔"
            @update:value="handleConfigChange"
          >
            <template #suffix>ms</template>
          </n-input-number>
        </n-form-item>

        <n-form-item label="时间范围" path="timeRange">
          <n-input-number
            v-model:value="localConfig.timeRange"
            :min="60"
            :max="7200"
            :step="60"
            placeholder="显示时间范围"
            @update:value="handleConfigChange"
          >
            <template #suffix>秒</template>
          </n-input-number>
        </n-form-item>
      </n-card>

      <!-- 🎛️ 显示控制 -->
      <n-card title="显示控制" size="small" class="config-section">
        <n-form-item label="显示图例">
          <n-switch v-model:value="localConfig.showLegend" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示统计">
          <n-switch v-model:value="localConfig.showStats" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示时间范围选择">
          <n-switch v-model:value="localConfig.showTimeRange" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="显示实时开关">
          <n-switch v-model:value="localConfig.showRealtimeToggle" @update:value="handleConfigChange" />
        </n-form-item>

        <n-form-item label="允许切换图表类型">
          <n-switch v-model:value="localConfig.allowTypeSwitch" @update:value="handleConfigChange" />
        </n-form-item>
      </n-card>

      <!-- 🎨 样式配置 -->
      <n-card title="样式配置" size="small" class="config-section">
        <n-form-item label="背景色" path="backgroundColor">
          <n-color-picker
            v-model:value="localConfig.backgroundColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="文字色" path="textColor">
          <n-color-picker
            v-model:value="localConfig.textColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="边框色" path="borderColor">
          <n-color-picker
            v-model:value="localConfig.borderColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="圆角大小" path="borderRadius">
          <n-input-number
            v-model:value="localConfig.borderRadius"
            :min="0"
            :max="50"
            placeholder="边框圆角"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>

        <n-form-item label="内边距" path="padding">
          <n-input-number
            v-model:value="localConfig.padding"
            :min="8"
            :max="50"
            placeholder="内边距"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>
      </n-card>

      <!-- 📈 图表样式 -->
      <n-card title="图表样式" size="small" class="config-section">
        <n-form-item label="网格色" path="gridColor">
          <n-color-picker
            v-model:value="localConfig.gridColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="坐标轴色" path="axisColor">
          <n-color-picker
            v-model:value="localConfig.axisColor"
            :show-alpha="false"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item label="线条宽度" path="lineWidth">
          <n-input-number
            v-model:value="localConfig.lineWidth"
            :min="1"
            :max="10"
            placeholder="线条宽度"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>

        <n-form-item label="数据点大小" path="pointSize">
          <n-input-number
            v-model:value="localConfig.pointSize"
            :min="0"
            :max="20"
            placeholder="数据点大小"
            @update:value="handleConfigChange"
          >
            <template #suffix>px</template>
          </n-input-number>
        </n-form-item>
      </n-card>

      <!-- 🌈 系列颜色配置 -->
      <n-card title="系列颜色" size="small" class="config-section">
        <n-form-item label="系列颜色">
          <div class="series-colors">
            <div v-for="(color, index) in localConfig.seriesColors" :key="index" class="color-item">
              <span class="color-label">系列 {{ index + 1 }}:</span>
              <n-color-picker
                v-model:value="localConfig.seriesColors[index]"
                :show-alpha="false"
                size="small"
                @update:value="handleConfigChange"
              />
              <n-button
                v-if="localConfig.seriesColors.length > 2"
                size="small"
                type="error"
                quaternary
                @click="removeSeriesColor(index)"
              >
                删除
              </n-button>
            </div>
            <n-button
              v-if="localConfig.seriesColors.length < 10"
              size="small"
              type="dashed"
              style="width: 100%; margin-top: 8px"
              @click="addSeriesColor"
            >
              添加颜色
            </n-button>
          </div>
        </n-form-item>
      </n-card>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 实时图表卡片配置面板
 * 提供图表类型、数据配置、样式配置等选项
 */

import { ref, computed, watch } from 'vue'

interface Props {
  config: {
    title?: string
    subtitle?: string
    showSubtitle?: boolean
    chartType?: 'line' | 'bar' | 'area'
    maxDataPoints?: number
    updateInterval?: number
    timeRange?: number
    showLegend?: boolean
    showStats?: boolean
    showTimeRange?: boolean
    showRealtimeToggle?: boolean
    allowTypeSwitch?: boolean
    backgroundColor?: string
    borderColor?: string
    borderRadius?: number
    textColor?: string
    titleColor?: string
    padding?: number
    chartHeight?: number
    gridColor?: string
    axisColor?: string
    lineWidth?: number
    pointSize?: number
    seriesColors?: string[]
  }
}

interface Emits {
  (e: 'update:config', config: any): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '实时图表',
    subtitle: '数据实时更新',
    showSubtitle: true,
    chartType: 'line',
    maxDataPoints: 50,
    updateInterval: 2000,
    timeRange: 300,
    showLegend: true,
    showStats: true,
    showTimeRange: true,
    showRealtimeToggle: true,
    allowTypeSwitch: true,
    backgroundColor: '#ffffff',
    borderColor: '#e6e6e6',
    borderRadius: 8,
    textColor: '#333333',
    titleColor: '#1a1a1a',
    padding: 16,
    chartHeight: 300,
    gridColor: '#f0f0f0',
    axisColor: '#cccccc',
    lineWidth: 2,
    pointSize: 4,
    seriesColors: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']
  })
})

const emit = defineEmits<Emits>()

// 本地配置副本
const localConfig = ref({ ...props.config })

// 监听属性变化，同步更新本地配置
watch(
  () => props.config,
  newConfig => {
    localConfig.value = { ...newConfig }
  },
  { deep: true }
)

// 选项数据
const chartTypeOptions = [
  { label: '折线图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '面积图', value: 'area' }
]

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入图表标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度应为 1-50 个字符', trigger: 'blur' }
  ],
  chartType: [{ required: true, message: '请选择图表类型', trigger: 'change' }],
  maxDataPoints: [{ type: 'number', min: 10, max: 500, message: '最大数据点数量应为 10-500', trigger: 'blur' }],
  updateInterval: [{ type: 'number', min: 500, max: 60000, message: '更新间隔应为 500-60000 毫秒', trigger: 'blur' }],
  timeRange: [{ type: 'number', min: 60, max: 7200, message: '时间范围应为 60-7200 秒', trigger: 'blur' }],
  chartHeight: [{ type: 'number', min: 200, max: 800, message: '图表高度应为 200-800 像素', trigger: 'blur' }],
  backgroundColor: [{ required: true, message: '请选择背景色', trigger: 'change' }],
  textColor: [{ required: true, message: '请选择文字色', trigger: 'change' }],
  borderColor: [{ required: true, message: '请选择边框色', trigger: 'change' }]
}

// 事件处理
const handleConfigChange = () => {
  emit('update:config', { ...localConfig.value })
}

const addSeriesColor = () => {
  if (!localConfig.value.seriesColors) {
    localConfig.value.seriesColors = []
  }
  const colors = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#ff4d4f',
    '#722ed1',
    '#eb2f96',
    '#13c2c2',
    '#52c41a',
    '#faad14',
    '#f759ab'
  ]
  const nextColor = colors[localConfig.value.seriesColors.length % colors.length]
  localConfig.value.seriesColors.push(nextColor)
  handleConfigChange()
}

const removeSeriesColor = (index: number) => {
  if (localConfig.value.seriesColors && localConfig.value.seriesColors.length > 2) {
    localConfig.value.seriesColors.splice(index, 1)
    handleConfigChange()
  }
}
</script>

<style scoped>
.realtime-chart-config {
  padding: 0;
}

.config-section {
  margin-bottom: 16px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.series-colors {
  width: 100%;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
}

.color-item:last-child {
  margin-bottom: 0;
}

.color-label {
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .color-item {
    flex-direction: column;
    align-items: stretch;
  }

  .color-label {
    min-width: auto;
    text-align: center;
  }
}
</style>
