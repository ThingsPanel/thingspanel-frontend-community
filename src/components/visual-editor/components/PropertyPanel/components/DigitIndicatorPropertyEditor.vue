<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item label="数值">
      <n-input-number :value="properties.value" @update:value="updateProperty('value', $event)" />
    </n-form-item>
    <n-form-item label="标签">
      <n-input :value="properties.label" @update:value="updateProperty('label', $event)" />
    </n-form-item>
    <n-form-item label="单位">
      <n-input :value="properties.unit" @update:value="updateProperty('unit', $event)" />
    </n-form-item>
    <n-form-item label="颜色">
      <n-color-picker :value="properties.color" @update:value="updateProperty('color', $event)" />
    </n-form-item>
    <n-form-item label="背景色">
      <n-color-picker :value="properties.backgroundColor" @update:value="updateProperty('backgroundColor', $event)" />
    </n-form-item>
    <n-form-item label="字号">
      <n-input-number
        :value="properties.fontSize"
        :min="12"
        :max="48"
        @update:value="updateProperty('fontSize', $event)"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface Props {
  properties: {
    value: number
    label: string
    unit: string
    color: string
    backgroundColor: string
    fontSize: number
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
</script>
