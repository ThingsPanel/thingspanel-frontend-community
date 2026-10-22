<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationGroups from './NotificationGroups.vue'
import NotificationDefaultPolicy from './NotificationDefaultPolicy.vue'
import NotificationInstances from '~/src/views/management/notification/NotificationInstances.vue'
import NotificationRecords from '../notification-record/index.vue'

const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const activeTab = ref('policies')
const policyRefresh = ref(0)
</script>

<template>
  <div>
    <div class="mb-16px">
      <div class="text-xl font-600">{{ tx('通知管理', 'Notification management') }}</div>
      <div class="mt-4px text-secondary">
        {{
          tx(
            '配置告警接收方式，查看渠道和发送结果。',
            'Configure alert recipients and channels, and review delivery results.'
          )
        }}
      </div>
    </div>
    <NTabs v-model:value="activeTab" type="line">
      <NTabPane name="policies" :tab="tx('通知策略', 'Notification policies')">
        <NotificationDefaultPolicy :key="policyRefresh" />
        <NotificationGroups @published="policyRefresh++" />
      </NTabPane>
      <NTabPane name="accounts" :tab="tx('通知渠道', 'Notification channels')">
        <NotificationInstances />
      </NTabPane>
      <NTabPane name="records" :tab="tx('发送记录', 'Delivery records')">
        <NotificationRecords />
      </NTabPane>
    </NTabs>
  </div>
</template>
