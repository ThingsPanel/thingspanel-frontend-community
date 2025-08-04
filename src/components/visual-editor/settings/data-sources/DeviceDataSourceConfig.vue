<template>
  <div class="device-data-source-config">
    <n-form label-placement="left" label-width="auto" size="small">
      <n-form-item label="数据源名称">
        <n-input 
          v-model:value="config.name" 
          placeholder="设备数据源"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="config.description" 
          placeholder="数据源描述"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="设备">
        <n-select
          v-model:value="config.deviceId"
          :options="deviceOptions"
          placeholder="选择设备"
          filterable
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="数据类型">
        <n-select
          v-model:value="config.metricsType"
          :options="metricsTypeOptions"
          placeholder="选择数据类型"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="指标">
        <n-select
          v-model:value="config.metricsId"
          :options="metricsOptions"
          placeholder="选择指标"
          filterable
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="指标名称">
        <n-input 
          v-model:value="config.metricsName" 
          placeholder="指标显示名称"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="聚合函数">
        <n-select
          v-model:value="config.aggregateFunction"
          :options="aggregateOptions"
          placeholder="选择聚合函数"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="时间范围">
        <n-select
          v-model:value="config.timeRange"
          :options="timeRangeOptions"
          placeholder="选择时间范围"
          @update:value="updateConfig"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { DeviceDataSource } from '../../types/data-source'

interface Props {
  modelValue: DeviceDataSource
}

interface Emits {
  'update:modelValue': [value: DeviceDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref<DeviceDataSource>({ ...props.modelValue })

// 选项配置
const deviceOptions = ref([
  { label: '设备1', value: 'device1' },
  { label: '设备2', value: 'device2' },
  { label: '设备3', value: 'device3' }
])

const metricsTypeOptions = [
  { label: '遥测数据', value: 'telemetry' },
  { label: '属性数据', value: 'attributes' },
  { label: '事件数据', value: 'event' },
  { label: '命令数据', value: 'command' }
]

const metricsOptions = ref([
  { label: '温度', value: 'temperature' },
  { label: '湿度', value: 'humidity' },
  { label: '压力', value: 'pressure' },
  { label: '电压', value: 'voltage' }
])

const aggregateOptions = [
  { label: '平均值', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' }
]

const timeRangeOptions = [
  { label: '最近5分钟', value: 'last_5m' },
  { label: '最近15分钟', value: 'last_15m' },
  { label: '最近30分钟', value: 'last_30m' },
  { label: '最近1小时', value: 'last_1h' },
  { label: '最近3小时', value: 'last_3h' },
  { label: '最近6小时', value: 'last_6h' },
  { label: '最近12小时', value: 'last_12h' },
  { label: '最近24小时', value: 'last_24h' }
]

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  config.value = { ...newValue }
}, { deep: true })
</script>

<style scoped>
.device-data-source-config {
  padding: 8px 0;
}
</style> 