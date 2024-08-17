<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { MovingNumbers } from 'moving-numbers-vue3';
import { Activity } from '@vicons/tabler';
import { DocumentOnePage24Regular } from '@vicons/fluent';
import dayjs from 'dayjs';
import { telemetryDataCurrent } from '@/service/api/device'; // 假设此路径正确

const props = defineProps<{
  id: string;
  cardHeight: number;
  cardMargin: number;
}>();

const telemetryData = ref<any[]>([]);
const initTelemetryData = ref<any>();
const nowTime = ref(dayjs(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss'));

const fetchTelemetry = async () => {
  const { data, error } = await telemetryDataCurrent(props.id);
  if (!error && data) {
    telemetryData.value = data;
    initTelemetryData.value = data[0] || {};
    initTelemetryData.value.device_id = props.id;
  }
};

const setItemRef = (el: any) => {
  console.log(el);
};

const isColor = (i: any) => {
  if (typeof i.value === 'string') {
    return '#cccccc';
  }
  return '';
};

const onTapTableTools = (_i: any) => {
  // 自定义处理逻辑
};

// 在组件挂载时调用 fetchTelemetry 获取数据
onMounted(() => {
  fetchTelemetry();
});
</script>

<template>
  <n-grid :x-gap="cardMargin" :y-gap="cardMargin" cols="1 600:2 900:3 1200:4">
    <n-gi v-for="(i, index) in telemetryData" :key="i.tenant_id">
      <n-card header-class="border-b h-36px" hoverable :style="{ height: cardHeight + 'px' }">
        <div class="card-body">
          <span v-if="isColor(i)" class="index-style">{{ i.value }}</span>
          <MovingNumbers
            v-else
            :ref="setItemRef"
            :data-index="index"
            class="c1"
            :m-num="i.value"
            :quantile-show="true"
          ></MovingNumbers>
          <span v-if="i.unit">{{ i.unit }}</span>
        </div>
        <template #header>
          <div class="line1" :title="i.key">
            <template v-if="i.label">
              <span v-if="i.label">{{ i.label }}</span>
              <span>({{ i.key }})</span>
            </template>
            <template v-else>
              <span>{{ i.key }}</span>
            </template>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end">
            {{ i.ts ? dayjs(i.ts).format('YYYY-MM-DD HH:mm:ss') : nowTime }}
          </div>
        </template>
        <template #header-extra>
          <div class="h-24px w-120px flex items-center justify-end">
            <NIcon
              size="24"
              @click="
                () => {
                  /* 自定义处理逻辑 */
                }
              "
            >
              <DocumentOnePage24Regular />
            </NIcon>
            <NDivider vertical />
            <NIcon size="24" :color="isColor(i)" @click="onTapTableTools(i)">
              <Activity />
            </NIcon>
            <NDivider vertical />
          </div>
        </template>
      </n-card>
    </n-gi>
  </n-grid>
</template>

<style lang="scss" scoped>
.line1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    &:nth-child(2) {
      color: #ccc;
      padding-left: 5px;
    }
  }
}

.card-body {
  padding: 10px 0 10px;
  display: flex;
  align-items: end;
  gap: 4px;

  span {
    &:first-child {
      font-size: 32px;
      line-height: 1;
    }
  }
}

.index-style {
  font-size: 24px;
}
</style>
