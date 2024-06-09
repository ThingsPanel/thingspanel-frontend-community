<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-28 19:49:57
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-04-03 13:41:38
-->
<script setup lang="tsx">
import { $t } from '@/locales';
import addSpace from './components/add-space.vue';
import addArea from './components/add-area.vue';

interface Emits {
  (e: 'cancelAdd', menu: App.Global.Menu): boolean;

  (e: 'saveAddSpace', menu: App.Global.Menu): boolean;

  (e: 'cancelAddApace', menu: App.Global.Menu): boolean;

  (e: 'saveAddAres', menu: App.Global.Menu): boolean;
}

const emit = defineEmits<Emits>();

function cancelAdd(data) {
  emit('cancelAdd', data);
  console.log('孙', data);
}

function saveAddSpace(data) {
  emit('saveAddSpace', data);
}

function cancelAddApace(data) {
  emit('cancelAddApace', data);
}

function saveAddAres(data) {
  emit('saveAddAres', data);
}
</script>

<template>
  <NCard>
    <n-tabs type="line" animated>
      <n-tab-pane name="oasis" :tab="$t('common.addSpace')">
        <addSpace @cancel-add="cancelAdd" @save-add-space="saveAddSpace" />
      </n-tab-pane>
      <n-tab-pane name="the beatles" :tab="$t('common.addArea')">
        <addArea @cancel-add-apace="cancelAddApace" @save-add-ares="saveAddAres" />
      </n-tab-pane>
    </n-tabs>
  </NCard>
</template>

<style scoped></style>
