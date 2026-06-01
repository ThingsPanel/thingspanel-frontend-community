<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect,
  NModal,
  NForm,
  NFormItem,
  NSpace,
  NPopconfirm,
  NPagination
} from 'naive-ui'
import type { DataTableColumns, FormInst, SelectOption } from 'naive-ui'
import { $t } from '@/locales'
import { productApi } from '@/service/thingmodel/product'
import { deviceTemplateApi } from '@/service/thingmodel/device-template'
import type { Product, DeviceTemplate } from '@/service/thingmodel/types'

// ─── State ───────────────────────────────────────────────────────────────────

const tableData = ref<Product[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const searchText = ref('')

const templateOptions = ref<SelectOption[]>([])

// Modal
const modalVisible = ref(false)
const modalTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)
const editId = ref<string | null>(null)
const deleteError = ref('')

const formModel = reactive<{
  name: string
  device_template_id: string
  product_key: string
  sku: string
  description: string
}>({
  name: '',
  device_template_id: '',
  product_key: '',
  sku: '',
  description: ''
})

const formRules = {
  name: [{ required: true, message: $t('tmProduct.name'), trigger: 'blur' }],
  device_template_id: [{ required: true, message: $t('tmProduct.template'), trigger: 'change' }]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const templateNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const opt of templateOptions.value) {
    map[String(opt.value)] = String(opt.label)
  }
  return map
})

function resetForm() {
  formModel.name = ''
  formModel.device_template_id = ''
  formModel.product_key = ''
  formModel.sku = ''
  formModel.description = ''
  deleteError.value = ''
  editId.value = null
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

async function loadList() {
  loading.value = true
  try {
    const res = await productApi.list({ page: page.value, page_size: pageSize.value })
    tableData.value = res?.items ?? []
    total.value = res?.total ?? 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  deleteError.value = ''
  try {
    await productApi.delete(id)
    window.$message?.success($t('common.deleteSuccess'))
    await loadList()
  } catch (e: any) {
    // ApiError from client.ts has .code property
    const code = e?.code ?? ''
    if (code === 'PRODUCT_HAS_DEVICES') {
      const count = (e?.details as any)?.count ?? ''
      window.$message?.error($t('tmErrors.PRODUCT_HAS_DEVICES', { count }))
    } else {
      window.$message?.error(e?.message ?? $t('common.error'))
    }
  }
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    const body: Product = {
      name: formModel.name,
      device_template_id: formModel.device_template_id,
      product_key: formModel.product_key || undefined,
      sku: formModel.sku || undefined,
      description_i18n: formModel.description ? { default: formModel.description } : undefined
    }
    if (editId.value) {
      await productApi.update(editId.value, body)
    } else {
      await productApi.create(body)
    }
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

function openCreate() {
  resetForm()
  modalTitle.value = $t('tmProduct.create')
  modalVisible.value = true
}

async function openEdit(row: Product) {
  resetForm()
  editId.value = row.id ?? null
  modalTitle.value = $t('tmProduct.edit')
  formModel.name = row.name
  formModel.device_template_id = row.device_template_id
  formModel.product_key = row.product_key ?? ''
  formModel.sku = row.sku ?? ''
  formModel.description = row.description_i18n?.default ?? ''
  modalVisible.value = true
}

function handlePageChange(p: number) {
  page.value = p
  loadList()
}

// ─── Table columns ────────────────────────────────────────────────────────────

const columns = computed<DataTableColumns<Product>>(() => [
  {
    title: $t('tmProduct.name'),
    key: 'name'
  },
  {
    title: $t('tmProduct.productKey'),
    key: 'product_key',
    render: row => row.product_key ?? '—'
  },
  {
    title: $t('tmProduct.template'),
    key: 'device_template_id',
    render: row => templateNameMap.value[row.device_template_id] ?? row.device_template_id ?? '—'
  },
  {
    title: $t('tmProduct.sku'),
    key: 'sku',
    render: row => row.sku ?? '—'
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    render: row =>
      h(NSpace, {}, () => [
        h(
          NButton,
          { size: 'small', onClick: () => openEdit(row) },
          () => $t('common.edit')
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.id!)
          },
          {
            default: () => $t('tmProduct.deleteConfirm'),
            trigger: () =>
              h(NButton, { size: 'small', type: 'error' }, () => $t('common.delete'))
          }
        )
      ])
  }
])

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadTemplates()
  loadList()
})
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center justify-between gap-2">
      <NInput
        v-model:value="searchText"
        :placeholder="$t('tmProduct.searchPlaceholder')"
        clearable
        style="max-width: 280px"
      />
      <NButton type="primary" @click="openCreate">{{ $t('tmProduct.create') }}</NButton>
    </div>

    <NDataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :row-key="(row: Product) => row.id!"
      size="small"
    />

    <div class="mt-4 flex justify-end">
      <NPagination
        v-model:page="page"
        :page-count="Math.ceil(total / pageSize)"
        :page-size="pageSize"
        @update:page="handlePageChange"
      />
    </div>

    <!-- Create / Edit Modal -->
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="modalTitle"
      style="width: 520px"
      :mask-closable="false"
    >
      <NForm
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-placement="left"
        label-width="110px"
      >
        <NFormItem :label="$t('tmProduct.name')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItem>

        <NFormItem :label="$t('tmProduct.template')" path="device_template_id">
          <NSelect
            v-model:value="formModel.device_template_id"
            :options="templateOptions"
            filterable
            :placeholder="$t('tmProduct.template')"
          />
        </NFormItem>

        <NFormItem :label="$t('tmProduct.productKey')" path="product_key">
          <NInput
            v-model:value="formModel.product_key"
            :placeholder="$t('common.input') + $t('tmProduct.productKey')"
          />
        </NFormItem>

        <NFormItem :label="$t('tmProduct.sku')" path="sku">
          <NInput v-model:value="formModel.sku" />
        </NFormItem>

        <NFormItem :label="$t('tmProduct.description')" path="description">
          <NInput
            v-model:value="formModel.description"
            type="textarea"
            :rows="3"
          />
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
  </div>
</template>
