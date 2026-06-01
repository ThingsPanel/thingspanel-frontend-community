<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NSelect, NSpace, NDivider } from 'naive-ui'
import { $t } from '@/locales'

interface ChartWidget {
  type: string
  options?: Record<string, any>
}

interface ChartConfig {
  default_widgets: ChartWidget[]
}

const props = defineProps<{
  modelValue: ChartConfig
  platform: 'WEB' | 'APP'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: ChartConfig): void
}>()

const widgets = computed({
  get: () => props.modelValue?.default_widgets ?? [],
  set: (val) => emit('update:modelValue', { ...props.modelValue, default_widgets: val })
})

const widgetTypeOptions = [
  { label: $t('thingModel.widgetKind.line'), value: 'line' },
  { label: $t('thingModel.widgetKind.number'), value: 'number' },
  { label: $t('thingModel.widgetKind.gauge'), value: 'gauge' },
  { label: $t('thingModel.widgetKind.switch'), value: 'switch' },
  { label: $t('thingModel.widgetKind.bar'), value: 'bar' },
  { label: $t('thingModel.widgetKind.text'), value: 'text' }
]

function addWidget() {
  widgets.value = [...widgets.value, { type: 'line' }]
}

function removeWidget(index: number) {
  const arr = [...widgets.value]
  arr.splice(index, 1)
  widgets.value = arr
}

function moveUp(index: number) {
  if (index === 0) return
  const arr = [...widgets.value]
  ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
  widgets.value = arr
}

function moveDown(index: number) {
  if (index >= widgets.value.length - 1) return
  const arr = [...widgets.value]
  ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
  widgets.value = arr
}

function updateType(index: number, type: string) {
  const arr = [...widgets.value]
  arr[index] = { ...arr[index], type }
  widgets.value = arr
}
</script>

<template>
  <div class="border rounded p-3 bg-gray-50">
    <div
      v-for="(widget, idx) in widgets"
      :key="idx"
      class="flex items-center gap-2 mb-2"
    >
      <NSelect
        :value="widget.type"
        :options="widgetTypeOptions"
        size="small"
        style="width: 140px"
        @update:value="(v) => updateType(idx, v)"
      />
      <NSpace size="small">
        <NButton size="tiny" :disabled="idx === 0" @click="moveUp(idx)">↑</NButton>
        <NButton size="tiny" :disabled="idx === widgets.length - 1" @click="moveDown(idx)">↓</NButton>
        <NButton size="tiny" type="error" @click="removeWidget(idx)">✕</NButton>
      </NSpace>
    </div>
    <NButton dashed size="small" @click="addWidget">+ {{ $t('thingModel.addWidget') }}</NButton>
  </div>
</template>
