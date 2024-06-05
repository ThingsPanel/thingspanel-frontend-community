<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useWebSocket } from '@vueuse/core';
import { debounce } from 'lodash';
import { router } from '@/router';
import { fetchHomeData } from '@/service/api';
import type { ICardRender, ICardView } from '@/components/panel/card';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { getWebsocketServerUrl } from '@/utils/common/tool';

const layout = ref<ICardView[]>([]);
const isError = ref<boolean>(false);
const active = ref<boolean>(true);
const cr = ref<ICardRender>();
const socketMap = new Map(); // from device id to socket
const wsUrl = `${getWebsocketServerUrl()}/telemetry/datas/current/keys/ws`;

const getLayout = async () => {
  const { data, error } = await fetchHomeData({});

  isError.value = (error || !(data && data.config)) as boolean;

  if (!isError.value && data) {
    const configJson = JSON.parse(data.config);
    updateConfigData(configJson);
    layout.value = [...configJson, ...layout.value];
  }
};

onMounted(getLayout);

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
        item.data?.type === 'chart'
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

watch(
  () => layout,
  _newLayout => {
    throttledWatcher();
  },
  { deep: true }
);

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
</script>

<template>
  <div v-if="isError" class="h-full w-full flex-center">
    <n-result status="418" :title="$t('custom.home.title')" :description="$t('custom.home.description')">
      <template #footer>
        <n-button
          type="primary"
          :disabled="active"
          @click="
            () => {
              router.go(0);
            }
          "
        >
          <n-countdown
            v-if="active"
            :duration="60000"
            :render="props => props.seconds + 's'"
            :active="active"
            @finish="active = false"
          />
          {{ active ? '' : $t('custom.home.refresh') }}
        </n-button>
      </template>
    </n-result>
  </div>

  <!--
 <div v-else>


  </div> 
-->
  <CardRender
    v-else
    ref="cr"
    :layout="layout"
    :is-preview="true"
    :col-num="12"
    :default-card-col="4"
    :row-height="85"
    @update:layout="
      data => {
        nextTick(() => {
          layout = data;
        });
      }
    "
  />
</template>

<style scoped></style>
