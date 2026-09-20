<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import {
  NButton,
  NDataTable,
  NInput,
  NResult,
  NEmpty,
  NSelect,
  NModal,
  NForm,
  NFormItem,
  NSpace,
  NPopconfirm,
  NPagination,
  NSpin,
  NCard,
  NText,
  NTag
} from 'naive-ui'
import type { DataTableColumns, FormInst, SelectOption } from 'naive-ui'
import { useRouter } from 'vue-router'
import { $t } from '@/locales'
import { deviceApi } from '@/service/thingmodel/device'
import { deviceTemplateApi } from '@/service/thingmodel/device-template'
import { productApi } from '@/service/thingmodel/product'
import type { Device, DeviceTemplate, Product } from '@/service/thingmodel/types'
import { checkThingmodelAvailability } from '@/service/thingmodel/client'

// ─── Router ───────────────────────────────────────────────────────────────────

const router = useRouter()

// ─── State ───────────────────────────────────────────────────────────────────

const serviceAvailable = ref<boolean | null>(null)

const tableData = ref<Device[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const searchSn = ref('')
const filterTemplateId = ref<string | null>(null)

const templateOptions = ref<SelectOption[]>([])
const productOptions = ref<SelectOption[]>([])
const filteredProductOptions = ref<SelectOption[]>([])

// Modal
const modalVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

const formModel = reactive<{
  sn: string
  device_template_id: string
  product_id: string
  voucher: string
}>({
  sn: '',
  device_template_id: '',
  product_id: '',
  voucher: ''
})

const formRules = {
  sn: [{ required: true, message: $t('tmDevice.sn'), trigger: 'blur' }],
  device_template_id: [{ required: true, message: $t('tmDevice.template'), trigger: 'change' }]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const templateNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const opt of templateOptions.value) {
    map[String(opt.value)] = String(opt.label)
  }
  return map
})

const productNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const opt of productOptions.value) {
    map[String(opt.value)] = String(opt.label)
  }
  return map
})

