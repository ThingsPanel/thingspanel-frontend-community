<script setup lang="ts" generic="T extends Record<string, unknown>, K = never">
import { VueDraggable } from 'vue-draggable-plus'
import type { FilteredColumn } from '@/hooks/common/table'
import { $t } from '@/locales'

defineOptions({
  name: 'TableColumnSetting'
})

const columns = defineModel<FilteredColumn[]>('columns', {
  required: true
})
</script>

<template>
  <NPopover placement="bottom-end" trigger="click">
    <template #trigger>
      <NButton size="small">
        <template #icon>
          <IconAntDesignSettingOutlined class="text-icon" />
        </template>
        {{ $t('common.columnSetting') }}
      </NButton>
    </template>
    <VueDraggable v-model="columns">
      <div v-for="item in columns" :key="item.key" class="h-36px flex-y-center rd-4px hover:(bg-primary bg-opacity-20)">
        <IconMdiDrag class="mr-8px cursor-move text-icon" />
        <NCheckbox v-model:checked="item.checked">
          {{ item.title }}
        </NCheckbox>
      </div>
    </VueDraggable>
  </NPopover>
</template>

<style scoped></style>
