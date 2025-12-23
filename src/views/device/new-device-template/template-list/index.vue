<script setup lang="ts">
import { reactive, ref, computed, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NIcon,
  NPagination,
  NDataTable,
  NTag,
  NSpace,
  NEmpty,
  NGrid,
  NGi,
  NPopconfirm
} from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { ListOutline, GridOutline } from '@vicons/ionicons5'
import { deleteDeviceTemplate, deviceTemplate } from '@/service/api/device-template-model'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import ItemCard from '@/components/dev-card-item/index.vue'
import { useBoolean, useLoading } from '~/packages/hooks/src'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { getDemoServerUrl } from '@/utils/common/tool'

const route = useRoute()
const router = useRouter()
const { startLoading, endLoading, loading } = useLoading(false)
const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)

const queryParams = reactive({
  page: 1,
  page_size: 10,
  name: ''
})

const getPath = (path: string) => {
  if (!path) return ''
  const relativePath = path.replace(/^\.\//, '')
  return `${url.value.replace('api/v1', '') + relativePath}`
}

const deviceTemplateList = ref([] as any[])
const dataTotal = ref(0)

const getData = async () => {
  startLoading()
  try {
    const res = await deviceTemplate({ page: queryParams.page, ...queryParams })
    if (!res.error) {
      deviceTemplateList.value = res.data.list
      dataTotal.value = res.data.total
    }
  } catch (error) {
    console.error('Failed to fetch device template data:', error)
    window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    endLoading()
  }
}

const handleQuery = async () => {
  queryParams.page = 1
  await getData()
}

const handleReset = async () => {
  queryParams.page = 1
  queryParams.name = ''
  await getData()
}

const handleAddNew = () => {
  router.push({
    name: 'device_new-device-template_template-details_editor'
  })
}

const handlePreview = (id: string) => {
  router.push({
    name: 'device_new-device-template_template-details_viewer',
    query: { id }
  })
}

const handleRemove = async (id: string) => {
  try {
    const { error } = await deleteDeviceTemplate(id)
    if (!error) {
      window.$message?.success($t('common.templateDeleted'))
      await getData()
    }
  } catch (error) {
    console.error('Failed to delete template:', error)
    window.$message?.error($t('common.deleteFailed'))
  }
}

const columns = computed(() => [
  {
    title: $t('route.device_template'),
    key: 'name',
    ellipsis: {
      tooltip: true
    },
    sorter: true
  },
  {
    title: $t('generate.description'),
    key: 'description',
    ellipsis: {
      tooltip: true
    },
    render: (row: any) => row.description || '--'
  },
  {
    title: $t('generate.labels'),
    key: 'label',
    width: 200,
    render: (row: any) => {
      if (!row.label) return '--'
      const tags = row.label.split(',').filter(Boolean)
      return h(
        NSpace,
        { size: 'small', wrap: true },
        {
          default: () =>
            tags
              .slice(0, 2)
              .map((tag: string) => h(NTag, { size: 'small', key: tag }, { default: () => tag.trim() }))
              .concat(
                tags.length > 2
                  ? [h(NTag, { size: 'small', type: 'info' }, { default: () => `+${tags.length - 2}` })]
                  : []
              )
        }
      )
    }
  },
  {
    title: $t('common.creationTime'),
    key: 'created_at',
    width: 160,
    sorter: true,
    render: (row: any) => {
      return row.created_at ? new Date(row.created_at).toLocaleDateString() : '--'
    }
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 200,
    render: (row: any) => {
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handlePreview(row.id)
              },
              { default: () => $t('common.view') }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleRemove(row.id)
              },
              {
                default: () => $t('common.confirmDelete'),
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error'
                    },
                    { default: () => $t('common.delete') }
                  )
              }
            )
          ]
        }
      )
    }
  }
])

const handlePageChange = (page: number) => {
  queryParams.page = page
  getData()
}

const handlePageSizeChange = (pageSize: number) => {
  queryParams.page_size = pageSize
  queryParams.page = 1
  getData()
}

const handleRefresh = () => {
  getData()
}

