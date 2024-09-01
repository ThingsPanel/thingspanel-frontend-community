<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { NIcon } from 'naive-ui';
import * as ionicons5 from '@vicons/ionicons5';
import type { ICardData } from '@/components/panel/card';
import { $t } from '@/locales';
import { attributeDataPub, commandDataPub, telemetryDataPub } from '@/service/api/device';

const props = defineProps<{
  card: ICardData;
}>();

const cardRef = ref<HTMLElement | null>(null);
const fontSize = ref('14px');
const iconSize = ref('24px');
let resizeObserver: ResizeObserver | null = null;
const deviceName = computed(() => props.card?.dataSource?.deviceSource?.[0]?.name || '设备1');

const config = computed(() => props.card?.config || {});
const buttonIcon = computed(() => (ionicons5 as any)[config.value.iconName || 'Play']);
const buttonIconColor = computed(() => config.value.buttonIconColor || '#fff');
const buttonColor = computed(() => config.value.buttonColor || '#ff4d4f');
const buttonText = computed(() => config.value.buttonText || '自定义数据下发');

const deviceId = computed(() => props.card?.dataSource?.deviceSource?.[0]?.deviceId);

const handleButtonClick = async () => {
  if (!deviceId.value) return;

  const valueToBeSent = config.value.valueToSend || '1';
  const obj = {
    device_id: deviceId.value,
    value: valueToBeSent
  };

  try {
    if (config.value.dataType === 'attributes') {
      await attributeDataPub(obj);
    } else if (config.value.dataType === 'telemetry') {
      await telemetryDataPub(obj);
    } else if (config.value.dataType === 'command') {
      await commandDataPub(obj);
    }
    window.$message?.success($t('数据发送成功'));
  } catch (error) {
    window.$message?.error($t('数据发送失败'));
  }
};

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    const minDimension = Math.min(width, height);
    fontSize.value = `${minDimension / 10}px`;
    iconSize.value = `${minDimension / 5}px`;
  }
};

onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(cardRef.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<template>
  <div ref="cardRef" class="card-container" :style="{ fontSize }">
    <div class="device-name">{{ deviceName }}</div>
    <button class="action-button" :style="{ backgroundColor: buttonColor }" @click="handleButtonClick">
      <NIcon :size="iconSize" :color="buttonIconColor">
        <component :is="buttonIcon" />
      </NIcon>
    </button>
    <div class="button-text">{{ buttonText }}</div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
}

.device-name {
  margin-bottom: 10px;
}

.action-button {
  border: none;
  width: 30%;
  height: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin-bottom: 10px;
  border-radius: 10%;
}

.button-text {
  font-size: 0.9em;
}
</style>
