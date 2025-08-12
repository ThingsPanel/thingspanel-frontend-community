<template>
  <div class="device-metrics-selector">
    <!-- 设备选择 -->
    <div class="device-selector mb-4">
      <n-select
        v-model:value="selectedDeviceId"
        :options="deviceOptions || []"
        :placeholder="$t('generate.select-device')"
        :loading="isLoadingDevices"
        :disabled="disabled"
        class="w-full"
        label-field="name"
        value-field="id"
        filterable
        clearable
        @update:value="onDeviceChange"
      >
        <template #header>{{ $t('generate.deviceSelection') }}</template>
      </n-select>
    </div>

    <!-- 指标选择 -->
    <div class="metrics-selector">
      <n-select
        v-model:value="selectedMetricsId"
        :options="processedMetricsOptions || []"
        :placeholder="$t('generate.selectMetrics')"
        :loading="isLoadingMetrics"
        :disabled="!selectedDeviceId || disabled"
        :show="metricsShow"
        class="w-full"
        :consistent-menu-width="false"
        filterable
        clearable
        @update:show="onMetricsDropdownShow"
        @update:value="onMetricsChange"
      />
    </div>

    <!-- 指标名称输入 -->
    <div v-if="showMetricsName" class="metrics-name-input mt-2">
      <n-input
        v-model:value="metricsName"
        :placeholder="$t('generate.enterMetricsName')"
        class="w-full"
        @update:value="onMetricsNameChange"
      />
    </div>

    <!-- 聚合函数选择 -->
    <div v-if="showAggregateFunction" class="aggregate-function-selector mt-2">
      <n-select
        v-model:value="aggregateFunction"
        :options="aggregateFunctionOptions || []"
        :placeholder="$t('generate.selectAggregateFunction')"
        :disabled="isNoAggregate"
        class="w-full"
        clearable
        filterable
        @update:value="onAggregateFunctionChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { SelectOption } from 'naive-ui'
import { deviceListForPanel, deviceMetricsList } from '@/service/api'
import { $t } from '@/locales'

interface DeviceOption {
  id: string
  name: string
  [key: string]: any
}

interface MetricsOption {
  key: string
  label: string
  data_type: string
  data_source_type?: string
  [key: string]: any
}

interface DeviceMetricsSelectorProps {
  modelValue?: {
    deviceId?: string
    metricsId?: string
    metricsName?: string
    metricsType?: string
    metricsDataType?: string
    aggregateFunction?: string
  }
  deviceOptions?: DeviceOption[]
  disabled?: boolean
  showMetricsName?: boolean
  showAggregateFunction?: boolean
  isNoAggregate?: boolean
}

interface DeviceMetricsSelectorEmits {
  (e: 'update:modelValue', value: any): void
  (e: 'device-change', deviceId: string, device: DeviceOption): void
  (e: 'metrics-change', metricsId: string, metrics: MetricsOption): void
}

const props = withDefaults(defineProps<DeviceMetricsSelectorProps>(), {
  deviceOptions: () => [],
  disabled: false,
  showMetricsName: true,
  showAggregateFunction: false,
  isNoAggregate: false
})

const emit = defineEmits<DeviceMetricsSelectorEmits>()

// 响应式数据
const selectedDeviceId = ref<string>('')
const selectedMetricsId = ref<string>('')
const metricsName = ref<string>('')
const aggregateFunction = ref<string>('')
const metricsShow = ref<boolean>(false)
const isLoadingDevices = ref<boolean>(false)
const isLoadingMetrics = ref<boolean>(false)
const metricsOptions = ref<MetricsOption[]>([])
const metricsOptionsFetched = ref<boolean>(false)
const internalDeviceOptions = ref<DeviceOption[]>([])

// 聚合函数选项
const aggregateFunctionOptions: SelectOption[] = [
  { label: $t('common.average'), value: 'avg' },
  { label: $t('generate.max-value'), value: 'max' },
  { label: $t('common.sum'), value: 'sum' },
  { label: $t('common.diffValue'), value: 'diff' }
]

// 计算属性
const deviceOptions = computed(() => {
  if (props.deviceOptions && props.deviceOptions.length > 0) {
    return props.deviceOptions
  }
  return internalDeviceOptions.value
})

