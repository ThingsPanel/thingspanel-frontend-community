<template>
  <div class="curve-chart-config">
    <!-- 图表基础设置 -->
    <n-card title="图表设置" class="config-section">
      <n-form :model="localConfig.chart" label-placement="left" label-width="120px">
        <n-form-item label="显示图例">
          <n-switch v-model:value="localConfig.chart.showLegend" />
        </n-form-item>
        <n-form-item label="显示数据缩放">
          <n-switch v-model:value="localConfig.chart.showDataZoom" />
        </n-form-item>
        <n-form-item label="显示提示框">
          <n-switch v-model:value="localConfig.chart.showTooltip" />
        </n-form-item>
        <n-form-item label="平滑曲线">
          <n-switch v-model:value="localConfig.chart.smooth" />
        </n-form-item>
        <n-form-item label="显示数据点">
          <n-switch v-model:value="localConfig.chart.showSymbol" />
        </n-form-item>
        <n-form-item label="数据点大小">
          <n-input-number 
            v-model:value="localConfig.chart.symbolSize" 
            :min="2" 
            :max="10" 
            :step="1"
          />
        </n-form-item>
        <n-form-item label="线条宽度">
          <n-input-number 
            v-model:value="localConfig.chart.lineWidth" 
            :min="1" 
            :max="10" 
            :step="1"
          />
        </n-form-item>
        <n-form-item label="显示面积">
          <n-switch v-model:value="localConfig.chart.showArea" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 时间范围设置 -->
    <n-card title="时间范围" class="config-section">
      <n-form :model="localConfig.timeRange" label-placement="left" label-width="120px">
        <n-form-item label="默认时间范围">
          <n-select 
            v-model:value="localConfig.timeRange.defaultRange" 
            :options="timeRangeOptions"
          />
        </n-form-item>
        <n-form-item label="允许自定义时间">
          <n-switch v-model:value="localConfig.timeRange.allowCustomRange" />
        </n-form-item>
        <n-form-item label="显示时间选择器">
          <n-switch v-model:value="localConfig.timeRange.showTimeSelector" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 数据聚合设置 -->
    <n-card title="数据聚合" class="config-section">
      <n-form :model="localConfig.aggregation" label-placement="left" label-width="120px">
        <n-form-item label="启用聚合">
          <n-switch v-model:value="localConfig.aggregation.enabled" />
        </n-form-item>
        <n-form-item label="默认聚合函数">
          <n-select 
            v-model:value="localConfig.aggregation.defaultFunction" 
            :options="aggregationFunctionOptions"
          />
        </n-form-item>
        <n-form-item label="默认聚合窗口">
          <n-select 
            v-model:value="localConfig.aggregation.defaultWindow" 
            :options="aggregationWindowOptions"
          />
        </n-form-item>
        <n-form-item label="显示聚合选择器">
          <n-switch v-model:value="localConfig.aggregation.showAggregateSelector" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 主题设置 -->
    <n-card title="主题设置" class="config-section">
      <n-form :model="localConfig.theme" label-placement="left" label-width="120px">
        <n-form-item label="配色方案">
          <n-select 
            v-model:value="localConfig.theme.colorScheme" 
            :options="colorSchemeOptions"
          />
        </n-form-item>
        <n-form-item label="自定义颜色">
          <div class="color-list">
            <div 
              v-for="(color, index) in localConfig.theme.customColors" 
              :key="index" 
              class="color-item"
            >
              <n-color-picker v-model:value="localConfig.theme.customColors[index]" />
              <n-button 
                text 
                type="error" 
                @click="removeCustomColor(index)"
              >
                删除
              </n-button>
            </div>
            <n-button 
              dashed 
              style="width: 100%; margin-top: 8px;"
              @click="addCustomColor"
            >
              添加颜色
            </n-button>
          </div>
        </n-form-item>
        <n-form-item label="自适应主题">
          <n-switch v-model:value="localConfig.theme.adaptiveTheme" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 坐标轴设置 -->
    <n-card title="坐标轴设置" class="config-section">
      <n-form :model="localConfig.axis" label-placement="left" label-width="120px">
        <n-form-item label="显示X轴">
          <n-switch v-model:value="localConfig.axis.showXAxis" />
        </n-form-item>
        <n-form-item label="显示Y轴">
          <n-switch v-model:value="localConfig.axis.showYAxis" />
        </n-form-item>
        <n-form-item label="X轴类型">
          <n-select 
            v-model:value="localConfig.axis.xAxisType" 
            :options="axisTypeOptions"
          />
        </n-form-item>
        <n-form-item label="Y轴类型">
          <n-select 
            v-model:value="localConfig.axis.yAxisType" 
            :options="yAxisTypeOptions"
          />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 网格设置 -->
    <n-card title="网格设置" class="config-section">
      <n-form :model="localConfig.grid" label-placement="left" label-width="120px">
        <n-form-item label="左边距">
          <n-input v-model:value="localConfig.grid.left" placeholder="如: 3%" />
        </n-form-item>
        <n-form-item label="右边距">
          <n-input v-model:value="localConfig.grid.right" placeholder="如: 4%" />
        </n-form-item>
        <n-form-item label="下边距">
          <n-input v-model:value="localConfig.grid.bottom" placeholder="如: 50px" />
        </n-form-item>
        <n-form-item label="包含标签">
          <n-switch v-model:value="localConfig.grid.containLabel" />
        </n-form-item>
      </n-form>
    </n-card>

    <!-- 性能设置 -->
    <n-card title="性能设置" class="config-section">
      <n-form :model="localConfig.performance" label-placement="left" label-width="120px">
        <n-form-item label="最大数据点数">
          <n-input-number 
            v-model:value="localConfig.performance.maxDataPoints" 
            :min="100" 
            :max="50000" 
            :step="1000"
          />
        </n-form-item>
        <n-form-item label="更新节流(ms)">
          <n-input-number 
            v-model:value="localConfig.performance.updateThrottle" 
            :min="50" 
            :max="1000" 
            :step="50"
          />
        </n-form-item>
        <n-form-item label="启用数据采样">
          <n-switch v-model:value="localConfig.performance.enableSampling" />
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { 
  NCard, 
  NForm, 
  NFormItem, 
  NSwitch, 
  NSelect, 
  NInputNumber, 
  NInput, 
  NColorPicker, 
  NButton 
} from 'naive-ui'

