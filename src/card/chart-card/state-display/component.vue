<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { NIcon } from 'naive-ui';
import * as ionicons5 from '@vicons/ionicons5';
import type { ICardData } from '@/components/panel/card';
import { getAttributeDataSet } from '@/service/api/device';
import { $t } from '@/locales';

const props = defineProps<{
  card: ICardData;
}>();

const detail = ref<any>(null);
const isActive = ref(false);
const fontSize = ref('14px');
const cardRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const config = computed(() => props.card?.config || {});
const activeIconName = computed(() => config.value.activeIconName || 'BulbOutline');
const inactiveIconName = computed(() => config.value.inactiveIconName || 'Bulb');
const activeColor = computed(() => config.value.activeColor || '#FFA500');
const inactiveColor = computed(() => config.value.inactiveColor || '#808080');

const getIcon = (name: string) => {
  return (ionicons5 as any)[name];
};

const getSwitchValue = (switchState: boolean): any => {
  const dataType = props.card?.dataSource?.deviceSource?.[0]?.metricsDataType;
  if (dataType === 'string') {
    return switchState ? config.value.active0 || '1' : config.value.active1 || '0';
  } else if (dataType === 'number') {
    return switchState ? Number.parseFloat(config.value.active0) || 1 : Number.parseFloat(config.value.active1) || 0;
  } else if (dataType === 'boolean') {
    return switchState ? Boolean(config.value.active0) || true : Boolean(config.value.active1) || false;
  }
  return switchState ? 1 : 0;
};

const calculateState = () => {
  if (config.value.active0) {
    isActive.value = detail.value === getSwitchValue(true);
  } else {
    isActive.value = detail.value !== getSwitchValue(false);
  }
};

const setSeries = async (dataSource: ICardData['dataSource']) => {
  if (!dataSource?.deviceSource?.[0]) return;

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0];

  if (metricsType === 'attributes' && deviceId && metricsId) {
    const res = await getAttributeDataSet({ device_id: deviceId });
    const attributeData = res.data.find(item => item.key === metricsId);
    detail.value = attributeData?.value;
    calculateState();
  }
};

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    const newFontSize = `${Math.min(width, height) / 10}px`;
    fontSize.value = newFontSize;
  }
};

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props.card?.dataSource);
  },
  { deep: true }
);

watch(
  () => props.card?.config,
  () => {
    calculateState();
  },
  { deep: true }
);

onMounted(() => {
  setSeries(props.card?.dataSource);
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

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (metricsId && data[metricsId] !== undefined && data[metricsId] !== null && data[metricsId] !== '') {
      detail.value = data[metricsId];
      calculateState();
    }
  }
});
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <NIcon class="status-icon" :color="isActive ? activeColor : inactiveColor">
        <component :is="getIcon(isActive ? activeIconName : inactiveIconName)" />
      </NIcon>
      <div class="metric-name">
        {{ props.card?.dataSource?.deviceSource?.[0]?.metricsName || $t('generate.status') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-icon {
  font-size: 3em;
  margin-bottom: 10px;
}

.metric-name {
  text-align: center;
  font-size: 0.9em;
}
</style>
