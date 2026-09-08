<script setup lang="ts">
/* ————————————————————————————————————————————— 预注册新增弹窗 ——————————————————————————————————————————————— */
import { computed, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { STATIC_BASE_URL } from '@/constants/common';
import UploadCard from '../../update-package/components/upload-card.vue';
import { $t } from '~/src/locales';
import { addDevice, editProduct } from '~/src/service/product/list';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: deviceAddType | null;
  pid: number | string;
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
    add: $t('page.product.list.batchAdd'),
    edit: $t('page.product.list.editProduct')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

const formModel = reactive<deviceAddType>(createDefaultFormModel());
// batch_file: string;
// batch_number: string;
// create_type: string;
// current_version: string;
// device_count ?: number;
// product_id ?: string;
type RuleKey = Extract<keyof deviceAddType, 'batch_file' | 'batch_number' | 'create_type' | 'device_count'>;
const rules = computed(() => {
  const rulesData: Record<RuleKey, FormItemRule | FormItemRule[]> = {
    batch_file: formModel.create_type === '2' ? createRequiredFormRule($t('page.product.list.filePlaceholder')) : [],
    batch_number: createRequiredFormRule($t('page.product.list.batchNumberPlaceholder')),
    create_type: createRequiredFormRule($t('page.product.list.productTypePlaceholder')),
    device_count:
      formModel.create_type === '1' ? createRequiredFormRule($t('page.product.list.deviceNumberPlaceholder')) : []
  };
  return rulesData;
});

const downloadTemplate = () => {
  window.open(`${STATIC_BASE_URL}/files/batch_template/batch_template.xlsx`);
};

function createDefaultFormModel(): deviceAddType {
  const data: deviceAddType = {
    batch_file: '',
    create_type: '1',
    current_version: '',
    batch_number: ''
  };
  return data;
}

function handleUpdateFormModel(model: Partial<deviceAddType>) {
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
        handleUpdateFormModel(props.editData as deviceAddType);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addDevice({
      ...formModel,
      product_id: props.pid,
      device_count: Number(formModel.device_count)
    });
  } else if (props.type === 'edit') {
    data = await editProduct(formModel);
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
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-500px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.product.list.batchNumber')" path="batch_number">
          <NInput v-model:value="formModel.batch_number" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.product.list.firmwareVersion')" path="current_version">
          <NInput v-model:value="formModel.current_version" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.product.list.addType')" path="create_type">
          <NRadioGroup v-model:value="formModel.create_type">
            <NRadio value="1" :label="$t('page.product.list.autoGenerate')" />
            <NRadio value="2" :label="$t('page.product.list.batchUpload')" />
          </NRadioGroup>
        </NFormItemGridItem>
        <NFormItemGridItem
          v-if="formModel.create_type === '2'"
          :span="24"
          :label="$t('page.product.list.file')"
          path="batch_file"
        >
          <UploadCard
            v-model:value="formModel.batch_file"
            :text="$t('page.product.list.filePlaceholder')"
            accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            source-type="importBatch"
            class="mt-10px"
            :file-type="['xls', 'xlsx']"
          ></UploadCard>
          <NButton quaternary type="primary" @click="downloadTemplate">
            {{ $t('page.product.list.downloadTemplate') }}
          </NButton>
        </NFormItemGridItem>
        <NFormItemGridItem v-else :span="24" :label="$t('page.product.list.deviceCount')" path="device_count">
          <NInput v-model:value="formModel.device_count" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
