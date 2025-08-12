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
        <NDataTable size="small" :columns="columns" :data="tableData" />
      </NCard>
    </NGridItem>
  </NGrid>
</template>

<style scoped></style>
