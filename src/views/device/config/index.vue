<script lang="tsx" setup>
import { onMounted, ref, computed, h, onActivated } from 'vue'
import { NButton, NInput, NIcon, NPagination, NDataTable, NTag, NSpace, NEmpty, NTooltip } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { templateNative, type DeviceAccessTemplate } from '@/service/api/template-native'
import { fileAssetsNative } from '@/service/api/file-assets-native'
import { useAuthStore } from '@/store/modules/auth'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import ItemCard from '@/components/dev-card-item/index.vue'
import CardGrid from '@/components/card-grid/index.vue'
import { tableThemeOverrides } from '@/utils/table-theme'

const { routerPushByKey } = useRouterPush()
const authStore = useAuthStore()
const canWrite = computed(() => canManageDeviceGroups(authStore.userInfo.roles))

// 查询参数
const queryData = ref({
  page: 1,
  pageSize: 10,
  name: ''
})

// 数据
const deviceConfigList = ref([] as DeviceAccessTemplate[])
const dataTotal = ref(0)
const loading = ref(false)
const listError = ref('')
const coverUrls = ref<Record<string, string>>({})
let requestSequence = 0

async function loadCoverUrls(items: DeviceAccessTemplate[], sequence: number) {
  const assetIds = [...new Set(items.map(item => item.imageAssetId).filter((id): id is string => Boolean(id)))]
  const urls: Record<string, string> = {}
  let cursor = 0
  const worker = async () => {
    while (cursor < assetIds.length) {
      const assetId = assetIds[cursor++]
      try {
        const { asset } = await fileAssetsNative.get(assetId)
        if (asset.downloadUrl) urls[assetId] = asset.downloadUrl
      } catch {
        // A missing or expired cover falls back to the standard template image.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, assetIds.length) }, () => worker()))
  if (sequence === requestSequence) {
    coverUrls.value = Object.fromEntries(
      items.flatMap(item => {
        const url = item.imageAssetId ? urls[item.imageAssetId] : undefined
        return url ? [[item.id, url]] : []
      })
    )
  }
}

// 获取数据
const getData = async () => {
  const sequence = ++requestSequence
  loading.value = true
  listError.value = ''
  try {
    const result = await templateNative.list({
      page: queryData.value.page,
      pageSize: queryData.value.pageSize,
      ...(queryData.value.name.trim() ? { search: queryData.value.name.trim() } : {})
    })
    if (sequence === requestSequence) {
      deviceConfigList.value = result.items
      dataTotal.value = result.total
      coverUrls.value = {}
      void loadCoverUrls(result.items, sequence)
    }
  } catch (error) {
    if (sequence === requestSequence) {
      deviceConfigList.value = []
      dataTotal.value = 0
      coverUrls.value = {}
      listError.value = error instanceof Error ? error.message : '设备模板加载失败'
    }
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

// 搜索处理
const handleQuery = async () => {
  queryData.value.page = 1
  await getData()
}

// 重置搜索
const handleReset = async () => {
  queryData.value.page = 1
  queryData.value.name = ''
  await getData()
}

// 新建配置
const handleAddNew = () => {
  if (!canWrite.value) return
  routerPushByKey('device_config-edit')
}

// Open the native template detail; editing remains a separate explicit action.
const openTemplateEditor = (id: string) => {
  routerPushByKey('device_config-detail', { query: { id } })
}

// 设备类型映射
const deviceTypeMap = {
  standalone: $t('generate.direct-connected-device'),
  gateway: $t('generate.gateway'),
  subdevice: $t('generate.gateway-sub-device')
}

// 表格列定义
const columns = computed(() => [
  {
    title: $t('device_template.templateName'),
    key: 'name',
    minWidth: 280,
    ellipsis: {
      tooltip: true
    },
    render: (row: any) => {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => openTemplateEditor(row.id)
        },
        { default: () => row.name }
      )
    }
  },
  {
    title: $t('generate.device-type'),
    key: 'deviceKind',
    width: 220,
    render: (row: any) => {
      const kind = row.configuration.deviceKind
      const typeText = deviceTypeMap[kind] || kind
      const type = kind === 'standalone' ? 'info' : kind === 'gateway' ? 'success' : 'warning'
      return h(NTag, { type }, { default: () => typeText })
    }
  },
  {
    title: $t('generate.device-count'),
    key: 'deviceCount',
    width: 180,
    render: (row: DeviceAccessTemplate) => `${row.deviceCount} ${$t('generate.individual')}`
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 240,
    render: (row: any) => {
      return h(
        NSpace,
        { size: 'small', wrap: false },
        {
          default: () => [
            ...(canWrite.value
              ? [
                  h(
                    NButton,
                    {
                      size: 'small',
                      onClick: () => handleEdit(row.id)
                    },
                    { default: () => '编辑模板' }
                  )
                ]
              : []),
            h(
              NTooltip,
              { trigger: 'hover' },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'info',
                      disabled: true
                    },
                    { default: () => $t('device_template.publishToMarket') }
                  ),
                default: () => '原生模板发布入口尚未接通'
              }
            )
          ]
        }
      )
    }
  }
])

