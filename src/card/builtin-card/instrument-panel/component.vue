<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import { $t } from '@/locales';
import { deviceDetail } from '../../chart-card/curve/modules/api';

const initDetailValue = 8;

const props = defineProps<{
  card: ICardData;
}>();
const detail: any = ref(null);
const detailValue = computed(() => {
  return detail?.value?.data && detail?.value?.data[0] ? detail?.value?.data[0]?.value : initDetailValue;
});
const propsUnit = computed(() => {
  return (
    props?.card?.config?.unit ||
    (detail?.value?.data && detail?.value?.data[0] ? detail?.value?.data[0]?.unit || '' : '')
  );
});
const detailValueAndUnit = computed(() => {
  return `${detailValue.value} ${propsUnit.value}`;
});
const detailValueAndUnitLen = computed(() => {
  return detailValueAndUnit.value.length;
});
const metricsName = computed(() => {
  return props?.card?.dataSource?.deviceSource?.[0]?.metricsName || '仪表盘';
});
const propsMin = computed(() => {
  return props?.card?.config?.min || 0;
});
const propsMax = computed(() => {
  return props?.card?.config?.max || 200;
});
const circleId = computed(() => {
  return `instrument-circle-${props?.card?.dataSource?.deviceSource?.[0]?.deviceId}`;
});

const setSeries: (dataSource) => void = async dataSource => {
  const querDetail = {
    device_id: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.deviceId ?? '' : '',
    keys: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.metricsId : ''
  };
  if (querDetail.device_id && querDetail.keys) {
    detail.value = await deviceDetail(querDetail);
  }
};

const updateSvgSize = () => {
  const svgDom = document.getElementsByClassName('instrument-svg')[0];
  const svgWidth = svgDom.clientWidth;
  const radius = 0.2 * svgWidth;
  const perimeter = 2 * Math.PI * radius;
  const strokeDasharray = Math.ceil(perimeter / 2);

  const circleDoms = document.getElementsByClassName('instrument-svg-circle') || [];
  const len = circleDoms.length;
  const strokeWidthMax = 16;

  for (let i = 0; i < len; i += 1) {
    const theWidth = svgWidth * 0.05;
    circleDoms[i].setAttribute('stroke-width', `${theWidth > strokeWidthMax ? strokeWidthMax : theWidth}`);
    circleDoms[i].setAttribute('r', `${radius}`);
  }

  circleDoms[0].setAttribute('stroke-dasharray', `${strokeDasharray}`);
  const baseStrokeDasharray = circleDoms[1].getAttribute('stroke-dasharray');
  const baseValue = baseStrokeDasharray?.split(' ') || [];
  const ratio = Number(baseValue?.[0]) / Number(baseValue?.[1]);
  const newValue = Math.ceil(strokeDasharray * ratio);
  circleDoms[1].setAttribute('stroke-dasharray', `${newValue} ${strokeDasharray}`);

  circleDoms[0].setAttribute('stroke-dashoffset', `${-strokeDasharray}`);
  circleDoms[1].setAttribute('stroke-dashoffset', `${-strokeDasharray}`);
};

const updateProgress = () => {
  const svgDom = document.getElementsByClassName('instrument-svg')[0];
  const svgWidth = svgDom.clientWidth;
  const radius = 0.2 * svgWidth;
  const perimeter = 2 * Math.PI * radius;
  const strokeDasharray = Math.ceil(perimeter / 2);

  const val = detailValue.value;
  const range = propsMax.value - propsMin.value;
  const percent = val / range;
  const strokeDasharrayChange = `${Math.ceil(strokeDasharray * percent)} ${strokeDasharray}`;

  const circleDom1 = document.getElementsByClassName('instrument-svg-circle')[1];
  circleDom1.setAttribute('stroke-dasharray', `${strokeDasharrayChange}`);

  updateSvgSize();
};

watch(
  () => detail?.value?.data[0]?.value,
  () => {
    updateProgress();
  }
);
watch(
  () => props?.card?.config?.min,
  () => {
    updateProgress();
  }
);
watch(
  () => props?.card?.config?.max,
  () => {
    updateProgress();
  }
);
watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props.card?.dataSource);
  },
  { deep: true }
);

onMounted(() => {
  window.addEventListener('resize', updateSvgSize);
  setSeries(props?.card?.dataSource);
  updateProgress();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSvgSize);
});
</script>

<template>
  <div class="instrument flex-col flex-justify-center flex-items-center">
    <div class="instrument-top h-full w-full flex flex-col flex-justify-between flex-items-center">
      <div class="instrument-title">{{ $t('dashboard_panel.cardName.instrumentPanel') }}</div>
      <div class="instrument-panel">
        <svg width="100%" height="100%" class="instrument-svg">
          <circle
            class="instrument-svg-circle"
            cx="50%"
            cy="51%"
            r="50"
            stroke="#d1d3d7"
            stroke-width="5%"
            fill="none"
            stroke-dasharray="158"
            stroke-dashoffset="-158"
            stroke-linecap="round"
          />
          <circle
            :id="circleId"
            class="instrument-svg-circle"
            cx="50%"
            cy="51%"
            r="50"
            stroke="#00a5e0"
            stroke-width="5%"
            fill="none"
            stroke-dasharray="158"
            stroke-dashoffset="-158"
            stroke-linecap="round"
          />
        </svg>
        <span class="instrument-valueunit" :class="{ 'instrument-valueunit-overflow': detailValueAndUnitLen > 6 }">
          {{ detailValueAndUnit }}
        </span>
        <div class="instrument-min">{{ propsMin }}</div>
        <div class="instrument-max">{{ propsMax }}</div>
      </div>
    </div>
    <div class="instrument-bottom w-full text-center">
      <p>{{ metricsName }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.instrument {
  &-panel {
    position: relative;
    width: 60%;
    height: 100%;
    margin-top: 20px;
  }
  &-min,
  &-max {
    position: absolute;
    top: 55%;
  }
  &-min {
    left: 22%;
  }
  &-max {
    right: 22%;
  }
  &-valueunit {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -80%);
    font-weight: bold;
    font-size: 1.5vw;
    width: 100%;
    text-align: center;
    &-overflow {
      top: auto;
      bottom: 5%;
    }
  }
}
</style>
