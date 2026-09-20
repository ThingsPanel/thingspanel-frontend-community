<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect,
  NResult,
  NEmpty,
  NTag,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NPagination,
  NPopconfirm,
  NSpin,
  NCard,
  NText
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { thingModelApi } from '@/service/thingmodel/thing-model'
import type { ThingModel } from '@/service/thingmodel/types'
import { checkThingmodelAvailability } from '@/service/thingmodel/client'
import { $t } from '@/locales'

const router = useRouter()

const serviceAvailable = ref<boolean | null>(null)

// List state
const loading = ref(false)
const list = ref<ThingModel[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref<string | null>(null)
const pagination = reactive({ page: 1, page_size: 20 })

// Create modal state
const showCreate = ref(false)
const creating = ref(false)
const createForm = reactive({ name: '', description: '' })
const createFormRef = ref()

const statusOptions = [
  { label: $t('common.allStatus'), value: null },
  { label: $t('thingModel.status.DRAFT'), value: 'DRAFT' },
  { label: $t('thingModel.status.PUBLISHED'), value: 'PUBLISHED' },
  { label: $t('thingModel.status.ARCHIVED'), value: 'ARCHIVED' }
]

function statusType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'PUBLISHED': return 'success'
    case 'ARCHIVED': return 'warning'
    default: return 'default'
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    if (search.value) params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await thingModelApi.list(params)
    if (res.data) {
      list.value = res.data.items || []
      total.value = res.data.total || 0
    }
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchList()
}

function goDetail(id: string) {
  router.push({ path: '/thing-model/detail', query: { id } })
}

async function handleDelete(id: string) {
  try {
    await thingModelApi.delete(id)
    window.$message?.success($t('common._delete') + $t('common.editSuccess'))
    fetchList()
  } catch {
    window.$message?.error($t('common.error'))
  }
}

async function handleCreate() {
  if (!createForm.name.trim()) {
    window.$message?.error($t('thingModel.name') + ' ' + $t('common.error'))
    return
  }
  creating.value = true
  try {
    const res = await thingModelApi.create({
      name: createForm.name,
      description_i18n: createForm.description ? { default: createForm.description } : undefined
    } as ThingModel)
    window.$message?.success($t('thingModel.create'))
    showCreate.value = false
    createForm.name = ''
    createForm.description = ''
    if (res.data?.id) {
      goDetail(res.data.id)
    } else {
      fetchList()
    }
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    creating.value = false
  }
}

const columns: DataTableColumns<ThingModel> = [
  {
    title: $t('thingModel.name'),
    key: 'name',
    render: (row) => row.name || '--'
  },
  {
    title: $t('thingModel.status'),
    key: 'status',
    render: (row) =>
      h(NTag, { type: statusType(row.status), size: 'small' }, { default: () => $t(`thingModel.status.${row.status || 'DRAFT'}`) })
  },
  {
    title: $t('thingModel.category'),
    key: 'category',
    render: (row) => row.category || '--'
  },
  {
    title: $t('thingModel.createdAt'),
    key: 'created_at',
    render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '--')
  },
  {
    title: $t('common._edit'),
    key: 'actions',
    align: 'right' as const,
    render: (row) =>
      h(NSpace, { justify: 'end' }, {
        default: () => [
          h(
            NButton,
            { size: 'small', onClick: () => goDetail(row.id!) },
            { default: () => $t('common._edit') }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id!)
            },
            {
              trigger: () =>
                h(NButton, { size: 'small', type: 'error' }, { default: () => $t('common._delete') }),
              default: () => $t('thingModel.deleteConfirm')
            }
          )
        ]
      })
  }
]

onMounted(() => {
  checkThingmodelAvailability().then(ok => { serviceAvailable.value = ok })
  fetchList()
})
</script>

<template>
  <div class="p-4">
    <NResult
      v-if="serviceAvailable === false"
      status="warning"
      title="新物模型服务未部署"
      description="thingmodel-api 服务不可达，请参考部署文档配置后重试。"
      style="margin: 40px auto; max-width: 500px"
    />
    <NCard v-else :title="$t('thingModel.list')">
      <template #header-extra>
        <NButton type="primary" @click="showCreate = true">{{ $t('thingModel.create') }}</NButton>
      </template>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NInput
          v-model:value="search"
          :placeholder="$t('thingModel.searchPlaceholder')"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <NSelect
          v-model:value="statusFilter"
          :options="statusOptions"
          :placeholder="$t('thingModel.status')"
          clearable
          style="width: 160px"
          @update:value="handleSearch"
        />
        <NButton @click="handleSearch">{{ $t('common.search') }}</NButton>
      </div>

      <NSpin :show="loading">
        <NDataTable :columns="columns" :data="list" :bordered="false" :min-height="200" />
        <NEmpty v-if="!loading && list.length === 0" :description="$t('common.nodata')" class="my-8" />
        <div class="mt-4 flex items-center justify-between">
          <NText depth="3" class="text-sm">{{ $t('common.total') }}: {{ total }}</NText>
          <NPagination
            :page="pagination.page"
            :page-size="pagination.page_size"
            :item-count="total"
            @update:page="handlePageChange"
          />
        </div>
      </NSpin>
    </NCard>

    <!-- Create Modal -->
    <NModal v-model:show="showCreate" preset="card" :title="$t('thingModel.create')" style="width: 480px">
      <NForm ref="createFormRef" :model="createForm" label-placement="left" label-width="80px">
        <NFormItem :label="$t('thingModel.name')" required>
          <NInput v-model:value="createForm.name" :placeholder="$t('thingModel.name')" />
        </NFormItem>
        <NFormItem :label="$t('thingModel.description')">
          <NInput
            v-model:value="createForm.description"
            type="textarea"
            :rows="3"
            :placeholder="$t('thingModel.description')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreate = false">{{ $t('common._cancel') }}</NButton>
          <NButton type="primary" :loading="creating" @click="handleCreate">{{ $t('common._confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