// Props
interface Props {
  config: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

// Emits
const emit = defineEmits<{
  'update:config': [config: Record<string, any>]
}>()

// Local config
const localConfig = ref({
  chart: {
    showLegend: true,
    showDataZoom: true,
    showTooltip: true,
    smooth: true,
    showSymbol: true,
    symbolSize: 4,
    lineWidth: 2,
    showArea: false,
    ...props.config.chart
  },
  timeRange: {
    defaultRange: '1h',
    allowCustomRange: true,
    showTimeSelector: true,
    ...props.config.timeRange
  },
  aggregation: {
    enabled: false,
    defaultFunction: 'avg',
    defaultWindow: 'no_aggregate',
    showAggregateSelector: true,
    ...props.config.aggregation
  },
  theme: {
    colorScheme: 'colorGroups',
    customColors: [],
    adaptiveTheme: true,
    ...props.config.theme
  },
  axis: {
    showXAxis: true,
    showYAxis: true,
    xAxisType: 'time',
    yAxisType: 'value',
    ...props.config.axis
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '50px',
    containLabel: true,
    ...props.config.grid
  },
  performance: {
    maxDataPoints: 10000,
    updateThrottle: 100,
    enableSampling: false,
    ...props.config.performance
  }
})

// Options
const timeRangeOptions = [
  { label: '15分钟', value: '15m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '3小时', value: '3h' },
  { label: '6小时', value: '6h' },
  { label: '12小时', value: '12h' },
  { label: '24小时', value: '24h' },
  { label: '3天', value: '3d' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' }
]

const aggregationFunctionOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const aggregationWindowOptions = [
  { label: '不聚合', value: 'no_aggregate' },
  { label: '30秒', value: '30s' },
  { label: '1分钟', value: '1m' },
  { label: '2分钟', value: '2m' },
  { label: '5分钟', value: '5m' },
  { label: '10分钟', value: '10m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '3小时', value: '3h' },
  { label: '6小时', value: '6h' },
  { label: '1天', value: '1d' },
  { label: '7天', value: '7d' },
  { label: '1月', value: '1mo' }
]

const colorSchemeOptions = [
  { label: '配色方案1', value: 'colorGroups' },
  { label: '配色方案2', value: 'colorGroups2' }
]

const axisTypeOptions = [
  { label: '时间轴', value: 'time' },
  { label: '分类轴', value: 'category' }
]

const yAxisTypeOptions = [
  { label: '数值轴', value: 'value' },
  { label: '对数轴', value: 'log' }
]

// Methods
const addCustomColor = () => {
  localConfig.value.theme.customColors.push('#409EFF')
}

const removeCustomColor = (index: number) => {
  localConfig.value.theme.customColors.splice(index, 1)
}

// Watch for changes
watch(
  localConfig,
  (newConfig) => {
    emit('update:config', newConfig)
  },
  { deep: true }
)

// Watch for external config changes
watch(
  () => props.config,
  (newConfig) => {
    Object.assign(localConfig.value, newConfig)
  },
  { deep: true }
)
</script>

<style scoped>
.curve-chart-config {
  padding: 16px;
}

.config-section {
  margin-bottom: 16px;
}

.color-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>