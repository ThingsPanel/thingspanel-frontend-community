import { createApp, watch } from 'vue';
import './plugins/assets';
import { useSysSettingStore } from '@/store/modules/sys-setting';
import { setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { setupStore } from './store';
import { router, setupRouter } from './router';
import { i18n, setupI18n } from './locales';
import App from './App.vue';

// 定义 localStorage 的 key
const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES';
const MAX_RECENT_ROUTES = 8;

// 1. 定义需要排除的路径列表
const excludedPaths = ['/login', '/404','/home','/visualization/kanban-details']; // 你可以根据需要添加更多路径

async function setupApp() {
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
  setupLoading();
  setupNProgress();
  setupIconifyOffline();
  setupDayjs();
  await setupRouter(app);

  // 添加路由后置守卫
  router.afterEach((to) => {
    // 1. 添加排除路径判断
    if (excludedPaths.includes(to.path)) {
      return;
    }

    // 简单过滤掉没有名称或者 title 的路由，以及重定向的路由
    if (!to.name || !to.meta?.title || to.redirectedFrom) {
      return;
    }

    try {
      const routesRaw = localStorage.getItem(RECENTLY_VISITED_ROUTES_KEY);
      let recentRoutes = routesRaw ? JSON.parse(routesRaw) : [];

      // 移除已存在的相同路由 (基于 path 判断)
      // 注意：如果你希望带不同 query 的同一路径视为不同项，则需要修改此过滤逻辑
      recentRoutes = recentRoutes.filter(route => route.path !== to.path);
      // console.log('recentRoutes',to);
      
      // 添加新路由到列表开头
      recentRoutes.unshift({
        path: to.path,
        name: to.name,
        title: to.meta.title,
        i18nKey:to.meta.i18nKey,
        icon:to.meta.icon,
        query: to.query // 2. 保存 query 参数
      });

      // 限制列表长度
      if (recentRoutes.length > MAX_RECENT_ROUTES) {
        recentRoutes = recentRoutes.slice(0, MAX_RECENT_ROUTES);
      }

      // 保存回 localStorage
      localStorage.setItem(RECENTLY_VISITED_ROUTES_KEY, JSON.stringify(recentRoutes));
    } catch (error) {
      console.error('处理最近访问路由时出错:', error);
    }
  });

  app.config.globalProperties.getPlatform = () => {
    const { appVersion }: any = window.navigator;
    if (['iPhone', 'Android', 'iPad'].includes(appVersion) || window.innerWidth < 680) {
      return true;
    }
    return false;
  };
  app.mount('#app');
}

setupApp();
