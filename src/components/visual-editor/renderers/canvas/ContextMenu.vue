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
