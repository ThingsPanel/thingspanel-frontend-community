<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { FormInst } from 'naive-ui';
import { router } from '@/router';
import {
  deviceConfigAdd,
  deviceConfigEdit,
  deviceConfigInfo,
  deviceConfigVoucherType,
  deviceProtocalServiceList,
  deviceTemplate,
  protocolPluginConfigForm
} from '@/service/api/device';
import { $t } from '@/locales';
import FormInput from '../config-detail/modules/form.vue';

const route = useRoute();
const configId = ref(route.query.id || null);
const modalTitle = ref($t('generate.add'));
const configForm = ref(defaultConfigForm());
const isEdit = ref(false);
// 合并字段
const typeOptions = ref([]);
const connectOptions = ref([]);
const protocol_config = ref({});
type FormElementType = 'input' | 'table' | 'select';
interface FormElement {
  type: FormElementType;
  dataKey: string;
  label: string;
  options?: Option[];
  placeholder?: string;
  validate?: Validate;
  array?: FormElement[];
}

const formElements = ref<FormElement[]>([]);

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
  const postData = { ...configForm.value };
  postData.protocol_config = JSON.stringify(protocol_config.value);

  if (!configId.value) {
    const res = await deviceConfigAdd(postData);
    if (!res.error) {
      handleClose();
    }
  } else {
    const res = await deviceConfigEdit(postData);
    if (!res.error) {
      handleClose();
    }
  }
};

const getConfig = async () => {
  const res = await deviceConfigInfo({ id: configId.value });
  configForm.value = { ...res.data };

  protocol_config.value = JSON.parse(res.data.protocol_config);
};

watch(
  () => configId.value,
  async newId => {
    if (newId) {
      modalTitle.value = $t('common.edit');
    }
  }
);
const getProtocolList = async (deviceCode: string) => {
  const queryData = { device_type: deviceCode };
  const res = await deviceProtocalServiceList(queryData);
  if (res.data) {
    typeOptions.value = [
      {
        type: 'group',
        name: $t('common.protocol'),
        key: 'protocol',
        children: res.data.protocol || []
      },
      {
        type: 'group',
        name: $t('common.service'),
        key: 'service',
        children: res.data.service || []
      }
    ];
  }
};

const getConfigForm = async data => {
  const res = await protocolPluginConfigForm({
    device_type: configForm.value.device_type,
    protocol_type: data
  });
  formElements.value = res.data || [];
};

const getVoucherType = async data => {
  connectOptions.value = [];
  const res = await deviceConfigVoucherType({
    device_type: configForm.value.device_type,
    protocol_type: data
  });
  if (res.data) {
    connectOptions.value = Object.keys(res.data).map(key => {
      return { label: key, value: res.data[key] };
    });
  }
};

const choseProtocolType = async data => {
  configForm.value.voucher_type = null;
  await getVoucherType(data);
  await getConfigForm(data);
};
onMounted(async () => {
  if (configId.value) {
    modalTitle.value = $t('common.edit');
    isEdit.value = true;
    await getConfig();
  } else {
    isEdit.value = false;
    modalTitle.value = $t('generate.add');
  }
  getDeviceTemplate();

  await getProtocolList(configForm?.value.device_type || '1');

  if (configForm.value.protocol_type) {
    await getVoucherType(configForm.value.protocol_type);
    await getConfigForm(configForm.value.protocol_type);
  }
});

// const getPlatform = computed(() => {
//   const { proxy }: any = getCurrentInstance();
//   return proxy.getPlatform();
// });
</script>

<template>
  <div class="overflow-y-auto">
    <NCard :title="`${modalTitle}${$t('custom.devicePage.deviceConfig')}`">
      <NForm ref="configFormRef" :model="configForm" :rules="configFormRules" label-placement="left" label-width="auto">
        <!-- 第一个文件中的原表单项 -->
        <NFormItem :label="$t('generate.device-configuration-name')" path="name" class="w-[600px]">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-device-name')" />
        </NFormItem>
        <NFormItem class="w-[600px]" :label="$t('generate.select-device-function-template')" path="device_template_id">
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
          <n-radio-group
            v-model:value="configForm.device_type"
            name="device_type"
            @update:value="
              v => {
                protocol_config.value = null;
                configForm.voucher_type = null;
                configForm.protocol_type = null;
                getProtocolList(v);
              }
            "
          >
            <n-space>
              <n-radio value="1" :disabled="isEdit">{{ $t('generate.direct-connected-device') }}</n-radio>
              <n-radio value="2" :disabled="isEdit">{{ $t('generate.gateway') }}</n-radio>
              <n-radio value="3" :disabled="isEdit">{{ $t('generate.gateway-sub-device') }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>

        <!-- 第二个文件中的新增表单项 -->
        <template v-if="configForm.device_type">
          <NFormItem class="w-[600px]" :label="$t('generate.choose-protocol-or-Service')" path="protocol_type">
            <NSelect
              v-model:value="configForm.protocol_type"
              :options="typeOptions"
              :placeholder="$t('generate.select-protocol-service')"
              label-field="name"
              value-field="service_identifier"
              @update:value="choseProtocolType"
            ></NSelect>
          </NFormItem>

          <NFormItem
            v-show="configForm.device_type === '2'"
            class="w-[600px]"
            :label="$t('generate.authentication-type')"
            path="voucher_type"
          >
            <NSelect
              v-model:value="configForm.voucher_type"
              :options="connectOptions"
              :placeholder="$t('generate.select-authentication-type')"
            ></NSelect>
          </NFormItem>
        </template>
        <NFormItem v-if="configForm.device_type === '3'">
          <FormInput v-model:protocol-config="protocol_config" :form-elements="formElements"></FormInput>
        </NFormItem>
        <NFlex justify="flex-start">
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
