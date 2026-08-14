<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { NInput, NSelect, NSpin, NEmpty, NPagination, NIcon, NButton, NButtonGroup } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { GridOutline, ListOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { getMarketTemplates, installFromMarket } from '@/service/api/market'
import { useMarketAuth } from '../composables/use-market-auth'
import MarketTemplateCard from './market-template-card.vue'
import MarketTemplateDrawer from './market-template-drawer.vue'
import MarketLoginModal from './market-login-modal.vue'

const emit = defineEmits(['installed'])

const { isLoggedIn, getToken, clearToken } = useMarketAuth()

const loading = ref(false)
const installingId = ref('')
const templateList = ref<any[]>([])
const total = ref(0)
const viewMode = ref<'grid' | 'list'>('grid')

const searchParams = reactive({
  keyword: '',
  category: null as string | null,
  sort_by: 'latest',
  page: 1,
  page_size: 12
})

const categoryOptions = [
  { label: 'IoT', value: 'IoT' },
  { label: '工业', value: '工业' },
  { label: '农业', value: '农业' },
  { label: '智慧城市', value: '智慧城市' },
  { label: '其他', value: '其他' }
]

const sortOptions = [
  { label: $t('market.sortLatest'), value: 'latest' },
  { label: $t('market.sortHottest'), value: 'hottest' }
]

// Drawer
const drawerVisible = ref(false)
const selectedTemplateId = ref('')

// Login modal
const marketLoginRef = ref<InstanceType<typeof MarketLoginModal>>()
const pendingInstallId = ref('')

const fetchMarketTemplates = async () => {
  loading.value = true
  try {
    const params: any = {
      page: searchParams.page,
      page_size: searchParams.page_size,
      sort_by: searchParams.sort_by
    }
    if (searchParams.keyword) params.keyword = searchParams.keyword
    if (searchParams.category) params.category = searchParams.category

    const res: any = await getMarketTemplates(params)
    if (!res.error) {
      templateList.value = res.data?.list || (Array.isArray(res.data) ? res.data : [])
      total.value = res.data?.total ?? 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  searchParams.page = 1
  fetchMarketTemplates()
}

const debouncedSearch = useDebounceFn(() => {
  handleSearch()
}, 500)

watch(
  () => searchParams.keyword,
  () => {
    debouncedSearch()
  }
)

const handleViewDetail = (id: string) => {
  selectedTemplateId.value = id
  drawerVisible.value = true
}

const startInstall = async (id: string) => {
  if (!isLoggedIn()) {
    pendingInstallId.value = id
    marketLoginRef.value?.open()
    return
  }
  await doInstall(id)
}

const handleInstall = (id: string) => {
  if (installingId.value) return

  const templateName = templateList.value.find(item => item.id === id)?.name || '该模板'
  const dialog = window.$dialog
  if (!dialog) {
    startInstall(id)
    return
  }

  dialog.warning({
    title: '确认下载模板',
    content: `确认将“${templateName}”下载并安装到当前租户吗？完成后会创建对应的设备配置、设备模板和物模型。`,
    positiveText: '确认下载',
    negativeText: '取消',
    onPositiveClick: () => startInstall(id)
  })
}

const doInstall = async (id: string) => {
  const token = getToken()
  if (!token) return

  installingId.value = id
  try {
    const res: any = await installFromMarket({
      market_template_id: id,
      market_token: token
    })
    if (!res.error) {
      // Check for missing plugins
      const data = res.data
      if (data?.missing_plugins && data.missing_plugins.length > 0) {
        const pluginNames = data.missing_plugins
          .map((p: any) => {
            const version = p.min_version ? ` (≥${p.min_version})` : ''
            const required = p.required ? $t('market.pluginRequired') : $t('market.pluginOptional')
            return `${p.plugin_name}${version} [${required}]`
          })
          .join('\n')
        window.$dialog?.warning({
          title: $t('market.missingPluginsTitle'),
          content: `${$t('market.missingPluginsMessage')}\n\n${pluginNames}\n\n${$t('market.contactAdmin')}`,
          positiveText: $t('common.confirm')
        })
      }
      window.$message?.success($t('market.installSuccess'))
      emit('installed')
    } else {
      const msg = res.error?.msg || ''
      if (msg.includes('已存在') || msg.includes('duplicate')) {
        window.$message?.warning($t('market.alreadyInstalled'))
      } else {
        window.$message?.error($t('market.installFailed') + ': ' + msg)
      }
    }
  } catch (e: any) {
    if (e?.response?.status === 401) {
      clearToken()
      window.$message?.error($t('market.tokenExpired'))
      pendingInstallId.value = id
      marketLoginRef.value?.open()
    } else {
      window.$message?.error($t('market.installFailed') + ': ' + (e?.message || ''))
    }
  } finally {
    installingId.value = ''
  }
}

const onMarketLoginSuccess = () => {
  if (pendingInstallId.value) {
    doInstall(pendingInstallId.value)
    pendingInstallId.value = ''
  }
}

onMounted(() => {
  fetchMarketTemplates()
})
</script>

<template>
  <div class="market-template-list">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-title">{{ $t('market.pageTitle') }}</h2>
        <p class="page-subtitle">{{ $t('market.pageSubtitle') }}</p>
      </div>
      <div class="page-header-right">{{ $t('market.totalTemplates', { n: total }) }}</div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <NInput
          v-model:value="searchParams.keyword"
          :placeholder="$t('market.searchPlaceholder')"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <NIcon><IosSearch /></NIcon>
          </template>
        </NInput>
        <NSelect
          v-model:value="searchParams.category"
          :options="categoryOptions"
          :placeholder="$t('market.allCategories')"
          clearable
          class="filter-select"
          @update:value="handleSearch"
        />
        <NSelect
          v-model:value="searchParams.sort_by"
          :options="sortOptions"
          class="sort-select"
          @update:value="handleSearch"
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

    <!-- 模板列表 -->
    <NSpin
      :show="loading || Boolean(installingId)"
      :description="installingId ? '模板下载并安装中，请稍候…' : undefined"
    >
      <NEmpty v-if="!loading && !templateList.length" :description="$t('market.noTemplates')" style="padding: 80px 0" />
      <div v-else-if="viewMode === 'grid'" class="template-grid">
        <MarketTemplateCard
          v-for="item in templateList"
          :key="item.id"
          :template="item"
          mode="grid"
          @install="handleInstall"
          @view-detail="handleViewDetail"
        />
      </div>
      <div v-else class="template-list">
        <MarketTemplateCard
          v-for="item in templateList"
          :key="item.id"
          :template="item"
          mode="list"
          @install="handleInstall"
          @view-detail="handleViewDetail"
        />
      </div>
    </NSpin>

    <!-- 分页 -->
    <div v-if="total > searchParams.page_size" class="pagination-wrap">
      <NPagination
        v-model:page="searchParams.page"
        :page-size="searchParams.page_size"
        :item-count="total"
        @update:page="fetchMarketTemplates"
      />
    </div>

    <!-- 模板详情抽屉 -->
    <MarketTemplateDrawer v-model:visible="drawerVisible" :template-id="selectedTemplateId" @install="handleInstall" />

    <!-- 市场登录弹窗 -->
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
  </div>
</template>

<style scoped lang="scss">
.market-template-list {
  padding: 20px 24px;
  background: #f5f6f8;
  min-height: 100%;
  border-radius: 8px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
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

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
