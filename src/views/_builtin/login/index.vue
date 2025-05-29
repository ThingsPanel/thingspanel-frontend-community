<script setup lang="ts">
import { computed, watch } from 'vue';
import type { Component } from 'vue';
import { getColorPalette, mixColor } from '@sa/utils';
import { useTitle } from '@vueuse/core';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { loginModuleRecord } from '@/constants/app';
import { useSysSettingStore } from '@/store/modules/sys-setting';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
import RegisterByEmail from './modules/register-email.vue';
import ResetPwd from './modules/reset-pwd.vue';
import BindWechat from './modules/bind-wechat.vue';
import LoginBg from './modules/login-bg.vue';

interface Props {
  /** The login module */
  module?: UnionKey.LoginModule;
}

const props = withDefaults(defineProps<Props>(), {
  module: 'pwd-login'
});

const appStore = useAppStore();
const themeStore = useThemeStore();
const sysSetting = useSysSettingStore();


interface LoginModule {
  key: UnionKey.LoginModule;
  label: string;
  component: Component;
}

const modules: LoginModule[] = [
  { key: 'pwd-login', label: loginModuleRecord['pwd-login'], component: PwdLogin },
  { key: 'code-login', label: loginModuleRecord['code-login'], component: CodeLogin },
  { key: 'register', label: loginModuleRecord.register, component: Register },
  { key: 'register-email', label: loginModuleRecord.register, component: RegisterByEmail },
  { key: 'reset-pwd', label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  { key: 'bind-wechat', label: loginModuleRecord['bind-wechat'], component: BindWechat }
];

const activeModule = computed(() => {
  const findItem = modules.find(item => item.key === props.module);
  return findItem || modules[0];
});

// 计算当前模块的标题
const moduleTitle = computed(() => {
  switch (props.module) {
    case 'pwd-login':
      return $t('page.login.pwdLogin.title');
    case 'register-email':
      return $t('page.login.register.title');
    case 'reset-pwd':
      return $t('page.login.resetPwd.title');
    case 'code-login':
      return $t('page.login.codeLogin.title');
    default:
      return $t('page.login.pwdLogin.title');
  }
});



// 卡片背景色
const cardBgColor = computed(() => {
  if (themeStore.darkMode) {
    return 'rgba(31, 41, 55, 0.95)';
  }
  return 'rgba(255, 255, 255, 0.95)';
});

// 边框颜色
const borderColor = computed(() => {
  if (themeStore.darkMode) {
    return '#374151';
  }
  return '#e5e7eb';
});

// 监听标题变化
watch(moduleTitle, newTitle => {
  useTitle(newTitle);
});
</script>

<template>
  <div
    class="relative size-full flex-center overflow-hidden min-h-screen"
    :style="{
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif',
      background: themeStore.darkMode
        ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #111827 100%)'
        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)'
    }"
  >
    <!-- 背景动画效果 -->
    <div class="bg-animation">
      <div class="bg-animation-inner" :class="{ 'dark-theme': themeStore.darkMode }"></div>
    </div>

    <!-- 登录卡片 -->
    <div
      class=" relative z-10 w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500"
      :style="{
        width: '400px',
        background: cardBgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: themeStore.darkMode
          ? '0 20px 60px rgba(0, 0, 0, 0.3)'
          : '0 20px 60px rgba(0, 0, 0, 0.1)'
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
            <path v-if="themeStore.darkMode" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            <path v-else d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
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
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
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
        <h1
          class="text-xl font-semibold mb-1"
          :style="{ color: themeStore.darkMode ? '#f9fafb' : '#1f2937' }"
        >
          {{ $t('system.title') }}
        </h1>
        <p
          class="text-xs opacity-60"
          :style="{ color: themeStore.darkMode ? '#9ca3af' : '#6b7280' }"
        >
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
            <component :is="activeModule.component" />
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: bgFloat 10s ease-in-out infinite;
}

.bg-animation-inner.dark-theme::before {
   background: radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
 }

@keyframes bgFloat {
  0%, 100% {
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

/* 响应式适配 */
@media (max-width: 640px) {
  .size-full {
    padding: 1rem;
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