const availableViews = [
  { key: 'card', icon: GridOutline, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]

const getTagArray = (labelStr: string) => {
  if (!labelStr) return []
  return labelStr
    .split(',')
    .filter(Boolean)
    .map(tag => tag.trim())
}

const getDisplayTags = (labelStr: string) => {
  const tags = getTagArray(labelStr)
  return {
    displayTags: tags.slice(0, 3),
    hasMore: tags.length > 3,
    moreCount: tags.length - 3
  }
}

onMounted(() => {
  getData()
})
</script>

<template>
  <AdvancedListLayout
    :initial-view="'card'"
    :available-views="availableViews"
    :show-query-button="false"
    :show-reset-button="false"
    @add-new="handleAddNew"
    @refresh="handleRefresh"
  >
    <template #header-left>
      <div class="flex gap-2">
        <NButton type="primary" @click="handleAddNew">+ {{ $t('generate.add-device-function-template') }}</NButton>
      </div>
    </template>

    <template #search-form-content>
      <div class="flex gap-4 items-center">
        <NInput
          v-model:value="queryParams.name"
          :placeholder="$t('generate.enter-template-name')"
          type="text"
          clearable
          style="width: 240px"
          @clear="handleReset"
          @keydown.enter="handleQuery"
        >
          <template #prefix>
            <NIcon>
              <IosSearch />
            </NIcon>
          </template>
        </NInput>
        <NButton type="primary" @click="handleQuery">
          {{ $t('common.search') }}
        </NButton>
      </div>
    </template>

    <template #card-view>
      <n-spin :show="loading">
        <div v-if="deviceTemplateList.length === 0 && !loading" class="empty-state">
          <NEmpty size="huge" :description="$t('common.nodata')" />
        </div>
        <div v-else>
          <NGrid cols="1 s:2 m:3 l:4 xl:5 2xl:6" x-gap="20" y-gap="20" responsive="screen">
            <NGi v-for="item in deviceTemplateList" :key="item.id">
              <ItemCard
                :isStatus="false"
                :title="item.name"
                :subtitle="item.description || '--'"
                @click-card="handlePreview(item.id)"
              >
                <template #footer>
                  <div class="card-footer-content">
                    <div class="tags-section">
                      <div class="tags-container">
                        <template v-if="item.label">
                          <NTag
                            v-for="tag in getDisplayTags(item.label).displayTags"
                            :key="tag"
                            size="small"
                            class="tag-item"
                          >
                            {{ tag }}
                          </NTag>
                          <NTag v-if="getDisplayTags(item.label).hasMore" size="small" type="info" class="more-tag">
                            +{{ getDisplayTags(item.label).moreCount }}
                          </NTag>
                        </template>
                        <span v-else class="no-tags">--</span>
                      </div>
                    </div>
                  </div>
                </template>

                <template #footer-icon>
                  <div class="footer-icon-container">
                    <img v-if="item.path" :src="getPath(item.path)" alt="device type icon" class="template-image" />
                    <SvgIcon v-else local-icon="default-template" class="template-image" />
                  </div>
                </template>
              </ItemCard>
            </NGi>
          </NGrid>
        </div>
      </n-spin>
    </template>

    <template #list-view>
      <NDataTable
        :columns="columns"
        :data="deviceTemplateList"
        :loading="loading"
        size="small"
        :pagination="false"
        :bordered="false"
        :single-line="false"
        striped
      />
    </template>

    <template #footer>
      <NPagination
        v-model:page="queryParams.page"
        :page-size="queryParams.page_size"
        :item-count="dataTotal"
        show-size-picker
        :page-sizes="[10, 20, 50, 100]"
        show-quick-jumper
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </template>
  </AdvancedListLayout>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.card-footer-content {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.tags-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  min-height: 20px;
}

.tag-item,
.more-tag {
  margin: 0;
  font-size: 12px;
}

.no-tags {
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
}

.footer-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
}

.template-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.template-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.footer-template-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 4px;
}

@media (max-width: 640px) {
  .tag-item,
  .more-tag {
    font-size: 11px;
  }

  .no-tags {
    font-size: 12px;
  }
}

@media (min-width: 1920px) {
  :deep(.n-grid) {
    gap: 24px;
  }
}
</style>
