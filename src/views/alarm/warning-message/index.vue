<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 15:24:25
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 16:43:27
-->
<script setup lang="tsx">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useAuthStore } from '@/store/modules/auth'
import AlarmConfiguration from './components/alarm-configuration.vue'
import NewInformation from './components/new-information.vue'

const authStore = useAuthStore()
const canManageAlarm = computed(() => ['SYS_ADMIN', 'TENANT_ADMIN'].includes(authStore.userInfo.authority))
</script>

<template>
  <div class="table-box">
    <NCard :title="$t('generate.alarm-center')">
      <n-tabs type="line" size="large">
        <n-tab-pane :name="$t('generate.alarmInfo')" :tag="$t('generate.alarmInfo')">
          <AlarmConfiguration />
        </n-tab-pane>
        <n-tab-pane v-if="canManageAlarm" :name="$t('generate.alarmConfig')" :tag="$t('generate.alarmConfig')">
          <NewInformation />
        </n-tab-pane>
      </n-tabs>
    </NCard>
  </div>
</template>

<style scoped></style>
