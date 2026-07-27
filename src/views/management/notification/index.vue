<script setup lang="ts">
import Email from './components/email.vue'
import ShortMessage from './components/short-message.vue'
import PushNotification from './components/push-notification.vue'
import { $t } from '~/src/locales'
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
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
      </div>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.pannel-content {
  padding-top: 16px !important;
}
</style>
