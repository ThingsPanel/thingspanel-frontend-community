<script setup lang="ts">
import { ref } from 'vue';
import { useMessage } from 'naive-ui';
import { createServiceDrop, getServiceAccessForm, putServiceDrop } from '@/service/api/plugin.ts';
import FormInput from './form.vue';

const message = useMessage();
const isEdit = ref<any>(false);
const emit = defineEmits(['getList']);
const serviceModal = ref<any>(false);
const formRef = ref<any>(null);

const service_plugin_id = ref<any>('');
const formElements = ref<any>([]);
const defaultForm = {
  name: '',
  service_plugin_id: '',
  voucher: {},
  vouchers: {}
};
const form = ref<any>({ ...defaultForm });
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入接入点名称'
  }
});
const openModal: (id: any, row?: any) => void = async (id, row) => {
  if (row) {
    isEdit.value = true;
  }
  service_plugin_id.value = id;
  form.value.service_plugin_id = id;
  const data = await getServiceAccessForm({
    service_plugin_id: service_plugin_id.value
  });
  if (data.data) {
    formElements.value = data.data;
    serviceModal.value = true;
  } else {
    message.error('暂无服务接入点数据');
  }
};
const close: () => void = () => {
  serviceModal.value = false;
};

const submitSevice: () => void = async () => {
  form.value.voucher = JSON.stringify(form.value.vouchers);
  formRef.value?.validate(async errors => {
    if (errors) return;
    const data: any = isEdit.value ? await putServiceDrop(form.value) : await createServiceDrop(form.value);
    serviceModal.value = false;
    emit('getList', form.value.voucher);
    form.value = { ...defaultForm };
    form.value.vouchers = {};
    console.log(data, '提交');
  });
};

defineExpose({ openModal });
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" title="新增接入点" class="w">
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="接入点名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入接入点名称" />
      </n-form-item>
    </n-form>
    <div class="box">
      <FormInput v-model:protocol-config="form.vouchers" :form-elements="formElements"></FormInput>
    </div>
    <div class="footer">
      <NButton type="primary" class="btn" @click="submitSevice">保存并下一步</NButton>
      <NButton @click="close">取消</NButton>
    </div>
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
.box {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.w {
  width: 1300px !important;
  margin-top: 20vh;
  height: max-content !important;
  max-height: 600px !important;
}
</style>
