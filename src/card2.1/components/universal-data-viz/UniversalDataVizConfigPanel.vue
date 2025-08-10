<template>
  <div class="universal-data-viz-config-panel">
    <!-- 数据源类型选择 -->
    <n-form-item label="数据源类型">
      <n-radio-group v-model:value="dataSourceType" @update:value="handleDataSourceTypeChange">
        <n-radio-button value="object">对象数据</n-radio-button>
        <n-radio-button value="array">数组数据</n-radio-button>
      </n-radio-group>
    </n-form-item>

    <!-- 图表类型配置 -->
    <n-form-item label="图表类型">
      <n-select 
        v-model:value="chartType" 
        :options="chartTypeOptions"
        @update:value="handleChartTypeChange"
      />
    </n-form-item>

    <!-- 对象数据配置 -->
    <div v-if="dataSourceType === 'object'" class="config-section">
      <n-divider title-placement="left">对象数据映射</n-divider>
      
      <n-form-item label="键1路径">
        <n-input 
          v-model:value="objectConfig.key1Path" 
          placeholder="如: data.temperature"
          @update:value="handleConfigChange"
        />
      </n-form-item>
      
      <n-form-item label="键2路径">
        <n-input 
          v-model:value="objectConfig.key2Path" 
          placeholder="如: data.humidity"
          @update:value="handleConfigChange"
        />
      </n-form-item>
      
      <n-form-item label="键3路径">
        <n-input 
          v-model:value="objectConfig.key3Path" 
          placeholder="如: data.pressure"
          @update:value="handleConfigChange"
        />
      </n-form-item>
    </div>

    <!-- 数组数据配置 -->
    <div v-if="dataSourceType === 'array'" class="config-section">
      <n-divider title-placement="left">数组数据映射</n-divider>
      
      <n-form-item label="X轴字段">
        <n-input 
          v-model:value="arrayConfig.xPath" 
          placeholder="如: timestamp, time, x 或 [0]"
          @update:value="handleConfigChange"
        >
          <template #suffix>
            <n-text depth="3" style="font-size: 10px;">时间轴</n-text>
          </template>
        </n-input>
      </n-form-item>
      
      <n-form-item label="Y轴字段">
        <n-input 
          v-model:value="arrayConfig.yPath" 
          placeholder="如: temperature, value, amount 或 [1]"
          @update:value="handleConfigChange"
        >
          <template #suffix>
            <n-text depth="3" style="font-size: 10px;">数值轴</n-text>
          </template>
        </n-input>
      </n-form-item>
      
      <n-form-item label="标签字段">
        <n-input 
          v-model:value="arrayConfig.labelPath" 
          placeholder="如: label, name (可选)"
          @update:value="handleConfigChange"
        >
          <template #suffix>
            <n-text depth="3" style="font-size: 10px;">可选</n-text>
          </template>
        </n-input>
      </n-form-item>
      
      <n-alert type="info" style="margin-top: 12px;">
        <template #icon>
          <n-icon><InformationCircleOutline /></n-icon>
        </template>
        系统会根据数组第0个元素自动推断最佳字段路径。<br/>
        支持对象路径（如 nested.field）和数组索引（如 [0]）。
      </n-alert>
    </div>

    <!-- 显示模式配置 -->
    <n-divider title-placement="left">显示配置</n-divider>
    
    <n-form-item label="默认显示模式">
      <n-select 
        v-model:value="defaultDisplayMode" 
        :options="displayModeOptions"
        @update:value="handleConfigChange"
      />
    </n-form-item>
    
    <n-form-item label="显示调试信息">
      <n-switch 
        v-model:value="showDebugInfo" 
        @update:value="handleConfigChange"
      />
    </n-form-item>

    <n-form-item label="自动检测模式">
      <n-switch 
        v-model:value="autoDetectMode" 
        @update:value="handleConfigChange"
      />
    </n-form-item>

    <!-- 配置预览 -->
    <n-divider title-placement="left">配置预览</n-divider>
    <n-card size="small" class="config-preview">
      <n-code 
        :code="JSON.stringify(currentConfig, null, 2)" 
        language="json"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 通用数据可视化组件配置面板
 * 用于在Visual Editor中配置数据源和显示参数
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'

interface Props {
  modelValue?: any
  widget?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  widget: null
})

const emit = defineEmits<Emits>()
const message = useMessage()

// 配置项（默认为数组模式）
const dataSourceType = ref<'object' | 'array'>('array')
const chartType = ref('line')
const defaultDisplayMode = ref('chart')
const showDebugInfo = ref(true)
const autoDetectMode = ref(true)

