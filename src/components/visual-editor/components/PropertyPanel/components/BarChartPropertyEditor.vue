<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item label="标题">
      <n-input 
        :value="properties.title"
        @update:value="updateProperty('title', $event)"
      />
    </n-form-item>
    <n-form-item label="颜色">
      <n-color-picker 
        :value="properties.color"
        @update:value="updateProperty('color', $event)"
      />
    </n-form-item>
    <n-form-item label="数据">
      <n-dynamic-input 
        :value="properties.data"
        :on-create="createDataItem"
        @update:value="updateProperty('data', $event)"
      >
        <template #default="{ value, index }">
          <n-space>
            <n-input 
              :value="value.name"
              placeholder="名称"
              @update:value="updateDataItem(index, 'name', $event)"
            />
            <n-input-number 
              :value="value.value"
              placeholder="数值"
              @update:value="updateDataItem(index, 'value', $event)"
            />
          </n-space>
        </template>
      </n-dynamic-input>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
interface DataItem {
  name: string
  value: number
}

interface Props {
  properties: {
    title: string
    color: string
    data: DataItem[]
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}

const createDataItem = () => ({
  name: '新数据',
  value: 0
})

const updateDataItem = (index: number, field: string, value: any) => {
  if (value === null) return
  
  const newData = [...props.properties.data]
  newData[index] = {
    ...newData[index],
    [field]: value
  }
  emit('update', { data: newData })
}
</script>