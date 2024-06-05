<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { FormInst } from 'naive-ui';
// import {useMessage} from 'naive-ui';
import { router } from '@/router';
import { deviceConfigAdd, deviceConfigEdit, deviceConfigInfo, deviceTemplate } from '@/service/api/device';
import { $t } from '@/locales';

const route = useRoute();
// const message = useMessage();
const configId = ref(route.query.id || null);
const modalTitle = ref($t('generate.add'));
const configForm = ref(defaultConfigForm());
const isEdit = ref(false);

function defaultConfigForm() {
  return {
    id: null,
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
const queryTemplate = ref({
  page: 1,
  page_size: 20,
  total: 0
});
const deviceTemplateOptions = ref([{ name: $t('generate.unbind'), id: '' }]);
const getDeviceTemplate = () => {
  deviceTemplate(queryTemplate.value).then(res => {
    deviceTemplateOptions.value = deviceTemplateOptions.value.concat(res.data.list);
    queryTemplate.value.total = res.data.total;
  });
};

const deviceTemplateScroll = (e: Event) => {
  const currentTarget = e.currentTarget as HTMLElement;
  if (currentTarget.scrollTop + currentTarget.offsetHeight >= currentTarget.scrollHeight) {
    if (deviceTemplateOptions.value.length + 1 <= queryTemplate.value.total) {
      queryTemplate.value.page += 1;
      getDeviceTemplate();
    }
  }
};
const configFormRef = ref<HTMLElement & FormInst>();
const handleClose = () => {
  configFormRef.value?.restoreValidation();
  configForm.value = defaultConfigForm();
  router.go(-1);
};
// 提交表单
const handleSubmit = async () => {
  await configFormRef?.value?.validate();
  if (!configId.value) {
    const res = await deviceConfigAdd(configForm.value);
    if (!res.error) {
      // message.success('新增成功');
      handleClose();
    }
  } else {
    const res = await deviceConfigEdit(configForm.value);
    if (!res.error) {
      // message.success('修改成功');
      handleClose();
    }
  }
};
const getConfig = async () => {
  const res = await deviceConfigInfo({ id: configId.value });
  configForm.value = { ...res.data };
};

watch(
  () => configId.value,
  async newId => {
    if (newId) {
      modalTitle.value = $t('common.edit');
    }
  }
);

onMounted(async () => {
  // configId.value=<string>route.query.id || ''
  if (configId.value) {
    modalTitle.value = $t('common.edit');
    isEdit.value = true;
    await getConfig();
  } else {
    isEdit.value = false;
    modalTitle.value = $t('generate.add');
  }
  getDeviceTemplate();
});

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <div class="overflow-y-auto">
    <NCard :title="`${modalTitle}${$t('custom.devicePage.deviceConfig')}`">
      <NForm
        ref="configFormRef"
        :model="configForm"
        :rules="configFormRules"
        label-placement="left"
        label-width="auto"
        :class="getPlatform ? '90%' : 'w-600'"
      >
        <NFormItem :label="$t('generate.device-configuration-name')" path="name">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-device-name')" />
        </NFormItem>
        <NFormItem :label="$t('generate.select-device-function-template')" path="device_template_id">
          <NSelect
            v-model:value="configForm.device_template_id"
            :options="deviceTemplateOptions"
            filterable
            label-field="name"
            value-field="id"
            @scroll="deviceTemplateScroll"
          ></NSelect>
        </NFormItem>
        <NFormItem :label="$t('generate.device-access-type')" path="device_type">
          <n-radio-group v-model:value="configForm.device_type" name="device_type">
            <n-space>
              <n-radio value="1" :disabled="isEdit">{{ $t('generate.direct-connected-device') }}</n-radio>
              <n-radio value="2" :disabled="isEdit">{{ $t('generate.gateway') }}</n-radio>
              <n-radio value="3" :disabled="isEdit">{{ $t('generate.gateway-sub-device') }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>
        <!--        <NFormItem label="设备连接方式" path="device_conn_type">-->
        <!--          <n-radio-group v-model:value="configForm.device_conn_type" name="device_conn_type">-->
        <!--            <n-space>-->
        <!--              <n-radio value="A">设备连接平台</n-radio>-->
        <!--              <n-radio value="B">平台连接设备</n-radio>-->
        <!--            </n-space>-->
        <!--          </n-radio-group>-->
        <!--        </NFormItem>-->
        <NFlex justify="flex-end">
          <NButton type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</NButton>
        </NFlex>
      </NForm>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
.w-600 {
  width: 600px;
}
</style>
