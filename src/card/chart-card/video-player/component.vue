<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device';

interface ICardData {
  dataSource: any; // 定义数据源接口
}

interface DataDetail {
  value: string;
}

interface Detail {
  data: DataDetail[];
}

const props = defineProps<{ card: ICardData }>();
const detail = reactive<Detail>({ data: [] });

const video = ref<HTMLVideoElement | null>(null);
const currentTime = ref(0);
const duration = ref(0);

const player = ref();

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
  const metricsType = dataSource.deviceSource ? dataSource.deviceSource[0]?.metricsType : '';

  if (querDetail.device_id && querDetail.keys) {
    let res;
    if (metricsType === 'telemetry') {
      res = await telemetryDataCurrentKeys(querDetail);
    } else if (metricsType === 'attributes') {
      res = await getAttributeDataSet(querDetail);
    }

    if (res && Array.isArray(res.data)) {
      detail.data = res.data.map(item => ({ value: item.value }));
    } else {
      console.error('Unexpected response format:', res);
    }
  }
};

const createPlayer = () => {
  player.value = new (window as any).WasmPlayer(null, 'easy-player', () => {}, { Height: true, openAudio: false });
};

const play = src => {
  if (!src) return;
  if (!player.value) {
    createPlayer();
  }
  setTimeout(() => {
    player.value.play(src, 1);
  }, 50);
};

const destroy = () => {
  if (!player.value) return;
  player.value.destroy();
  player.value = null;
};

watch(
  () => props.card.dataSource,
  () => setSeries(props.card.dataSource),
  { immediate: true, deep: true }
);

watch(
  () => detail.data?.[0]?.value,
  () => play(detail.data?.[0]?.value),
  { immediate: true, deep: true }
);

onMounted(() => {
  setSeries(props.card.dataSource);
  if (video.value) {
    video.value.addEventListener('timeupdate', updateCurrentTime);
    video.value.addEventListener('loadedmetadata', updateDuration);
  }
  createPlayer();
});

onBeforeUnmount(() => {
  if (video.value) {
    video.value.removeEventListener('timeupdate', updateCurrentTime);
    video.value.removeEventListener('loadedmetadata', updateDuration);
  }
  destroy();
});
</script>

<template>
  <div class="video-player">
    <n-card ref="cardRef" :bordered="false" class="h-full w-full">
      <div class="video-container">
        <!--
 <video ref="video" class="video" controls @timeupdate="updateCurrentTime" @loadedmetadata="updateDuration">
          <source v-if="detail.data.length > 0" :src="detail.data[0].value" type="video/mp4" />
          <source v-if="detail.data.length > 0" :src="detail.data[0].value" type="video/webm" />
          <source v-if="detail.data.length > 0" :src="detail.data[0].value" type="video/ogg" />
          Your browser does not support the video tag.
        </video> 
-->
        <div id="easy-player"></div>
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
