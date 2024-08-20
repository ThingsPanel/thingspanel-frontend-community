<script setup lang="ts">
import { ref } from 'vue';
import { putRegisterService } from '@/service/api/plugin';
const serviceType = ref<any>('接入协议');
const emit = defineEmits(['getList']);
const serviceModal = ref<any>(false);
const formRef = ref<any>(null);
const details = ref<any>({});

const loading = ref<any>(false);
const defaultForm = {
  http_address: '',
  device_type: 1,
  sub_topic_prefix: '',
  access_address: ''
};
const form = ref<any>({ ...defaultForm });

const rules = ref<any>({
  http_address: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入HTTP服务地址'
  },
  device_type: {
    required: true,
    message: '请选择设备类型'
  },
  sub_topic_prefix: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入服服务订阅主题前缀'
  }
});
const options = ref<any>([
  {
    label: '直连设备',
    value: 1
  },
  {
    label: '网关设备',
    value: 2
  },
  {
    label: '网关子设备',
    value: 3
  }
]);

const openModal: (row: any) => void = row => {
  if (row) {
    serviceType.value = row.service_type === 1 ? '接入协议' : '接入服务';
    Object.assign(details.value, row);
    if (details.value.service_config === '') return;
    Object.assign(form.value, JSON.parse(row.service_config));
  }
  serviceModal.value = true;
};
const close: () => void = () => {
  serviceModal.value = false;
  Object.assign(details.value, {});
  Object.assign(form.value, defaultForm);
  console.log(form.value, defaultForm, '弹窗关闭');
};

const submitSevice: () => void = () => {
  formRef.value?.validate(async errors => {
    if (errors) return;
    loading.value = true;
    const params = details.value;
    params.service_config = JSON.stringify(form.value);
    const data: any = await putRegisterService(params);
    console.log(data, '提交');
    if (data.data) {
      emit('getList');
      close();
    }
    loading.value = false;
  });
};

defineExpose({ openModal });
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" :title="`插件配置(${serviceType})`" @after-leave="close">
    <n-space vertical>
      <n-spin :show="loading">
        <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
          :disabled="loading"
        >
          <n-form-item label="HTTP服务地址" path="http_address">
            <n-input v-model:value="form.http_address" placeholder="127.0.0.1:503" />
          </n-form-item>
          <n-form-item v-if="serviceType === '接入协议'" label="设备类型" path="device_type">
            <n-select v-model:value="form.device_type" placeholder="请选择设备类型" :options="options" />
          </n-form-item>
          <n-form-item label="服务订阅主题前缀" path="sub_topic_prefix">
            <n-input v-model:value="form.sub_topic_prefix" placeholder="plugin/xxx/" />
          </n-form-item>
          <n-form-item v-if="serviceType === '接入协议'" label="设备接入地址" path="access_address">
            <n-input v-model:value="form.access_address" placeholder="请输入设备接入地址" type="textarea" />
          </n-form-item>
        </n-form>
        <div class="footer">
          <NButton type="primary" class="btn" @click="submitSevice">确认</NButton>
          <NButton @click="close">取消</NButton>
        </div>
      </n-spin>
    </n-space>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  .btn {
    margin-left: 10px;
  }
}
</style>
