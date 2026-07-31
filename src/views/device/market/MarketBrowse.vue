<script setup lang="ts">
/**
 * MarketBrowse - 市场解决方案包浏览页面
 *
 * 功能：
 * - 浏览市场中的解决方案包
 * - 搜索和筛选
 * - 查看详情
 * - 发起安装
 */
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NEmpty,
  NPagination,
  NIcon,
  NButton,
  NCard,
  NTag,
  NAvatar,
  NRate,
  NTooltip,
  NDrawer,
  NDrawerContent,
  NDivider,
  NAlert
} from 'naive-ui'
import {
  SearchOutline,
  CloudDownloadOutline,
  EyeOutline,
  TimerOutline,
  PersonOutline,
  StarOutline,
  OpenOutline,
  LinkOutline
} from '@vicons/ionicons5'
import { $t } from '@/locales'
import {
  browseMarketBundles,
  getMarketBundleDetail,
  getBundlePrecheckInfo,
  type MarketBundleListItem,
  type MarketBundleDetail,
  type DashboardBindingSpec
} from '@/service/api/market-bundle'
import { useMarketAuth } from '@/views/device/config/composables/use-market-auth'
import InstallWizard from './InstallWizard.vue'
import MarketBundleDetailDrawer from './MarketBundleDetailDrawer.vue'
import MarketLoginModal from '@/views/device/config/modules/market-login-modal.vue'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false
  }
)

// ========== Auth ==========

const { isLoggedIn } = useMarketAuth()

// ========== State ==========

/** 加载状态 */
const loading = ref(false)

/** Bundle 列表 */
const bundleList = ref<MarketBundleListItem[]>([])

/** 总数 */
const total = ref(0)

/** 搜索参数 */
const searchParams = reactive({
  keyword: '',
  category: null as string | null,
  sort_by: 'latest' as 'latest' | 'hottest',
  page: 1,
  page_size: 12
})

/** 类别选项 */
const categoryOptions = [
  { label: $t('market.category.all'), value: '' },
  { label: () => $t('market.category.smartHome'), value: 'smart-home' },
  { label: () => $t('market.category.industrial'), value: 'industrial' },
  { label: () => $t('market.category.agriculture'), value: 'agriculture' },
  { label: () => $t('market.category.smartCity'), value: 'smart-city' },
  { label: () => $t('market.category.energy'), value: 'energy' },
  { label: () => $t('market.category.healthcare'), value: 'healthcare' },
  { label: () => $t('market.category.retail'), value: 'retail' },
  { label: () => $t('market.category.other'), value: 'other' }
]

/** 排序选项 */
const sortOptions = [
  { label: () => $t('market.sortLatest'), value: 'latest' },
  { label: () => $t('market.sortHottest'), value: 'hottest' }
]

/** 详情抽屉可见性 */
const detailDrawerVisible = ref(false)

/** 当前查看详情的 Bundle */
const currentDetail = ref<MarketBundleDetail | null>(null)
const currentVersion = ref('')
const currentBindings = ref<DashboardBindingSpec[]>([])
const loadingDetail = ref(false)

/** 安装向导 */
const installWizardRef = ref<InstanceType<typeof InstallWizard>>()
const installWizardVisible = ref(false)

/** 登录弹窗 */
const marketLoginRef = ref<InstanceType<typeof MarketLoginModal>>()
const pendingInstallBundle = ref<{ bundleKey: string; version: string } | null>(null)
const resumeInstallAfterLogin = ref(false)

// ========== Computed ==========

/** 是否有更多 */
const hasMore = computed(() => total.value > searchParams.page_size)

// ========== Methods ==========

/**
 * 获取 Bundle 列表
 */