// 编辑处理
const handleEdit = (id: string) => {
  if (!canWrite.value) return
  routerPushByKey('device_config-edit', { query: { id } })
}

// 分页处理
const handlePageChange = (page: number) => {
  queryData.value.page = page
  getData()
}

// 分页大小处理
const handlePageSizeChange = (pageSize: number) => {
  queryData.value.pageSize = pageSize
  queryData.value.page = 1
  getData()
}

// 排序处理
const handleSorterChange = () => {
  // 根据需要实现排序逻辑
}

// 组件挂载时获取数据
onMounted(() => {
  getData()
})

// 打开时自动刷新页面
onActivated(() => {
  getData()
})
import { CreateOutline, CloudUploadOutline, ListOutline, GridOutline as CardIcon } from '@vicons/ionicons5'
import SvgIcon from '@/components/custom/svg-icon.vue'

// 注释：已移除defaultConfigSvg导入和svgToDataUrl函数，现在使用SvgIcon组件处理SVG图标

// 设备类型图标映射 - 使用本地SVG图标名称
const deviceTypeIcons = {
  standalone: 'direct',
  gateway: 'gateway',
  subdevice: 'subdevice',
  default: 'defaultdevice' // 默认设备图标
}

// 获取设备图标名称的函数
const getDeviceIconName = (deviceType: string): string => {
  return deviceTypeIcons[deviceType] || deviceTypeIcons.default
}

