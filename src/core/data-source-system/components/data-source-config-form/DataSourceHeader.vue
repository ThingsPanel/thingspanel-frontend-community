<script setup lang="ts">
import { computed } from 'vue';
import { NSelect, NSpace, NTag, NTooltip, NIcon } from 'naive-ui';
import { InformationCircleOutline } from '@vicons/ionicons5';

const props = defineProps<{
  dataSourceOptions: { label: string; value: string; type?: string; description?: string; example?: object }[];
  activeDataSourceKey: string;
}>();

const emit = defineEmits(['update:activeDataSourceKey']);

const activeDataSource = computed(() => {
  return props.dataSourceOptions.find(opt => opt.value === props.activeDataSourceKey);
});

function handleUpdate(value: string) {
  emit('update:activeDataSourceKey', value);
}
</script>

<template>
  <div class="data-source-header">
    <NSpace align="center">
      <span>当前数据源:</span>
      <NSelect
        :value="activeDataSourceKey"
        :options="dataSourceOptions"
        style="width: 200px"
        @update:value="handleUpdate"
      />
      <NTag v-if="activeDataSource?.type" type="success">
        {{ activeDataSource.type }}
        {{ activeDataSourceKey }}
      </NTag>
      <NTooltip v-if="activeDataSource?.example" trigger="hover">
        <template #trigger>
          <NIcon :size="20" class="cursor-pointer">
            <InformationCircleOutline />
          </NIcon>
        </template>
        <pre>{{ JSON.stringify(activeDataSource.example, null, 2) }}</pre>
      </NTooltip>
    </NSpace>
  </div>
</template>

<style scoped>
.data-source-header {
  margin-bottom: 16px;
}
</style>
