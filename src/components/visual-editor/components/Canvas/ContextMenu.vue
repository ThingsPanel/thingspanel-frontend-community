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
import { $t } from '@/locales'

interface Props {
  show: boolean
  x: number
  y: number
  selectedIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => []
})

const emit = defineEmits<{
  select: [action: string]
  close: []
}>()

const menuOptions = computed(() => {
  const selectedIds = props.selectedIds || []
  const hasSelection = selectedIds.length > 0
  const multipleSelection = selectedIds.length > 1

  return [
    {
      label: $t('visualEditor.copy'),
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(CopyOutline) }),
      disabled: !hasSelection
    },
    {
      label: $t('visualEditor.delete'),
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
      disabled: !hasSelection
    },
    {
      type: 'divider',
      key: 'divider1'
    },
    {
      label: multipleSelection ? $t('visualEditor.groupComponents') : $t('visualEditor.layerManagement'),
      key: 'layer',
      icon: () => h(NIcon, null, { default: () => h(LayersOutline) }),
      disabled: !hasSelection
    },
    {
      label: $t('visualEditor.lockComponent'),
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
