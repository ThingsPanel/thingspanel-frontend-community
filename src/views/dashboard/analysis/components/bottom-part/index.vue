<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import { $t } from '@/locales'

// eslint-disable-next-line prettier/prettier
defineOptions({ name: 'DashboardAnalysisBottomPart' })

interface TimelineData {
  type: 'default' | 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string
  time: string
}

interface TableData {
  key: number
  name: string
  age: number
  address: string
  tags: string[]
}

const timelines: TimelineData[] = [
  { type: 'default', title: $t('card.ah'), content: '', time: '2021-10-10 20:46' },
  {
    type: 'success',
    title: $t('custom.devicePage.success'),
    content: '哪里成功',
    time: '2021-10-10 20:46'
  },
  {
    type: 'error',
    title: $t('card.error'),
    content: $t('card.whereSuccess'),
    time: '2021-10-10 20:46'
  },
  {
    type: 'warning',
    title: $t('card.warning'),
    content: $t('card.whereWarning'),
    time: '2021-10-10 20:46'
  },
  { type: 'info', title: $t('card.info'), content: $t('card.yes'), time: '2021-10-10 20:46' }
]

const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const columns = [
  {
    title: 'Name',
    key: 'name'
  },
  {
    title: 'Age',
    key: 'age'
  },
  {
    title: 'Address',
    key: 'address'
  },
  {
    title: 'Tags',
    key: 'tags',
    render(row: TableData) {
      const tags = row.tags.map(tagKey => {
        return h(
          NTag,
          {
            style: {
              marginRight: '6px'
            },
            type: 'info'
          },
          {
            default: () => tagKey
          }
        )
      })
      return tags
    }
  }
]

const tableData: TableData[] = [
  {
    key: 0,
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer']
  },
  {
    key: 1,
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['wow']
  },
  {
    key: 2,
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher']
  },
  {
    key: 3,
    name: 'Soybean',
    age: 25,
    address: 'China Shenzhen',
    tags: ['handsome', 'programmer']
  },
  {
    key: 4,
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer']
  },
  {
    key: 5,
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['wow']
  },
  {
    key: 6,
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher']
  }
]
</script>

<template>
  <NGrid :x-gap="16" :y-gap="16" :item-responsive="true">
    <NGridItem span="0:24 640:24 1024:8">
      <NCard :title="$t('generate.timeline')" :bordered="false" class="h-full rounded-8px shadow-sm">
        <NTimeline>
          <NTimelineItem v-for="item in timelines" :key="item.type" v-bind="item" />
        </NTimeline>
      </NCard>
    </NGridItem>
    <NGridItem span="0:24 640:24 1024:16">
      <NCard :title="$t('generate.table')" :bordered="false" class="h-full rounded-8px shadow-sm">
        <NDataTable
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="720"
          :row-key="row => row.key"
          :columns="columns"
          :data="tableData"
          class="standard-table"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.nodata')" />
          </template>
        </NDataTable>
      </NCard>
    </NGridItem>
  </NGrid>
</template>

<style scoped lang="scss">
.standard-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    max-width: 260px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    white-space: nowrap;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
