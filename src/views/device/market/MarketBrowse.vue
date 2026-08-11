<script setup lang="ts">
/**
 * MarketBrowse - 市场解决方案包浏览页面
 *
 * 功能：
 * - 浏览市场中的解决方案包
 * - 搜索和筛选
 * - 查看详情
 * - 下载模板到本地模板库
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import {
  NInput,
  NSelect,
  NSpin,
  NEmpty,
  NPagination,
  NIcon,
  NButton,
  NButtonGroup,
  NCard,
  NEllipsis,
  useDialog,
  useMessage
} from 'naive-ui'
import { SearchOutline, CloudDownloadOutline, GridOutline, ListOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import {
  browseMarketBundles,
  getMarketBundleDetail,
  getBundlePrecheckInfo,
  type MarketBundleListItem,
  type MarketBundleDetail,
  type DashboardBindingSpec
} from '@/service/api/market-bundle'
import { downloadMarketDashboardTemplate } from '@/service/api/dashboard-template'
import { useMarketAuth } from '@/views/device/config/composables/use-market-auth'
import MarketBundleDetailDrawer from './MarketBundleDetailDrawer.vue'
import MarketLoginModal from '@/views/device/config/modules/market-login-modal.vue'
import defaultDashboardCover from '@/assets/imgs/default_dashboard_cover.png'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  {
    embedded: false
  }
)

// ========== Auth ==========

const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const { isLoggedIn, getToken, clearToken } = useMarketAuth()

// ========== State ==========

/** 加载状态 */
const loading = ref(false)

/** Bundle 列表 */
const bundleList = ref<MarketBundleListItem[]>([])

/** 总数 */
const total = ref(0)

/** 视图模式：网格 / 列表 */
const viewMode = ref<'grid' | 'list'>('grid')

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

/** 分类 value → i18n key 映射 */
const categoryLabelMap: Record<string, string> = {
  'smart-home': 'market.category.smartHome',
  industrial: 'market.category.industrial',
  agriculture: 'market.category.agriculture',
  'smart-city': 'market.category.smartCity',
  energy: 'market.category.energy',
  healthcare: 'market.category.healthcare',
  retail: 'market.category.retail',
  other: 'market.category.other'
}

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

/** 登录弹窗 */
const marketLoginRef = ref<InstanceType<typeof MarketLoginModal>>()
const pendingDownloadBundle = ref<MarketBundleListItem | null>(null)
const downloadingBundleKey = ref('')

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
 * 下载模板到本地模板库
 */
async function handleDownload(item: MarketBundleListItem) {
  if (!isLoggedIn()) {
    pendingDownloadBundle.value = item
    marketLoginRef.value?.open()
    return
  }

  dialog.warning({
    title: '下载看板模板',
    content: `将“${item.name}”及其依赖的设备模板、物模型下载到本地模板库。下载阶段不会绑定真实设备，也不会创建运行看板。`,
    positiveText: '确认下载',
    negativeText: '取消',
    onPositiveClick: () => performDownload(item)
  })
}

/**
 * 登录成功回调
 */
function onMarketLoginSuccess() {
  if (pendingDownloadBundle.value) {
    const bundle = pendingDownloadBundle.value
    pendingDownloadBundle.value = null
    void handleDownload(bundle)
  }
}

