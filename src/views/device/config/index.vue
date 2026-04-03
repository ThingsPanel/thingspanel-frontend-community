<script lang="tsx" setup>
import { onMounted, ref, computed, h, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NIcon,
  NPagination,
  NDataTable,
  NTag,
  NSpace,
  NEmpty,
  NDropdown,
  NTabs,
  NTabPane,
  NTooltip
} from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { deviceConfig } from '@/service/api/device'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
import ItemCard from '@/components/dev-card-item/index.vue'

// Import Publish Components
import MarketLoginModal from './modules/market-login-modal.vue'
import PublishConfirmModal from './modules/publish-confirm-modal.vue'
import MarketTemplateList from './modules/market-template-list.vue'

const router = useRouter()
const { routerPushByKey } = useRouterPush()

// Refs for Modals
const marketLoginRef = ref<InstanceType<typeof MarketLoginModal>>()
const publishConfirmRef = ref<InstanceType<typeof PublishConfirmModal>>()
const pendingPublishId = ref('')
const pendingPublishName = ref('')
const activeTab = ref('local')

const handleInstalled = () => {
  activeTab.value = 'local'
  getData()
}

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

// 处理发布到市场（以 device_config_id 为发布单位）
const handlePublishToMarket = (deviceConfigId: string, defaultName?: string) => {
  if (!deviceConfigId) {
    window.$message?.warning($t('device_template.requireThingModelBeforePublish'))
    return
  }
  const token = sessionStorage.getItem('market_token')
  if (!token) {
    pendingPublishId.value = deviceConfigId
    pendingPublishName.value = defaultName || ''
    marketLoginRef.value?.open()
  } else {
    publishConfirmRef.value?.open(deviceConfigId, defaultName)
  }
}

// 市场登录成功回调
const onMarketLoginSuccess = () => {
  if (pendingPublishId.value) {
    publishConfirmRef.value?.open(pendingPublishId.value, pendingPublishName.value)
    pendingPublishId.value = ''
    pendingPublishName.value = ''
  }
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
    },
    render: (row: any) => {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => goToDetail(row.id)
        },
        { default: () => row.name }
      )
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
    width: 200,
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
            ),
            h(
              NTooltip,
              { trigger: 'hover', disabled: !!row.device_template_id },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'info',
                      disabled: !row.device_template_id,
                      onClick: () => handlePublishToMarket(row.id, row.name)
                    },
                    { default: () => $t('device_template.publishToMarket') }
                  ),
                default: () => $t('device_template.requireThingModelBeforePublish')
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
const handleSorterChange = () => {
  // 根据需要实现排序逻辑
}

// 刷新数据
const handleRefresh = () => {
  getData()
}

// 组件挂载时获取数据
onMounted(() => {
  getData()
})

// 打开时自动刷新页面
onActivated(() => {
  getData()
})
import { ListOutline, GridOutline as CardIcon, EllipsisHorizontal } from '@vicons/ionicons5'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { getDemoServerUrl } from '@/utils/common/tool'

const demoUrl = getDemoServerUrl()

// 注释：已移除defaultConfigSvg导入和svgToDataUrl函数，现在使用SvgIcon组件处理SVG图标

// 设备类型图标映射 - 使用本地SVG图标名称
const deviceTypeIcons = {
  1: 'direct', // 直连设备
  2: 'gateway', // 网关设备
  3: 'subdevice', // 子设备
  default: 'defaultdevice' // 默认设备图标
}

// 获取设备图标名称的函数
const getDeviceIconName = (deviceType: string): string => {
  return deviceTypeIcons[deviceType] || deviceTypeIcons.default
}

const getConfigImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return ''
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  return `${demoUrl.replace('api/v1', '')}${imageUrl}`
}

// 注释：已移除getConfigImageUrl函数，现在直接在模板中判断是否有image_url

const availableViews = [
  { key: 'card', icon: CardIcon, label: 'common.viewCard' },
  { key: 'list', icon: ListOutline, label: 'common.viewList' }
]
</script>

<template>
  <div class="p-4">
    <NTabs v-model:value="activeTab" type="line" animated>
      <NTabPane name="local" :tab="$t('device_template.localTemplates')">
        <AdvancedListLayout
          :loading="loading"
          :show-query-button="false"
          :show-reset-button="false"
          :available-views="availableViews"
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
                    @click-card="goToDetail(item.id)"
                  >
                    <template #subtitle-icon>
                      <SvgIcon :local-icon="getDeviceIconName(item.device_type)" class="image-icon" />
                    </template>

                    <!-- 右上角操作按钮 -->
                    <template #top-right-icon>
                      <NDropdown
                        placement="bottom-end"
                        trigger="hover"
                        :options="[
                          { label: $t('common.edit'), key: 'edit' },
                          {
                            label: $t('device_template.publishToMarket'),
                            key: 'publish',
                            disabled: !item.device_template_id
                          }
                        ]"
                        @select="
                          key => {
                            if (key === 'edit') handleEdit(item.id)
                            if (key === 'publish') handlePublishToMarket(item.id, item.name)
                          }
                        "
                      >
                        <NTooltip :disabled="!!item.device_template_id" trigger="hover">
                          <template #trigger>
                            <NButton size="tiny" quaternary circle>
                              <template #icon>
                                <NIcon><EllipsisHorizontal /></NIcon>
                              </template>
                            </NButton>
                          </template>
                          {{ $t('device_template.requireThingModelBeforePublish') }}
                        </NTooltip>
                      </NDropdown>
                    </template>

                    <!-- 底部图标 - 左下角显示配置图片 -->
                    <template #footer-icon>
                      <div class="footer-icon-container">
                        <img
                          v-if="item.image_url"
                          :src="getConfigImageUrl(item.image_url)"
                          alt="config image"
                          class="config-image"
                        />
                        <SvgIcon v-else local-icon="default-config" class="config-image" />
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
      </NTabPane>

      <NTabPane name="market" :tab="$t('device_template.marketTemplates')">
        <MarketTemplateList @installed="handleInstalled" />
      </NTabPane>
    </NTabs>

    <!-- 市场登录弹窗 -->
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
    <!-- 发布确认弹窗 -->
    <PublishConfirmModal ref="publishConfirmRef" @publish-success="getData" />
  </div>
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
