<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-28 19:49:57
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-04-10 05:50:15
-->
<script setup lang="tsx">
import { $t } from '@/locales';
import editSpace from './components/edit-space.vue';
import editArea from './components/edit-area.vue';

interface Props {
  typeData: {
    id?: string;
    typeData?: string;
    buttonDisabled?: boolean;
  };
}

const props = defineProps<Props>();
const type: any = props.typeData.typeData;
console.log('555555555id', props.typeData.id);

interface Emits {
  (e: 'editAdd', menu: App.Global.Menu): boolean;
  (e: 'saveSpace', menu: App.Global.Menu): boolean;
  (e: 'cancelEditArea', menu: App.Global.Menu): boolean;
  (e: 'saveEditArea', menu: App.Global.Menu): boolean;
}
const emit = defineEmits<Emits>();

function editAdd(data) {
  emit('editAdd', data);
  console.log('孙', data);
}
function saveSpace(data) {
  console.log('孙修改', data);
  emit('saveSpace', data);
}
function cancelEditArea(data) {
  emit('cancelEditArea', data);
}
function saveEditArea(data) {
  emit('saveEditArea', data);
}
</script>

<template>
  <NCard>
    <n-tabs type="line" animated :value="type">
      <n-tab-pane name="space" :tab="$t('common.editSpace')">
        <editSpace
          :data-id="props.typeData.id"
          :button-disabled="props.typeData.buttonDisabled"
          @edit-add="editAdd"
          @save-space="saveSpace"
        />
      </n-tab-pane>
      <n-tab-pane name="area" tab="custom.edit-area">
        <editArea :data-id="props.typeData.id" @cancel-edit-area="cancelEditArea" @save-edit-area="saveEditArea" />
      </n-tab-pane>
    </n-tabs>
  </NCard>
</template>

<style scoped></style>
