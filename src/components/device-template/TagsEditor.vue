<script setup lang="ts">
import { ref } from 'vue'
import { NTag, NInput, NSpace } from 'naive-ui'
import { $t } from '@/locales'

interface Props {
  modelValue: string[]
}

interface Emits {
  (e: 'update:modelValue', val: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const inputValue = ref('')
const inputVisible = ref(false)

function handleClose(tag: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

function handleConfirm() {
  const val = inputValue.value.trim()
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  inputValue.value = ''
  inputVisible.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleConfirm()
  } else if (e.key === 'Escape') {
    inputValue.value = ''
    inputVisible.value = false
  }
}
</script>

<template>
  <NSpace size="small" align="center" :wrap="true">
    <NTag
      v-for="tag in modelValue"
      :key="tag"
      closable
      size="small"
      @close="handleClose(tag)"
    >
      {{ tag }}
    </NTag>

    <template v-if="inputVisible">
      <NInput
        v-model:value="inputValue"
        size="small"
        style="width: 120px"
        :placeholder="$t('deviceTemplate.addTagPlaceholder')"
        autofocus
        @blur="handleConfirm"
        @keydown="handleKeydown"
      />
    </template>

    <NTag
      v-else
      size="small"
      style="cursor: pointer; border-style: dashed"
      @click="inputVisible = true"
    >
      + {{ $t('deviceTemplate.addTag') }}
    </NTag>
  </NSpace>
</template>
