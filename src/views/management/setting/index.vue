<script setup lang="ts">
import { $t } from '@/locales'
import ThemeSetting from './components/theme-setting.vue'
import FunctionSetting from './components/function-setting.vue'
import DataClearSetting from './components/data-clear-setting.vue'
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NTabs type="line" animated>
          <NTabPane name="1" :tab="主题设置">
            <ThemeSetting></ThemeSetting>
          </NTabPane>
          <NTabPane name="2" :tab="数据清理设置">
            <DataClearSetting></DataClearSetting>
          </NTabPane>
          <NTabPane name="3" :tab="功能设置">
            <FunctionSetting></FunctionSetting>
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss"></style>
