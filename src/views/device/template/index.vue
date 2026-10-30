<script setup lang="ts">
import { computed, h, onActivated, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NEllipsis,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NPagination,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui'
import ModelModal from './components/ModelModal.vue'
import { IosSearch } from '@vicons/ionicons4'
import { GridOutline, ListOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import CardGrid from '@/components/card-grid/index.vue'
import {
  createOperationKey,
  thingModelNative,
  ThingModelNativeError,
  type ModelSummary,
  type NativeModelProfile
} from '@/service/api/thingmodel-native'
import NativeModelProfileForm from '@/views/device/template/components/NativeModelProfile.vue'
import { EMPTY_NATIVE_RESOURCES, normalizeNativeProfile } from '@/views/device/template/native-model-resources'

const router = useRouter()
const loading = ref(false)
const creating = ref(false)
const createVisible = ref(false)
const rows = ref<ModelSummary[]>([])
const total = ref(0)
const deleting = ref<string[]>([])
const deleteOperations = new Map<string, { revision: number; key: string }>()
const query = reactive({ page: 1, pageSize: 10, name: '' })
const form = reactive({ name: '', description: '', category: '' })
const profile = ref<NativeModelProfile>({ ...EMPTY_NATIVE_RESOURCES.profile, tags: [] })
let pendingCreate: { fingerprint: string; key: string } | null = null
let listSequence = 0
const availableViews = [
  { key: 'card', icon: GridOutline, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]

const load = async () => {
  const sequence = ++listSequence
  loading.value = true
  try {
    const result = await thingModelNative.list({
      page: query.page,
      pageSize: query.pageSize,
      query: query.name || undefined
    })
    if (sequence !== listSequence) return
    rows.value = result.items
    total.value = result.total
  } catch (error) {
    console.error('Failed to load native thing models:', error)
    if (sequence === listSequence) window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    if (sequence === listSequence) loading.value = false
  }
}
const edit = (id: string) => router.push({ path: '/device/thingsmodel/detail', query: { id } })
const search = () => {
  query.page = 1
  void load()
}
const reset = () => {
  query.page = 1
  query.name = ''
  void load()
}
const openCreate = () => {
  form.name = ''
  form.description = ''
  form.category = ''
  profile.value = { ...EMPTY_NATIVE_RESOURCES.profile, tags: [] }
  pendingCreate = null
  createVisible.value = true
}
const create = async () => {
  if (!form.name.trim() || creating.value) return
  const request = {
    model: {
      name: form.name.trim(),
      descriptionI18n: form.description.trim() ? { default: form.description.trim() } : undefined,
      category: form.category.trim() || undefined,
      fields: [] as never[]
    },
    resources: {
      ...EMPTY_NATIVE_RESOURCES,
      profile: normalizeNativeProfile(profile.value),
      webChartConfig: null,
      appChartConfig: null
    }
  }
  const requestFingerprint = JSON.stringify(request)
  if (!pendingCreate || pendingCreate.fingerprint !== requestFingerprint)
    pendingCreate = { fingerprint: requestFingerprint, key: createOperationKey() }
  creating.value = true
  try {
    const result = await thingModelNative.create(request, pendingCreate.key)
    pendingCreate = null
    createVisible.value = false
    window.$message?.success($t('common.saveSuccess'))
    await edit(result.modelID)
  } catch (error) {
    console.error('Failed to create native thing model:', error)
    window.$message?.error(error instanceof Error ? error.message : $t('common.saveFailed'))
  } finally {
    creating.value = false
  }
}

const deleteConfirmation = (model: ModelSummary) => `确认删除“${model.name}”？已绑定设备继续使用已发布版本。`
const remove = async (model: ModelSummary) => {
  if (deleting.value.includes(model.modelID)) return
  let operation = deleteOperations.get(model.modelID)
  if (!operation || operation.revision !== model.draftRevision) {
    operation = { revision: model.draftRevision, key: createOperationKey() }
    deleteOperations.set(model.modelID, operation)
  }
  deleting.value.push(model.modelID)
  try {
    const result = await thingModelNative.delete(
      { modelID: model.modelID, expectedDraftRevision: model.draftRevision },
      operation.key
    )
    if (result.status !== 'DELETED') throw new Error('删除未完成，请刷新后重试。')
    deleteOperations.delete(model.modelID)
    window.$message?.success('物模型已删除')
    if (rows.value.length === 1 && query.page > 1) query.page -= 1
    await load()
  } catch (error) {
    console.error('删除物模型失败:', error)
    const conflict = error instanceof ThingModelNativeError && error.status === 409
    window.$message?.error(conflict ? '物模型已被修改，请刷新列表后重新删除。' : '删除失败，请稍后重试。')
    if (conflict) await load()
  } finally {
    deleting.value = deleting.value.filter(id => id !== model.modelID)
  }
}

const lifecycleLabel = (model: ModelSummary) =>
  model.lifecycle === 'ARCHIVED' ? '已归档' : model.publishedRevision ? `已发布 v${model.publishedRevision}` : '未发布'
const statusType = (model: ModelSummary) =>
  model.lifecycle === 'ARCHIVED' ? 'default' : model.publishedRevision ? 'success' : 'warning'
const columns = computed(() => [
  { title: '物模型名称', key: 'name', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'lifecycle',
    render: (row: ModelSummary) =>
      h(NTag, { size: 'small', type: statusType(row) }, { default: () => lifecycleLabel(row) })
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    render: (row: ModelSummary) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '--')
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: ModelSummary) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              { size: 'small', type: 'primary', onClick: () => edit(row.modelID) },
              { default: () => $t('common.edit') }
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => remove(row) },
              {
                default: () => deleteConfirmation(row),
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', type: 'error', loading: deleting.value.includes(row.modelID) },
                    { default: () => $t('common.delete') }
                  )
              }
            )
          ]
        }
      )
  }
])
onMounted(() => void load())
let hasActivated = false
onActivated(() => {
  if (hasActivated) void load()
  hasActivated = true
})
</script>

