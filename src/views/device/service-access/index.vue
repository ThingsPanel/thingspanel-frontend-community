<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PaginationProps } from 'naive-ui'
import { getServiceList } from '@/service/api/device'
import DevCardItem from '@/components/dev-card-item/index.vue'

const router = useRouter()
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 20,
  pageCount: 1
})
const queryParams = reactive({
  page_size: 12,
  service_type: 2
})
const deviceTemplateList = ref([] as any[])

const getData = async () => {
  const res = await getServiceList({
    page: pagination.page as number,
    ...queryParams
  })
  if (!res.error) {
    deviceTemplateList.value = res.data.list
    // eslint-disable-next-line require-atomic-updates
    pagination.pageCount = Math.ceil(res.data.total / 12)
  }
}

getData()

const clickDevice = async row => {
  router.push(
    `/device/service-details?id=${row.id}&service_type=${row.service_type}&service_name=${row.name}&service_identifier=${row.service_identifier}`
  )
}


</script>

<template>
  <div>
    <n-card>
      <n-grid cols="1 s:2 m:3 l:4 xl:5 2xl:8" x-gap="18" y-gap="18" responsive="screen">
        <n-gi v-for="item in deviceTemplateList" :key="item.id">
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
                  <rect x="15" y="20" width="70" height="50" rx="3" fill="none" stroke="#333" stroke-width="3"></rect>
              <line x1="25" y1="80" x2="75" y2="80" stroke="#333" stroke-width="3" stroke-linecap="round"></line>
             
                </svg>
              </div>
            </template>
          </DevCardItem>
        </n-gi>
      </n-grid>
      <div class="pagination-box">
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
      </div>
    </n-card>
  </div>
</template>

<style lang="scss" scoped>
.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.service-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
</style>
