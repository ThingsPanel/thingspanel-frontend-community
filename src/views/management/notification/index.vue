<script setup lang="ts">
import Email from './components/email.vue';
import ShortMessage from './components/short-message.vue';
import { $t } from '~/src/locales';
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NTabs type="line" animated>
          <NTabPane name="1" :tab="$t('page.manage.notification.email.title')">
            <Email></Email>
          </NTabPane>
          <NTabPane name="2" :tab="$t('page.manage.notification.shortMessage.title')">
            <ShortMessage></ShortMessage>
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss"></style>
