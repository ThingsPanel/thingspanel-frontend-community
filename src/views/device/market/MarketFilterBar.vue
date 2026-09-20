<script setup lang="ts">
import { NButton, NIcon, NInput, NSelect } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'

interface FilterOption {
  label: string | (() => string)
  value: string
}

withDefaults(
  defineProps<{
    keyword: string
    category: string | null
    sortBy: string
    categoryOptions: FilterOption[]
    sortOptions: FilterOption[]
    keywordPlaceholder: string
    categoryPlaceholder: string
  }>(),
  {
    category: null
  }
)

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:category': [value: string | null]
  'update:sort-by': [value: string]
  reset: []
}>()
</script>

<template>
  <div class="market-filter-area">
    <div class="market-filter-toolbar">
      <div class="market-filter-field market-filter-field--search">
        <NInput
          :value="keyword"
          :placeholder="keywordPlaceholder"
          clearable
          @update:value="value => emit('update:keyword', value)"
        >
          <template #prefix>
            <NIcon><SearchOutline /></NIcon>
          </template>
        </NInput>
      </div>

      <div class="market-filter-field">
        <NSelect
          :value="category"
          :options="categoryOptions"
          :placeholder="categoryPlaceholder"
          clearable
          @update:value="value => emit('update:category', value)"
        />
      </div>

      <div class="market-filter-field">
        <NSelect :value="sortBy" :options="sortOptions" @update:value="value => emit('update:sort-by', value)" />
      </div>

      <div class="market-filter-actions">
        <NButton quaternary @click="emit('reset')">
          {{ $t('generate.reset') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.market-filter-area {
  padding: 2px 0 0;
}

.market-filter-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 320px) repeat(2, minmax(160px, 200px)) auto;
  gap: 10px;
  align-items: center;
  justify-content: end;
}

.market-filter-field {
  min-width: 0;
}

.market-filter-field--search {
  min-width: 220px;
}

.market-filter-toolbar {
  :deep(.n-input),
  :deep(.n-base-selection) {
    min-height: 36px;
    border-radius: 8px;
    background: var(--card-color);
  }

  :deep(.n-input:hover),
  :deep(.n-base-selection:hover) {
    border-color: var(--primary-color);
  }

  :deep(.n-button) {
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
  }
}

.market-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

@media (max-width: 1440px) {
  .market-filter-toolbar {
    grid-template-columns: minmax(220px, 320px) repeat(2, minmax(160px, 200px)) auto;
  }

  .market-filter-field--search {
    grid-column: span 2;
  }

  .market-filter-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .market-filter-toolbar {
    grid-template-columns: 1fr;
  }

  .market-filter-field--search {
    grid-column: auto;
  }

  .market-filter-actions {
    justify-content: stretch;

    :deep(.n-button) {
      width: 100%;
    }
  }
}
</style>
