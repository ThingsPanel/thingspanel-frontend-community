<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import { $t } from '@/locales';
import { attributeDataPub, getAttributeDataSet, telemetryDataPub } from '@/service/api/device';

const active: any = ref(false);
const detail: any = ref(0);
const props = defineProps<{
  card: ICardData;
}>();

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    detail.value = metricsId ? data[metricsId] : 0;
  }
});

/**
 * Metrics data type can be string, number or boolean. If config.active0 is not empty, it will be used as the value when
 * the switch is on. If config.active1 is not empty, it will be used as the value when the switch is off. active0 and
 * active1 is string type and need to be converted according to the data type of metrics.
 *
 * @param swtichState
 */
const getSwitchValue: (swtichState: boolean) => any = (swtichState: boolean) => {
  const config = props?.card?.config;
  const dataType = props?.card?.dataSource?.deviceSource?.[0]?.metricsDataType;
  if (dataType === 'string') {
    if (swtichState) {
      return config?.active0 ? config.active0 : '1';
    }
    return config?.active1 ? config.active1 : '0';
  } else if (dataType === 'number') {
    if (swtichState) {
      return config?.active0 ? Number.parseFloat(config.active0) : 1;
    }
    return config?.active1 ? Number.parseFloat(config.active1) : 0;
  } else if (dataType === 'boolean') {
    if (swtichState) {
      return config?.active0 ? Boolean(config.active0) : true;
    }
    return config?.active1 ? Boolean(config.active1) : true;
  }
  return swtichState ? 1 : 0;
};

const setSeries: (dataSource: any) => void = async dataSource => {
  const arr = dataSource;
  const metricsType = arr.deviceSource ? arr.deviceSource[0]?.metricsType : '';
  const deviceId = arr.deviceSource ? arr.deviceSource[0]?.deviceId ?? '' : '';
  const metricsId = arr.deviceSource ? arr.deviceSource[0]?.metricsId : '';
  if (metricsType === 'attributes') {
    if (deviceId && metricsId) {
      const res = await getAttributeDataSet({ device_id: deviceId });
      const attributeData = res.data.find(item => item.key === metricsId);
      detail.value = attributeData?.value;
    }
  }
};

const clickSwitch: () => void = async () => {
  const arr: any = props?.card?.dataSource;
  const device_id = arr.deviceSource[0]?.deviceId ?? '';
  const metricsId = arr.deviceSource ? arr.deviceSource[0]?.metricsId : 'swtich';
  const metricsType = arr.deviceSource ? arr.deviceSource[0]?.metricsType : '';
  if (device_id && device_id !== '') {
    const obj = {
      device_id,
      value: JSON.stringify({
        [metricsId]: getSwitchValue(active.value) // key is metricsId
      })
    };
    if (metricsType === 'attributes') {
      await attributeDataPub(obj);
    } else if (metricsType === 'telemetry') {
      await telemetryDataPub(obj);
    }
  }
};

/**
 * Calculate the switch state based on the metrics data. metrics data is in detail.value. If active0 is not empty, check
 * detail.value is equal to active0. If true, switch is on. If active1 is not empty, check detail.value is equal to
 * active1. If true, switch is off.
 */
const calculateState: () => void = () => {
  if (props?.card?.config?.active0) {
    active.value = detail.value === getSwitchValue(true);
  } else {
    active.value = detail.value !== getSwitchValue(false);
  }
};

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props?.card?.dataSource);
  },
  { deep: true }
);

watch(
  () => detail,
  () => {
    calculateState();
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
</script>

<template>
  <div class="box">
    <div>
      <!-- {{  props?.card?.dataSource?.deviceSource[0] }} -->
      <n-switch v-model:value="active" @change="clickSwitch" />
      <div class="switch">{{ card.dataSource?.deviceSource?.[0]?.metricsName || $t('generate.switch') }}</div>
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
