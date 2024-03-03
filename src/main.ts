import { createApp, watch } from 'vue';
import './plugins/assets';
import { useSysSettingStore } from '@/store/modules/sys-setting';
import { setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { setupRouter } from './router';
import { i18n, setupI18n } from './locales';
import App from './App.vue';

async function setupApp() {
  setupLoading();

  setupNProgress();

  setupIconifyOffline();

  setupDayjs();

  const app = createApp(App);

  setupStore(app);

  setupI18n(app);
  const sysSettingStore = useSysSettingStore();
  // 确保系统设置在应用启动时加载
  await sysSettingStore.initSysSetting();
  // 监听 system_name 的变化，并根据变化动态更新国际化消息
  watch(
    () => sysSettingStore.system_name,
    newSystemName => {
      const locales = i18n.global.availableLocales;
      locales.forEach(locale => {
        i18n.global.mergeLocaleMessage(locale, {
          system: {
            title: newSystemName
          }
        });
      });
    },
    { immediate: true }
  );
  await setupRouter(app);

  app.mount('#app');
}
setupApp();
