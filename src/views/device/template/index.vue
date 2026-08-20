<script setup lang="ts">
import { reactive, ref, computed, h, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  NButton,
  NInput,
  NIcon,
  NPagination,
  NDataTable,
  NTag,
  NSpace,
  NEmpty,
  NPopconfirm,
  NCard,
  NEllipsis,
  NDropdown
} from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { EllipsisHorizontal, ListOutline, GridOutline } from '@vicons/ionicons5'
import { deleteDeviceTemplate, deviceTemplate } from '@/service/api/device-template-model'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import TemplateModal from './components/template-modal.vue'
import { useBoolean, useLoading } from '~/packages/hooks/src'
// 导入SvgIcon组件，使用项目标准图标系统
import SvgIcon from '@/components/custom/svg-icon.vue'
import { getDemoServerUrl } from '@/utils/common/tool'

const route = useRoute()
const { startLoading, endLoading, loading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()
const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)

// 查询参数
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

// 数据
const deviceTemplateList = ref([] as any[])
const dataTotal = ref(0)
const modalType = ref<'add' | 'edit'>('add')
const templateId = ref<string>('')

// 获取数据
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

// 搜索处理
const handleQuery = async () => {
  queryParams.page = 1
  await getData()
}

// 重置搜索
const handleReset = async () => {
  queryParams.page = 1
  queryParams.name = ''
  await getData()
}

// 新建模板
const handleAddNew = () => {
  modalType.value = 'add'
  templateId.value = ''
  openModal()
}

// 编辑模板
const handleEdit = (id: string) => {
  modalType.value = 'edit'
  templateId.value = id
  openModal()
}

// 删除模板
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

const handleCardMenuSelect = (key: string, item: any) => {
  if (key !== 'delete') return

  window.$dialog?.warning({
    title: $t('common.deletePrompt'),
    content: `${$t('common.confirmDelete')} ${item.name}`,
    positiveText: $t('common.delete'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => handleRemove(item.id)
  })
}

const cardMenuOptions = [{ label: $t('common.delete'), key: 'delete' }]

// 表格列定义
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
    width: 220,
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
                onClick: () => handleEdit(row.id)
              },
              { default: () => $t('common.edit') }
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

// 分页处理
const handlePageChange = (page: number) => {
  queryParams.page = page
  getData()
}

// 分页大小处理
const handlePageSizeChange = (pageSize: number) => {
  queryParams.page_size = pageSize
  queryParams.page = 1
  getData()
}

// 刷新数据
const handleRefresh = () => {
  getData()
}

// 可用视图配置
const availableViews = [
  { key: 'card', icon: GridOutline, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]

// 处理标签数组
const getTagArray = (labelStr: string) => {
  if (!labelStr) return []
  return labelStr
    .split(',')
    .filter(Boolean)
    .map((tag) => tag.trim())
}

// 获取显示的标签（最多 4 个：≤4 全显示，>4 则 3 个 +N）
const getDisplayTags = (labelStr: string) => {
  const tags = getTagArray(labelStr)
  const maxVisible = 4

  if (tags.length <= maxVisible) {
    return {
      displayTags: tags,
      hasMore: false,
      moreCount: 0
    }
  }

  return {
    displayTags: tags.slice(0, maxVisible - 1),
    hasMore: true,
    moreCount: tags.length - (maxVisible - 1)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  getData()

  // 处理URL参数中的编辑请求
  const idParam = route.query?.id
  if (typeof idParam === 'string' && idParam) {
    setTimeout(() => {
      handleEdit(idParam)
    }, 0)
  }
})
</script>

<template>
  <div>
    <AdvancedListLayout
      :initial-view="'card'"
      :available-views="availableViews"
      :show-query-button="false"
      :show-reset-button="false"
      @add-new="handleAddNew"
      @refresh="handleRefresh"
    >
      <!-- 左侧操作按钮 -->
      <template #header-left>
        <div class="flex gap-2">
          <NButton type="primary" @click="handleAddNew">+ {{ $t('generate.add-device-function-template') }}</NButton>
        </div>
      </template>

      <!-- 搜索表单内容 -->
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

      <!-- 卡片视图 -->
      <template #card-view>
        <n-spin :show="loading">
          <div v-if="deviceTemplateList.length === 0 && !loading" class="empty-state">
            <NEmpty size="huge" :description="$t('common.nodata')" />
          </div>
          <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            <NCard
              v-for="item in deviceTemplateList"
              :key="item.id"
              hoverable
              class="template-card"
              :content-style="{ padding: '0' }"
              @click="handleEdit(item.id)"
            >
              <div class="card-body">
                <div class="card-header">
                  <div class="card-name">
                    <NEllipsis :line-clamp="1">{{ item.name }}</NEllipsis>
                  </div>
                  <NDropdown
                    :options="cardMenuOptions"
                    trigger="click"
                    placement="bottom-end"
                    @select="(key) => handleCardMenuSelect(key, item)"
                  >
                    <NButton quaternary circle size="small" @click.stop>
                      <template #icon>
                        <NIcon><EllipsisHorizontal /></NIcon>
                      </template>
                    </NButton>
                  </NDropdown>
                </div>

                <div class="card-desc">
                  <NEllipsis :line-clamp="2">{{ item.description || '--' }}</NEllipsis>
                </div>

                <div class="card-meta">
                  <div class="card-icon">
                    <img v-if="item.path" :src="getPath(item.path)" alt="" class="template-image" />
                    <SvgIcon v-else local-icon="default-template" class="template-image svg-icon" />
                  </div>

                  <div v-if="item.label" class="tags-row">
                    <NTag
                      v-for="tag in getDisplayTags(item.label).displayTags"
                      :key="tag"
                      size="small"
                      :bordered="false"
                      class="tag-item"
                    >
                      {{ tag }}
                    </NTag>
                    <NTag v-if="getDisplayTags(item.label).hasMore" size="small" :bordered="false" class="more-tag">
                      +{{ getDisplayTags(item.label).moreCount }}
                    </NTag>
                  </div>
                  <span v-else class="no-tags">--</span>
                </div>
              </div>
            </NCard>
          </div>
        </n-spin>
      </template>

      <!-- 列表视图 -->
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

      <!-- 底部分页 -->
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

    <!-- 模板弹窗 -->
    <TemplateModal v-model:visible="visible" :type="modalType" :template-id="templateId" :get-table-data="getData" />
  </div>
</template>

<style scoped lang="scss">
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
  min-height: 148px;
}

.card-name {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a2e;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-desc {
  flex: 1;
  min-height: 36px;
  font-size: 12px;
  line-height: 1.5;
  color: #888;
}

.card-meta {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: auto;
  padding-top: 4px;
}

.card-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f1f5f9;
}

.template-image {
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.svg-icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
}

.tags-row {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
}

.tag-item {
  margin: 0;

  :deep(.n-tag) {
    border-radius: 6px;
    background: #f8f9fc;
    color: #5b6478;
    border: 1px solid #eef0f4;
    font-size: 12px;
  }
}

.more-tag {
  margin: 0;

  :deep(.n-tag) {
    border-radius: 10px;
    background: #ede9fe;
    color: #4f46e5;
    font-weight: 600;
    font-size: 11px;
  }
}

.no-tags {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
  line-height: 36px;
}
</style>
