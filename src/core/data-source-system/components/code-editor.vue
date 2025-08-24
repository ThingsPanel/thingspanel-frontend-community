<!--
  代码编辑器组件
  用于编辑JSON、JavaScript等代码片段
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { NInput } from 'naive-ui'

interface Props {
  modelValue: string
  language?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'json',
  placeholder: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const code = ref(props.modelValue)

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== code.value) {
      code.value = newValue
    }
  }
)

const handleChange = (value: string) => {
  code.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="code-editor">
    <NInput
      v-model:value="code"
      type="textarea"
      :placeholder="placeholder"
      :options="{ language: language }"
      style="height: 200px"
      @update:value="handleChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.code-editor {
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  overflow: hidden;
}
</style>
