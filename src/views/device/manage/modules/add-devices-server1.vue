<!-- Select Service -->
<script setup lang="ts">
import AddDeviceServiceModal from './add-device-server-modal.vue';
import { useBoolean } from '~/packages/hooks';

const { bool: visible, setTrue: openModal } = useBoolean();

const data = [
  {
    title: 'OpenWeather气象服务'
  },
  {
    title: 'xxx'
  },
  {
    title: 'xxx'
  },
  {
    title: 'xxx'
  },
  {
    title: 'xxx'
  }
];

// The server configuration dialog box is displayed
function handleSelectClick(index: number) {
  console.log(`被点击${index}${1}`);
  openModal();
}
</script>

<template>
  <div>
    <n-space>
      <n-tag
        v-for="(item, index) in data"
        :key="index"
        size="large"
        class="card"
        style="background-color: transparent"
        @click="handleSelectClick(index)"
      >
        {{ item.title }}
      </n-tag>
    </n-space>
    <AddDeviceServiceModal v-model:visible="visible" />
  </div>
</template>

<style scoped>
.card {
  width: 300px;
  height: 150px;
  border-radius: 4px;
  justify-content: center;
  margin-right: 20px;
  margin-bottom: 20px;
  font-size: 20px;
  cursor: pointer;
}
</style>
