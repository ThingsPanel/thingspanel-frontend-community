<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { getColorPalette, mixColor } from '@sa/utils';
// import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { loginModuleRecord } from '@/constants/app';
import { useSysSettingStore } from '@/store/modules/sys-setting';
import PwdLogin from './modules/pwd-login.vue';
import CodeLogin from './modules/code-login.vue';
import Register from './modules/register.vue';
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
  { key: 'reset-pwd', label: loginModuleRecord['reset-pwd'], component: ResetPwd },
  { key: 'bind-wechat', label: loginModuleRecord['bind-wechat'], component: BindWechat }
];

const activeModule = computed(() => {
  const findItem = modules.find(item => item.key === props.module);
  return findItem || modules[0];
});

const bgThemeColor = computed(() =>
  themeStore.darkMode ? getColorPalette(themeStore.themeColor, 7) : themeStore.themeColor
);

const bgColor = computed(() => {
  const COLOR_WHITE = '#ffffff';

  const ratio = themeStore.darkMode ? 0.5 : 0.2;

  return mixColor(COLOR_WHITE, themeStore.themeColor, ratio);
});
</script>

<template>
  <div class="relative wh-full flex-center overflow-hidden" :style="{ backgroundColor: bgColor }">
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

    <!--    <WaveBg :theme-color="bgThemeColor" />-->
    <NCard :bordered="false" class="relative z-4 w-auto rd-12px">
      <div class="w-300px sm:w-360px">
        <header class="flex-col-center justify-center">
          <SystemLogo width="80" class="text-60px text-primary <sm:text-64px" />
          <!-- <NGradientText class="mb-6 mt--8" type="primary" :size="28">{{ $t('system.title') }}</NGradientText> -->
        </header>
        <main>
          <!-- <h3 class="text-18px text-primary font-medium">{{ $t('activeModule.label' as any) }}</h3> -->
          <div>
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
