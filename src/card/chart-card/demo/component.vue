<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import { deviceDetail } from '../curve/modules/api';
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
    detail.value = metricsId ? data[metricsId] : '';
  }
});

const setSeries: (dataSource) => void = async dataSource => {
  const arr: any = dataSource;
  const querDetail = {
    device_id: dataSource?.deviceSource ? dataSource?.deviceSource[0]?.deviceId ?? '' : '',
    keys: arr.deviceSource ? arr.deviceSource[0]?.metricsId : ''
  };
  if (querDetail.device_id && querDetail.keys) {
    const detailValue = await deviceDetail(querDetail);
    if (detailValue?.data[0]?.unit) {
      unit.value = detailValue?.data[0]?.unit;
    }
    if (detailValue?.data[0]?.value) {
      detail.value = detailValue.data[0].value;
    }
  } else {
    // window.$message?.error("查询不到设备");
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
    resizeObserver.observe(myCard.value.$el);
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
  <div class="h-full">
    <div class="h-full flex-col items-center">
      <NCard ref="myCard" :bordered="false" class="box">
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
  position: relative;
  flex-direction: column;
  width: 100%;
  height: 100%;
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
  left: 15%;
  width: 25%;
  height: 25%;
}

.value-wrap {
  position: absolute; /* 新增: 使得 .unit 可以相对于此元素定位 */
  display: inline-block; /* 确保包裹元素不影响外部布局 */
  bottom: 16%;
  left: 60%;
  width: 40%;
}

.unit {
  position: absolute;
  top: -8%;
  right: 10%;
  width: 50%;
  font-size: 1em;
  overflow: hidden;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  transform: translateY(-50%); /* 可选: 微调垂直对齐 */
}

.name {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 45%;
  font-size: 1.2em;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.value {
  font-size: 2.5em;
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
