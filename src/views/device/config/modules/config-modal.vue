<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { FormInst } from 'naive-ui';
import { $t } from '@/locales';
// import {useMessage} from 'naive-ui';
import { deviceConfigAdd, deviceConfigEdit, deviceTemplate } from '@/service/api/device';

// const message = useMessage();

interface Props {
  modalVisible?: boolean;
  modalType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modalVisible: false,
  modalType: 'add'
});
const modalTitle = ref($t('generate.add'));
const configForm = ref(defaultConfigForm());

function defaultConfigForm() {
  return {
    additional_info: null,
    description: null,
    device_conn_type: null,
    device_template_id: null,
    device_type: null,
    name: null,
    protocol_config: null,
    protocol_type: null,
    remark: null,
    voucher_type: null
  };
}

const configFormRules = ref({
  name: {
    required: true,
    message: $t('common.deviceConfigName'),
    trigger: 'blur'
  },
  device_type: {
    required: true,
    message: $t('common.deviceAccessType'),
    trigger: 'change'
  },
  device_conn_type: {
    required: true,
    message: $t('common.deviceConnectionMethod'),
    trigger: 'change'
  }
});
const deviceTemplateOptions = ref([]);
const getDeviceTemplate = () => {
  const paramsData = {
    page: 1,
    page_size: 100
  };
  deviceTemplate(paramsData).then(res => {
    deviceTemplateOptions.value = res.data.list;
  });
};

interface Emits {
  (e: 'modalClose'): void;

  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();
const visible = ref(false);
watch(
  () => props.modalVisible,
  newValue => {
    visible.value = newValue;
    if (props.modalType === 'add') {
      modalTitle.value = $t('generate.add');
    } else {
      modalTitle.value = $t('common.edit');
    }
    getDeviceTemplate();
  }
);
const modalClose = () => {
  emit('modalClose');
};

const deviceTemplateScroll = () => {};
const configFormRef = ref<HTMLElement & FormInst>();
const handleClose = () => {
  configFormRef.value?.restoreValidation();
  configForm.value = defaultConfigForm();
  visible.value = false;
  modalClose();
};
// 提交表单
const handleSubmit = async () => {
  await configFormRef?.value?.validate();
  if (props.modalType === 'add') {
    const res = await deviceConfigAdd(configForm.value);
    if (!res.error) {
      console.log(res);
      // message.success('新增成功');
    }
  } else {
    const res = await deviceConfigEdit(configForm.value);
    if (!res.error) {
      console.log(res);
      // message.success('修改成功');
    }
  }
  handleClose();
  emit('submitted');
};
</script>

<template>
  <div class="overflow-hidden">
    <NCard :title="`${modalTitle}${$t('custom.devicePage.deviceConfig')}`">
      <NForm ref="configFormRef" :model="configForm" :rules="configFormRules" label-placement="left" label-width="auto">
        <NFormItem :label="$t('generate.device-configuration-name')" path="name">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-device-name')" />
        </NFormItem>
        <NFormItem :label="$t('generate.select-device-function-template')" path="device_template_id">
          <NSelect
            v-model:value="configForm.device_template_id"
            :options="deviceTemplateOptions"
            label-field="name"
            value-field="id"
            @scroll="deviceTemplateScroll"
          ></NSelect>
        </NFormItem>
        <NFormItem :label="$t('generate.device-access-type')" path="device_type">
          <n-radio-group v-model:value="configForm.device_type" name="device_type">
            <n-space>
              <n-radio value="1">{{ $t('generate.direct-connected-device') }}</n-radio>
              <n-radio value="2">{{ $t('generate.gateway') }}</n-radio>
              <n-radio value="3">{{ $t('generate.gateway-sub-device') }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>
        <NFormItem :label="$t('generate.device-connection-method')" path="device_conn_type">
          <n-radio-group v-model:value="configForm.device_conn_type" name="device_conn_type">
            <n-space>
              <n-radio value="A">{{ $t('generate.device-connect-platform') }}</n-radio>
              <n-radio value="B">{{ $t('generate.platform-connect-device') }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>
        <NFlex>
          <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</NButton>
        </NFlex>
      </NForm>
    </NCard>
  </div>
</template>
