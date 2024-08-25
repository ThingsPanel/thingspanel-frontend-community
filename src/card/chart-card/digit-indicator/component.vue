<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { NCard, NIcon } from 'naive-ui';
import type { ICardData } from '@/components/panel/card';
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device';
import { icons as iconOptions } from '@/components/common/icons';

const props = defineProps<{
  card: ICardData;
}>();

const detail = ref<string>('');
const unit = ref<string>(''); // Unit will be '%' for humidity
const fontSize = ref('14px');
const cardRef = ref<InstanceType<typeof NCard> | null>(null);
let resizeObserver: ResizeObserver | null = null;

const setSeries = async (dataSource: ICardData['dataSource']) => {
  if (!dataSource?.deviceSource?.[0]) return;

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0];

  if (metricsType === 'telemetry' && deviceId && metricsId) {
    const detailValue = await telemetryDataCurrentKeys({
      device_id: deviceId,
      keys: metricsId
    });
    unit.value = detailValue?.data?.[0]?.unit ?? '%';
    detail.value = detailValue?.data?.[0]?.value ?? '';
  } else if (metricsType === 'attributes' && deviceId && metricsId) {
    const res = await getAttributeDataSet({ device_id: deviceId });
    const attributeData = res.data.find(item => item.key === metricsId);
    detail.value = attributeData?.value ?? '';
    unit.value = attributeData?.unit ?? '%';
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
    detail.value = '';
    unit.value = '';
    setSeries(props.card?.dataSource);
  },
  { deep: true }
);

onMounted(() => {
  setSeries(props.card?.dataSource);
  if (cardRef.value?.$el) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(cardRef.value.$el);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    detail.value = metricsId ? data[metricsId] : '';
  }
});
</script>

<template>
  <div class="card-container">
    <NCard ref="cardRef" :bordered="false" class="card">
      <div class="card-content" :style="{ fontSize: fontSize }">
        <div class="icon-container">
          <NIcon class="iconclass" :color="props?.card?.config?.color || 'blue'">
            <component :is="iconOptions[props?.card?.config?.iconName || 'Water']" />
          </NIcon>
        </div>
        <div class="value-container">
          <span class="value" :title="(detail || '45') + (props?.card?.config?.unit || unit || '%')">
            {{ detail || '45' }} {{ props?.card?.config?.unit || unit || '%' }}
          </span>
        </div>
        <div class="metric-name-container">
          <span class="metric-name" :title="card?.dataSource?.deviceSource?.[0]?.metricsName">
            {{ card?.dataSource?.deviceSource?.[0]?.metricsName || '湿度' }}
          </span>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
}

.card {
  height: 100%;
}

:deep(.n-card__content) {
  padding: 0;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.iconclass {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unit {
  margin-left: 0.3em;
  font-size: 2em;
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
</style>