// 处理指标选项，按数据源类型分组
const processedMetricsOptions = computed(() => {
  try {
    if (!metricsOptions.value || !Array.isArray(metricsOptions.value) || !metricsOptions.value.length) {
      return []
    }

    const groupedOptions: SelectOption[] = []

    // API返回的数据结构是 [{ data_source_type, options: [{ key, label, data_type }] }]
    metricsOptions.value.forEach((group: any) => {
      if (!group || typeof group !== 'object') return

      const sourceType = group.data_source_type || 'default'

      // 添加分组标题
      groupedOptions.push({
        label: sourceType,
        value: `group-${sourceType}`,
        disabled: true,
        type: 'group'
      })

      // 添加该分组下的选项
      if (group.options && Array.isArray(group.options)) {
        group.options.forEach((option: any) => {
          if (option && option.key) {
            groupedOptions.push({
              label: `${option.label || option.key} (${option.key})`,
              value: option.key,
              data: {
                ...option,
                data_source_type: sourceType
              }
            })
          }
        })
      }
    })

    return groupedOptions
  } catch (error) {
    console.error('处理指标选项时出错:', error)
    return []
  }
})

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      selectedDeviceId.value = newValue.deviceId || ''
      selectedMetricsId.value = newValue.metricsId || ''
      metricsName.value = newValue.metricsName || ''
      aggregateFunction.value = newValue.aggregateFunction || ''
    }
  },
  { immediate: true, deep: true }
)

// 监听内部数据变化，同步到外部
watch(
  [selectedDeviceId, selectedMetricsId, metricsName, aggregateFunction],
  () => {
    const value = {
      deviceId: selectedDeviceId.value,
      metricsId: selectedMetricsId.value,
      metricsName: metricsName.value,
      aggregateFunction: aggregateFunction.value
    }
    emit('update:modelValue', value)
  },
  { deep: true }
)

// 设备选择变化
const onDeviceChange = async (deviceId: string) => {
  selectedDeviceId.value = deviceId

  // 清空指标相关数据
  selectedMetricsId.value = ''
  metricsName.value = ''
  metricsOptions.value = []
  metricsOptionsFetched.value = false

  if (deviceId) {
    const device = deviceOptions.value.find(d => d.id === deviceId)
    if (device) {
      emit('device-change', deviceId, device)
    }
  }
}

// 指标下拉显示控制
const onMetricsDropdownShow = async (show: boolean) => {
  metricsShow.value = show

  if (show && selectedDeviceId.value && !metricsOptionsFetched.value) {
    await loadMetricsOptions()
  }
}

// 加载指标选项
const loadMetricsOptions = async () => {
  if (!selectedDeviceId.value) return

  try {
    isLoadingMetrics.value = true
    const res = await deviceMetricsList(selectedDeviceId.value)

    // 检查返回的数据结构
    if (res && res.data && Array.isArray(res.data)) {
      metricsOptions.value = res.data
    } else {
      console.warn('API返回数据格式异常:', res)
      metricsOptions.value = []
    }

    metricsOptionsFetched.value = true
  } catch (error) {
    console.error('加载指标失败:', error)
    metricsOptions.value = []
  } finally {
    isLoadingMetrics.value = false
  }
}

// 指标选择变化
const onMetricsChange = (metricsId: string) => {
  selectedMetricsId.value = metricsId

  if (metricsId && metricsOptions.value && Array.isArray(metricsOptions.value)) {
    // 在新的数据结构中查找指标
    let foundMetrics: any = null
    for (const group of metricsOptions.value) {
      if (group && group.options && Array.isArray(group.options)) {
        const metric = group.options.find((opt: any) => opt && opt.key === metricsId)
        if (metric) {
          foundMetrics = {
            ...metric,
            data_source_type: group.data_source_type
          }
          break
        }
      }
    }

    if (foundMetrics) {
      // 自动设置指标名称
      if (!metricsName.value) {
        metricsName.value = foundMetrics.label || foundMetrics.key
      }

      emit('metrics-change', metricsId, foundMetrics)
    }
  }
}

// 指标名称变化
const onMetricsNameChange = (name: string) => {
  metricsName.value = name
}

// 聚合函数变化
const onAggregateFunctionChange = (func: string) => {
  aggregateFunction.value = func
}

// 加载设备选项
const loadDeviceOptions = async () => {
  try {
    isLoadingDevices.value = true
    const res = await deviceListForPanel({})
    internalDeviceOptions.value = res.data || []
  } catch (error) {
    console.error('加载设备列表失败:', error)
    internalDeviceOptions.value = []
  } finally {
    isLoadingDevices.value = false
  }
}

// 组件挂载时自动加载设备列表
onMounted(() => {
  if (!props.deviceOptions || props.deviceOptions.length === 0) {
    loadDeviceOptions()
  }
})

// 暴露方法
defineExpose({
  loadDeviceOptions,
  reset: () => {
    selectedDeviceId.value = ''
    selectedMetricsId.value = ''
    metricsName.value = ''
    aggregateFunction.value = ''
    metricsOptions.value = []
    metricsOptionsFetched.value = false
  }
})
</script>

<style scoped>
.device-metrics-selector {
  width: 100%;
}

:deep(.n-select-group-header) {
  font-weight: 600;
  color: #666;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.n-select-option) {
  padding: 8px 12px;
}

:deep(.n-select-option:hover) {
  background-color: #f0f9ff;
}
</style>
