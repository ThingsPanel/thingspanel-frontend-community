<script setup lang="ts">
import type { FilteredColumn } from '@/hooks/common/table'
import { $t } from '~/src/locales'

defineOptions({
  name: 'TableHeaderOperation'
})

interface Props {
  disabledDelete?: boolean
  loading?: boolean
}

defineProps<Props>()

interface Emits {
  (e: 'add'): void
  (e: 'delete'): void
  (e: 'refresh'): void
}

const emit = defineEmits<Emits>()

const columns = defineModel<FilteredColumn[]>('columns', {
  default: () => []
})

function add() {
  emit('add')
}

function batchDelete() {
  emit('delete')
}

function refresh() {
  emit('refresh')
}
</script>

<template>
  <NSpace wrap justify="end" class="<sm:w-200px">
    <NButton size="small" ghost type="primary" @click="add">
      <template #icon>
        <IconIcRoundPlus class="text-icon" />
      </template>
      {{ "新增" }}
    </NButton>
    <NPopconfirm @positive-click="batchDelete">
      <template #trigger>
        <NButton size="small" ghost type="error" :disabled="disabledDelete">
          <template #icon>
            <IconIcRoundDelete class="text-icon" />
          </template>
          {{ "批量删除" }}
        </NButton>
      </template>
      {{ "确认删除" }}
    </NPopconfirm>
    <NButton size="small" @click="refresh">
      <template #icon>
        <IconMdiRefresh class="text-icon" :class="{ 'animate-spin': loading }" />
      </template>
      {{ "刷新" }}
    </NButton>
    <TableColumnSetting v-model:columns="columns" />
  </NSpace>
</template>

<style scoped></style>
