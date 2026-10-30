<script setup lang="ts">
import { useSlots } from 'vue'
import { NModal } from 'naive-ui'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    show: boolean
    title: string
    width?: number
    busy?: boolean
  }>(),
  {
    width: 600,
    busy: false
  }
)

defineEmits<{ 'update:show': [value: boolean] }>()
const slots = useSlots()
const gutter = 'clamp(16px, 3vw, 24px)'
</script>

<template>
  <NModal
    v-bind="$attrs"
    :show="show"
    preset="card"
    :title="title"
    :style="{
      width: `min(${width}px, calc(100vw - 32px))`,
      maxHeight: 'calc(100dvh - 32px)',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px'
    }"
    :header-style="{ padding: `20px ${gutter} 16px`, flexShrink: 0 }"
    :content-style="{ padding: `0 ${gutter} 20px`, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }"
    :footer-style="{ padding: `16px ${gutter}`, flexShrink: 0, borderTop: '1px solid var(--border-color)' }"
    :mask-closable="!busy"
    :close-on-esc="!busy"
    :closable="!busy"
    @update:show="$emit('update:show', $event)"
  >
    <div class="model-modal-body"><slot /></div>
    <template v-if="slots.footer" #footer>
      <div class="model-modal-footer"><slot name="footer" /></div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.model-modal-body {
  min-width: 0;

  :deep(.n-input),
  :deep(.n-base-selection) {
    min-height: 36px;
    border-radius: 8px;
  }

  :deep(.n-button) {
    border-radius: 8px;
  }

  :deep(.n-form-item-label) {
    padding-bottom: 8px;
  }
}

.model-modal-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  :deep(.n-button) {
    height: 36px;
    min-width: 72px;
    border-radius: 8px;
  }
}
</style>
