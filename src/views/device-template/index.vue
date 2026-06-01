<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect,
  NTag,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NPagination,
  NPopconfirm,
  NSpin,
  NCard,
  NGrid,
  NGi
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { deviceTemplateApi } from '@/service/thingmodel/device-template'
import { thingModelApi } from '@/service/thingmodel/thing-model'
import type { DeviceTemplate, ThingModel } from '@/service/thingmodel/types'
import { $t } from '@/locales'

const router = useRouter()

// List state
const loading = ref(false)
const list = ref<DeviceTemplate[]>([])
const total = ref(0)
const search = ref('')
const statusFilter = ref<string | null>(null)
const thingModelFilter = ref<string | null>(null)
const pagination = reactive({ page: 1, page_size: 20 })

// Thing model options for filter
const thingModelOptions = ref<{ label: string; value: string }[]>([])

// Create modal state
const showCreate = ref(false)
const creating = ref(false)
const createForm = reactive<{ name: string; thing_model_id: string }>({
  name: '',
  thing_model_id: ''
})

const statusOptions = [
  { label: $t('common.allStatus'), value: null as string | null },
  { label: $t('deviceTemplate.status.DRAFT'), value: 'DRAFT' },
  { label: $t('deviceTemplate.status.PUBLISHED'), value: 'PUBLISHED' },
  { label: $t('deviceTemplate.status.ARCHIVED'), value: 'ARCHIVED' }
]

function statusType(status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'PUBLISHED':
      return 'success'
    case 'ARCHIVED':
      return 'warning'
    default:
      return 'default'
  }
}

async function fetchThingModels() {
  try {
    const res = await thingModelApi.list({ page: 1, page_size: 200 })
    if (res.data) {
      const items: ThingModel[] = res.data.items || []
      thingModelOptions.value = items
        .filter(m => m.status === 'PUBLISHED')
        .map(m => ({ label: m.name, value: m.id! }))
    }
  } catch {
    // ignore
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    if (thingModelFilter.value) params.thing_model_id = thingModelFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await deviceTemplateApi.list(params)
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

function goDetail(id?: string) {
  if (id) {
    router.push({ path: '/device-template/detail', query: { id } })
  } else {
    router.push({ path: '/device-template/detail' })
  }
}

async function handleDelete(id: string) {
  try {
    await deviceTemplateApi.delete(id)
    window.$message?.success($t('common._delete') + $t('common.editSuccess'))
    fetchList()
  } catch {
    window.$message?.error($t('common.error'))
  }
}

async function handleCreate() {
  if (!createForm.name.trim()) {
    window.$message?.error($t('deviceTemplate.name') + ' ' + $t('common.error'))
    return
  }
  creating.value = true
  try {
    const res = await deviceTemplateApi.create({
      name: createForm.name,
      thing_model_id: createForm.thing_model_id || '',
      thing_model_snapshot_id: ''
    } as DeviceTemplate)
    window.$message?.success($t('common.addSuccess'))
    showCreate.value = false
    createForm.name = ''
    createForm.thing_model_id = ''
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

const columns: DataTableColumns<DeviceTemplate> = [
  {
    title: $t('deviceTemplate.name'),
    key: 'name',
    render: row => row.name || '--'
  },
  {
    title: $t('deviceTemplate.brand'),
    key: 'brand',
    render: row => row.brand || '--'
  },
  {
    title: $t('deviceTemplate.status'),
    key: 'status',
    render: row =>
      h(
        NTag,
        { type: statusType(row.status), size: 'small' },
        { default: () => $t(`deviceTemplate.status.${row.status || 'DRAFT'}`) }
      )
  },
  {
    title: $t('deviceTemplate.thingModelRef'),
    key: 'thing_model_id',
    render: row => {
      const tm = thingModelOptions.value.find(m => m.value === row.thing_model_id)
      return tm?.label || row.thing_model_id || '--'
    }
  },
  {
    title: $t('common.creationTime'),
    key: 'created_at',
    render: (row: any) => (row.created_at ? new Date(row.created_at).toLocaleString() : '--')
  },
  {
    title: $t('common._edit'),
    key: 'actions',
    render: row =>
      h(NSpace, {}, {
        default: () => [
          h(
            NButton,
            { size: 'small', onClick: () => goDetail(row.id) },
            { default: () => $t('deviceTemplate.detail') }
          ),
          h(
            NPopconfirm,
            { onPositiveClick: () => handleDelete(row.id!) },
            {
              trigger: () =>
                h(NButton, { size: 'small', type: 'error' }, { default: () => $t('common._delete') }),
              default: () => $t('deviceTemplate.deleteConfirm')
            }
          )
        ]
      })
  }
]

onMounted(async () => {
  await fetchThingModels()
  fetchList()
})
</script>

<template>
  <div class="p-4">
    <NCard :title="$t('deviceTemplate.list')">
      <template #header-extra>
        <NButton type="primary" @click="showCreate = true">
          {{ $t('deviceTemplate.create') }}
        </NButton>
      </template>

      <NGrid :cols="24" :x-gap="12" class="mb-4">
        <NGi :span="8">
          <NSelect
            v-model:value="statusFilter"
            :options="statusOptions"
            :placeholder="$t('deviceTemplate.status')"
            clearable
            @update:value="handleSearch"
          />
        </NGi>
        <NGi :span="8">
          <NSelect
            v-model:value="thingModelFilter"
            :options="thingModelOptions"
            :placeholder="$t('deviceTemplate.thingModelRef')"
            clearable
            filterable
            @update:value="handleSearch"
          />
        </NGi>
        <NGi :span="4">
          <NButton @click="handleSearch">{{ $t('common._confirm') }}</NButton>
        </NGi>
      </NGrid>

      <NSpin :show="loading">
        <NDataTable :columns="columns" :data="list" :bordered="false" />
        <div class="mt-4 flex justify-end">
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
    <NModal v-model:show="showCreate" preset="card" :title="$t('deviceTemplate.create')" style="width: 480px">
      <NForm :model="createForm" label-placement="left" label-width="100px">
        <NFormItem :label="$t('deviceTemplate.name')" required>
          <NInput v-model:value="createForm.name" :placeholder="$t('deviceTemplate.namePlaceholder')" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreate = false">{{ $t('common._cancel') }}</NButton>
          <NButton type="primary" :loading="creating" @click="handleCreate">
            {{ $t('common._confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
