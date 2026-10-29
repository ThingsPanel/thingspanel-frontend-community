<script setup lang="ts">
import { $t } from '@/locales'
import FunctionSetting from './components/function-setting.vue'
import DataClearSetting from './components/data-clear-setting.vue'
import AuthenticationSetting from './components/authentication-setting.vue'
import { useAuthStore } from '@/store/modules/auth'
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
const auth = useAuthStore()
const { locale } = useI18n()
const route = useRoute()
const activeTab = ref(route.query.authTest || route.query.tab === 'authentication' ? 'authentication' : 'data-clear')
</script>

<template>
  <div class="overflow-hidden">
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="data-clear" :tab="$t('page.manage.setting.dataClearSetting.title')">
            <DataClearSetting></DataClearSetting>
          </NTabPane>
          <NTabPane name="function" :tab="$t('custom.management.configSetting')">
            <FunctionSetting></FunctionSetting>
          </NTabPane>
          <NTabPane
            v-if="auth.userInfo.authority === 'SYS_ADMIN'"
            name="authentication"
            :tab="locale.toLowerCase().startsWith('zh') ? '登录与认证' : 'Sign-in and authentication'"
          >
            <AuthenticationSetting />
          </NTabPane>
        </NTabs>
      </div>
    </NCard>
  </div>
</template>

<style lang="scss"></style>