function onTemplateChange(templateId: string) {
  formModel.product_id = ''
  // filter products by template if product has device_template_id
  // For simplicity: show all products when a template is selected
  filteredProductOptions.value = productOptions.value
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function loadTemplates() {
  try {
    const res = await deviceTemplateApi.list({ status: 'PUBLISHED', page: 1, page_size: 200 })
    templateOptions.value = (res?.items ?? []).map((t: DeviceTemplate) => ({
      label: t.name,
      value: t.id as string
    }))
  } catch {
    // ignore
  }
}

async function loadProducts() {
  try {
    const res = await productApi.list({ page: 1, page_size: 200 })
    productOptions.value = (res?.items ?? []).map((p: Product) => ({
      label: p.name,
      value: p.id as string
    }))
    filteredProductOptions.value = productOptions.value
  } catch {
    // ignore
  }
}

async function loadList() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, page_size: pageSize.value }
    if (searchSn.value) params.sn = searchSn.value
    const res = await deviceApi.list(params)
    tableData.value = res?.items ?? []
    total.value = res?.total ?? 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await deviceApi.delete(id)
    window.$message?.success($t('common.deleteSuccess'))
    await loadList()
  } catch (e: any) {
    window.$message?.error(e?.message ?? $t('common.error'))
  }
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const body: Device = {
      sn: formModel.sn,
      device_template_id: formModel.device_template_id,
      product_id: formModel.product_id || undefined,
      voucher: formModel.voucher || undefined
    }
    await deviceApi.create(body)
    window.$message?.success($t('common.saveSuccess'))
    modalVisible.value = false
    await loadList()
  } catch (e: any) {
    window.$message?.error(e?.message ?? $t('common.error'))
  } finally {
    submitting.value = false
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function openRegister() {
  formModel.sn = ''
  formModel.device_template_id = ''
  formModel.product_id = ''
  formModel.voucher = ''
  modalVisible.value = true
}

function goDetail(row: Device) {
  router.push({ path: '/tm-device/detail', query: { id: row.id } })
}

function handleSearch() {
  page.value = 1
  loadList()
}

function handlePageChange(p: number) {
  page.value = p
  loadList()
}

// ─── Online status ────────────────────────────────────────────────────────────

type OnlineStatus = 'online' | 'offline' | 'unactivated'

function getOnlineStatus(row: Device): OnlineStatus {
  const activated = (row as any).activate_flag
  if (!activated || activated === 'inactive') return 'unactivated'
  const online = (row as any).is_online
  return online ? 'online' : 'offline'
}

function statusType(status: OnlineStatus) {
  if (status === 'online') return 'success'
  if (status === 'offline') return 'error'
  return 'default'
}

function statusLabel(status: OnlineStatus) {
  if (status === 'online') return $t('tmDevice.online')
  if (status === 'offline') return $t('tmDevice.offline')
  return $t('tmDevice.unactivated')
}

// ─── Table columns ────────────────────────────────────────────────────────────

const columns = computed<DataTableColumns<Device>>(() => [
  {
    title: $t('tmDevice.sn'),
    key: 'sn'
  },
  {
    title: $t('tmDevice.status'),
    key: 'status',
    render: row => {
      const s = getOnlineStatus(row)
      return h(NTag, { type: statusType(s), size: 'small' }, () => statusLabel(s))
    }
  },
  {
    title: $t('tmDevice.template'),
    key: 'device_template_id',
    render: row => templateNameMap.value[(row as any).device_template_id] ?? (row as any).device_template_id ?? '—'
  },
  {
    title: $t('tmDevice.product'),
    key: 'product_id',
    render: row => productNameMap.value[(row as any).product_id ?? ''] ?? '—'
  },
  {
    title: $t('tmDevice.activatedAt'),
    key: 'activated_at',
    render: row => (row as any).activated_at ?? '—'
  },
  {
    title: $t('tmDevice.lastOnlineAt'),
    key: 'last_online_at',
    render: row => (row as any).last_online_at ?? '—'
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    render: row =>
      h(NSpace, {}, () => [
        h(
          NButton,
          { size: 'small', onClick: () => goDetail(row) },
          () => $t('common.check')
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => handleDelete(row.id!) },
          {
            default: () => $t('tmDevice.deleteConfirm'),
            trigger: () => h(NButton, { size: 'small', type: 'error' }, () => $t('common.delete'))
          }
        )
      ])
  }
])

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  checkThingmodelAvailability().then(ok => { serviceAvailable.value = ok })
  loadTemplates()
  loadProducts()
  loadList()
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
    <NCard v-else :title="$t('tmDevice.list')">
      <template #header-extra>
        <NButton type="primary" @click="openRegister">{{ $t('tmDevice.register') }}</NButton>
      </template>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NInput
          v-model:value="searchSn"
          :placeholder="$t('tmDevice.searchSnPlaceholder')"
          clearable
          style="width: 220px"
          @keydown.enter="handleSearch"
        />
        <NSelect
          v-model:value="filterTemplateId"
          :options="templateOptions"
          clearable
          filterable
          :placeholder="$t('tmDevice.template')"
          style="width: 200px"
          @update:value="handleSearch"
        />
        <NButton @click="handleSearch">{{ $t('common.search') }}</NButton>
      </div>

      <NSpin :show="loading">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :row-key="(row: Device) => row.id!"
          :min-height="200"
          size="small"
        />
        <NEmpty v-if="!loading && tableData.length === 0" :description="$t('common.nodata')" class="my-8" />
        <div class="mt-4 flex items-center justify-between">
          <NText depth="3" class="text-sm">{{ $t('common.total') }}: {{ total }}</NText>
          <NPagination
            v-model:page="page"
            :page-count="Math.ceil(total / pageSize) || 1"
            :page-size="pageSize"
            @update:page="handlePageChange"
          />
        </div>
      </NSpin>

      <!-- Register Modal -->
      <NModal
        v-model:show="modalVisible"
        preset="card"
        :title="$t('tmDevice.register')"
        style="width: 520px"
        :mask-closable="false"
      >
        <NForm
          ref="formRef"
          :model="formModel"
          :rules="formRules"
          label-placement="left"
          label-width="100px"
        >
          <NFormItem :label="$t('tmDevice.sn')" path="sn">
            <NInput v-model:value="formModel.sn" />
          </NFormItem>

          <NFormItem :label="$t('tmDevice.template')" path="device_template_id">
            <NSelect
              v-model:value="formModel.device_template_id"
              :options="templateOptions"
              filterable
              @update:value="onTemplateChange"
            />
          </NFormItem>

          <NFormItem :label="$t('tmDevice.product')" path="product_id">
            <NSelect
              v-model:value="formModel.product_id"
              :options="filteredProductOptions"
              filterable
              clearable
            />
          </NFormItem>

          <NFormItem label="Voucher" path="voucher">
            <NInput v-model:value="formModel.voucher" />
          </NFormItem>
        </NForm>

        <template #footer>
          <NSpace justify="end">
            <NButton @click="modalVisible = false">{{ $t('common.cancel') }}</NButton>
            <NButton type="primary" :loading="submitting" @click="handleSubmit">
              {{ $t('common.confirm') }}
            </NButton>
          </NSpace>
        </template>
      </NModal>
    </NCard>
  </div>
</template>
