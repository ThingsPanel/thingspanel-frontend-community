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
console.log(activeModule.value.label);
const bgThemeColor = computed(() =>
  themeStore.darkMode ? getColorPalette(themeStore.themeColor, 7) : themeStore.themeColor
);

const bgColor = computed(() => {
  const COLOR_WHITE = '#ffffff';

  const ratio = themeStore.darkMode ? 0.5 : 0.2;

  return mixColor(COLOR_WHITE, themeStore.themeColor, ratio);
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

// 监听标题变化
watch(moduleTitle, newTitle => {
  useTitle(newTitle);
});
</script>

<template>
  <div class="relative size-full flex-center overflow-hidden" :style="{ backgroundColor: bgColor }">
    <!--
 <div class="absolute left-48px top-24px z-99">
      <div class="flex-center">
        <ThemeSchemaSwitch
          :theme-schema="themeStore.themeScheme"
          :show-tooltip="false"
          @switch="themeStore.toggleThemeScheme"
        />

        <LangSwitch
          :lang="appStore.locale"
          :lang-options="appStore.localeOptions"
          :show-tooltip="false"
          @change-lang="appStore.changeLocale"
        />
      </div>
    </div> 
-->

    <!--    <WaveBg :theme-color="bgThemeColor" />-->
    <NCard :bordered="false" class="relative z-4 w-auto rd-12px">
      <div class="w-400px lt-sm:w-300px">
        <header class="flex-y-center justify-between">
          <SystemLogo class="text-64px text-primary lt-sm:text-48px" width="70" />
          <h3 class="ml--8 mt--4 text-28px text-primary font-500 lt-sm:text-22px">{{ $t('system.title') }}</h3>
          <div class="i-flex-col">
            <ThemeSchemaSwitch
              :theme-schema="themeStore.themeScheme"
              :show-tooltip="false"
              class="text-20px lt-sm:text-18px"
              @switch="themeStore.toggleThemeScheme"
            />
            <LangSwitch
              :lang="appStore.locale"
              :lang-options="appStore.localeOptions"
              :show-tooltip="false"
              @change-lang="appStore.changeLocale"
            />
          </div>
        </header>
        <main class="pt-24px">
          <h3 class="text-18px text-primary font-medium">{{ $t(activeModule.label as any) }}</h3>
          <div class="pt-24px">
            <Transition :name="themeStore.page.animateMode" mode="out-in" appear>
              <component :is="activeModule.component" />
            </Transition>
          </div>
        </main>
      </div>
    </NCard>
    <LoginBg :theme-color="bgThemeColor" :sys-setting="sysSetting" />
  </div>
</template>

<style scoped></style>