<template>
  <div class="template-page">
    <AdvancedListLayout
      :initial-view="'card'"
      :available-views="availableViews"
      :inline-header="true"
      :stacked-header="true"
      :show-query-button="false"
      :show-reset-button="false"
      @add-new="openCreate"
    >
      <template #header-title>
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold">物模型</h2>
          <span class="text-gray-400">{{ total }} 个物模型</span>
        </div>
      </template>
      <template #search-form-content>
        <div class="device-filter-toolbar">
          <NButton type="primary" @click="openCreate">新建物模型</NButton>
          <div class="device-filter-field">
            <NInput
              v-model:value="query.name"
              placeholder="搜索物模型名称"
              :input-props="{ 'aria-label': '搜索物模型名称' }"
              clearable
              @clear="reset"
              @keydown.enter="search"
            >
              <template #prefix>
                <NIcon :size="16"><IosSearch /></NIcon>
              </template>
            </NInput>
          </div>
          <div class="device-filter-actions">
            <NButton type="primary" @click="search">{{ $t('common.search') }}</NButton>
            <NButton quaternary @click="reset">{{ $t('generate.reset') }}</NButton>
          </div>
        </div>
      </template>
      <template #card-view>
        <NSpin :show="loading">
          <div v-if="rows.length === 0 && !loading" class="empty-state">
            <NEmpty size="huge" :description="$t('common.nodata')" />
          </div>
          <CardGrid v-else>
            <NCard
              v-for="item in rows"
              :key="item.modelID"
              hoverable
              class="template-card"
              :content-style="{ padding: '0' }"
              @click="edit(item.modelID)"
            >
              <div class="card-body">
                <div class="card-header">
                  <div class="card-name">
                    <NEllipsis :line-clamp="1">{{ item.name }}</NEllipsis>
                  </div>
                  <NSpace @click.stop>
                    <NButton size="small" type="primary" @click="edit(item.modelID)">{{ $t('common.edit') }}</NButton>
                    <NPopconfirm @positive-click="remove(item)">
                      {{ deleteConfirmation(item) }}
                      <template #trigger>
                        <NButton size="small" type="error" :loading="deleting.includes(item.modelID)">
                          {{ $t('common.delete') }}
                        </NButton>
                      </template>
                    </NPopconfirm>
                  </NSpace>
                </div>
                <div class="card-desc">
                  更新于 {{ item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '--' }}
                </div>
                <div class="card-meta">
                  <NTag size="small" :type="statusType(item)" :bordered="false" class="tag-item">
                    {{ lifecycleLabel(item) }}
                  </NTag>
                </div>
              </div>
            </NCard>
          </CardGrid>
        </NSpin>
      </template>
      <template #list-view>
        <NDataTable
          :columns="columns"
          :data="rows"
          :loading="loading"
          :pagination="false"
          :row-key="(row: ModelSummary) => row.modelID"
        />
      </template>
      <template #footer>
        <NPagination
          v-model:page="query.page"
          :page-size="query.pageSize"
          :item-count="total"
          show-size-picker
          :page-sizes="[10, 20, 50, 100]"
          show-quick-jumper
          @update:page="load"
          @update:page-size="
            size => {
              query.pageSize = size
              query.page = 1
              load()
            }
          "
        />
      </template>
    </AdvancedListLayout>
    <ModelModal v-model:show="createVisible" title="新建物模型" class="template-create-modal" :busy="creating">
      <NForm :model="form" label-placement="top" :disabled="creating" class="template-create-form">
        <NFormItem label="名称" required>
          <NInput
            v-model:value="form.name"
            placeholder="请输入物模型名称"
            maxlength="120"
            :input-props="{ 'aria-label': '名称' }"
          />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="form.description"
            type="textarea"
            placeholder="请输入物模型描述"
            :autosize="{ minRows: 3, maxRows: 5 }"
            :input-props="{ 'aria-label': '描述' }"
          />
        </NFormItem>
        <NFormItem label="分类">
          <NInput v-model:value="form.category" placeholder="请输入分类" :input-props="{ 'aria-label': '分类' }" />
        </NFormItem>
        <NativeModelProfileForm v-model="profile" :disabled="creating" />
      </NForm>
      <template #footer>
        <NButton :disabled="creating" @click="createVisible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="creating" :disabled="!form.name.trim()" @click="create">
          {{ $t('common.save') }}
        </NButton>
      </template>
    </ModelModal>
  </div>
