<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useTitle } from '@vueuse/core'
import { NEllipsis, NSpin } from 'naive-ui'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { useThemeStore } from '@/store/modules/theme'
import { loginModuleRecord } from '@/constants/app'
import { useSysSettingStore } from '@/store/modules/sys-setting'
import { fetchTenantSetupState } from '@/service/api/auth'
import PwdLogin from './modules/pwd-login.vue'
import CodeLogin from './modules/code-login.vue'
import Register from './modules/register.vue'
import RegisterByEmail from './modules/register-email.vue'
import RegisterSuperAdmin from './modules/register-super-admin.vue'
import ResetPwd from './modules/reset-pwd.vue'
import BindWechat from './modules/bind-wechat.vue'
import LoginBg from './modules/login-bg.vue'

interface Props {
  /** The login module */
  module?: UnionKey.LoginModule
}

const props = withDefaults(defineProps<Props>(), {
  module: 'pwd-login'
})

const appStore = useAppStore()
const themeStore = useThemeStore()
const sysSetting = useSysSettingStore()
const searchParams = new URLSearchParams(window.location.search)

// 首次安装/注册状态
const setupState = ref<{
  has_admin: boolean
  entry: 'login' | 'register'
  market_base_url?: string
  market_register_url?: string
} | null>(null)
const loading = ref(true)
const redirectingToMarket = ref(false)
const returnedFromMarket = computed(() => searchParams.get('market_registered') === '1')
const marketEmail = computed(() => searchParams.get('market_email')?.trim() || '')
const marketSource = computed(() => searchParams.get('market_source')?.trim() || 'horizon')

interface LoginModule {
  key: UnionKey.LoginModule
  label: string
  component: Component
}

const modules: LoginModule[] = [
  { key: 'pwd-login', label: loginModuleRecord['pwd-login'], component: PwdLogin },
  { key: 'code-login', label: loginModuleRecord['code-login'], component: CodeLogin },
  { key: 'register', label: loginModuleRecord.register, component: Register },
  { key: 'register-email', label: loginModuleRecord.register, component: RegisterByEmail },
  { key: 'register-super-admin', label: loginModuleRecord.register, component: RegisterSuperAdmin },
  { key: 'reset-pwd', label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  { key: 'bind-wechat', label: loginModuleRecord['bind-wechat'], component: BindWechat }
]

const fallbackMarketUrl = import.meta.env.VITE_MARKET_URL || 'https://r.thingspanel.cn'

const normalizeMarketUrl = (baseUrl?: string) => {
  const url = baseUrl?.trim()
  if (!url) return fallbackMarketUrl
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')) {
    return fallbackMarketUrl
  }
  return url
}

// 检查首次安装状态
const loadSetupState = async () => {
  try {
    const res = await fetchTenantSetupState()
    setupState.value = res.data ?? {
      has_admin: true,
      entry: 'login'
    }
  } catch {
    setupState.value = {
      has_admin: true,
      entry: 'login'
    }
  } finally {
    if (setupState.value && !setupState.value.has_admin) {
      if (returnedFromMarket.value) {
        loading.value = false
      } else {
        redirectToMarketRegister()
      }
    } else {
      loading.value = false
    }
  }
}

// 初始检查
onMounted(() => {
  loadSetupState()
})

const marketRegisterUrl = computed(() =>
  normalizeMarketUrl(setupState.value?.market_register_url || setupState.value?.market_base_url)
)

const buildMarketRegisterUrl = () => {
  const base = marketRegisterUrl.value
  const url = base.endsWith('/register') ? new URL(base) : new URL('/register', base)
  url.searchParams.set('callback', window.location.href)
  url.searchParams.set('return_to', window.location.href)
  return url.toString()
}

const redirectToMarketRegister = () => {
  if (redirectingToMarket.value) return

  try {
    redirectingToMarket.value = true
    window.location.replace(buildMarketRegisterUrl())
  } catch (error) {
    console.error('Failed to redirect to market register:', error)
    redirectingToMarket.value = false
    loading.value = false
  }
}

// 默认显示的模块
const defaultModule = computed(() => {
  return 'pwd-login'
})

// 实际使用的 module（支持 props 覆盖）
const effectiveModule = computed(() => {
  if (props.module && props.module !== 'pwd-login') {
    return props.module
  }
  if (setupState.value && !setupState.value.has_admin && returnedFromMarket.value) {
    return 'register-super-admin'
  }
  return defaultModule.value
})

const activeModule = computed(() => {
  const findItem = modules.find(item => item.key === effectiveModule.value)
  return findItem || modules[0]
})

const activeModuleProps = computed(() => {
  if (activeModule.value.key === 'register-super-admin') {
    return {
      marketUrl: normalizeMarketUrl(setupState.value?.market_register_url || setupState.value?.market_base_url),
      marketEmail: marketEmail.value,
      marketRegistered: returnedFromMarket.value,
      marketSource: marketSource.value
    }
  }

  return {}
})

// 计算当前模块的标题
const moduleTitle = computed(() => {
  switch (effectiveModule.value) {
    case 'pwd-login':
      return $t('page.login.pwdLogin.title')
    case 'register-email':
      return $t('page.login.register.title')
    case 'register-super-admin':
      return '完成初始化'
    case 'reset-pwd':
      return $t('page.login.resetPwd.title')
    case 'code-login':
      return $t('page.login.codeLogin.title')
    default:
      return $t('page.login.pwdLogin.title')
  }
})

