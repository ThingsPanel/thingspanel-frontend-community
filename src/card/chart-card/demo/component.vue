<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device';
import { icons as iconOptions } from './icons';

// 正式环境可根据api获取
const detail = ref<string>('');
const unit = ref<string>('');
const props = defineProps<{
  card: ICardData;
}>();
const fontSize = ref('14px');

const myCard = ref<any | null>(null); // 创建一个ref来引用NCard
let resizeObserver: ResizeObserver | null = null;

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    // Only update detail value when data[metricsId] is not undefined, null or ''
    if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
      console.warn(`No data returned from websocket for ${metricsId}`);
      return;
    }
    detail.value = metricsId ? data[metricsId] : '';
  }
});

const setSeries: (dataSource) => void = async dataSource => {
  const arr: any = dataSource;
  const metricsType = arr.deviceSource ? arr.deviceSource[0]?.metricsType : '';
  const deviceId = dataSource?.deviceSource ? dataSource?.deviceSource[0]?.deviceId ?? '' : '';
  const metricsId = arr.deviceSource ? arr.deviceSource[0]?.metricsId : '';
  if (metricsType === 'telemetry') {
    const querDetail = {
      device_id: deviceId,
      keys: metricsId
    };
    if (querDetail.device_id && querDetail.keys) {
      const detailValue = await telemetryDataCurrentKeys(querDetail);
      if (detailValue?.data?.[0]?.unit) {
        unit.value = detailValue?.data[0]?.unit;
      }
      if (detailValue?.data?.[0]?.value) {
        detail.value = detailValue.data[0].value;
      }
    }
  } else if (metricsType === 'attributes') {
    if (deviceId && metricsId) {
      const res = await getAttributeDataSet({ device_id: deviceId });
      const attributeData = res.data.find(item => item.key === metricsId);
      detail.value = attributeData?.value;
      if (attributeData?.unit) {
        unit.value = attributeData?.unit;
      }
    }
  }
};

const handleResize = entries => {
  for (const entry of entries) {
    // 根据卡片宽度动态调整字体大小，这里仅为示例逻辑，实际应用中需按需调整
    let dFontSize = `${entry.contentRect.width / 20}px`; // 假设字体大小与宽度成反比，20为比例系数
    if (entry.contentRect.width / entry.contentRect.height > 3) {
      dFontSize = `${(entry.contentRect.width + (entry.contentRect.height * entry.contentRect.width) / entry.contentRect.height / 2) / 20 / (1 + entry.contentRect.width / entry.contentRect.height / 2)}px`;
    }
    console.log('font size:', dFontSize);
    fontSize.value = dFontSize;
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
  setSeries(props?.card?.dataSource);
  // 确保DOM已经挂载后再初始化ResizeObserver
  if (myCard.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(myCard.value);
  }
});

onBeforeUnmount(() => {
  // 组件卸载前清除观察器
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<template>
  <div ref="myCard" class="h-full">
    <div class="h-full w-full flex flex-col items-center">
      <div class="bt-data" :style="'font-size:' + fontSize">
        <span class="name" :title="card?.dataSource?.deviceSource?.[0]?.metricsName || ''">
          {{ card?.dataSource?.deviceSource?.[0]?.metricsName }}
        </span>
        <NIcon class="iconclass" :color="props?.card?.config?.color || 'black'">
          <component :is="iconOptions[props?.card?.config?.iconName || 'ClipboardCode20Regular']" />
        </NIcon>
        <div class="value-wrap">
          <span class="value" :title="detail != null && detail != '' ? detail : '8'">
            {{ detail != null && detail !== '' ? detail : '8' }}
          </span>
          <span class="unit" :title="props?.card?.config?.unit || unit">
            {{ props?.card?.config?.unit || unit }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.items-center {
  padding: 0;
}
.iconclass.n-icon svg {
  width: 100%;
  height: 100%;
}
.bt-data {
  width: 100%;
  height: 100%;
}

.iconclass {
  position: absolute;
  bottom: 20%;
  left: 4%;
  width: 25%;
  height: 25%;
}

.value-wrap {
  position: absolute;
  display: flex;
  bottom: 20%;
  left: 50%;
  width: 45%;
  line-height: 1;
}

.unit {
  margin-left: 5px;
  font-size: 1em;
  overflow: hidden;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  transform: translateY(-50%);
}

.name {
  position: absolute;
  top: 15%;
  left: 8%;
  width: 45%;
  font-size: 1.2em;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.value {
  flex-shrink: 0;
  max-width: 75%;
  font-size: 2em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  vertical-align: text-bottom;
}
</style>
