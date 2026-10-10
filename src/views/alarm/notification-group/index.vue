<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationGroups from './NotificationGroups.vue'
import NotificationDefaultPolicy from './NotificationDefaultPolicy.vue'
import NotificationInstances from '~/src/views/management/notification/NotificationInstances.vue'
import NotificationAvailablePlugins from './NotificationAvailablePlugins.vue'

const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const activeTab = ref('policies')
</script>

<template>
  <div>
    <NAlert type="info" class="mb-12px">
      {{
        tx(
          '为未单独指定策略的告警设置默认值；也可以在单条告警规则中明确选择策略。历史通知组不再支持修改，已有告警引用和历史记录保留。',
          'Set a default for alerts without an explicit policy, or choose a policy on an individual alert rule. Historical notification groups are read only; existing alert references and records are retained.'
        )
      }}
    </NAlert>
    <NTabs v-model:value="activeTab" type="line">
      <NTabPane name="policies" :tab="tx('通知策略', 'Notification policies')">
        <NotificationDefaultPolicy />
        <NotificationGroups />
      </NTabPane>
      <NTabPane name="available-plugins" :tab="tx('可用通知插件', 'Available notification plugins')">
        <NotificationAvailablePlugins />
      </NTabPane>
      <NTabPane name="accounts" :tab="tx('可用服务', 'Available services')">
        <NotificationInstances />
      </NTabPane>
    </NTabs>
  </div>
</template>
