<script setup lang="ts">
/* ————————————————————————————————————————————— 产品编辑与新增弹窗 ——————————————————————————————————————————————— */
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { getDeviceConfigList } from '@/service/api/device';
import { dictQuery } from '@/service/api/setting';
import UploadCard from './upload-card.vue';
import { $t } from '~/src/locales';
import { addProduct, editProduct } from '~/src/service/product/list';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: productRecord | null;
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
    add: $t('page.product.list.addProduct'), // 新增产品
    edit: $t('page.product.list.editProduct') // 编辑产品
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();
const deviceOptions = ref();

const getList = async (name?: string) => {
  const { data, error } = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    name
  });
  if (!error && data) {
    deviceOptions.value = data?.list?.map(item => {
      return { label: item.name, value: item.id };
    });
  }
};
const formModel = reactive<productAdd>(createDefaultFormModel() as productAdd);

const rules: Record<'name' | 'product_type', FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('page.product.list.productNamePlaceholder')),
  product_type: createRequiredFormRule($t('page.product.list.productTypePlaceholder'))
};

function createDefaultFormModel() {
  return {
    name: '',
    device_type: undefined,
    additional_info: undefined,
    description: undefined,
    image_url: undefined,
    product_model: undefined,
    product_type: undefined,
    remark: undefined,
    device_config_id: undefined,
    product_key: undefined
  };
}

function handleUpdateFormModel(model: Partial<productRecord>) {
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
        handleUpdateFormModel(props.editData as productAdd);
      }
    }
  };

  handlers[props.type]();
}

const productOptions = ref([]);
const getProductList = async (name?: string) => {
  const res: any = await dictQuery({
    page: 1,
    page_size: 10,
    dict_code: 'PRODUCT_TYPE',
    name
  });
  productOptions.value = res.data || [];
};

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addProduct(formModel);
  } else if (props.type === 'edit') {
    data = await editProduct(formModel);
  }
  if (!data.error) {
    // window.$message?.success(data.msg || data.message || $t('page.product.list.success'));
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
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :on-after-enter="
      () => {
        getList(), getProductList();
      }
    "
    :title="title"
  >
    <NForm
      ref="formRef"
      class="flex-wrap"
      :class="getPlatform ? 'flex-col' : 'flex'"
      label-placement="left"
      :label-width="100"
      :model="formModel"
      :rules="rules"
    >
      <NFormItem :class="getPlatform ? '100%' : 'w-50%'" :label="$t('page.product.list.productName')" path="name">
        <NInput v-model:value="formModel.name" />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.list.deviceType')"
        path="product_type"
      >
        <NSelect
          v-model:value="formModel.product_type"
          filterable
          :options="productOptions"
          label-field="translation"
          value-field="dict_value"
          @search="getProductList"
        />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.list.productNumber')"
        path="product_model"
      >
        <NInput v-model:value="formModel.product_model" />
      </NFormItem>
      <NFormItem
        :class="getPlatform ? '100%' : 'w-50%'"
        :label="$t('page.product.list.deviceConfig')"
        path="device_config_id"
      >
        <NSelect
          v-model:value="formModel.device_config_id"
          filterable
          :disabled="props.type === 'edit'"
          :options="deviceOptions"
          @search="getList"
        />
      </NFormItem>
      <NFormItem :class="getPlatform ? '100%' : 'w-50%'" :label="$t('page.product.list.productKey')" path="product_key">
        <NInput v-model:value="formModel.product_key" :disabled="props.type === 'edit'" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('page.product.list.productImage')" path="image_url">
        <UploadCard
          v-model:value="formModel.image_url"
          accept="image/png, image/jpeg, image/jpg"
          class="mt-10px"
          :file-type="['jpg', 'png', 'jpeg']"
        ></UploadCard>
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('page.product.list.productDesc')" path="description">
        <NInput v-model:value="formModel.description" />
      </NFormItem>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
