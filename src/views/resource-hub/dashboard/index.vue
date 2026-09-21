<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabPane, NTabs } from 'naive-ui'
import MarketBrowse from '@/views/device/market/MarketBrowse.vue'
import LocalDashboardTemplates from '@/views/visualization/thingsvis-template/index.vue'

const route = useRoute()
const router = useRouter()

const activeTab = computed(() => (route.query.tab === 'local' ? 'local' : 'resources'))

function handleTabChange(value: string) {
  void router.replace({
    name: 'resource-hub_dashboard',
    query: value === 'local' ? { tab: 'local' } : {}
  })
}
</script>

<template>
  <div class="resource-hub-dashboard">
    <div class="resource-hub-header">
      <div>
        <h2>看板模板</h2>
        <p>在资源中心浏览模板资源，或管理已保存的模板并创建看板。</p>
      </div>
    </div>

    <NTabs :value="activeTab" type="line" animated @update:value="handleTabChange">
      <NTabPane name="resources" tab="资源中心" display-directive="show:lazy">
        <MarketBrowse embedded />
      </NTabPane>
      <NTabPane name="local" tab="我的模板" display-directive="show:lazy">
        <LocalDashboardTemplates />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped lang="scss">
.resource-hub-dashboard {
  min-height: 100%;
  padding: 16px;
}

.resource-hub-header {
  display: flex;
  align-items: center;
  min-height: 56px;
  margin-bottom: 12px;

  h2 {
    margin: 0 0 6px;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #909399;
  }
}

.resource-hub-dashboard :deep(.n-tabs-pane-wrapper) {
  min-height: 100%;
}
</style>