async function performDownload(item: MarketBundleListItem) {
  const marketToken = getToken()
  if (!marketToken) {
    pendingDownloadBundle.value = item
    marketLoginRef.value?.open()
    return
  }

  downloadingBundleKey.value = item.bundleKey
  try {
    const result = await downloadMarketDashboardTemplate({
      bundleKey: item.bundleKey,
      version: item.latestVersion,
      marketToken
    })
    if (result.error) {
      const errorDetails = result.error.details as { error?: unknown } | undefined
      const upstreamError = typeof errorDetails?.error === 'string' ? errorDetails.error : ''
      if (
        result.error.httpStatus === 401 ||
        result.error.code === '401' ||
        /(?:invalid|missing) authentication/i.test(upstreamError)
      ) {
        clearToken()
        pendingDownloadBundle.value = item
        message.warning($t('market.tokenExpired'))
        marketLoginRef.value?.open()
        return
      }
      message.error(result.error.message)
      return
    }

    detailDrawerVisible.value = false
    dialog.success({
      title: '模板下载完成',
      content: '看板模板和依赖资源已保存到本地。请在“看板模板”中选择真实设备并创建看板。',
      positiveText: '查看本地模板',
      negativeText: '继续浏览',
      onPositiveClick: () => router.push({ name: 'visualization_thingsvis-template' })
    })
    void fetchBundleList()
  } finally {
    downloadingBundleKey.value = ''
  }
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
 * 封面：优先 thumbnail，否则默认图1
 */
function getCoverSrc(item: MarketBundleListItem): string {
  return item.thumbnail || defaultDashboardCover
}

/**
 * 分类标签文案
 */
function getCategoryLabel(category: string): string {
  const key = categoryLabelMap[category]
  return key ? $t(key) : category
}

/**
 * 分类标签文字色（对齐设备模板页颜色映射思路）
 */
function getCategoryColor(category: string): string {
  const value = (category || '').toLowerCase()
  if (value.includes('agriculture') || value.includes('农业')) return '#7c3aed'
  if (value.includes('industrial') || value.includes('工业')) return '#0d9488'
  if (value.includes('other') || value.includes('其他')) return '#ea580c'
  if (value.includes('smart-home') || value.includes('家居')) return '#dc2626'
  if (value.includes('smart-city') || value.includes('城市')) return '#2563eb'
  if (value.includes('energy') || value.includes('能源')) return '#16a34a'
  if (value.includes('healthcare') || value.includes('医疗')) return '#e11d48'
  if (value.includes('retail') || value.includes('零售')) return '#ea580c'
  return 'var(--primary-color, #6366f1)'
}

// ========== Lifecycle ==========

onMounted(() => {
  void fetchBundleList()
})
</script>

<template>
  <div :class="['market-browse', { 'is-embedded': props.embedded }]">
    <!-- 页头（非 embedded） -->
    <div v-if="!props.embedded" class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">{{ $t('market.browse.title') }}</h2>
        <p class="page-subtitle">{{ $t('market.browse.subtitle') }}</p>
      </div>
      <div class="page-header-right">{{ $t('market.browse.totalBundles', { n: total }) }}</div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <NInput
          v-model:value="searchParams.keyword"
          :placeholder="$t('market.browse.searchPlaceholder')"
          clearable
          class="search-input"
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
          class="filter-select"
          @update:value="handleCategoryChange"
        />

        <NSelect
          v-model:value="searchParams.sort_by"
          :options="sortOptions"
          class="sort-select"
          @update:value="handleSortChange"
        />
      </div>

      <NButtonGroup class="view-toggle">
        <NButton
          :class="{ 'view-active': viewMode === 'grid' }"
          :title="$t('market.viewGrid')"
          @click="viewMode = 'grid'"
        >
          <template #icon>
            <NIcon><GridOutline /></NIcon>
          </template>
        </NButton>
        <NButton
          :class="{ 'view-active': viewMode === 'list' }"
          :title="$t('market.viewList')"
          @click="viewMode = 'list'"
        >
          <template #icon>
            <NIcon><ListOutline /></NIcon>
          </template>
        </NButton>
      </NButtonGroup>
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

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="bundle-grid">
        <div v-for="item in bundleList" :key="item.bundleKey" class="bundle-grid-item">
          <NCard class="bundle-card" hoverable :content-style="{ padding: '0' }" @click="handleViewDetail(item)">
            <div
              class="card-cover"
              role="img"
              :aria-label="item.name"
              :style="{ backgroundImage: `url(${getCoverSrc(item)})` }"
            >
              <span v-if="item.category" class="category-badge" :style="{ color: getCategoryColor(item.category) }">
                {{ getCategoryLabel(item.category) }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-name">
                <NEllipsis :line-clamp="1">{{ item.name }}</NEllipsis>
              </div>

              <div class="card-meta">
                <span v-if="item.latestVersion" class="version-badge">v{{ item.latestVersion }}</span>
                <span class="install-stat">
                  <NIcon size="14" class="install-icon"><CloudDownloadOutline /></NIcon>
                  {{ formatInstallCount(item.installCount) }}
                </span>
                <span v-if="item.author" class="author-name">{{ item.author }}</span>
              </div>

              <div class="card-actions" @click.stop>
                <NButton class="action-btn" size="small" @click="handleViewDetail(item)">
                  {{ $t('market.viewDetail') }}
                </NButton>
                <NButton
                  class="action-btn"
                  type="primary"
                  size="small"
                  :loading="downloadingBundleKey === item.bundleKey"
                  @click="handleDownload(item)"
                >
                  {{ $t('market.browse.downloadTemplate') }}
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="bundle-list">
        <div v-for="item in bundleList" :key="item.bundleKey" class="bundle-list-row" @click="handleViewDetail(item)">
          <div
            class="list-cover"
            role="img"
            :aria-label="item.name"
            :style="{ backgroundImage: `url(${getCoverSrc(item)})` }"
          />

          <div class="list-main">
            <div class="card-name">
              <NEllipsis :line-clamp="1">{{ item.name }}</NEllipsis>
            </div>
            <div class="list-sub">
              <span v-if="item.category" class="list-category" :style="{ color: getCategoryColor(item.category) }">
                {{ getCategoryLabel(item.category) }}
              </span>
              <span v-if="item.latestVersion" class="version-badge">v{{ item.latestVersion }}</span>
            </div>
          </div>

          <div class="list-right">
            <span class="install-stat">
              <NIcon size="14" class="install-icon"><CloudDownloadOutline /></NIcon>
              {{ formatInstallCount(item.installCount) }}
            </span>
            <div class="list-actions" @click.stop>
              <NButton size="small" @click="handleViewDetail(item)">{{ $t('market.viewDetail') }}</NButton>
              <NButton
                size="small"
                type="primary"
                :loading="downloadingBundleKey === item.bundleKey"
                @click="handleDownload(item)"
              >
                {{ $t('market.browse.downloadTemplate') }}
              </NButton>
            </div>
          </div>
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
      @download="handleDownload"
    />

    <!-- 登录弹窗 -->
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
  </div>
</template>

<style scoped lang="scss">
.market-browse {
  padding: 20px 24px;
  background: #f5f6f8;
  min-height: 100%;
  border-radius: 8px;

  &.is-embedded {
    padding: 16px 0 0;
    background: transparent;
    min-height: 480px;
    border-radius: 0;
  }
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
}

.page-header-left {
  min-width: 0;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.3;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: #8b8fa3;
  line-height: 1.4;
}

.page-header-right {
  flex-shrink: 0;
  font-size: 13px;
  color: #8b8fa3;
  padding-top: 6px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 180px;
  max-width: 360px;
}

.filter-select {
  width: 140px;
}

.sort-select {
  width: 120px;
}

.view-toggle {
  flex-shrink: 0;

  :deep(.n-button) {
    --n-border: 1px solid #e5e7eb;
    --n-border-hover: 1px solid #c7d2fe;
  }

  .view-active {
    --n-color: #eef2ff !important;
    --n-color-hover: #e0e7ff !important;
    --n-color-pressed: #e0e7ff !important;
    --n-border: 1px solid #a5b4fc !important;
    --n-border-hover: 1px solid #a5b4fc !important;
    --n-text-color: #4f46e5 !important;
    --n-text-color-hover: #4f46e5 !important;
    background: #eef2ff;
    color: #4f46e5;
  }
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
  overflow: hidden;
  min-width: 0;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;

  :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.card-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}

.category-badge {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(4px);
  line-height: 1.5;
}

.card-body {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px 16px 16px;
}

.card-name {
  width: 100%;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.card-meta {
  width: 100%;
  min-width: 0;
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.author-name {
  color: #666;
}

.version-badge {
  background: #ede9fe;
  color: #4f46e5;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.install-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #999;
}

.install-icon {
  color: #999;
}

.card-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.action-btn {
  flex: 1;
  min-width: 0;
  width: 100%;
}

/* 列表模式 */
.bundle-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bundle-list-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #eef0f4;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    border-color 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border-color: #e0e4ef;
  }
}

.list-cover {
  flex-shrink: 0;
  width: 96px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: #0f172a;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.list-main {
  flex: 1;
  min-width: 0;
}

.list-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.list-category {
  font-size: 12px;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #eee;
}

.list-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
