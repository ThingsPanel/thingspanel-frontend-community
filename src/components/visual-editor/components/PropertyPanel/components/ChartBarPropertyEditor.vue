<template>
  <n-form size="small" label-placement="left" label-width="70">
    <n-form-item label="标题">
      <n-input :value="properties.title" @update:value="updateProperty('title', $event)" />
    </n-form-item>
    <n-form-item label="设备ID列表">
      <n-dynamic-input
        :value="properties.deviceIds"
        :on-create="() => ''"
        @update:value="updateProperty('deviceIds', $event)"
      >
        <template #default="{ value, index }">
          <n-input :value="value" :placeholder="`设备ID ${index + 1}`" @update:value="updateDeviceId(index, $event)" />
        </template>
      </n-dynamic-input>
    </n-form-item>
    <n-form-item label="指标ID列表">
      <n-dynamic-input
        :value="properties.metricsIds"
        :on-create="() => ''"
        @update:value="updateProperty('metricsIds', $event)"
      >
        <template #default="{ value, index }">
          <n-input :value="value" :placeholder="`指标ID ${index + 1}`" @update:value="updateMetricsId(index, $event)" />
        </template>
      </n-dynamic-input>
    </n-form-item>
    <n-form-item label="颜色配置">
      <n-dynamic-input
        :value="properties.colors"
        :on-create="() => '#18a058'"
        @update:value="updateProperty('colors', $event)"
      >
        <template #default="{ value, index }">
          <n-color-picker :value="value" @update:value="updateColor(index, $event)" />
        </template>
      </n-dynamic-input>
    </n-form-item>
    <n-form-item label="显示图例">
      <n-switch :value="properties.showLegend" @update:value="updateProperty('showLegend', $event)" />
    </n-form-item>
    <n-form-item label="显示网格">
      <n-switch :value="properties.showGrid" @update:value="updateProperty('showGrid', $event)" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface Props {
  properties: {
    title: string
    deviceIds: string[]
    metricsIds: string[]
    colors: string[]
    showLegend: boolean
    showGrid: boolean
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const updateProperty = (key: string, value: any) => {
  if (value !== null) {
    emit('update', { [key]: value })
  }
}

const updateDeviceId = (index: number, value: string | null) => {
  if (value === null) return

  const newDeviceIds = [...props.properties.deviceIds]
  newDeviceIds[index] = value
  emit('update', { deviceIds: newDeviceIds })
}

const updateMetricsId = (index: number, value: string | null) => {
  if (value === null) return

  const newMetricsIds = [...props.properties.metricsIds]
  newMetricsIds[index] = value
  emit('update', { metricsIds: newMetricsIds })
}

const updateColor = (index: number, value: string | null) => {
  if (value === null) return

  const newColors = [...props.properties.colors]
  newColors[index] = value
  emit('update', { colors: newColors })
}
</script>
