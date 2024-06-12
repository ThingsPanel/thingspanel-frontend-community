<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { deviceDetail } from '../../chart-card/curve/modules/api';

interface ICardData {
  dataSource: any; // 定义数据源接口
}

interface Detail {
  data: Array<{ value: string }>;
}

const props = defineProps<{ card: ICardData }>();
const detail = reactive<Detail>({ data: [] });

const video = ref<HTMLVideoElement | null>(null);
const currentTime = ref(0);
const duration = ref(0);

const updateCurrentTime = () => {
  if (video.value) currentTime.value = video.value.currentTime;
};

const updateDuration = () => {
  if (video.value) duration.value = video.value.duration;
};

const setSeries: (dataSource) => void = async dataSource => {
  const querDetail = {
    device_id: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.deviceId ?? '' : '',
    keys: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.metricsId : ''
  };
  if (querDetail.device_id && querDetail.keys) {
    detail.data = await deviceDetail(querDetail);
  }
};

watch(
  () => props.card.dataSource,
  () => setSeries(props.card.dataSource),
  { immediate: true, deep: true }
);

onMounted(() => {
  setSeries(props.card.dataSource);
  if (video.value) {
    video.value.addEventListener('timeupdate', updateCurrentTime);
    video.value.addEventListener('loadedmetadata', updateDuration);
  }
});

onBeforeUnmount(() => {
  if (video.value) {
    video.value.removeEventListener('timeupdate', updateCurrentTime);
    video.value.removeEventListener('loadedmetadata', updateDuration);
  }
});
</script>

<template>
  <div class="video-player">
    <n-card ref="cardRef" :bordered="false" class="h-full w-full">
      <div class="video-container">
        <video ref="video" class="video" controls @timeupdate="updateCurrentTime" @loadedmetadata="updateDuration">
          <source :src="detail?.data?.data?.[0]?.value" type="video/mp4" />
          <source :src="detail?.data?.data?.[0]?.value" type="video/webm" />
          <source :src="detail?.data?.data?.[0]?.value" type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-container {
  width: 100%;
  height: 98%;
  position: absolute;
  left: 0;
  top: 10px;
}

.video {
  width: 100%;
  height: 100%;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.controls button {
  margin: 5px;
}

.progress {
  display: flex;
  align-items: center;
}

.progress span {
  margin: 0 10px;
}

.progress input[type='range'] {
  flex-grow: 1;
}
</style>
