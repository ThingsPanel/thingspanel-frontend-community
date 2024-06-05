<script lang="tsx" setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useDialog } from 'naive-ui';
import { useFullscreen, useWebSocket } from '@vueuse/core';
import { debounce } from 'lodash';
// eslint-disable-next-line vue/prefer-import-from-vue
import type { UnwrapRefSimple } from '@vue/reactivity';
import type { ICardData, ICardFormIns, ICardRender, ICardView } from '@/components/panel/card';
import { PutBoard, deviceTemplateSelect, getBoard } from '@/service/api';
import { localStg } from '@/utils/storage';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import { getWebsocketServerUrl } from '@/utils/common/tool';

const dialog = useDialog();

const props = defineProps<{ panelId: string }>();
const panelDate = ref<Panel.Board>();
const cr = ref<ICardRender>();
const fullui = ref();

const socketMap = new Map(); // from device id to socket

const showingCardList = ref(false);
const isEditing = ref(false);
const editingCard = ref(false);
const deviceOptions = ref<UnwrapRefSimple<any>[]>();

let wsUrl = getWebsocketServerUrl();
wsUrl += '/telemetry/datas/current/keys/ws';

const getDeviceOptions = async () => {
  const { data, error } = await deviceTemplateSelect();
  if (!error) {
    deviceOptions.value = data;
  }
};

const { isFullscreen, toggle } = useFullscreen(fullui);
const appStore = useAppStore();
const layout = ref<ICardView[]>([]);
const preLayout = ref<ICardView[]>([]); // 用来保存用户修改前的内容
const fetchBroad = async () => {
  const { data } = await getBoard(props.panelId);
  if (data) {
    panelDate.value = data;
    if (data.config) {
      const configJson = JSON.parse(data.config);
      updateConfigData(configJson);
      layout.value = [...configJson, ...layout.value];
      preLayout.value = layout.value;
    }
  }
};

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * Convert a string to a unique number.
 *
 * @param str
 * @returns
 */
function stringToUniqueNumber(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = hash * 31 + str.charCodeAt(i);
  }
  return hash;
}

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * The attribute "i" of each config data may be a string instead of a number, so we need to convert it to a unique
 * number to avoid Vue's warning.
 *
 * @param configJson
 */
function updateConfigData(configJson: ICardView[]) {
  for (const item of configJson) {
    if (typeof item.i === 'string') {
      item.i = stringToUniqueNumber(item.i);
    }
  }
}

const state = reactive({
  cardData: null as null | ICardData
});

const editView = ref<ICardView | null>();
const formRef = ref<ICardFormIns>();

const toEditMode = () => {
  isEditing.value = true;
};

const quitEditMode = () => {
  if (JSON.stringify(layout.value) !== JSON.stringify(preLayout.value)) {
    dialog.warning({
      title: '您尚未保存，确定退出编辑？',
      positiveText: $t('device_template.confirm'),
      negativeText: $t('common.cancel'),
      onPositiveClick: () => {
        isEditing.value = false;
        layout.value = preLayout.value;
      }
    });
  } else {
    isEditing.value = false;
  }
};

const setComponentsValue = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
  const cardViews = layout.value.filter(
    item =>
      item.data?.dataSource?.deviceSource?.[0]?.deviceId === deviceId &&
      item.data?.dataSource?.deviceSource?.[0]?.metricsId === metricsId
  );
  for (const cardView of cardViews) {
    const cardComponent = cr.value?.getCardComponent(cardView)?.getComponent();
    cardComponent?.updateData && cardComponent?.updateData(deviceId, metricsId, data);
  }
};

const token = localStg.get('token');

/**
 * First, get all unique device ids from the layout. Then check socketMap, if a device id in socketMap is not in the
 * unique device ids, close the socket. Then, for each unique device id, check if there is a socket in socketMap, if
 * not, create a new socket. if yes, close the socket and create a new socket.
 */
const updateComponentsData = async () => {
  console.log('updateComponentsData enter');

  // 去除重复设备
  const deviceMetricsIds = layout.value
    .filter(
      item =>
        item.data?.dataSource?.deviceSource &&
        item.data?.dataSource?.deviceSource[0]?.deviceId &&
        item.data?.dataSource?.deviceSource[0]?.metricsId &&
        cr.value?.getCardComponent(item)?.getComponent()?.updateData
    )
    .map(
      item =>
        `${item.data?.dataSource?.deviceSource?.[0]?.deviceId}|${item.data?.dataSource?.deviceSource?.[0]?.metricsId}`
    );
  const set = new Set(deviceMetricsIds);
  const uniqueDeviceMetricsIds = [...set];
  console.log('uniqueDeviceMetricsIds', uniqueDeviceMetricsIds);

  // 关闭不在layout中的socket
  for (const [deviceMetricsId, socket] of socketMap.entries()) {
    if (!uniqueDeviceMetricsIds.includes(deviceMetricsId)) {
      console.log('close socket', deviceMetricsId);
      socket.close();
      socketMap.delete(deviceMetricsId);
    }
  }

  // 创建新的socket
  for (const deviceMetricsId of uniqueDeviceMetricsIds) {
    const [deviceId, metricsId] = deviceMetricsId.split('|');
    if (!socketMap.has(deviceMetricsId)) {
      console.log('create socket', deviceMetricsId);
      const { ws, send } = useWebSocket(wsUrl, {
        heartbeat: {
          message: 'ping',
          interval: 8000,
          pongTimeout: 3000
        },
        onMessage(_websocket: WebSocket, event: MessageEvent) {
          if (event.data && event.data !== 'pong') {
            const data = JSON.parse(event.data);
            console.log(`get event data: ${deviceMetricsId} ${event.data}`);
            setComponentsValue(deviceId, metricsId, data);
          }
        },
        onConnected() {
          console.log('ws connected');
          const dataw = {
            // eslint-disable-next-line no-constant-binary-expression
            device_id: deviceId,
            keys: [metricsId],
            token
          };
          console.log('ws send data', JSON.stringify(dataw));
          send(JSON.stringify(dataw));
        }
      });
      socketMap.set(deviceMetricsId, ws.value);
    }
  }
};

