<script setup lang="ts">
import { ref } from 'vue';
import type { FormInst } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { deviceAdd } from '@/service/api/device';
import { $t } from '@/locales';

const props = defineProps<{
  configOptions: any[];
  nextCallback: () => void;
  setIdCallback: (dId, cId, dobj) => void;
}>();
const formRef = ref<FormInst | null>(null);
const message = useMessage();
const formValue = ref({
  name: '',
  label: [],
  device_config_id: ''
});
const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  }
};

function handleValidateClick(e: MouseEvent) {
  e.preventDefault();
  formRef.value?.validate(async errors => {
    if (!errors) {
      const res = await deviceAdd({ ...formValue.value, label: formValue.value.label.join(','), access_way: 'A' });
      const configId = formValue.value.device_config_id;
      const deviceId = res.data.id;
      props.setIdCallback(deviceId, configId, res.data.voucher);
      props.nextCallback();
    } else {
      console.log(errors);
      message.error($t('custom.devicePage.validationFailed'));
    }
  });
}
</script>

<template>
  <div>
    <n-card :bordered="false">
      <n-form ref="formRef" :label-width="80" :model="formValue" :rules="rules" size="small">
        <n-form-item :label="$t('custom.devicePage.deviceName')" path="name">
          <n-input v-model:value="formValue.name" :placeholder="() => $t('custom.devicePage.inputDeviceName')" />
        </n-form-item>
        <n-form-item :label="$t('custom.devicePage.label')" path="label">
          <n-dynamic-tags v-model:value="formValue.label" />
        </n-form-item>
        <n-form-item :label="$t('custom.devicePage.deviceConfig')" path="device_config_id">
          <n-select
            v-model:value="formValue.device_config_id"
            :placeholder="() => $t('custom.devicePage.selectDeviceConfig')"
            :options="configOptions"
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" attr-type="button" @click="handleValidateClick">
            {{ $t('device_template.nextStep') }}
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped></style>
