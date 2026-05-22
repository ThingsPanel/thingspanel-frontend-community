<script setup lang="ts">
import { $t } from '@/locales'
import FunctionSetting from './components/function-setting.vue'
import DataClearSetting from './components/data-clear-setting.vue'
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NTabs type="line" animated>
          <NTabPane name="data-clear" :tab="$t('page.manage.setting.dataClearSetting.title')">
            <DataClearSetting></DataClearSetting>
          </NTabPane>
          <NTabPane name="function" :tab="$t('custom.management.configSetting')">
            <FunctionSetting></FunctionSetting>
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss"></style>
