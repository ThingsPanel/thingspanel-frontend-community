<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NTabs,
  NTabPane,
  NTag,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NCard,
  NSpin,
  NAlert,
  NPopconfirm,
  NModal,
  NDivider,
  NDataTable
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { thingModelApi } from '@/service/thingmodel/thing-model'
import type { ThingModel } from '@/service/thingmodel/types'
import { $t } from '@/locales'
import ItemList from '@/components/thing-model/ItemList.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const loading = ref(false)
const saving = ref(false)
const acting = ref(false)
const activeTab = ref('basic')

const model = ref<ThingModel>({
  name: '',
  description_i18n: { default: '' }
})

const editName = ref('')
const editDesc = ref('')
const versions = ref<any[]>([])
const versionsLoading = ref(false)

// Publish changelog modal
const showPublish = ref(false)
const changelog = ref('')

function buildDescriptionI18n(value: string) {
  const description = value.trim()
  return description ? { default: description } : undefined
}

function statusType(status?: string): 'default' | 'success' | 'warning' {
  switch (status) {
    case 'PUBLISHED': return 'success'
    case 'ARCHIVED': return 'warning'
    default: return 'default'
  }
}

async function fetchModel() {
  if (!id.value) return
  loading.value = true
  try {
    const res = await thingModelApi.get(id.value)
    if (res.data) {
      model.value = res.data
      editName.value = res.data.name
      editDesc.value = res.data.description_i18n?.default || ''
    }
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    loading.value = false
  }
}

async function fetchVersions() {
  if (!id.value) return
  versionsLoading.value = true
  try {
    const res = await thingModelApi.versions(id.value)
    versions.value = Array.isArray(res.data) ? res.data : (res.data as any).items || res.items || []
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    versionsLoading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await thingModelApi.update(id.value, {
      ...model.value,
      name: editName.value,
      description_i18n: buildDescriptionI18n(editDesc.value)
    })
    window.$message?.success($t('common.editSuccess'))
    await fetchModel()
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  acting.value = true
  try {
    await thingModelApi.publish(id.value, { changelog: changelog.value || undefined })
    window.$message?.success($t('thingModel.publish'))
    showPublish.value = false
    changelog.value = ''
    await fetchModel()
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    acting.value = false
  }
}

async function handleArchive() {
  acting.value = true
  try {
    await thingModelApi.archive(id.value)
    window.$message?.success($t('thingModel.archive'))
    await fetchModel()
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    acting.value = false
  }
}

async function handleDeriveDraft() {
  acting.value = true
  try {
    const res = await thingModelApi.deriveDraft(id.value)
    window.$message?.success($t('thingModel.deriveDraft'))
    if (res.data?.id) {
      router.push({ path: '/thing-model/detail', query: { id: res.data.id } })
    }
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    acting.value = false
  }
}

async function handleDelete() {
  acting.value = true
  try {
    await thingModelApi.delete(id.value)
    window.$message?.success($t('common._delete'))
    router.push({ path: '/thing-model' })
  } catch {
    window.$message?.error($t('common.error'))
  } finally {
    acting.value = false
  }
}

function onTabChange(tab: string) {
  if (tab === 'versions' && versions.value.length === 0) {
    fetchVersions()
  }
}

const versionColumns: DataTableColumns<any> = [
  {
    title: $t('thingModel.version'),
    key: 'version',
    render: (row) => row.version ?? '--'
  },
  {
    title: $t('thingModel.changelog'),
    key: 'changelog',
    render: (row) => row.changelog || '--'
  },
  {
    title: $t('thingModel.createdAt'),
    key: 'created_at',
    render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString() : '--')
  }
]

onMounted(() => {
  fetchModel()
})
</script>

