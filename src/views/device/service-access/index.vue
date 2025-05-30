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
      <NGrid x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen">
        <NGridItem v-for="item in deviceTemplateList" :key="item.id">
          <DevCardItem
             :isStatus="false"
            :title="item.name"
            :subtitle="item.description || '暂无描述'"
            :footer-text="item.version || 'v1.0.0'"
            @click-card="clickDevice(item)"
          >
            <!-- 左下角默认图标 -->
            <template #footer-icon>
              <div class="service-icon-container">
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
                  <!-- Wi-Fi 信号 -->
                  <path d="M30 25 Q50 10, 70 25" stroke="#666" stroke-width="2" fill="none"></path>
                  <path d="M35 30 Q50 18, 65 30" stroke="#666" stroke-width="2" fill="none"></path>
                  <circle cx="50" cy="35" r="2" fill="#666"></circle>

                  <!-- 设备主体：带前面板 -->
                  <rect x="25" y="45" width="50" height="35" rx="6" fill="#999"></rect>

                  <!-- 前面板指示灯或端口 -->
                  <circle cx="40" cy="62" r="3" fill="#fff"></circle>
                  <circle cx="50" cy="62" r="3" fill="#fff"></circle>
                  <circle cx="60" cy="62" r="3" fill="#fff"></circle>
                </svg>
              </div>
            </template>
          </DevCardItem>
        </NGridItem>
      </NGrid>
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
