<script setup lang="ts">
import { defineExpose, ref } from 'vue';
import moment from 'moment';
import { $t } from '@/locales';

const modalVisible = ref(false);
const detailInfo = ref({
  id: '',
  email: '',
  username: '',
  ip: '',
  request_message: '',
  response_message: '',
  latency: '',
  name: '',
  path: '',
  created_at: ''
});

const show = info => {
  modalVisible.value = true;
  detailInfo.value = info;
};
const closeModal = () => {
  modalVisible.value = false;
};
defineExpose({
  show
});
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="$t('custom.management.logDetail')" class="w-80%">
    <NForm v-model="detailInfo" label-placement="left" label-align="left" label-width="80px">
      <NFormItem :label="$t('custom.management.account')">
        <div class="result">{{ detailInfo.email }}</div>
      </NFormItem>
      <NFormItem label="$t('custom.management.account')">
        <div class="result">{{ detailInfo.username }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestTime')">
        <div class="result">{{ detailInfo.latency }}ms</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.time')">
        <div class="result">
          {{ moment(detailInfo.created_at).format('YYYY-MM-DD hh:mm:ss') }}
        </div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestPath')">
        <div class="result">{{ detailInfo.path }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestMethod')">
        <div class="result">{{ detailInfo.name }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.ipAddresst')">
        <div class="result">{{ detailInfo.ip }}</div>
      </NFormItem>
      <NFormItem :label="$t('custom.management.requestContent')">
        <NInput v-model:value="detailInfo.request_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
      <NFormItem :label="$t('custom.management.responseContent')">
        <NInput v-model:value="detailInfo.response_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
    </NForm>
    <div class="text-right">
      <NButton @click="closeModal">{$t('custom.management.close')}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.n-form-item .n-form-item-label {
  font-size: 14px;
  color: #101010;
}
.value {
  font-size: 14px;
  color: #101010;
}
</style>
