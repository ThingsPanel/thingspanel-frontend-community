<script setup lang="ts">
/**
 * InstalledBundles - 已安装解决方案包列表页面
 *
 * 功能：
 * - 显示已安装的解决方案包列表
 * - 显示安装状态和绑定状态
 * - 快速跳转到详情
 * - 跳转到安装向导
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NTag,
  NSpace,
  NCard,
  NEmpty,
  NPagination,
  NIcon,
  NGrid,
  NGi,
  NTooltip,
  NDropdown
} from 'naive-ui'
import { h } from 'vue'
import {
  ArrowForwardIos,
  RefreshOutline,
  OpenOutline,
  LinkOutline,
  CloudDownloadOutline,
  EllipsisHorizontal
} from '@vicons/ionicons5'
import { $t } from '@/locales'
import { getInstalledBundles, type InstalledBundle, type MarketApiError } from '@/service/api/market-bundle'
import MarketBrowse from './MarketBrowse.vue'

// ========== Router ==========

const router = useRouter()

// ========== State ==========

/** 加载状态 */
const loading = ref(false)

/** 已安装列表 */
const installedList = ref<InstalledBundle[]>([])

/** 总数 */
const total = ref(0)

/** 分页参数 */
const pagination = reactive({
  page: 1,
  pageSize: 10
})

/** 当前激活的标签页 */
const activeTab = ref<'installed' | 'browse'>('installed')

// ========== Computed ==========

/** 表格列定义 */
const columns = computed(() => [
  {
    title: $t('market.install.bundleName'),
    key: 'bundleName',
    ellipsis: {
      tooltip: true
    },
    render: (row: InstalledBundle) => {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => goToDetail(row.installationId)
        },
        { default: () => row.bundleName }
      )
    }
  },
  {
    title: $t('market.install.version'),
    key: 'version',
    width: 100,
    render: (row: InstalledBundle) => {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.version })
    }
  },
  {
    title: $t('market.install.status'),
    key: 'status',
    width: 140,
    render: (row: InstalledBundle) => {
      const statusMap: Record<string, { type: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
        DOWNLOADED: { type: 'info', label: $t('market.install.status.downloaded') },
        VERIFIED: { type: 'info', label: $t('market.install.status.verified') },
        MODELS_INSTALLED: { type: 'info', label: $t('market.install.status.modelsInstalled') },
        DASHBOARDS_CREATED: { type: 'info', label: $t('market.install.status.dashboardsCreated') },
        WAITING_FOR_BINDINGS: { type: 'warning', label: $t('market.install.status.waitingForBindings') },
        COMPLETED: { type: 'success', label: $t('market.install.status.completed') },
        FAILED: { type: 'error', label: $t('market.install.status.failed') },
        COMPENSATION_REQUIRED: { type: 'error', label: $t('market.install.status.compensationRequired') }
      }
      const status = statusMap[row.status] || { type: 'info', label: row.status }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    }
  },
  {
    title: $t('market.install.bindingStatus'),
    key: 'bindingStatus',
    width: 100,
    render: (row: InstalledBundle) => {
      const statusMap: Record<string, { type: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
        BOUND: { type: 'success', label: $t('market.install.bindingStatus.bound') },
        UNBOUND: { type: 'warning', label: $t('market.install.bindingStatus.unbound') },
        PARTIAL: { type: 'warning', label: $t('market.install.bindingStatus.partial') }
      }
      const status = statusMap[row.bindingStatus] || { type: 'info', label: row.bindingStatus }
      return h(NTag, { type: status.type, size: 'small' }, { default: () => status.label })
    }
  },
  {
    title: $t('market.install.resources'),
    key: 'resources',
    width: 150,
    render: (row: InstalledBundle) => {
      const templates = row.deviceTemplates?.length || 0
      const dashboards = row.dashboards?.length || 0
      return h(
        'span',
        {},
        `${templates} ${$t('market.install.templates')}, ${dashboards} ${$t('market.install.dashboards')}`
      )
    }
  },
  {
    title: $t('market.install.bindings'),
    key: 'bindings',
    width: 100,
    render: (row: InstalledBundle) => {
      const boundCount = row.bindings?.filter((b) => b.deviceId).length || 0
      const totalCount = row.bindings?.length || 0
      return h(
        NTooltip,
        {},
        {
          trigger: () => h('span', {}, `${boundCount}/${totalCount}`),
          default: () =>
            `${boundCount} ${$t('market.install.bound')}, ${totalCount - boundCount} ${$t('market.install.unbound')}`
        }
      )
    }
  },
  {
    title: $t('market.install.installedAt'),
    key: 'installedAt',
    width: 160,
    render: (row: InstalledBundle) => {
      return new Date(row.installedAt).toLocaleString()
    }
  },
  {
    title: $t('common.actions'),
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row: InstalledBundle) => {
      const dropdownOptions = [
        {
          label: $t('common.view'),
          key: 'view',
          icon: () => h(NIcon, {}, { default: () => h(OpenOutline) })
        },
        {
          label: $t('market.install.updateBindings'),
          key: 'binding',
          icon: () => h(NIcon, {}, { default: () => h(LinkOutline) }),
          disabled: row.bindingStatus === 'BOUND'
        }
      ]

      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                onClick: () => goToDetail(row.installationId)
              },
              { default: () => $t('common.view') }
            ),
            h(
              NDropdown,
              {
                options: dropdownOptions,
                onSelect: (key: string) => handleAction(key, row)
              },
              {
                default: () =>
                  h(
                    NButton,
                    { size: 'small', quaternary: true, circle: true },
                    {
                      icon: () => h(NIcon, {}, { default: () => h(EllipsisHorizontal) })
                    }
                  )
              }
            )
          ]
        }
      )
    }
  }
])