// 对象数据配置
const objectConfig = ref({
  key1Path: 'key1',
  key2Path: 'key2', 
  key3Path: 'key3'
})

// 数组数据配置（默认使用时间和温度）
const arrayConfig = ref({
  xPath: 'timestamp',
  yPath: 'temperature',
  labelPath: 'label'
})

// 选项
const chartTypeOptions = [
  { label: '线形图', value: 'line' },
  { label: '柱状图', value: 'bar' },
  { label: '散点图', value: 'scatter' }
]

const displayModeOptions = [
  { label: '图表模式', value: 'chart' },
  { label: '对象模式', value: 'object' },
  { label: '表格模式', value: 'table' }
]

// 避免递归更新的标志
const isUpdating = ref(false)

// 当前完整配置
const currentConfig = computed(() => ({
  dataSourceType: dataSourceType.value,
  chartType: chartType.value,
  defaultDisplayMode: defaultDisplayMode.value,
  showDebugInfo: showDebugInfo.value,
  autoDetectMode: autoDetectMode.value,
  objectConfig: dataSourceType.value === 'object' ? objectConfig.value : undefined,
  arrayConfig: dataSourceType.value === 'array' ? arrayConfig.value : undefined
}))

// 初始化配置（防止递归更新）
const initializeConfig = () => {
  if (isUpdating.value) return
  
  const config = props.modelValue || {}
  
  isUpdating.value = true
  
  try {
    dataSourceType.value = config.dataSourceType || 'array'
    chartType.value = config.chartType || 'line'
    defaultDisplayMode.value = config.defaultDisplayMode || 'chart'
    showDebugInfo.value = config.showDebugInfo !== undefined ? config.showDebugInfo : true
    autoDetectMode.value = config.autoDetectMode !== undefined ? config.autoDetectMode : true
    
    if (config.objectConfig) {
      objectConfig.value = { ...objectConfig.value, ...config.objectConfig }
    }
    
    if (config.arrayConfig) {
      arrayConfig.value = { ...arrayConfig.value, ...config.arrayConfig }
    }
    
    console.log('🔧 [UniversalDataVizConfig] 配置已初始化:', currentConfig.value)
  } finally {
    setTimeout(() => {
      isUpdating.value = false
    }, 100)
  }
}

// 处理数据源类型变化
const handleDataSourceTypeChange = (type: 'object' | 'array') => {
  console.log('🔧 [UniversalDataVizConfig] 数据源类型变化:', type)
  
  // 切换类型时提供智能默认值
  if (type === 'array' && arrayConfig.value.xPath === 'x') {
    arrayConfig.value = {
      xPath: 'timestamp',
      yPath: 'value',
      labelPath: 'name'
    }
  }
  
  handleConfigChange()
}

// 处理图表类型变化
const handleChartTypeChange = (type: string) => {
  console.log('🔧 [UniversalDataVizConfig] 图表类型变化:', type)
  handleConfigChange()
}

// 处理配置变化（防止递归）
const handleConfigChange = () => {
  if (isUpdating.value) return
  
  const config = currentConfig.value
  console.log('🔧 [UniversalDataVizConfig] 配置变化:', config)
  
  // 发送配置更新
  emit('update:modelValue', config)
  
  // 显示提示
  message.success(`配置已更新 - ${dataSourceType.value === 'object' ? '对象' : '数组'}数据模式`)
}

// 监听外部配置变化（防止递归）
watch(() => props.modelValue, (newValue, oldValue) => {
  if (isUpdating.value) return
  
  if (newValue && typeof newValue === 'object' && 
      JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
    initializeConfig()
  }
}, { deep: true, immediate: true })

// 组件挂载时初始化
onMounted(() => {
  console.log('🔧 [UniversalDataVizConfig] 配置面板已挂载')
  console.log('🔧 [UniversalDataVizConfig] 初始widget:', props.widget)
  console.log('🔧 [UniversalDataVizConfig] 初始modelValue:', props.modelValue)
  
  initializeConfig()
  
  // 如果没有初始配置，发送默认配置
  if (!props.modelValue || Object.keys(props.modelValue).length === 0) {
    handleConfigChange()
  }
})
</script>

<style scoped>
.universal-data-viz-config-panel {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  padding: 12px 0;
  border-left: 3px solid var(--primary-color);
  padding-left: 12px;
  margin: 8px 0;
  background: var(--body-color);
  border-radius: 4px;
}

.config-preview {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.config-preview .n-code {
  font-size: 11px;
  line-height: 1.4;
}

:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color);
  font-size: 13px;
}

:deep(.n-divider__title) {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
}
</style>