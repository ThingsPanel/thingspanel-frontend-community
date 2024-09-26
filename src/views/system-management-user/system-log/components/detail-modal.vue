<script setup lang="ts">
import { defineExpose, ref } from 'vue';
import moment from 'moment';

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
  <NModal v-model:show="modalVisible" preset="card" title="日志详情" class="w-80%">
    <NForm v-model="detailInfo" label-placement="left" label-align="left" label-width="80px">
      <NFormItem label="账号">
        <div class="result">{{ detailInfo.email }}</div>
      </NFormItem>
      <NFormItem label="用户名">
        <div class="result">{{ detailInfo.username }}</div>
      </NFormItem>
      <NFormItem label="请求耗时">
        <div class="result">{{ detailInfo.latency }}ms</div>
      </NFormItem>
      <NFormItem label="时间">
        <div class="result">
          {{ moment(detailInfo.created_at).format('YYYY-MM-DD hh:mm:ss') }}
        </div>
      </NFormItem>
      <NFormItem label="请求路径">
        <div class="result">{{ detailInfo.path }}</div>
      </NFormItem>
      <NFormItem label="请求方法">
        <div class="result">{{ detailInfo.name }}</div>
      </NFormItem>
      <NFormItem label="IP地址">
        <div class="result">{{ detailInfo.ip }}</div>
      </NFormItem>
      <NFormItem label="请求内容">
        <NInput v-model:value="detailInfo.request_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
      <NFormItem label="响应内容">
        <NInput v-model:value="detailInfo.response_message" type="textarea" readonly disabled></NInput>
      </NFormItem>
    </NForm>
    <div class="text-right">
      <NButton @click="closeModal">关闭</NButton>
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
.text-right {
  text-align: right;
}
</style>
