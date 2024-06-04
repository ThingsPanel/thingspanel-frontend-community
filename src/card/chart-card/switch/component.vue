<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { getWebsocketServerUrl } from '@/utils/common/tool';
import { deviceDatas, deviceDetail } from './api';

const active: any = ref(false);
const props = defineProps<{
  card: ICardData;
}>();
const socket: any = ref(null);
const detail: any = ref(null);
// sendMessage()
const setSeries: (obj: any) => void = async obj => {
  const arr: any = props?.card?.dataSource;
  const querDetail = {
    device_id: obj.deviceSource[0]?.deviceId ?? '',
    keys: arr.deviceSource[0].metricsId
  };
  if (querDetail.device_id && querDetail.keys) {
    detail.value = await deviceDetail(querDetail);
    const queryInfo = {
      device_id: obj.deviceSource[0]?.deviceId ?? '',
      keys: [arr.deviceSource[0].metricsId || 'externalVol'],
      token: localStg.get('token')
    };
    console.log(arr.deviceSource[0].metricsId, '11');
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(queryInfo)); // 将对象转换为JSON字符串后发送
    } else {
      console.error('WebSocket连接未建立或已关闭');
    }
  } else {
    console.log('WebSocket连接未建立或已关闭');
  }
};

const fun: () => void = () => {
  let wsUrl = getWebsocketServerUrl();
  wsUrl += `/telemetry/datas/current/keys/ws`;
  socket.value = new WebSocket(wsUrl); // 替换为你的WebSocket URL

  socket.value.onopen = () => {
    setSeries(props?.card?.dataSource);
    console.log('WebSocket连接已打开');
  };

  socket.value.onmessage = event => {
    const receivedData = JSON.parse(event.data);
    active.value = receivedData.switch !== 0;
    // console.log('接收到数据:', receivedData);
    // 在这里处理接收到的数据
  };

  socket.value.onerror = error => {
    console.error('WebSocket错误:', error);
  };

  socket.value.onclose = () => {
    console.log('WebSocket连接已关闭');
  };
};

const clickSwitch: () => void = async () => {
  const arr: any = props?.card?.dataSource;
  const device_id = arr.deviceSource[0]?.deviceId ?? '';
  if (device_id && device_id !== '') {
    console.log(arr.deviceSource[0], '测试4');
    const obj = {
      device_id,
      value: JSON.stringify({
        switch: active.value ? 1 : 0
      })
    };
    await deviceDatas(obj);
    fun();
  } else {
    console.log('查询不到设备');
  }
};

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props?.card?.dataSource);
  },
  { deep: true }
);
onMounted(() => {
  fun();
});
onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});
</script>

<template>
  <div class="box">
    <div>
      <!-- {{  props?.card?.dataSource?.deviceSource[0] }} -->
      <n-switch v-model:value="active" @change="clickSwitch" />
      <div class="switch">{{ $t('generate.switch') }}</div>
    </div>
  </div>
</template>

<style lang="scss">
.box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .switch {
    margin-top: 20px;
    text-align: center;
  }
}
</style>
