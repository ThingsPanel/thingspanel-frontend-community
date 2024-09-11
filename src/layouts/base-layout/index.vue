<script setup lang="ts">
import { computed, h, onMounted } from 'vue';
import { NButton } from 'naive-ui';
import { AdminLayout, LAYOUT_SCROLL_EL_ID } from '@sa/materials';
import type { LayoutMode } from '@sa/materials';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { useAppStore } from '@/store/modules/app';
import { useThemeStore } from '@/store/modules/theme';
import { localStg } from '@/utils/storage';
import deviceStatusMp3 from '@/assets/audio/device-status.mp3';
import { useRouterPush } from '@/hooks/common/router';
import GlobalHeader from '../modules/global-header/index.vue';
import GlobalSider from '../modules/global-sider/index.vue';
import GlobalTab from '../modules/global-tab/index.vue';
import GlobalContent from '../modules/global-content/index.vue';
import GlobalFooter from '../modules/global-footer/index.vue';
import ThemeDrawer from '../modules/theme-drawer/index.vue';
import { setupMixMenuContext } from '../hooks/use-mix-menu';
const { routerPushByKey } = useRouterPush();
defineOptions({
  name: 'BaseLayout'
});

const appStore = useAppStore();
const themeStore = useThemeStore();

const layoutMode = computed(() => {
  const vertical: LayoutMode = 'vertical';
  const horizontal: LayoutMode = 'horizontal';
  return themeStore.layout.mode.includes(vertical) ? vertical : horizontal;
});

const headerPropsConfig: Record<UnionKey.ThemeLayoutMode, App.Global.HeaderProps> = {
  vertical: {
    showLogo: false,
    showMenu: false,
    showMenuToggler: true
  },
  'vertical-mix': {
    showLogo: false,
    showMenu: false,
    showMenuToggler: false
  },
  horizontal: {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  },
  'horizontal-mix': {
    showLogo: true,
    showMenu: true,
    showMenuToggler: false
  }
};

const headerProps = computed(() => headerPropsConfig[themeStore.layout.mode]);

const siderVisible = computed(() => themeStore.layout.mode !== 'horizontal');

const isVerticalMix = computed(() => themeStore.layout.mode === 'vertical-mix');

const isHorizontalMix = computed(() => themeStore.layout.mode === 'horizontal-mix');

const siderWidth = computed(() => getSiderWidth());

const siderCollapsedWidth = computed(() => getSiderCollapsedWidth());

function getSiderWidth() {
  const { width, mixWidth, mixChildMenuWidth } = themeStore.sider;
  let w = isVerticalMix.value || isHorizontalMix.value ? mixWidth : width;
  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth;
  }
  return w;
}

function getSiderCollapsedWidth() {
  const { collapsedWidth, mixCollapsedWidth, mixChildMenuWidth } = themeStore.sider;
  let w = isVerticalMix.value || isHorizontalMix.value ? mixCollapsedWidth : collapsedWidth;

  if (isVerticalMix.value && appStore.mixSiderFixed) {
    w += mixChildMenuWidth;
  }
  return w;
}

setupMixMenuContext();
let eventSource = null;
let tryNum = 0;
const createEventSource = () => {
  const token = localStg.get('token');
  eventSource = new EventSourcePolyfill(`${import.meta.env.MODE === 'development' ? '/proxy-default' : ''}/events`, {
    heartbeatTimeout: 3 * 60 * 1000, // 这是自定义配置请求超时时间  默认是4500ms(印象中是)
    headers: {
      'x-token': token
    }
  });
};
onMounted(() => {
  createEventSource();
  if (eventSource) {
    eventSource.onopen = () => {
      console.log('SSE连接已建立');
      tryNum = 0;
    };

    eventSource.addEventListener(
      'device_online',
      event => {
        const data = event.data ? JSON.parse(event.data) : {};
        if (data.is_online) {
          window.$notification?.success({
            title: `${data.device_name}设备已连接`,

            duration: 5000,

            action: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'default',
                  onClick: () => {
                    routerPushByKey('device_details', {
                      query: {
                        d_id: data.device_id
                      }
                    });
                  }
                },
                {
                  default: () => '点击进入设备详情页面'
                }
              )
          });
        } else {
          window.$notification?.info({
            title: `${data.device_name}设备断开连接`,

            duration: 5000,
            action: () =>
              h(
                NButton,
                {
                  text: true,
                  type: 'default',
                  onClick: () => {
                    routerPushByKey('device_details', {
                      query: {
                        d_id: data.device_id
                      }
                    });
                  }
                },
                {
                  default: () => '点击进入设备详情页面'
                }
              )
          });
        }
        //         // 创建一个新的Audio对象
        const audio = new Audio(deviceStatusMp3);

        //  // 播放音乐
        audio.play();
      },
      false
    );
    eventSource.onerror = error => {
      console.error('SSE error:', error);
      eventSource.close();
      if (tryNum < 3) {
        tryNum += 1;
        createEventSource();
      }
    };
  }
});
</script>

<template>
  <AdminLayout
    v-model:sider-collapse="appStore.siderCollapse"
    :mode="layoutMode"
    :scroll-el-id="LAYOUT_SCROLL_EL_ID"
    :scroll-mode="themeStore.layout.scrollMode"
    :is-mobile="appStore.isMobile"
    :full-content="appStore.fullContent"
    :fixed-top="themeStore.fixedHeaderAndTab"
    :header-height="themeStore.header.height"
    :tab-visible="themeStore.tab.visible"
    :tab-height="themeStore.tab.height"
    :content-class="appStore.contentXScrollable ? 'overflow-x-hidden' : ''"
    :sider-visible="siderVisible"
    :sider-width="siderWidth"
    :sider-collapsed-width="siderCollapsedWidth"
    :footer-visible="themeStore.footer.visible"
    :fixed-footer="themeStore.footer.fixed"
    :right-footer="themeStore.footer.right"
  >
    <template #header>
      <GlobalHeader v-bind="headerProps" />
    </template>
    <template #tab>
      <GlobalTab />
    </template>
    <template #sider>
      <GlobalSider />
    </template>
    <GlobalContent />
    <ThemeDrawer />
    <template #footer>
      <GlobalFooter />
    </template>
  </AdminLayout>
</template>

<style lang="scss">
#__SCROLL_EL_ID__ {
  @include scrollbar();
}
</style>
