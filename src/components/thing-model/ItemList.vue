<script setup lang="ts">
import { ref, computed, onMounted, h, watch } from 'vue'
import { NButton, NDataTable, NTabs, NTabPane, NTag, NSpace, NPopconfirm, NSpin, NAlert } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { thingModelItemApi } from '@/service/thingmodel/thing-model-item'
import type { ThingModelItem } from '@/service/thingmodel/types'
import { $t } from '@/locales'
import ItemEditDrawer from './ItemEditDrawer.vue'

const props = defineProps<{
  thingModelId: string
  status: string
}>()

const loading = ref(false)
const items = ref<ThingModelItem[]>([])
const typeFilter = ref<string>('ALL')
const showDrawer = ref(false)
const editingItem = ref<ThingModelItem | null>(null)

const isDraft = computed(() => props.status === 'DRAFT')

const typeOptions = [
  { label: $t('thingModel.allTypes'), key: 'ALL' },
  { label: $t('thingModel.itemType.PROPERTY'), key: 'PROPERTY' },
  { label: $t('thingModel.itemType.EVENT'), key: 'EVENT' },
  { label: $t('thingModel.itemType.COMMAND'), key: 'COMMAND' }
]

const filteredItems = computed(() => {
  if (typeFilter.value === 'ALL') return items.value
  return items.value.filter(i => i.type === typeFilter.value)
})

function itemTypeTag(type: string) {
  switch (type) {
    case 'EVENT':
      return 'info'
    case 'COMMAND':
      return 'warning'
    default:
      return 'success'
  }
}

function valueKindLabel(item: ThingModelItem): string {
  const kind = item.value_type?.kind || item.value_type?.type || '--'
  const key = `thingModel.valueKind.${kind}`
  return $t(key) !== key ? $t(key) : kind
}

async function fetchItems() {
  if (!props.thingModelId) return
  loading.value = true
  try {
    const res = await thingModelItemApi.list(props.thingModelId)
    if (res.data) {
      items.value = res.data.items || []
    }
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingItem.value = null
  showDrawer.value = true
}

function openEdit(item: ThingModelItem) {
  editingItem.value = { ...item }
  showDrawer.value = true
}

async function handleDelete(item: ThingModelItem) {
  try {
    await thingModelItemApi.delete(props.thingModelId, item.id!)
    window.$message?.success($t('common._delete'))
    await fetchItems()
  } catch {
    window.$message?.error($t('common.error'))
  }
}

async function handleSaved() {
  showDrawer.value = false
  await fetchItems()
}

const columns = computed<DataTableColumns<ThingModelItem>>(() => {
  const cols: DataTableColumns<ThingModelItem> = [
    {
      title: $t('thingModel.identifier'),
      key: 'identifier',
      render: row => row.identifier || '--'
    },
    {
      title: $t('thingModel.displayName'),
      key: 'name_i18n',
      render: row => row.name_i18n?.default || '--'
    },
    {
      title: $t('thingModel.itemType'),
      key: 'type',
      render: row =>
        h(
          NTag,
          { type: itemTypeTag(row.type), size: 'small' },
          { default: () => $t(`thingModel.itemType.${row.type}`) }
        )
    },
    {
      title: $t('thingModel.valueKind'),
      key: 'value_type',
      render: row => valueKindLabel(row)
    },
    {
      title: $t('thingModel.unit'),
      key: 'unit',
      render: row => row.value_type?.constraint?.unit || row.value_type?.unit || '--'
    }
  ]

  if (isDraft.value) {
    cols.push({
      title: $t('common._edit'),
      key: 'actions',
      render: row =>
        h(
          NSpace,
          {},
          {
            default: () => [
              h(NButton, { size: 'small', onClick: () => openEdit(row) }, { default: () => $t('common._edit') }),
              h(
                NPopconfirm,
                { onPositiveClick: () => handleDelete(row) },
                {
                  trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => $t('common._delete') }),
                  default: () => $t('thingModel.deleteConfirm')
                }
              )
            ]
          }
        )
    })
  }

  return cols
})

watch(
  () => props.thingModelId,
  () => {
    fetchItems()
  }
)

onMounted(() => {
  fetchItems()
})
</script>

<template>
  <div>
    <NAlert v-if="!isDraft" type="info" class="mb-3">
      {{ $t('thingModel.immutableWarning') }}
    </NAlert>

    <div class="flex items-center justify-between mb-3">
      <NTabs v-model:value="typeFilter" type="segment" size="small" style="width: 400px">
        <NTabPane v-for="opt in typeOptions" :key="opt.key" :name="opt.key" :tab="opt.label" />
      </NTabs>
      <NButton v-if="isDraft" type="primary" size="small" @click="openAdd">
        {{ $t('thingModel.addField') }}
      </NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="filteredItems" :bordered="false" size="small" />
    </NSpin>

    <ItemEditDrawer
      v-if="showDrawer"
      :show="showDrawer"
      :thing-model-id="thingModelId"
      :item="editingItem"
      @close="showDrawer = false"
      @saved="handleSaved"
    />
  </div>
</template>