<template>
  <div class="p-4">
    <NSpin :show="loading">
      <NCard>
        <template #header>
          <NSpace align="center">
            <NButton text @click="router.push({ path: '/thing-model' })">← {{ $t('thingModel.list') }}</NButton>
            <NDivider vertical />
            <span class="font-semibold text-lg">{{ model.name || '--' }}</span>
            <NTag :type="statusType(model.status)" size="small">
              {{ $t(`thingModel.status.${model.status || 'DRAFT'}`) }}
            </NTag>
          </NSpace>
        </template>

        <template #header-extra>
          <NSpace>
            <!-- DRAFT actions -->
            <template v-if="model.status === 'DRAFT' || !model.status">
              <NButton type="primary" :loading="acting" @click="showPublish = true">
                {{ $t('thingModel.publish') }}
              </NButton>
              <NPopconfirm @positive-click="handleDelete">
                <template #trigger>
                  <NButton type="error" :loading="acting">{{ $t('common._delete') }}</NButton>
                </template>
                {{ $t('thingModel.deleteConfirm') }}
              </NPopconfirm>
            </template>
            <!-- PUBLISHED actions -->
            <template v-else-if="model.status === 'PUBLISHED'">
              <NButton :loading="acting" @click="handleDeriveDraft">{{ $t('thingModel.deriveDraft') }}</NButton>
              <NPopconfirm @positive-click="handleArchive">
                <template #trigger>
                  <NButton type="warning" :loading="acting">{{ $t('thingModel.archive') }}</NButton>
                </template>
                {{ $t('thingModel.archiveConfirm') }}
              </NPopconfirm>
            </template>
          </NSpace>
        </template>

        <NAlert
          v-if="model.status === 'PUBLISHED' || model.status === 'ARCHIVED'"
          :type="model.status === 'ARCHIVED' ? 'warning' : 'info'"
          class="mb-4"
        >
          {{ $t('thingModel.immutableWarning') }}
        </NAlert>

        <NTabs v-model:value="activeTab" type="line" animated @update:value="onTabChange">
          <!-- Basic Info -->
          <NTabPane name="basic" :tab="$t('thingModel.tabBasic')">
            <NForm label-placement="left" label-width="100px" class="max-w-lg mt-4">
              <NFormItem :label="$t('thingModel.name')">
                <NInput
                  v-model:value="editName"
                  :disabled="model.status === 'PUBLISHED' || model.status === 'ARCHIVED'"
                />
              </NFormItem>
              <NFormItem :label="$t('thingModel.description')">
                <NInput
                  v-model:value="editDesc"
                  type="textarea"
                  :rows="3"
                  :disabled="model.status === 'PUBLISHED' || model.status === 'ARCHIVED'"
                />
              </NFormItem>
              <NFormItem :label="$t('thingModel.category')">
                <span>{{ model.category || '--' }}</span>
              </NFormItem>
              <NFormItem v-if="model.status === 'DRAFT' || !model.status">
                <NButton type="primary" :loading="saving" @click="handleSave">
                  {{ $t('thingModel.saveDraft') }}
                </NButton>
              </NFormItem>
            </NForm>
          </NTabPane>

          <!-- Fields -->
          <NTabPane name="fields" :tab="$t('thingModel.tabFields')">
            <ItemList v-if="id" :thing-model-id="id" :status="model.status || 'DRAFT'" />
          </NTabPane>

          <!-- Versions -->
          <NTabPane name="versions" :tab="$t('thingModel.tabVersions')">
            <NSpin :show="versionsLoading">
              <NDataTable :columns="versionColumns" :data="versions" :bordered="false" />
            </NSpin>
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpin>

    <!-- Publish Modal -->
    <NModal v-model:show="showPublish" preset="card" :title="$t('thingModel.publish')" style="width: 440px">
      <NForm label-placement="left" label-width="90px">
        <NFormItem :label="$t('thingModel.changelog')">
          <NInput
            v-model:value="changelog"
            type="textarea"
            :rows="3"
            :placeholder="$t('thingModel.changelog')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPublish = false">{{ $t('common._cancel') }}</NButton>
          <NButton type="primary" :loading="acting" @click="handlePublish">{{ $t('common._confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>
