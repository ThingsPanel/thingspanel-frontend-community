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