const availableViews = [
  { key: 'card', icon: CardIcon, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]
</script>

<template>
  <div class="p-4">
    <AdvancedListLayout
      :loading="loading"
      :inline-header="true"
      :show-query-button="false"
      :show-reset-button="false"
      :available-views="availableViews"
      @add-new="handleAddNew"
      @query="handleQuery"
      @reset="handleReset"
    >
      <template #header-title>
        <div class="device-template-header">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold">设备模板</h2>
            <span class="text-gray-400">{{ dataTotal }} 个模板</span>
          </div>
          <NButton v-if="canWrite" type="primary" @click="handleAddNew">
            {{ $t('generate.createDeviceConfig') }}
          </NButton>
        </div>
      </template>
      <!-- 搜索表单内容 -->
      <template #search-form-content>
        <div class="device-filter-toolbar">
          <div class="device-filter-field device-filter-field--search">
            <NInput
              v-model:value="queryData.name"
              :placeholder="$t('generate.enter-config-name')"
              type="text"
              clearable
              @clear="handleReset"
              @keydown.enter="handleQuery"
            >
              <template #prefix>
                <NIcon>
                  <IosSearch />
                </NIcon>
              </template>
            </NInput>
          </div>
          <div class="device-filter-actions">
            <NButton type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
            <NButton quaternary @click="handleReset">{{ $t('generate.reset') }}</NButton>
          </div>
        </div>
      </template>

      <!-- 卡片视图 -->
      <template #card-view>
        <div v-if="listError" class="mb-3 text-red-500">设备模板加载失败：{{ listError }}</div>
        <n-spin :show="loading">
          <div v-if="deviceConfigList.length === 0 && !loading" class="empty-state">
            <NEmpty size="huge" :description="$t('common.nodata')" class="min-h-60" />
          </div>
          <CardGrid>
            <div v-for="item in deviceConfigList" :key="item.id">
              <ItemCard
                :title="item.name"
                :footer-text="`${item.deviceCount} ${$t('generate.individual')} ${$t('generate.device')}`"
                :subtitle="deviceTypeMap[item.configuration.deviceKind]"
                :device-config-id="item.id"
                :isStatus="false"
                @click-card="openTemplateEditor(item.id)"
              >
                <template #subtitle-icon>
                  <SvgIcon :local-icon="getDeviceIconName(item.configuration.deviceKind)" class="image-icon" />
                </template>

                <!-- 高频图标操作固定在右上角 -->
                <template #top-right-icon>
                  <NSpace :size="2" class="card-actions">
                    <NTooltip trigger="hover">
                      <template #trigger>
                        <NButton
                          v-if="canWrite"
                          size="small"
                          quaternary
                          circle
                          type="primary"
                          @click.stop="handleEdit(item.id)"
                        >
                          <template #icon>
                            <NIcon><CreateOutline /></NIcon>
                          </template>
                        </NButton>
                      </template>
                      编辑模板
                    </NTooltip>
                    <NTooltip trigger="hover">
                      <template #trigger>
                        <NButton size="small" quaternary type="info" disabled>
                          <template #icon>
                            <NIcon><CloudUploadOutline /></NIcon>
                          </template>
                        </NButton>
                      </template>
                      原生模板发布入口尚未接通
                    </NTooltip>
                  </NSpace>
                </template>

                <!-- 底部图标 - 左下角显示配置图片 -->
                <template #footer-icon>
                  <div class="footer-icon-container">
                    <img
                      v-if="coverUrls[item.id]"
                      :src="coverUrls[item.id]"
                      alt="template cover"
                      class="config-image"
                    />
                    <SvgIcon v-else local-icon="default-config" class="config-image" />
                  </div>
                </template>
              </ItemCard>
            </div>
          </CardGrid>
        </n-spin>
      </template>

      <!-- 表格视图 -->
      <template #list-view>
        <div v-if="listError" class="mb-3 text-red-500">设备模板加载失败：{{ listError }}</div>
        <n-scrollbar class="device-table-scroll" :size="1">
          <NDataTable
            class="device-data-table thingspanel-data-table device-config-data-table"
            :columns="columns"
            :data="deviceConfigList"
            :loading="loading"
            size="medium"
            :theme-overrides="tableThemeOverrides"
            :pagination="false"
            :bordered="true"
            :bottom-bordered="true"
            :single-column="false"
            :single-line="true"
            :striped="false"
            :scroll-x="920"
            :row-key="row => row.id"
            @update:sorter="handleSorterChange"
          >
            <template #empty>
              <NEmpty size="small" :description="$t('common.noData')" />
            </template>
          </NDataTable>
        </n-scrollbar>
      </template>

      <!-- 底部分页 -->
      <template #footer>
        <NPagination
          v-model:page="queryData.page"
          :page-size="queryData.pageSize"
          :item-count="dataTotal"
          show-size-picker
          :page-sizes="[10, 20, 30, 50]"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </template>
    </AdvancedListLayout>
  </div>
</template>

<style scoped>
.device-template-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  min-width: max-content;
}

.device-filter-toolbar {
  display: grid;
  grid-template-columns: minmax(160px, 220px) auto;
  gap: 10px;
  align-items: center;
  justify-content: end;
  max-width: 100%;
}

.device-filter-field {
  min-width: 0;
}

.device-filter-field--search {
  min-width: 160px;
}

.device-filter-toolbar :deep(.n-input) {
  min-height: 36px;
  border-radius: 8px;
  background: var(--card-color);
}

.device-filter-toolbar :deep(.n-input:hover) {
  border-color: var(--primary-color);
}

.device-filter-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.device-filter-actions :deep(.n-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
}

.device-config-data-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: 0.01em;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
    white-space: nowrap;
  }
}

.device-table-scroll {
  height: 100%;
  min-height: 220px;
}

@media (max-width: 768px) {
  .device-filter-toolbar {
    grid-template-columns: 1fr;
  }

  .device-filter-field--search {
    min-width: 0;
  }

  .device-filter-actions {
    justify-content: stretch;
  }

  .device-filter-actions :deep(.n-button) {
    flex: 1;
  }
}

:deep(.card-actions) {
  flex-wrap: nowrap;
  white-space: nowrap;
}

:deep(.card-actions .n-icon) {
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.card-actions .n-button) {
  width: 28px;
  height: 28px;
  padding: 0;
}
</style>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.card-extra-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
}

// 设备类型图标样式
.image-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
}

// 底部图标容器 - 固定40x40正方形
.footer-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.config-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>
