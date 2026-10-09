<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationGroups from './NotificationGroups.vue'
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
          '在通知策略中选择可用服务、接收目标和内容，再用于社区告警。旧通知组维护已停用；已有告警引用和历史记录保留。',
          'Configure available services, recipients and content in a notification policy, then publish it for community alerts. Legacy group management is retired; existing alert references and history are retained.'
        )
      }}
    </NAlert>
    <NTabs v-model:value="activeTab" type="line">
      <NTabPane name="policies" :tab="tx('通知策略', 'Notification policies')">
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