</template>

<style scoped lang="scss">
.template-page {
  height: 100%;
  min-height: 0;
}

.device-filter-toolbar {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  > .n-button {
    flex-shrink: 0;
  }

  :deep(.n-input) {
    min-height: 36px;
    border-radius: 8px;
    background: var(--card-color);
  }

  :deep(.n-button) {
    height: 36px;
    padding: 0 12px;
    border-radius: 8px;
  }
}

.device-filter-field {
  flex: 0 1 220px;
  min-width: 160px;
  margin-left: auto;
}

.device-filter-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.template-create-form {
  :deep(.n-input) {
    min-height: 36px;
    border-radius: 8px;
  }

  :deep(.n-form-item-label) {
    padding-bottom: 8px;
  }

  :deep(.n-button) {
    border-radius: 8px;
  }
}

.template-create-actions :deep(.n-button) {
  height: 36px;
  min-width: 72px;
  border-radius: 8px;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.template-card {
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid #e8ebf0;
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 16px;
  min-height: 130px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
}
.card-desc {
  flex: 1;
  min-height: 32px;
  font-size: 12px;
  color: #888;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}
@media (max-width: 768px) {
  .template-page :deep(.full-height-card > .n-card__content) {
    padding: 12px;
  }

  .template-page :deep(.list-content-header--stacked) {
    padding-bottom: 12px;
  }

  .device-filter-field {
    flex: 1 1 100%;
    min-width: 0;
    margin-left: 0;
  }

  .device-filter-actions {
    width: 100%;
    gap: 8px;

    :deep(.n-button) {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
