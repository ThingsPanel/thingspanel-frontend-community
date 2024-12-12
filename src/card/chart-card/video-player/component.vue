<script setup lang="ts">
import { defineProps, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { VideoJsPlayer } from 'video.js';
import videojs from 'video.js';
import { getAttributeDatasKey, telemetryDataCurrentKeys } from '@/service/api/device';
import 'video.js/dist/video-js.css';
import { createLogger } from '@/utils/logger';
const logger = createLogger('Player');
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
        logger.error({ 'Unexpected response format:': res });
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
  const options = {
    autoplay: true, // 设置自动播放
    muted: true, // 设置了它为true，才可实现自动播放,同时视频也被静音 （Chrome66及以上版本，禁止音视频的自动播放）
    preload: 'auto', // 预加载
    controls: false // 显示播放的控件
  };

  player = videojs(m3u8_video.value, options, () => {
    videojs.log('播放器已经准备好了!');
    player.on('error', () => {
      videojs.log('播放器解析出错!', player.error());
    });
  });
};

watch(
  () => props.card.dataSource,
  () => {
    setSeries(props.card.dataSource);
  },
  { immediate: true, deep: true }
);

watch(
  () => detail.data?.[0]?.value,
  (val, oldVal) => {
    if (detail.data?.[0]?.value && val !== oldVal) {
      videoUrl.value = detail.data?.[0]?.value;
      // if(videoUrl.value.indexOf('.m3u8')>-1){
      // videoUrl.value ='http://218.6.43.28:83/openUrl/YpAvS48/live.m3u8'
      // }

      setTimeout(() => {
        if (detail.data?.[0]?.value && !player) {
          createPlayer();
        }
      }, 0);
    }
  },
  { immediate: true, deep: true }
);

onBeforeUnmount(() => {
  player?.dispose();
});
</script>

<template>
  <div class="video-player">
    <n-card :bordered="false" class="h-full w-full">
      <div v-if="videoUrl.indexOf('.m3u8') > -1" class="video-container">
        <video
          ref="m3u8_video"
          autoplay
          class="video-js vjs-default-skin vjs-big-play-centered"
          controls
          preload
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
      </div>
      <div v-else class="video-container">
        <video
          ref="m3u8_video"
          autoplay
          class="video-js vjs-default-skin vjs-big-play-centered ddd"
          controls
          preload
          data-setup="{}"
          :src="videoUrl"
        ></video>
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