// 卡片背景色
const cardBgColor = computed(() => {
  if (themeStore.darkMode) {
    return 'rgba(31, 41, 55, 0.95)'
  }
  return 'rgba(255, 255, 255, 0.95)'
})

// 边框颜色
const borderColor = computed(() => {
  if (themeStore.darkMode) {
    return '#374151'
  }
  return '#e5e7eb'
})

// 监听标题变化
watch(moduleTitle, newTitle => {
  useTitle(newTitle)
})
</script>

<template>
  <div
    class="relative size-full flex-center overflow-hidden min-h-screen"
    :style="{
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif',
      background: sysSetting.home_background
        ? 'none'
        : themeStore.darkMode
          ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #111827 100%)'
          : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)'
    }"
  >
    <!-- 使用 LoginBg 组件显示后端配置的背景图片 -->
    <LoginBg v-if="sysSetting.home_background" :themeColor="themeStore.themeColor" :sysSetting="sysSetting" />

    <!-- 默认背景动画效果 -->
    <div v-else class="bg-animation">
      <div class="bg-animation-inner" :class="{ 'dark-theme': themeStore.darkMode }"></div>
    </div>

    <!-- Loading / redirect 状态 -->
    <div v-if="loading || redirectingToMarket" class="flex-center">
      <n-spin size="large" />
    </div>

    <!-- 登录卡片 -->
    <div
      v-if="!loading"
      class="relative z-10 w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500"
      :style="{
        width: '380px',
        background: cardBgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: themeStore.darkMode ? '0 20px 60px rgba(0, 0, 0, 0.3)' : '0 20px 60px rgba(0, 0, 0, 0.1)'
      }"
    >
      <!-- 顶部控制栏 -->
      <div class="flex justify-end gap-2 mb-4">
        <button
          class="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border transition-all duration-200 hover:scale-105"
          :style="{
            background: themeStore.darkMode ? '#374151' : '#f9fafb',
            border: `1px solid ${borderColor}`,
            color: themeStore.darkMode ? '#d1d5db' : '#6b7280'
          }"
          @click="themeStore.toggleThemeScheme"
        >
          <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path v-if="themeStore.darkMode" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            <path
              v-else
              d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
            />
          </svg>
        </button>
        <button
          class="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border transition-all duration-200 hover:scale-105"
          :style="{
            background: themeStore.darkMode ? '#374151' : '#f9fafb',
            border: `1px solid ${borderColor}`,
            color: themeStore.darkMode ? '#d1d5db' : '#6b7280'
          }"
          @click="appStore.changeLocale(appStore.locale === 'zh-CN' ? 'en-US' : 'zh-CN')"
        >
          <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path
              d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
            />
          </svg>
          <span>{{ appStore.locale === 'zh-CN' ? '中文' : 'EN' }}</span>
        </button>
      </div>

      <!-- Logo区域 -->
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 shadow-lg transition-transform duration-300 hover:scale-110"
          :style="{ background: themeStore.themeColor }"
        >
          <SystemLogo width="32" class="text-white" />
        </div>
        <div class="title-container">
          <n-ellipsis
            :line-clamp="2"
            class="text-xl font-semibold mb-1 title-artistic"
            :style="{
              color: themeStore.darkMode ? '#f9fafb' : '#1f2937',
              lineHeight: '1.4',
              letterSpacing: '0.02em',
              textAlign: 'center'
            }"
          >
            {{ $t('system.title') }}
          </n-ellipsis>
        </div>
        <p class="text-xs opacity-60" :style="{ color: themeStore.darkMode ? '#9ca3af' : '#6b7280' }">
          {{ $t('system.description') }}
        </p>
      </div>

      <!-- 表单区域 -->
      <div class="space-y-6">
        <!-- <h2
          class="text-lg font-medium text-center"
          :style="{ color: themeStore.darkMode ? '#f9fafb' : '#1f2937' }"
        >
          {{ $t(activeModule.label as any) }}
        </h2> -->

        <div class="transition-all duration-300">
          <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
            <component :is="activeModule.component" v-bind="activeModuleProps" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 背景动画效果 */
.bg-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  opacity: 0.6;
}

.bg-animation-inner::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: bgFloat 10s ease-in-out infinite;
}

.bg-animation-inner.dark-theme::before {
  background:
    radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
}

@keyframes bgFloat {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 进入动画 */
@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: slide-in-from-bottom 0.5s ease-out;
}

/* 标题容器样式 */
.title-container {
  position: relative;
  margin: 0 auto;
  text-align: center;
  max-width: 90%;
}

/* 移除了横线装饰
.title-container::before,
.title-container::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 15%;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
}

.title-container::before {
  left: 0;
  transform: translateX(-50%);
}

.title-container::after {
  right: 0;
  transform: translateX(50%);
}
*/

/* 标题艺术化样式 */
.title-artistic {
  word-break: break-word;
  hyphens: auto;
  display: block;
  padding: 0 1em;
  text-align: center;
  line-height: 1.4;
  letter-spacing: 0.02em;
}

.title-artistic::first-line {
  font-size: 0.9em;
}

.title-artistic::first-letter {
  font-size: 1.2em;
}

/* 响应式适配 */
@media (max-width: 640px) {
  .size-full {
    padding: 1rem;
  }

  .title-container {
    max-width: 95%;
  }

  .title-container::before,
  .title-container::after {
    width: 10%;
  }

  .title-artistic {
    font-size: 1rem;
    padding: 0 0.5em;
  }

  .title-artistic::first-line {
    font-size: 0.85em;
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
