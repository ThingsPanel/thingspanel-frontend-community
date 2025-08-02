<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item label="链接">
      <n-input 
        :value="properties.src"
        placeholder="请输入图片URL"
        @update:value="updateProperty('src', $event)"
      />
    </n-form-item>
    <n-form-item label="Alt">
      <n-input 
        :value="properties.alt"
        @update:value="updateProperty('alt', $event)"
      />
    </n-form-item>
    <n-form-item label="适应">
      <n-select 
        :value="properties.objectFit"
        :options="fitOptions"
        @update:value="updateProperty('objectFit', $event)"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface Props {
  properties: {
    src: string
    alt: string
    objectFit: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const fitOptions = [
  { label: '覆盖', value: 'cover' },
  { label: '包含', value: 'contain' },
  { label: '填充', value: 'fill' }
]

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}
</script>