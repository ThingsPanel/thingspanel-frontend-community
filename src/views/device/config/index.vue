<script lang="tsx" setup>
import { onMounted, ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NInput, NIcon, NPagination, NDataTable, NTag, NSpace, NEmpty } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { deviceConfig } from '@/service/api/device'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import ItemCard from '@/components/dev-card-item/index.vue'

const router = useRouter()
const { routerPushByKey } = useRouterPush()

// 查询参数
const queryData = ref({
  page: 1,
  page_size: 10,
  name: ''
})

// 数据
const deviceConfigList = ref([] as any[])
const dataTotal = ref(0)
const loading = ref(false)

// 获取数据
const getData = async () => {
  loading.value = true
  try {
    const res = await deviceConfig(queryData.value)
    if (!res.error) {
      deviceConfigList.value = res.data.list
      dataTotal.value = res.data.total
    }
  } finally {
    loading.value = false
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
  routerPushByKey('device_config-edit')
}

// 页面跳转
const goToDetail = (id: string) => {
  router.push({ path: '/device/config-detail', query: { id } })
}

// 设备类型映射
const deviceTypeMap = {
  '1': $t('generate.direct-connected-device'),
  '2': $t('generate.gateway'),
  '3': $t('generate.gateway-sub-device')
}

// 表格列定义
const columns = computed(() => [
  {
    title: $t('device_template.templateName'),
    key: 'name',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: $t('generate.device-type'),
    key: 'device_type',
    render: (row: any) => {
      const typeText = deviceTypeMap[row.device_type as keyof typeof deviceTypeMap] || row.device_type
      const type = row.device_type === '1' ? 'info' : row.device_type === '2' ? 'success' : 'warning'
      return h(NTag, { type }, { default: () => typeText })
    }
  },
  {
    title: $t('generate.device-count'),
    key: 'device_count',
    render: (row: any) => `${row.device_count} ${$t('generate.individual')}`
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 120,
    render: (row: any) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => handleEdit(row.id)
              },
              { default: () => $t('common.edit') }
            )
          ]
        }
      )
    }
  }
])

// 编辑处理
const handleEdit = (id: string) => {
  routerPushByKey('device_config-edit', { query: { id } })
}

// 分页处理
const handlePageChange = (page: number) => {
  queryData.value.page = page
  getData()
}

// 分页大小处理
const handlePageSizeChange = (pageSize: number) => {
  queryData.value.page_size = pageSize
  queryData.value.page = 1
  getData()
}

// 排序处理
const handleSorterChange = (sorter: any) => {
  // 根据需要实现排序逻辑
  console.log('Sorter changed:', sorter)
}

// 刷新数据
const handleRefresh = () => {
  getData()
}

// 组件挂载时获取数据
onMounted(() => {
  getData()
})
import { ListOutline, GridOutline as CardIcon } from '@vicons/ionicons5'
// eslint-disable-next-line no-unused-vars
import defaultConfig from './modules/svg/default-config.svg?url'
import { getDemoServerUrl } from '@/utils/common/tool'

const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)

// 导入设备类型图标
import directDeviceIconUrl from '@/components/data-table-page/modules/svg/direct.svg?url'
import gatewayIconUrl from '@/components/data-table-page/modules/svg/gateway.svg?url'
import subDeviceIconUrl from '@/components/data-table-page/modules/svg/subdevice.svg?url'
import defaultDeviceIconUrl from '@/components/data-table-page/modules/svg/defaultdevice.svg?url'

// 设备类型到图标URL的映射
const deviceTypeIconUrls = {
  '1': directDeviceIconUrl, // 直连设备图标
  '2': gatewayIconUrl, // 网关图标
  '3': subDeviceIconUrl, // 网关子设备图标
  default: defaultDeviceIconUrl // 默认图标
}

// 获取设备图标URL的函数
const getDeviceIconUrl = (deviceType: string): string => {
  return deviceTypeIconUrls[deviceType] || deviceTypeIconUrls.default
}

// 获取配置图片URL的函数
const getConfigImageUrl = (imagePath: string): string => {
  if (!imagePath) return defaultConfig
  const relativePath = imagePath.replace(/^\.?\//, '')
  return `${url.value.replace('api/v1', '') + relativePath}`
}

const availableViews = [
  { key: 'card', icon: CardIcon, label: 'views.card' },
  { key: 'list', icon: ListOutline, label: 'views.list' }
]
</script>

<template>
  <AdvancedListLayout
    :available-views="availableViews"
    :showQueryButton="false"
    :showResetButton="false"
    @add-new="handleAddNew"
    @query="handleQuery"
    @reset="handleReset"
    @refresh="handleRefresh"
  >
    <template #header-left>
      <div class="flex gap-2">
        <n-button type="primary" @click="handleAddNew">{{ $t('generate.createDeviceConfig') }}</n-button>
      </div>
    </template>
    <!-- 搜索表单内容 -->
    <template #search-form-content>
      <div class="flex gap-4">
        <NInput
          v-model:value="queryData.name"
          :placeholder="$t('generate.enter-config-name')"
          type="text"
          clearable
          style="width: 210px"
          @clear="handleReset"
          @keydown.enter="handleQuery"
        >
          <template #prefix>
            <NIcon>
              <IosSearch />
            </NIcon>
          </template>
        </NInput>
        <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
      </div>
    </template>

    <!-- 卡片视图 -->
    <template #card-view>
      <n-spin :show="loading">
      <div v-if="deviceConfigList.length === 0 && !loading" class="empty-state">
        <NEmpty size="huge" :description="$t('common.nodata')" class="min-h-60" />
      </div>
      <n-grid cols="1 s:2 m:3 l:4 xl:5 2xl:8" x-gap="18" y-gap="18" responsive="screen">
        <n-gi v-for="item in deviceConfigList" :key="item.id">
          <ItemCard
            :title="item.name"
            :footer-text="`${item.device_count} ${$t('generate.individual')} ${$t('generate.device')}`"
            :subtitle="deviceTypeMap[item.device_type as keyof typeof deviceTypeMap]"
            :device-config-id="item.id"
            :isStatus="false"
            @click-card="handleEdit(item.id)"
          >
            <template #subtitle-icon>
              <img :src="getDeviceIconUrl(item.device_type)" alt="device type icon" class="image-icon" />
            </template>

            <!-- 底部图标 - 左下角显示配置图片 -->
            <template #footer-icon>
              <div class="footer-icon-container">
                <img :src="getConfigImageUrl(item.image_url)" alt="config image" class="config-image" />
              </div>
            </template>

            <!-- 卡片内容区域可以显示更多信息 -->
          </ItemCard>
        </n-gi>
      </n-grid>
    </n-spin>
    </template>

    <!-- 表格视图 -->
    <template #list-view>
      <NDataTable
        :columns="columns"
        :data="deviceConfigList"
        :loading="loading"
        size="small"
        :pagination="false"
        :bordered="false"
        :single-line="false"
        striped
        @update:sorter="handleSorterChange"
      />
    </template>

    <!-- 底部分页 -->
    <template #footer>
      <NPagination
        v-model:page="queryData.page"
        :page-size="queryData.page_size"
        :item-count="dataTotal"
        show-size-picker
        :page-sizes="[10, 20, 30, 50]"
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

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 0 4px;
}

.card-item {
  min-height: 200px;
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
  width: 20px;
  height: 20px;
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

// 响应式设计
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (min-width: 1201px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
</style>
