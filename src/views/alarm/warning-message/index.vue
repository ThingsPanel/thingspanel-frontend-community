<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 15:24:25
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 16:43:27
-->
<script setup lang="tsx">
import { $t } from '@/locales'
import AlarmConfiguration from './components/alarm-configuration.vue'
import NewInformation from './components/new-information.vue'
</script>

<template>
  <div class="table-box">
    <NCard :title="告警中心">
      <n-tabs type="line" size="large">
        <n-tab-pane :name="告警信息" :tag="告警信息">
          <AlarmConfiguration />
        </n-tab-pane>
        <n-tab-pane :name="告警配置" :tag="告警配置">
          <NewInformation />
        </n-tab-pane>
      </n-tabs>
    </NCard>
  </div>
</template>

<style scoped></style>