const throttledWatcher = debounce(() => {
  updateComponentsData();
}, 300);

const insertCard = (card: ICardData) => {
  cr.value?.addCard(card);
  editView.value = null;
  state.cardData = null;
  toEditMode();
};

const updateCard = (card: ICardData) => {
  if (editView.value) {
    editView.value.data = card;
    throttledWatcher();
  }
};

const updateLayoutData = (data: ICardView[]) => {
  nextTick(() => {
    layout.value = data;
  });
};

const edit = (view: ICardView) => {
  editingCard.value = true;

  editView.value = view;
  state.cardData = view.data || null;

  nextTick(() => {
    formRef.value?.setCard(state.cardData as any);
  });
};
const showCardList = () => {
  showingCardList.value = true;
};

const savePanel = async () => {
  const layoutJson = JSON.stringify(layout.value);

  await PutBoard({
    id: props.panelId,
    config: layoutJson,
    name: panelDate.value?.name,
    home_flag: panelDate.value?.home_flag
  });

  preLayout.value = layout.value;
};

watch(
  () => layout,
  newLayout => {
    console.log('layout change', newLayout);
    throttledWatcher();
  },
  { deep: true }
);

onMounted(() => {
  fetchBroad();
  getDeviceOptions();
});

onUnmounted(() => {
  for (const [deviceMetricsId, socket] of socketMap.entries()) {
    console.log('close socket', deviceMetricsId);
    socket.close();
  }
  socketMap.clear();
});
</script>

<template>
  <div class="w-full px-5 py-5">
    <div
      v-show="!appStore.fullContent"
      class="flex items-center justify-between border-b border-gray-200 px-10px pb-3 dark:border-gray-200/10"
    >
      <div>
        <!--
        <<NButton @click="router.go(-1)">
          <SvgIcon icon="ep:back" class="mr-0.5 text-lg" />
          {{ $t('page.login.common.back') }}
        </NButton>
-->
        <NSpace align="center">
          <span class="text-14px font-medium line-height-normal">看板：{{ panelDate?.name }}</span>
          <NButton v-show="isEditing" @mouseover="showCardList">
            <SvgIcon icon="material-symbols:add" class="mr-0.5 text-lg" />
            {{ $t('generate.add-component') }}
          </NButton>
        </NSpace>
      </div>
      <NSpace align="center">
        <!--        <NButton>-->
        <!--          <SvgIcon icon="material-symbols:settings-outline" class="mr-0.5 text-lg" />-->
        <!--        </NButton>-->
        <NDivider vertical />
        <NButton v-if="!isEditing" @click="toEditMode">
          <SvgIcon icon="material-symbols:edit" class="mr-0.5 text-lg" />
          {{ $t('generate.edit') }}
        </NButton>
        <NButton v-if="isEditing" @click="quitEditMode">退出编辑</NButton>
        <NButton v-show="isEditing" @click="savePanel">{{ $t('common.save') }}</NButton>
        <FullScreen
          :full="isFullscreen"
          @click="
            () => {
              toggle();
            }
          "
        />
      </NSpace>
    </div>
    <div ref="fullui" class="h-edit-area flex bg-white">
      <n-drawer
        v-model:show="showingCardList"
        :width="300"
        placement="left"
        :show-mask="false"
        style="box-shadow: 0 8px 16px 0 rgba(156, 107, 255, 0.4)"
      >
        <n-drawer-content title="卡片列表" class="shadow-sm" closable>
          <CardSelector v-if="showingCardList" class="h-full w-full overflow-auto" @select-card="insertCard" />
        </n-drawer-content>
      </n-drawer>

      <div class="h-full flex-1 overflow-auto">
        <div v-if="!layout.length" class="text-center text-gray-500 dark:text-gray-400">
          <NEmpty :description="$t('common.componentsAddedYet')"></NEmpty>
        </div>
        <CardRender
          ref="cr"
          :layout="layout"
          :is-preview="!isEditing"
          :col-num="12"
          :default-card-col="4"
          :row-height="85"
          @edit="edit"
          @update:layout="
            data => {
              console.log('panel manage update layout', data);
              updateLayoutData(data);
            }
          "
        />
      </div>

      <n-drawer
        v-model:show="editingCard"
        :width="500"
        placement="right"
        :show-mask="false"
        style="box-shadow: 0 8px 16px 0 rgba(156, 107, 255, 0.4)"
      >
        <n-drawer-content title="卡片配置" class="shadow-sm" closable>
          <CardForm
            ref="formRef"
            class="h-full w-full overflow-auto"
            :device-web-chart-config="[]"
            @update="(data: any) => updateCard(data)"
          />
        </n-drawer-content>
      </n-drawer>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel {
  @apply border border-transparent;
}
.h-content {
  height: calc(100% - 48px);
}
.h-edit-area {
  height: calc(100% - 30px);
}
</style>
