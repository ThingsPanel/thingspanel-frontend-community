<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useScriptTag } from '@vueuse/core';
import { TENCENT_MAP_SDK_URL } from '@/constants/map-sdk';

const { load } = useScriptTag(TENCENT_MAP_SDK_URL);
const emit = defineEmits(['position-selected']);

const props = defineProps(['longitude', 'latitude']);
const domRef = ref<HTMLDivElement | null>(null);
let map;

async function renderMap() {
  await load(true);
  if (!domRef.value) return;
  const center = new TMap.LatLng(props.latitude || 39.98412, props.longitude || 116.307484);
  map = new TMap.Map(domRef.value, {
    center,
    zoom: 9,
    maxZoom: 13,
    minZoom: 6
  });
  const MultiMarker = new TMap.MultiMarker({
    map,
    geometries: [
      {
        position: center, // 标注点位置
        rank: 4
      }
    ],
    collisionOptions: {
      sameSource: true,
      crossSource: true,
      vectorBaseMapSource: true
    },
    zIndex: 30
  });

  console.log(MultiMarker);
  map.on('click', event => {
    emit('position-selected', { lat: event.latLng.getLat(), lng: event.latLng.getLng() });
  });
}

onMounted(() => {
  renderMap();
});
</script>

<template>
  <div ref="domRef" class="100%"></div>
</template>

<style scoped></style>
