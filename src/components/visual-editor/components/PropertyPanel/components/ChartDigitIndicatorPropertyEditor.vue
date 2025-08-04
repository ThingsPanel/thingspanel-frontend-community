<template>
  <n-form size="small" label-placement="left" label-width="70">
    <n-form-item label="标题">
      <n-input :value="properties.title" @update:value="updateProperty('title', $event)" />
    </n-form-item>
    <n-form-item label="设备ID">
      <n-input
        :value="properties.deviceId"
        placeholder="请输入设备ID"
        @update:value="updateProperty('deviceId', $event)"
      />
    </n-form-item>
    <n-form-item label="指标ID">
      <n-input
        :value="properties.metricsId"
        placeholder="请输入指标ID"
        @update:value="updateProperty('metricsId', $event)"
      />
    </n-form-item>
    <n-form-item label="指标类型">
      <n-select
        :value="properties.metricsType"
        :options="metricsTypeOptions"
        @update:value="updateProperty('metricsType', $event)"
      />
    </n-form-item>
    <n-form-item label="图标">
      <n-input :value="properties.icon" placeholder="图标名称" @update:value="updateProperty('icon', $event)" />
    </n-form-item>
    <n-form-item label="颜色">
      <n-color-picker :value="properties.color" @update:value="updateProperty('color', $event)" />
    </n-form-item>
    <n-form-item label="背景颜色">
      <n-color-picker :value="properties.backgroundColor" @update:value="updateProperty('backgroundColor', $event)" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface Props {
  properties: {
    title: string
    deviceId: string
    metricsId: string
    metricsType: string
    icon: string
    color: string
    backgroundColor: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const metricsTypeOptions = [
  { label: '遥测数据', value: 'telemetry' },
  { label: '属性数据', value: 'attributes' }
]

const updateProperty = (key: string, value: any) => {
  if (value !== null) {
    emit('update', { [key]: value })
  }
}
</script>
