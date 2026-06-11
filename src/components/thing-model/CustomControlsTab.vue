<script setup lang="tsx">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NPopconfirm,
  NSwitch,
  NSpace,
  NTag,
  NSpin
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { $t } from '@/locales'
import { customControlApi, type CustomControl } from '@/service/thingmodel/custom-control'

const props = defineProps<{
  thingModelId: string
  readonly?: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)

const state = reactive({
  list: [] as CustomControl[],
  total: 0,
  page: 1,
  pageSize: 20
})

const emptyForm = (): CustomControl => ({
  thing_model_id: props.thingModelId,
  name: '',
  description: '',
  content: '{}',
  enable_status: 'enable',
  control_type: 'telemetry'
})

const form = ref<CustomControl>(emptyForm())

const isEdit = computed(() => !!form.value.id)

function isValidJson(str: string) {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

const jsonStatus = computed(() => {
  if (!form.value.content) return undefined
  return isValidJson(form.value.content) ? undefined : 'error'
})

const jsonFeedback = computed(() => {
  if (form.value.content && !isValidJson(form.value.content)) {
    return $t('generate.inputRightJson')
  }
  return ''
})

async function fetchList(page = state.page) {
  loading.value = true
  try {
    const res = await customControlApi.list(props.thingModelId, page, state.pageSize)
    const data = (res as any).data as any
    state.list = data?.items || data?.list || []
    state.total = data?.total || 0
    state.page = page
  } catch (e: any) {
    // silently ignore if endpoint not yet implemented on backend
    if (e?.code !== 'not_found' && e?.message !== 'endpoint not found') {
      window.$message?.error($t('common.loadFailure'))
    }
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(row: CustomControl) {
  form.value = { ...row }
  showModal.value = true
}

async function handleDelete(id: string) {
  try {
    await customControlApi.delete(id)
    window.$message?.success($t('common.deleteSuccess'))
    fetchList()
  } catch {
    window.$message?.error($t('common.error'))
  }
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    window.$message?.error(`${$t('thingModel.customControl.name')} ${$t('common.error')}`)
    return
  }
  if (!isValidJson(form.value.content)) {
    window.$message?.error($t('generate.inputRightJson'))
    return
  }

  saving.value = true
  try {
    const payload = { ...form.value, thing_model_id: props.thingModelId }
    if (isEdit.value) {
      await customControlApi.update(payload)
    } else {
      await customControlApi.create(payload)
    }
    window.$message?.success($t('common.editSuccess'))
    showModal.value = false
    fetchList()
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    saving.value = false
  }
}

const columns: DataTableColumns<CustomControl> = [
  { key: 'name', title: $t('thingModel.customControl.name'), minWidth: 120 },
  { key: 'content', title: $t('thingModel.customControl.content'), minWidth: 160, ellipsis: { tooltip: true } },
  {
    key: 'enable_status',
    title: $t('thingModel.customControl.enableStatus'),
    width: 100,
    render: (row) => row.enable_status === 'enable'
      ? <NTag type="success">{$t('page.manage.common.status.enable')}</NTag>
      : <NTag type="warning">{$t('page.manage.common.status.disable')}</NTag>
  },
  { key: 'description', title: $t('thingModel.customControl.description'), minWidth: 120, ellipsis: { tooltip: true } },
  {
    key: 'actions',
    title: $t('page.product.list.operate'),
    width: 160,
    align: 'center',
    render: (row) => (
      <NSpace justify="center" size="small">
        <NButton
          size="small"
          type="primary"
          disabled={props.readonly}
          onClick={() => openEdit(row)}
        >
          {$t('common.edit')}
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row.id!)}>
          {{
            default: () => $t('thingModel.customControl.deleteConfirm'),
            trigger: () => (
              <NButton size="small" type="error" disabled={props.readonly}>
                {$t('common.delete')}
              </NButton>
            )
          }}
        </NPopconfirm>
      </NSpace>
    )
  }
]

onMounted(() => fetchList())
</script>

<template>
  <div class="p-2">
    <div class="flex justify-between items-center mb-4">
      <span class="text-sm text-gray-500">{{ $t('thingModel.tabCustomControls') }}</span>
      <NButton type="primary" :disabled="readonly" @click="openAdd">
        {{ $t('thingModel.customControl.add') }}
      </NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable :columns="columns" :data="state.list" :bordered="false" />
    </NSpin>

    <div class="flex justify-end mt-2">
      <NPagination
        :item-count="state.total"
        :page="state.page"
        :page-size="state.pageSize"
        @update:page="fetchList"
      />
    </div>

    <NModal
      v-model:show="showModal"
      preset="card"
      :title="isEdit ? $t('thingModel.customControl.edit') : $t('thingModel.customControl.add')"
      style="width: 520px"
    >
      <NForm label-placement="left" label-width="110px" :model="form">
        <NFormItem :label="$t('thingModel.customControl.name')" required>
          <NInput v-model:value="form.name" :placeholder="$t('thingModel.customControl.name')" />
        </NFormItem>
        <NFormItem
          :label="$t('thingModel.customControl.content')"
          required
          :validation-status="jsonStatus"
          :feedback="jsonFeedback"
        >
          <NInput
            v-model:value="form.content"
            type="textarea"
            :rows="5"
            placeholder="{}"
            style="font-family: monospace"
          />
        </NFormItem>
        <NFormItem :label="$t('thingModel.customControl.enableStatus')">
          <NSwitch
            v-model:value="form.enable_status"
            checked-value="enable"
            unchecked-value="disable"
          />
        </NFormItem>
        <NFormItem :label="$t('thingModel.customControl.description')">
          <NInput v-model:value="form.description" type="textarea" :rows="2" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">{{ $t('common._cancel') }}</NButton>
          <NButton type="primary" :loading="saving" @click="handleSubmit">
            {{ $t('common._confirm') }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