// ========== Watch ==========

watch(activeTab, (tab) => {
  if (tab === 'installed') {
    void fetchInstalledList()
  }
})

// ========== Methods ==========

/**
 * 获取已安装列表
 */
async function fetchInstalledList() {
  loading.value = true

  try {
    const result = await getInstalledBundles({
      page: pagination.page,
      page_size: pagination.pageSize
    })

    if (result.data) {
      installedList.value = result.data.list || []
      total.value = result.data.total || 0
    }
  } catch (err) {
    console.error('Failed to fetch installed list:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 刷新列表
 */
async function refresh() {
  await fetchInstalledList()
}

/**
 * 分页变化
 */
function handlePageChange(page: number) {
  pagination.page = page
  void fetchInstalledList()
}

/**
 * 分页大小变化
 */
function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  void fetchInstalledList()
}

/**
 * 跳转到详情
 */
function goToDetail(installationId: string) {
  router.push({
    name: 'device_market-installed-detail',
    params: { id: installationId }
  })
}

/**
 * 处理下拉菜单操作
 */
async function handleAction(key: string, row: InstalledBundle) {
  switch (key) {
    case 'view':
      goToDetail(row.installationId)
      break
    case 'binding':
      goToDetail(row.installationId)
      break
  }
}

/**
 * 跳转到市场
 */
function goToBrowse() {
  activeTab.value = 'browse'
}

/**
 * 跳转到安装新包
 */
function goToInstall() {
  activeTab.value = 'browse'
}

// ========== Lifecycle ==========

onMounted(() => {
  void fetchInstalledList()
})
</script>

<template>
  <div class="installed-bundles">
    <div class="page-content">
      <!-- 标签页 -->
      <div class="tabs-header">
        <div :class="['tab-item', { active: activeTab === 'installed' }]" @click="activeTab = 'installed'">
          <CloudDownloadOutline />
          <span>{{ $t('market.nav.installed') }}</span>
          <NTag v-if="total > 0" type="info" size="small" round>{{ total }}</NTag>
        </div>
        <div :class="['tab-item', { active: activeTab === 'browse' }]" @click="goToBrowse">
          <CloudDownloadOutline />
          <span>{{ $t('market.nav.browse') }}</span>
        </div>
      </div>

      <!-- 已安装列表 -->
      <div v-if="activeTab === 'installed'" class="tab-content">
        <div class="list-header">
          <div class="header-left">
            <span class="total-count">
              {{ $t('market.install.totalInstalled', { count: total }) }}
            </span>
          </div>
          <div class="header-right">
            <NButton :loading="loading" @click="refresh">
              <template #icon>
                <NIcon><RefreshOutline /></NIcon>
              </template>
              {{ $t('common.refresh') }}
            </NButton>
            <NButton type="primary" @click="goToInstall">
              <template #icon>
                <NIcon><CloudDownloadOutline /></NIcon>
              </template>
              {{ $t('market.install.installNew') }}
            </NButton>
          </div>
        </div>

        <div v-if="installedList.length === 0 && !loading" class="empty-state">
          <NEmpty :description="$t('market.install.noInstalled')">
            <template #extra>
              <NButton type="primary" @click="goToInstall">
                <template #icon>
                  <NIcon><CloudDownloadOutline /></NIcon>
                </template>
                {{ $t('market.install.browseAndInstall') }}
              </NButton>
            </template>
          </NEmpty>
        </div>

        <NDataTable
          v-else
          :columns="columns"
          :data="installedList"
          :loading="loading"
          :pagination="{
            page: pagination.page,
            pageSize: pagination.pageSize,
            pageSizes: [10, 20, 50],
            showSizePicker: true,
            showQuickJumper: true
          }"
          :row-key="(row: InstalledBundle) => row.installationId"
          striped
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>

      <!-- 市场浏览 -->
      <div v-if="activeTab === 'browse'" class="tab-content">
        <MarketBrowse />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.installed-bundles {
  min-height: 100%;
}

.page-content {
  padding: 0 24px;
}

.tabs-header {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: #666;
  transition: all 0.2s ease;

  &:hover {
    color: #18a058;
  }

  &.active {
    color: #18a058;
    border-bottom-color: #18a058;
    font-weight: 500;
  }
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-count {
  font-size: 14px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  padding: 64px 0;
  text-align: center;
}
</style>
