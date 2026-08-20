<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { NInput, NSelect, NSpin, NEmpty, NPagination, NIcon } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { GridOutline, ListOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import AdvancedListLayout from '@/components/list-page/index.vue'
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
const availableViews = [
  { key: 'card', icon: GridOutline, label: 'market.viewGrid' },
  { key: 'list', icon: ListOutline, label: 'market.viewList' }
]

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

  const templateName = templateList.value.find((item) => item.id === id)?.name || '该模板'
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
  <div class="h-full p-4">
    <AdvancedListLayout
      initial-view="card"
      :available-views="availableViews"
      :show-add-button="false"
      :show-query-button="false"
      :show-reset-button="false"
      memory-key="resource-hub-device-view"
      use-view-memory
      @refresh="fetchMarketTemplates"
    >
      <template #search-form-content>
        <div class="flex flex-wrap items-center gap-3">
          <NInput
            v-model:value="searchParams.keyword"
            :placeholder="$t('market.searchPlaceholder')"
            clearable
            class="w-90"
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
            class="w-35"
            @update:value="handleSearch"
          />
          <NSelect
            v-model:value="searchParams.sort_by"
            :options="sortOptions"
            class="w-30"
            @update:value="handleSearch"
          />
        </div>
      </template>

      <template #header-left>
        <span class="text-14px text-gray-500">{{ $t('market.totalTemplates', { n: total }) }}</span>
      </template>

      <template #card-view>
        <NSpin
          :show="loading || Boolean(installingId)"
          :description="installingId ? '模板下载并安装中，请稍候…' : undefined"
        >
          <NEmpty v-if="!loading && !templateList.length" :description="$t('market.noTemplates')" class="py-20" />
          <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            <MarketTemplateCard
              v-for="item in templateList"
              :key="item.id"
              :template="item"
              mode="grid"
              @install="handleInstall"
              @view-detail="handleViewDetail"
            />
          </div>
        </NSpin>
      </template>

      <template #list-view>
        <NSpin :show="loading || Boolean(installingId)">
          <NEmpty v-if="!loading && !templateList.length" :description="$t('market.noTemplates')" class="py-20" />
          <div v-else class="flex flex-col gap-3">
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
      </template>

      <template v-if="total > searchParams.page_size" #footer>
        <NPagination
          v-model:page="searchParams.page"
          :page-size="searchParams.page_size"
          :item-count="total"
          @update:page="fetchMarketTemplates"
        />
      </template>
    </AdvancedListLayout>

    <!-- 模板详情抽屉 -->
    <MarketTemplateDrawer v-model:visible="drawerVisible" :template-id="selectedTemplateId" @install="handleInstall" />

    <!-- 市场登录弹窗 -->
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
  </div>
</template>
