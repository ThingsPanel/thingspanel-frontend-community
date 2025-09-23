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
/**
 * 基础右键菜单组件
 * 为所有渲染器提供统一的右键菜单功能
 */

import { computed, h } from 'vue'
import { NIcon } from 'naive-ui'
import { CopyOutline, TrashOutline, SettingsOutline, LockClosedOutline, LockOpenOutline } from '@vicons/ionicons5'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

interface Props {
  show: boolean
  x: number
  y: number
  selectedWidgets?: VisualEditorWidget[]
  onSelect: (action: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidgets: () => []
})

const emit = defineEmits<{
  close: []
}>()

const menuOptions = computed(() => {
  const selection = props.selectedWidgets || []
  const hasSelection = selection.length > 0
  const isSingleSelection = selection.length === 1

  let isLocked = false
  if (isSingleSelection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget = selection[0] as any // Use any to access temporary property
    // A component is locked if it's not draggable and not resizable.
    isLocked = widget._isLocked === true
  }

  const lockOption = {
    label: isLocked ? '解锁' : '锁定',
    key: isLocked ? 'unlock' : 'lock',
    icon: () => h(NIcon, null, { default: () => h(isLocked ? LockOpenOutline : LockClosedOutline) }),
    disabled: !isSingleSelection
  }

  return [
    {
      label: '属性',
      key: 'settings',
      icon: () => h(NIcon, null, { default: () => h(SettingsOutline) }),
      disabled: !isSingleSelection
    },
    lockOption,
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
  props.onSelect(action)
}

const handleClickOutside = () => {
  emit('close')
}
</script>

<style scoped>
/* 基础右键菜单样式 */
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
</style>