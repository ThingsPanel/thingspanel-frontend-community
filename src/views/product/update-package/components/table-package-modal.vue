<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { getDeviceConfigList } from '@/service/api/device';
import UploadCard from './upload-card.vue';
import { addOtaPackage, editOtaPackage } from '~/src/service/product/update-package';
import { $t } from '~/src/locales';
import { packageOptions, signModeOptions } from '~/src/constants/business';
const productOptions = ref();
const getOptions = async (name?: string) => {
  const { data, error } = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    name
  });
  if (!error && data) {
    productOptions.value = data?.list?.map(item => {
      return { label: item.name, value: item.id };
    });
  }
};
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: productPackageRecord | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('page.product.update-package.packageAdd'),
    edit: $t('page.product.update-package.packageEdit')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

const formModel = reactive<productPackageRecord>(createDefaultFormModel());
type formModelRuleName =
  | 'name'
  | 'version'
  | 'target_version'
  | 'package_type'
  | 'device_config_id'
  | 'signature_type'
  | 'package_url';
const rules: Record<formModelRuleName, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('page.product.update-package.packageNamePlaceholder')),
  version: createRequiredFormRule($t('page.product.update-package.versionPlaceholder')),
  target_version: createRequiredFormRule($t('page.product.update-package.versionCodePlaceholder')),
  package_type: createRequiredFormRule($t('page.product.update-package.typePlaceholder')),
  device_config_id: createRequiredFormRule($t('page.product.update-package.productPlaceholder')),
  signature_type: createRequiredFormRule($t('page.product.update-package.signModePlaceholder')),
  package_url: createRequiredFormRule($t('page.product.update-package.packagePlaceholder'))
};

function createDefaultFormModel(): productPackageRecord {
  const defaultFormModel: productPackageRecord = {
    id: '',
    additional_info: '',
    description: '',
    module: '',
    name: '',
    package_type: undefined as unknown as number,
    package_url: '',
    device_config_id: '',
    remark: '',
    signature_type: '',
    target_version: '',
    version: '',
    created_at: ''
  };
  return defaultFormModel;
}

function handleUpdateFormModel(model: Partial<productPackageRecord>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData as productPackageRecord);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addOtaPackage(formModel);
  } else if (props.type === 'edit') {
    data = await editOtaPackage(formModel);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <NModal v-model:show="modalVisible" :on-after-enter="() => getOptions()" preset="card" :title="title">
    <NForm
      ref="formRef"
      class="flex-wrap"
      :class="getPlatform ? 'flex-col' : 'flex'"
      label-placement="left"
      label-width="auto"
      :model="formModel"
      :rules="rules"
    >
      <NFormItem
        class=""
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.type')"
        path="package_type"
      >
        <NSelect
          v-model:value="formModel.package_type"
          :class="getPlatform ? '100%' : 'w-50%'"
          :options="packageOptions"
        />
      </NFormItem>
      <NFormItem
        v-if="formModel.package_type === 1"
        :class="getPlatform ? '100%' : 'w-50%'"
        :span="12"
        :label="$t('page.product.update-package.version')"
        path="target_version"
      >
        <NInput v-model:value="formModel.target_version" class="w-100%" />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.versionCode')"
        path="version"
      >
        <NInput v-model:value="formModel.version" class="w-100%" />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.packageName')"
        path="name"
      >
        <NInput v-model:value="formModel.name" class="w-100%" />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.deviceConfig')"
        path="device_config_id"
      >
        <NSelect
          v-model:value="formModel.device_config_id"
          class="w-100%"
          filterable
          :options="productOptions"
          @search="getOptions"
        />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.moduleName')"
        path="module"
      >
        <NInput v-model:value="formModel.module" class="w-100%" />
      </NFormItem>
      <!-- signModeOptions -->
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.update-package.signMode')"
        path="signature_type"
      >
        <NSelect v-model:value="formModel.signature_type" :options="signModeOptions" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('page.product.update-package.package')" path="package_url">
        <UploadCard v-model:value="formModel.package_url" source-type="upgradePackage" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('page.product.update-package.desc')" path="description">
        <NInput v-model:value="formModel.description" class="w-100%" type="textarea" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('page.product.update-package.customInfo')" path="additional_info">
        <NInput v-model:value="formModel.additional_info" type="textarea" />
      </NFormItem>
      <NSpace class="w-full pt-16px" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
