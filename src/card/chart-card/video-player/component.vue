<script setup lang="ts">
import { defineProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { VideoJsPlayer } from 'video.js';
import videojs from 'video.js';
import { getAttributeDatasKey, telemetryDataCurrentKeys } from '@/service/api/device';
import 'video.js/dist/video-js.css';

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
      if (res && Array.isArray(res.data)) {
        detail.data = res.data.map(item => ({ value: item.value }));
      } else {
        console.error('Unexpected response format:', res);
      }
    } else if (metricsType === 'attributes') {
      res = await getAttributeDatasKey({
        device_id: querDetail.device_id,
        key: querDetail.keys
      });
      if (res && res.data) {
        detail.data = [
          {
            value: res.data.value || ''
          }
        ];
      } else {
        detail.data = [
          {
            value: ''
          }
        ];
      }
    }
  }
};
const m3u8_video = ref(null);
let player: VideoJsPlayer;
const videoUrl = ref('');
const createPlayer = async () => {
  await nextTick();
  let options = {};
  if (videoUrl.value.includes('.m3u8')) {
    options = {
      liveui: true,
      liveTracker: {
        trackingThreshold: 0,
        liveTolerance: 15
      }
    };
  }
  player = videojs(m3u8_video.value, options, () => {
    videojs.log('播放器已经准备好了!');
    player.on('error', () => {
      videojs.log('播放器解析出错!', player.error());
    });
  });
  player?.dispose();
};

watch(
  () => props.card.dataSource,
  () => {
    setSeries(props.card.dataSource);
    createPlayer();
  },
  { immediate: true, deep: true }
);

watch(
  () => detail.data?.[0]?.value,
  () => {
    videoUrl.value = detail.data?.[0]?.value || '';
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  setSeries(props.card.dataSource);

  createPlayer();
});

onBeforeUnmount(() => {
  player?.dispose();
});
</script>

<template>
  <div class="video-player">
    <n-card :bordered="false" class="h-full w-full">
      <div class="video-container">
        <video
          v-if="videoUrl.indexOf('.m3u8') > -1"
          ref="m3u8_video"
          class="video-js vjs-default-skin vjs-big-play-centered"
          controls
          preload="auto"
          data-setup="{}"
        >
          <source :src="videoUrl" type="application/x-mpegURL" />
          <p class="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that
            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
              supports HTML5 video
            </a>
          </p>
        </video>
        <video
          v-else
          ref="m3u8_video"
          class="video-js vjs-default-skin vjs-big-play-centered"
          controls
          autoplay
          preload="auto"
          :src="videoUrl"
        >
          <p class="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that
            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
              supports HTML5 video
            </a>
          </p>
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

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}
.video-js {
  width: 100%;
  height: 100%;
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
