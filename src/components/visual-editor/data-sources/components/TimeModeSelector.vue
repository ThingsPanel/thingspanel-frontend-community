<template>
  <n-form-item label="时间模式">
    <n-radio-group v-model:value="selectedTimeMode" @update:value="onTimeModeSelect">
      <n-radio value="current">当前值</n-radio>
      <n-radio value="history">历史值</n-radio>
    </n-radio-group>
    <template #feedback>
      <div class="time-mode-tip">
        {{
          selectedTimeMode === 'current' ? '获取设备指标的最新数据' : '获取设备指标的历史数据，支持时间范围和聚合方式'
        }}
      </div>
    </template>
  </n-form-item>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NFormItem, NRadioGroup, NRadio } from 'naive-ui'

interface Props {
  modelValue?: string
}

interface Emits {
  'update:modelValue': [value: string]
  'time-mode-change': [timeMode: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedTimeMode = ref(props.modelValue || 'current')

// 时间模式选择处理
const onTimeModeSelect = (timeMode: string) => {
  console.log('🔧 TimeModeSelector - 时间模式选择:', timeMode)

  emit('update:modelValue', timeMode)
  emit('time-mode-change', timeMode)
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== selectedTimeMode.value) {
      selectedTimeMode.value = newValue
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.time-mode-tip {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
