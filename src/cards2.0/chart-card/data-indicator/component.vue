<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useWebSocket } from '@vueuse/core';
// import {ClipboardCode20Regular} from '@vicons/fluent';
import { localStg } from '@/utils/storage';
import type { CardData } from '@/components/tp-kan-ban/kan-ban';
import { getWebsocketServerUrl } from '@/utils/common/tool';
import { deviceDetail } from '../api';
import icons from './icon';

const iconMap = new Map(icons.map(c => [c.name, c.value]));
// 正式环境可根据api获取
const value = ref(1);
const detail: any = ref(null);
const intervalNum = ref();
const props = defineProps<{
  card: CardData;
  // mode: IConfigCtx['view'];
}>();

let wsUrl = getWebsocketServerUrl();
wsUrl += `/telemetry/datas/current/keys/ws`;
// eslint-disable-next-line no-constant-binary-expression
const keys = ['externalVol' || props?.card?.config?.source?.dataSource?.deviceSource?.[0]?.metricsId];
const { data, send, close } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  }
});

if (
  props?.card?.config?.source?.dataSource?.deviceSource &&
  props?.card?.config?.source?.dataSource?.deviceSource?.[0]?.deviceId
) {
  const token = localStg.get('token');
  const dataw = {
    // eslint-disable-next-line no-constant-binary-expression
    device_id: props?.card?.config?.source?.dataSource?.deviceSource?.[0]?.deviceId,
    keys,
    token
  };
  send(JSON.stringify(dataw));
}

watch(
  () => data.value,
  newVal => {
    if (newVal === 'pong') {
      console.log('心跳');
    } else {
      value.value = JSON.parse(newVal)[keys[0]] as number;
      console.log(newVal);
    }
  }
);

const setSeries: (dataSource) => void = async dataSource => {
  const arr: any = dataSource;
  const querDetail = {
    device_id: dataSource?.deviceSource?.[0]?.deviceId ?? '',
    keys: arr?.deviceSource?.[0]?.metricsId
  };
  if (querDetail.device_id && querDetail.keys) {
    detail.value = await deviceDetail(querDetail);
  } else {
    // window.$message?.error("查询不到设备");
  }
};

watch(
  () => props.card?.config?.source?.dataSource?.deviceSource,
  () => {
    setSeries(props.card?.config?.source?.dataSource);
  },
  { deep: true }
);

onMounted(() => {
  // setSeries(props?.card?.dataSource);
  intervalNum.value = setInterval(() => {
    setSeries(props?.card?.config?.source?.dataSource);
  }, 500);
});

onUnmounted(() => {
  clearInterval(intervalNum.value);
  close();
});
</script>

<template>
  <div class="h-full">
    <div class="h-full flex-col items-center">
      <!--
 <NCard
        v-if="card.dataSource?.origin === 'system'"
        :bordered="false"
        class="box"
      >
-->
      <NCard :bordered="false" class="box">
        <div class="top-data">
          <span class="name">
            {{ card?.config?.source?.deviceSource?.[0]?.metricsName }}
          </span>
        </div>
        <div class="bt-data">
          <NIcon size="58">
            <!--            <ClipboardCode20Regular/>-->
            <component
              :is="iconMap.get(card.config?.cardUI?.icon || 'm1')"
              class="text-58px"
              :style="{ color: card.config?.cardUI?.color }"
            />
          </NIcon>
          <div>
            <span class="value">{{ detail?.data && detail.data[0] ? detail.data[0]?.value : '-1' }}</span>
          </div>
          <span class="unit">{{ detail?.data && detail.data[0] ? detail.data[0]?.unit : '无' }}</span>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.items-center {
  padding: 0;
}

:deep(.n-card__content:first-child) {
  padding-top: 0;
}

.box {
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 10px;
}

.top-data,
.bt-data {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.bt-data {
  margin-top: 20%;
  padding: 0 10%;
  position: relative;
}

.unit {
  position: absolute;
  top: 0;
  right: 30px;
}

.name {
  margin-top: 10px;
  font-size: 18px;
}

.value {
  font-size: calc(100vw * 68 / 1920);
  margin-right: 40px;
}
</style>
