<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { deviceGroupDetail, getDeviceGroup } from '@/service/api/device';

const route = useRoute();
const id = route.query.id;
console.log(id);

const geDetails = async () => {
  const res = await deviceGroupDetail({ id });
  console.log(res);

  const res2 = await getDeviceGroup({
    page: 1,
    page_size: 10,
    parent_id: id
  });
  console.log(res2);
};
console.log('范德萨范德萨发范德萨范德萨范德萨');

onMounted(geDetails);
</script>

<template>
  <div>{{ 'details:' + id }}</div>
</template>

<style scoped></style>