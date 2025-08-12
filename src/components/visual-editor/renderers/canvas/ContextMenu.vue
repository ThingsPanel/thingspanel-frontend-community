<template>
  <n-dropdown
    :show="show"
    :x="x"
    :y="y"
    :options="menuOptions"
    placement="bottom-start"
    @select="handleSelect"
    @clickoutside="handleClickOutside"
  />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NIcon } from 'naive-ui'
import { CopyOutline, TrashOutline, SettingsOutline } from '@vicons/ionicons5'
import type { VisualEditorWidget } from '../../types'

interface Props {
  show: boolean
  x: number
  y: number
  selectedWidgets?: VisualEditorWidget[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidgets: () => []
})

const emit = defineEmits<{
  select: [action: string]
  close: []
}>()

const menuOptions = computed(() => {
  const selection = props.selectedWidgets || []
  const hasSelection = selection.length > 0
  const isSingleSelection = selection.length === 1

  return [
    {
      label: '属性',
      key: 'settings',
      icon: () => h(NIcon, null, { default: () => h(SettingsOutline) }),
      disabled: !isSingleSelection
    },
    {
      type: 'divider',
      key: 'd1'
    },
    {
      label: '复制',
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) }),
      disabled: !hasSelection
    },
    {
      label: '删除',
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      disabled: !hasSelection
    }
  ]
})

const handleSelect = (action: string) => {
  emit('select', action)
  emit('close')
}

const handleClickOutside = () => {
  emit('close')
}
</script>

<style scoped>
/* 禁用状态样式 */
.context-menu-disabled {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

.disabled-overlay {
  position: absolute;
  top: v-bind('y + "px"');
  left: v-bind('x + "px"');
  pointer-events: auto;
  min-width: 200px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  padding: 8px;
}

/* 原有样式（已注释） */
/*
无原有样式
*/
</style>
