<script setup lang="ts">
import { ref } from 'vue';
// import { useMessage } from "naive-ui";
import { createServiceDrop, getServiceAccessForm, putServiceDrop } from '@/service/api/plugin';
import { $t } from '@/locales';
import FormInput from './form.vue';
import AutomaticModeStep from './AutomaticModeStep.vue';

// const message = useMessage();
const isEdit = ref<any>(false);
const emit = defineEmits(['getList', 'isEdit']);
const serviceModals = ref<any>(false);
const formRef = ref<any>(null);
const currentStep = ref(1);

const service_plugin_id = ref<any>('');
const formElements = ref<any>([]);
const defaultForm = {
  name: '',
  service_plugin_id: '',
  voucher: {},
  vouchers: {},
  mode: 'manual' // 添加模式字段，默认为手动
};
const form = ref<any>({ ...defaultForm });
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入接入点名称'
  },
  mode: {
    required: true,
    trigger: ['change'],
    message: '请选择模式'
  }
});
const openModal: (id: any, row?: any) => void = async (id, row) => {
  if (row) {
    isEdit.value = true;
    Object.assign(form.value, row);
    Object.assign(form.value.vouchers, JSON.parse(row.voucher));
  }
  service_plugin_id.value = id;
  form.value.service_plugin_id = id;
  const data = await getServiceAccessForm({
    service_plugin_id: service_plugin_id.value
  });
  if (data.data) {
    formElements.value = data.data;
    serviceModals.value = true;
  }
};
const close: () => void = () => {
  serviceModals.value = false;
  form.value = { ...defaultForm };
  form.value.vouchers = {};
  currentStep.value = 1;
};

const submitSevice: () => void = async () => {
  formRef.value?.validate(async errors => {
    if (errors) return;
    if (form.value.mode === 'automatic') {
      // 自动模式，直接关闭当前弹窗，并打开配置弹窗
      serviceModals.value = false;
      emit('isEdit', form.value.voucher, {
        id: form.value.id,
        mode: form.value.mode,
        name: form.value.name
      }, true);
    } else {
      // 手动模式继续原有逻辑
      form.value.voucher = JSON.stringify(form.value.vouchers);
      const data: any = isEdit.value ? await putServiceDrop(form.value) : await createServiceDrop(form.value);
      serviceModals.value = false;
      const id = isEdit.value ? form.value.id : data.data.id;
      emit('isEdit', form.value.voucher, id, isEdit.value);
      form.value = { ...defaultForm };
      form.value.vouchers = {};
    }
  });
};

defineExpose({ openModal });
</script>

<template>
  <n-modal
    v-model:show="serviceModals"
    preset="dialog"
    :title="$t('card.addNewAccessPoint')"
    class="w"
    @after-leave="close"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item :label="$t('card.accessPointName')" path="name">
        <n-input v-model:value="form.name" placeholder="请输入接入点名称" />
      </n-form-item>
      <n-form-item :label="$t('common.selectionMode')" path="mode">
        <n-radio-group v-model:value="form.mode">
          <n-radio value="manual">{{ $t('common.manual') }}</n-radio>
          <n-radio value="automatic">{{ $t('common.automatic') }}</n-radio>
        </n-radio-group>
      </n-form-item>
    </n-form>
    <div class="box">
      <FormInput v-model:protocol-config="form.vouchers" :form-elements="formElements"></FormInput>
    </div>
    <div class="footer">
      <NButton type="primary" class="btn" @click="submitSevice">{{ $t('card.saveNext') }}</NButton>
      <NButton @click="close">{{ $t('common.cancel') }}</NButton>
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
  width: 70% !important;
  margin-top: 15vh;
  height: max-content !important;
  max-height: 800px !important;
  overflow: auto;
}
</style>
