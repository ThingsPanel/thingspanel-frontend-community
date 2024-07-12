<script setup lang="ts">
import { ref } from 'vue';
import { getServiceAccessForm, putRegisterService, registerService } from '@/service/api/plugin';
import FormInput from './form.vue';

const isEdit = ref<any>(false);
const emit = defineEmits(['getList']);
const serviceModal = ref<any>(false);
const formRef = ref<any>(null);
const loading = ref<any>(false);
const service_plugin_id = ref<any>('');

type FormElementType = 'input' | 'table' | 'select';

interface Validate {
  message: string; // 验证失败时显示的错误消息
  required?: boolean; // 指定字段是否必填
  rules?: string; // 用于验证字段值的正则表达式规则
  type?: 'number' | 'string' | 'array' | 'boolean' | 'object'; // 验证的类型
}

interface FormElement {
  type: FormElementType; // 表单元素的类型
  dataKey: string; // 用于唯一标识表单元素的键
  label: string; // 显示为表单元素标签的文本
  placeholder?: string; // 提示文本，仅 input 类型时有效
  validate?: Validate; // 包含表单验证规则的对象
  array?: FormElement[]; // 仅 table 类型时有效，定义表格列的配置
}
const formElements = ref<FormElement[]>([]);
const config_data = ref({});

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

const getServiceForm: () => void = async () => {
  const data = await getServiceAccessForm({
    service_plugin_id: service_plugin_id.value
  });
  formElements.value = data.data;
  console.log(data, '提交');
};

const openModal: (id: any, row?: any) => void = (id, row) => {
  if (row) {
    isEdit.value = true;
    Object.assign(form.value, row);
  }
  service_plugin_id.value = id;
  console.log(service_plugin_id.value, 'id');
  serviceModal.value = true;
  getServiceForm();
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
    console.log(data, '提交');
    console.log(config_data.value, '配置');
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
  <n-modal v-model:show="serviceModal" preset="dialog" title="新增接入点">
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
          <n-form-item label="服务接入点名称" path="name">
            <n-input v-model:value="form.name" placeholder="请输入服务名称" />
          </n-form-item>
        </n-form>
        <FormInput v-model:protocol-config="config_data" :form-elements="formElements"></FormInput>
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
