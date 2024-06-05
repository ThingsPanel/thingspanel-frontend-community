<script setup lang="ts">
import { ref, watch } from 'vue';
import type { DataTableColumn } from 'naive-ui';
import VueDraggable from 'vuedraggable';
import { $t } from '@/locales';

type Column = DataTableColumn<UserManagement.User>;

interface Props {
  columns: Column[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:columns', columns: Column[]): void;
}

const emit = defineEmits<Emits>();

type List = Column & { checked?: boolean };

const list = ref(initList());

function initList(): List[] {
  return props.columns.map(item => ({ ...item, checked: true }));
}

watch(
  list,
  newValue => {
    const newColumns = newValue.filter(item => item.checked);

    const columns: Column[] = newColumns.map(item => {
      const column = { ...item };
      delete column.checked;

      return column;
    }) as Column[];

    emit('update:columns', columns);
  },
  { deep: true }
);
</script>

<template>
  <n-popover placement="bottom" trigger="click">
    <template #trigger>
      <n-button size="small" type="primary">
        <icon-ant-design-setting-outlined class="mr-4px text-16px" />
        {{ $t('common.changeTableColumns') }}
      </n-button>
    </template>
    <div class="w-180px">
      <VueDraggable v-model="list" item-key="key">
        <template #item="{ element }">
          <div v-if="element.key" class="hover:bg-primary_active h-36px flex-y-center px-12px">
            <icon-mdi-drag class="mr-8px cursor-move text-20px" />
            <n-checkbox v-model:checked="element.checked">
              {{ element.title }}
            </n-checkbox>
          </div>
        </template>
      </VueDraggable>
    </div>
  </n-popover>
</template>

<style scoped></style>