async function fetchBundleList() {
  loading.value = true

  try {
    const params: any = {
      page: searchParams.page,
      page_size: searchParams.page_size,
      sort_by: searchParams.sort_by
    }

    if (searchParams.keyword) {
      params.keyword = searchParams.keyword
    }

    if (searchParams.category) {
      params.category = searchParams.category
    }

    const result = await browseMarketBundles(params)

    if (result.data) {
      bundleList.value = result.data.list || []
      total.value = result.data.total || 0
    }
  } catch (err) {
    console.error('Failed to fetch bundle list:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索处理
 */
function handleSearch() {
  searchParams.page = 1
  void fetchBundleList()
}

function clearFilters() {
  searchParams.keyword = ''
  searchParams.category = null
  handleSearch()
}

/**
 * 防抖搜索
 */
const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 500)

watch(
  () => searchParams.keyword,
  () => {
    debouncedSearch()
  }
)

/**
 * 类别变化
 */
function handleCategoryChange() {
  searchParams.page = 1
  void fetchBundleList()
}

/**
 * 排序变化
 */
function handleSortChange() {
  searchParams.page = 1
  void fetchBundleList()
}

/**
 * 分页变化
 */
function handlePageChange(page: number) {
  searchParams.page = page
  void fetchBundleList()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 查看详情
 */
async function handleViewDetail(item: MarketBundleListItem) {
  loadingDetail.value = true
  detailDrawerVisible.value = true

  try {
    const result = await getMarketBundleDetail(item.bundleKey)

    if (result.error) {
      window.$message?.error(result.error.message)
    } else if (result.data) {
      currentDetail.value = result.data
      currentVersion.value = item.latestVersion

      // 获取预检信息以获取绑定预览
      const precheckResult = await getBundlePrecheckInfo(item.bundleKey, {
        version: item.latestVersion
      })

      if (precheckResult.data?.bindingPreview) {
        currentBindings.value = precheckResult.data.bindingPreview
      } else {
        // 从版本信息中提取绑定
        const versionInfo = result.data.versions.find(v => v.version === item.latestVersion)
        currentBindings.value =
          versionInfo?.deviceBindings.map(b => ({
            dashboardKey: '',
            dashboardName: '',
            bindings: [b]
          })) || []
      }
    }
  } catch (err) {
    console.error('Failed to fetch bundle detail:', err)
    window.$message?.error('加载商品详情失败')
  } finally {
    loadingDetail.value = false
  }
}

/**
 * 处理安装
 */
async function handleInstall(item: MarketBundleListItem) {
  if (!isLoggedIn()) {
    pendingInstallBundle.value = {
      bundleKey: item.bundleKey,
      version: item.latestVersion
    }
    marketLoginRef.value?.open()
    return
  }

  await openInstallWizard(item.bundleKey, item.latestVersion)
}

/**
 * 登录成功回调
 */
function onMarketLoginSuccess() {
  if (resumeInstallAfterLogin.value) {
    resumeInstallAfterLogin.value = false
    installWizardVisible.value = true
    void nextTick(() => {
      void installWizardRef.value?.retryInstallation()
    })
    return
  }

  if (pendingInstallBundle.value) {
    const bundle = pendingInstallBundle.value
    void openInstallWizard(bundle.bundleKey, bundle.version)
    pendingInstallBundle.value = null
  }
}

function onMarketAuthenticationRequired() {
  resumeInstallAfterLogin.value = true
  installWizardVisible.value = false
  window.$message?.warning($t('market.tokenExpired'))
  marketLoginRef.value?.open()
}

/**
 * 打开安装向导
 */
async function openInstallWizard(bundleKey: string, version: string) {
  loadingDetail.value = true

  try {
    // 获取完整详情
    const result = await getMarketBundleDetail(bundleKey)

    if (result.data) {
      // 获取绑定预览
      const precheckResult = await getBundlePrecheckInfo(bundleKey, { version })

      let bindings: DashboardBindingSpec[] = []
      if (precheckResult.data?.bindingPreview) {
        bindings = precheckResult.data.bindingPreview
      }

      installWizardRef.value?.open({
        bundle: result.data,
        version,
        dashboardBindings: bindings
      })
      installWizardVisible.value = true
    } else if (result.error) {
      window.$message?.error(result.error.message)
    }
  } catch (err) {
    console.error('Failed to open install wizard:', err)
    window.$message?.error($t('market.install.loadBundleFailed'))
  } finally {
    loadingDetail.value = false
  }
}

/**
 * 安装完成回调
 */
function onInstallComplete() {
  detailDrawerVisible.value = false
  void fetchBundleList()
}

/**
 * 格式化安装数量
 */
function formatInstallCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

/**
 * 获取类别标签类型
 */
function getCategoryTagType(category: string): 'success' | 'info' | 'warning' | 'error' {
  const typeMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    'smart-home': 'success',
    industrial: 'info',
    agriculture: 'warning',
    'smart-city': 'info',
    energy: 'success',
    healthcare: 'error',
    retail: 'warning',
    other: 'default'
  }
  return typeMap[category] || 'default'
}

// ========== Lifecycle ==========

onMounted(() => {
  void fetchBundleList()
})
</script>

<template>
  <div :class="['market-browse', { 'is-embedded': props.embedded }]">
    <!-- 页面标题 -->
    <div v-if="!props.embedded" class="page-header">
      <h1 class="page-title">{{ $t('market.browse.title') }}</h1>
      <p class="page-subtitle">{{ $t('market.browse.subtitle') }}</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <NInput
        v-model:value="searchParams.keyword"
        :placeholder="$t('market.browse.searchPlaceholder')"
        clearable
        style="width: 300px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <NIcon><SearchOutline /></NIcon>
        </template>
      </NInput>

      <NSelect
        v-model:value="searchParams.category"
        :options="categoryOptions"
        :placeholder="$t('market.browse.allCategories')"
        clearable
        style="width: 160px"
        @update:value="handleCategoryChange"
      />

      <NSelect
        v-model:value="searchParams.sort_by"
        :options="sortOptions"
        style="width: 140px"
        @update:value="handleSortChange"
      />
    </div>

    <!-- Bundle 列表 -->
    <NSpin :show="loading">
      <div v-if="!loading && bundleList.length === 0" class="empty-state">
        <NEmpty :description="$t('market.browse.noBundles')">
          <template #extra>
            <NButton type="primary" @click="clearFilters">
              {{ $t('market.browse.clearFilters') }}
            </NButton>
          </template>
        </NEmpty>
      </div>

      <div v-else class="bundle-grid">
        <div v-for="item in bundleList" :key="item.bundleKey" class="bundle-grid-item">
          <NCard class="bundle-card" hoverable @click="handleViewDetail(item)">
            <!-- 卡片头部 -->
            <div class="bundle-header">
              <NAvatar :src="item.thumbnail" :size="48" round class="bundle-avatar">
                {{ item.name?.charAt(0) || 'B' }}
              </NAvatar>
              <NTag :type="getCategoryTagType(item.category)" size="small" class="bundle-category">
                {{ $t(`market.category.${item.category}`) || item.category }}
              </NTag>
            </div>

            <!-- 卡片内容 -->
            <div class="bundle-content">
              <h3 class="bundle-name">{{ item.name }}</h3>
              <p class="bundle-description">{{ item.description }}</p>
            </div>

            <!-- 卡片底部 -->
            <div class="bundle-footer">
              <div class="bundle-meta">
                <NTooltip>
                  <template #trigger>
                    <span class="meta-item">
                      <NIcon size="14"><TimerOutline /></NIcon>
                      {{ item.latestVersion }}
                    </span>
                  </template>
                  {{ $t('market.browse.version') }}: {{ item.latestVersion }}
                </NTooltip>

                <NTooltip>
                  <template #trigger>
                    <span class="meta-item">
                      <NIcon size="14"><CloudDownloadOutline /></NIcon>
                      {{ formatInstallCount(item.installCount) }}
                    </span>
                  </template>
                  {{ $t('market.browse.installs') }}: {{ item.installCount }}
                </NTooltip>

                <NTooltip v-if="item.author">
                  <template #trigger>
                    <span class="meta-item">
                      <NIcon size="14"><PersonOutline /></NIcon>
                      {{ item.author }}
                    </span>
                  </template>
                  {{ $t('market.browse.author') }}: {{ item.author }}
                </NTooltip>
              </div>

              <div class="bundle-actions" @click.stop>
                <NButton size="small" quaternary @click="handleViewDetail(item)">
                  <template #icon>
                    <NIcon><EyeOutline /></NIcon>
                  </template>
                  {{ $t('market.viewDetail') }}
                </NButton>
                <NButton type="primary" size="small" @click="handleInstall(item)">
                  <template #icon>
                    <NIcon><CloudDownloadOutline /></NIcon>
                  </template>
                  {{ $t('market.install') }}
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </NSpin>

    <!-- 分页 -->
    <div v-if="hasMore" class="pagination-wrapper">
      <NPagination
        v-model:page="searchParams.page"
        :page-size="searchParams.page_size"
        :item-count="total"
        @update:page="handlePageChange"
      />
    </div>

    <!-- 详情抽屉 -->
    <MarketBundleDetailDrawer
      v-model:visible="detailDrawerVisible"
      v-model:version="currentVersion"
      :bundle="currentDetail"
      :version="currentVersion"
      :bindings="currentBindings"
      :loading="loadingDetail"
      @install="handleInstall"
    />

    <!-- 登录弹窗 -->
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />

    <!-- 安装向导 -->
    <InstallWizard
      ref="installWizardRef"
      v-model="installWizardVisible"
      @installed="onInstallComplete"
      @authentication-required="onMarketAuthenticationRequired"
    />
  </div>
</template>

<style scoped lang="scss">
.market-browse {
  padding: 24px;
  min-height: calc(100vh - 120px);

  &.is-embedded {
    padding: 16px 0 0;
    min-height: 480px;
  }
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.bundle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.bundle-grid-item {
  min-width: 0;
}

.bundle-card {
  height: 100%;
  min-width: 0;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.bundle-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.bundle-avatar {
  background: linear-gradient(135deg, #18a058, #36ad6a);
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.bundle-category {
  flex-shrink: 0;
}

.bundle-content {
  margin-bottom: 12px;
}

.bundle-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bundle-description {
  font-size: 13px;
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
  height: 3em;
}

.bundle-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.bundle-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.bundle-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.mb-4 {
  margin-bottom: 16px;
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    flex-shrink: 0;
    color: #666;
    min-width: 100px;
  }

  .value {
    color: #333;
  }
}

.section-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.description {
  .label {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #333;
    line-height: 1.6;
  }
}

.binding-preview {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.binding-dashboard {
  font-weight: 500;
  margin-bottom: 4px;
}

.binding-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.required-mark {
  color: #d03050;
  margin-left: 2px;
}

.version-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-date {
  font-size: 12px;
  color: #999;
}
</style>
