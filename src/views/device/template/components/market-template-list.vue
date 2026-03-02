<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { NInput, NSelect, NSpace, NSpin, NGrid, NGi, NEmpty, NPagination, NIcon } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { $t } from '@/locales'
import { getMarketTemplates, installFromMarket } from '@/service/api/market'
import { useMarketAuth } from '../composables/use-market-auth'
import MarketTemplateCard from './market-template-card.vue'
import MarketTemplateDrawer from './market-template-drawer.vue'
import MarketLoginModal from './market-login-modal.vue'

// eslint-disable-next-line no-unused-vars
const emit = defineEmits<{
  (e: 'installed'): void
}>()

const { isLoggedIn, getToken, clearToken } = useMarketAuth()

const loading = ref(false)
const templateList = ref<any[]>([])
const total = ref(0)

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
      templateList.value = res.data?.list ?? res.data ?? []
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

const handleViewDetail = (id: string) => {
  selectedTemplateId.value = id
  drawerVisible.value = true
}

const handleInstall = async (id: string) => {
  if (!isLoggedIn()) {
    pendingInstallId.value = id
    marketLoginRef.value?.open()
    return
  }
  await doInstall(id)
}

const doInstall = async (id: string) => {
  const token = getToken()
  if (!token) return

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
          .map(
            (p: any) =>
              `${p.plugin_name} (≥${p.min_version}) [${p.required ? $t('market.pluginRequired') : $t('market.pluginOptional')}]`
          )
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
  }
}

// eslint-disable-next-line no-unused-vars
const onMarketLoginSuccess = (_token: string) => {
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
    <!-- 筛选区域 -->
    <NSpace class="mb-4" align="center" :size="12">
      <NInput
        v-model:value="searchParams.keyword"
        :placeholder="$t('market.searchPlaceholder')"
        clearable
        style="width: 260px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
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
        style="width: 140px"
        @update:value="handleSearch"
      />
      <NSelect
        v-model:value="searchParams.sort_by"
        :options="sortOptions"
        style="width: 120px"
        @update:value="handleSearch"
      />
    </NSpace>

    <!-- 模板卡片网格 -->
    <NSpin :show="loading">
      <NEmpty v-if="!loading && !templateList.length" :description="$t('market.noTemplates')" style="padding: 80px 0" />
      <NGrid v-else cols="1 s:2 m:3 l:4" x-gap="16" y-gap="16" responsive="screen">
        <NGi v-for="item in templateList" :key="item.id">
          <MarketTemplateCard :template="item" @install="handleInstall" @view-detail="handleViewDetail" />
        </NGi>
      </NGrid>
    </NSpin>

    <!-- 分页 -->
    <div v-if="total > searchParams.page_size" class="mt-4" style="display: flex; justify-content: flex-end">
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
