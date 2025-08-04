<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item label="内容">
      <n-input :value="properties.content" @update:value="updateProperty('content', $event)" />
    </n-form-item>
    <n-form-item label="字号">
      <n-input-number :value="properties.fontSize" @update:value="updateProperty('fontSize', $event)" />
    </n-form-item>
    <n-form-item label="颜色">
      <n-input :value="properties.color" @update:value="updateProperty('color', $event)" />
    </n-form-item>
    <n-form-item label="对齐">
      <n-select
        :value="properties.textAlign"
        :options="alignOptions"
        @update:value="updateProperty('textAlign', $event)"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface Props {
  properties: {
    content: string
    fontSize: number
    color: string
    textAlign: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' }
]

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}
</script>
