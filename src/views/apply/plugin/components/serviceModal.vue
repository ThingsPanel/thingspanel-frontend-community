<script setup lang="ts">
import { ref } from 'vue';
import { putRegisterService, registerService } from '@/service/api/plugin';
const isEdit = ref<any>(false);
const emit = defineEmits(['getList']);
const serviceModal = ref<any>(false);
const formRef = ref<any>(null);
const loading = ref<any>(false);
const defaultForm = {
  name: '',
  service_identifier: '',
  service_type: null,
  version: '',
  description: '',
  service_config: '',
  remark: ''
};
const form = ref<any>({ ...defaultForm });
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入服务名称'
  },
  service_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入服务标识符'
  },
  service_type: {
    required: true,
    message: '请选择服务类别'
  }
});
const options = ref<any>([
  {
    label: '接入协议',
    value: 1
  },
  {
    label: '接入服务',
    value: 2
  }
]);
const openModal: (row: any) => void = row => {
  if (row) {
    isEdit.value = true;
    Object.assign(form.value, row);
  } else {
    Object.assign(form.value, defaultForm);
  }
  serviceModal.value = true;
};
const close: () => void = () => {
  serviceModal.value = false;
  Object.assign(form.value, defaultForm);
};
const submitSevice: () => void = async () => {
  formRef.value?.validate(async errors => {
    if (errors) return;
    loading.value = true;
    const data: any = isEdit.value ? await putRegisterService(form.value) : await registerService(form.value);
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
  <n-modal v-model:show="serviceModal" preset="dialog" title="服务配置">
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
          @after-leave="close"
        >
          <n-form-item label="服务名称" path="name">
            <n-input v-model:value="form.name" placeholder="请输入服务名称" />
          </n-form-item>
          <n-form-item label="服务标识符" path="service_identifier">
            <n-input v-model:value="form.service_identifier" placeholder="请输入服务标识符" />
          </n-form-item>
          <n-form-item label="类别" path="service_type">
            <n-space vertical class="selectType" placeholder="请选择服务类别">
              <n-select v-model:value="form.service_type" :options="options" :disabled="isEdit" />
            </n-space>
          </n-form-item>
          <n-form-item label="版本" path="version">
            <n-input v-model:value="form.version" placeholder="请输入版本" />
          </n-form-item>
          <n-form-item label="描述" path="description">
            <n-input v-model:value="form.description" placeholder="请输入描述" type="textarea" />
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
