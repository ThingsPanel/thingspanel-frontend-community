<script setup lang="ts">
import { computed, ref } from 'vue'
import Email from './components/email.vue'
import ShortMessage from './components/short-message.vue'
import PushNotification from './components/push-notification.vue'
import { $t } from '~/src/locales'
import { useI18n } from 'vue-i18n'
import { getNotificationUiCapabilities } from '@/service/api/notification-v2'
import NotificationPlugins from '~/src/views/apply/plugin/NotificationPlugins.vue'
import NotificationInstances from './NotificationInstances.vue'

const { locale } = useI18n()
const capabilities = computed(() => getNotificationUiCapabilities())
const activeTab = ref(capabilities.value.canManagePlugins ? 'plugins' : 'native')
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane
            v-if="capabilities.canManagePlugins"
            name="plugins"
            :tab="tx('通知插件', 'Notification plugins')"
            class="pannel-content"
          >
            <NotificationPlugins />
          </NTabPane>
          <NTabPane name="native" :tab="tx('通知实例', 'Notification instances')" class="pannel-content">
            <NotificationInstances />
          </NTabPane>
          <NTabPane name="legacy" :tab="tx('旧通知配置', 'Legacy notification settings')" class="pannel-content">
            <NTabs type="line" animated>
              <NTabPane name="1" :tab="$t('page.manage.notification.email.title')" class="pannel-content">
                <Email></Email>
              </NTabPane>
              <NTabPane name="2" :tab="$t('page.manage.notification.shortMessage.title')" class="pannel-content">
                <ShortMessage></ShortMessage>
              </NTabPane>
              <NTabPane name="3" :tab="$t('page.manage.notification.pushNotification.title')" class="pannel-content">
                <PushNotification></PushNotification>
              </NTabPane>
            </NTabs>
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.pannel-content {
  padding-top: 16px !important;
}
</style>
