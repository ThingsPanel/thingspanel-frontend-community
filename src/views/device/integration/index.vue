<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PaginationProps } from 'naive-ui'
import _ from 'lodash'
import { getServiceList } from '@/service/api/device'
import DevCardItem from '@/components/dev-card-item/index.vue'
import AdvancedListLayout from '@/components/list-page/index.vue'
import CardGrid from '@/components/card-grid/index.vue'
import { GridOutline as CardIcon, SearchOutline } from '@vicons/ionicons5'
const loading = ref(false)
const router = useRouter()
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 15,
  pageCount: 1
})
const queryParams = reactive({
  page_size: 15,
  service_type: 2,
  search: ''
})
const deviceTemplateList = ref([] as any[])
const dataTotal = ref(0)

const getData = async () => {
  loading.value = true
  try {
    const res = await getServiceList({
      page: pagination.page as number,
      ...queryParams
    })
    if (!res.error) {
      deviceTemplateList.value = res.data.list
      dataTotal.value = res.data.total
      pagination.pageCount = Math.max(1, Math.ceil(res.data.total / Number(queryParams.page_size)))
    }
  } finally {
    loading.value = false
  }
}

getData()

const debouncedSearch = _.debounce(() => {
  pagination.page = 1
  getData()
}, 400)

const handleSearchInput = () => {
  debouncedSearch()
}

const handleReset = () => {
  queryParams.search = ''
  pagination.page = 1
  getData()
}

const clickDevice = async row => {
  router.push(
    `/device/service-details?id=${row.id}&service_type=${row.service_type}&service_name=${row.name}&service_identifier=${row.service_identifier}`
  )
}

onUnmounted(() => {
  debouncedSearch.cancel()
})
</script>

<template>
  <div>
    <AdvancedListLayout
      :available-views="[{ key: 'card', icon: CardIcon, label: 'common.viewCard' }]"
      :inline-header="true"
      :showQueryButton="false"
      :showResetButton="false"
      :showAddButton="false"
    >
      <template #header-title>
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold">三方集成</h2>
          <span class="text-gray-400">{{ dataTotal }} 个集成</span>
        </div>
      </template>
      <template #search-form-content>
        <div class="integration-filter-area">
          <div class="integration-filter-toolbar">
            <n-input
              v-model:value="queryParams.search"
              clearable
              :placeholder="$t('custom.devicePage.searchIntegration')"
              class="integration-search-input"
              @update:value="handleSearchInput"
            >
              <template #prefix>
                <n-icon :size="16">
                  <SearchOutline />
                </n-icon>
              </template>
            </n-input>
            <n-button quaternary size="small" @click="handleReset">{{ $t('generate.reset') }}</n-button>
          </div>
        </div>
      </template>

      <!-- 卡片视图 -->
      <template #card-view>
        <n-spin :show="loading">
          <CardGrid>
            <div v-for="item in deviceTemplateList" :key="item.id">
              <DevCardItem
                :isStatus="false"
                :title="item.name"
                :subtitle="item.description || '暂无描述'"
                :footer-text="item.version || '--'"
                @click-card="clickDevice(item)"
              >
                <!-- 左下角默认图标 -->
                <template #footer-icon>
                  <div class="service-icon-container">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
                      <rect
                        x="15"
                        y="20"
                        width="70"
                        height="50"
                        rx="3"
                        fill="none"
                        stroke="#333"
                        stroke-width="3"
                      ></rect>
                      <line
                        x1="25"
                        y1="80"
                        x2="75"
                        y2="80"
                        stroke="#333"
                        stroke-width="3"
                        stroke-linecap="round"
                      ></line>
                    </svg>
                  </div>
                </template>
              </DevCardItem>
            </div>
          </CardGrid>
        </n-spin>
      </template>

      <!-- 底部分页 -->
      <template #footer>
        <NPagination
          v-model:page="pagination.page"
          :page-count="pagination.pageCount"
          @update:page="
            page => {
              pagination.page = page
              getData()
            }
          "
        />
      </template>
    </AdvancedListLayout>
  </div>
</template>

<style lang="scss" scoped>
.service-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.integration-filter-area {
  width: 100%;
  padding: 2px 0 0;
}

.integration-filter-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.integration-search-input {
  width: min(360px, 100%);
}

.integration-filter-toolbar :deep(.n-input) {
  min-height: 36px;
  border-radius: 8px;
  background: var(--card-color);
}

.integration-filter-toolbar :deep(.n-input:hover) {
  border-color: var(--primary-color);
}

.integration-filter-toolbar :deep(.n-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .integration-filter-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .integration-search-input {
    width: 100%;
  }

  .integration-filter-toolbar :deep(.n-button) {
    align-self: flex-start;
  }
}
</style>
