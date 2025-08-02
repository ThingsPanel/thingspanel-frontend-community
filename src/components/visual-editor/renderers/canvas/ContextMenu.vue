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
import { CopyOutline, TrashOutline, LayersOutline, LockClosedOutline } from '@vicons/ionicons5'

interface Props {
  show: boolean
  x: number
  y: number
  selectedIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [action: string]
  close: []
}>()

const menuOptions = computed(() => {
  const hasSelection = props.selectedIds.length > 0
  const multipleSelection = props.selectedIds.length > 1

  return [
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
    },
    {
      type: 'divider',
      key: 'divider1'
    },
    {
      label: multipleSelection ? '成组' : '图层',
      key: 'layer',
      icon: () => h(NIcon, null, { default: () => h(LayersOutline) }),
      disabled: !hasSelection
    },
    {
      label: '锁定',
      key: 'lock',
      icon: () => h(NIcon, null, { default: () => h(LockClosedOutline) }),
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