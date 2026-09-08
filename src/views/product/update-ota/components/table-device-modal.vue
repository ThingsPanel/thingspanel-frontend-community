<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';
import { addOtaTask } from '@/service/product/update-ota';
import TableActionModal from './table-action-modal.vue';
import { editProduct } from '~/src/service/product/list';
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  pid: string;
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
    add: $t('page.product.update-ota.updateTask'),
    edit: $t('page.product.list.editProduct')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

const formModel = reactive<UpgradeTaskCreate>(createDefaultFormModel());

const rules: Record<'name' | 'device_type', FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('page.product.list.productNamePlaceholder')),
  device_type: createRequiredFormRule($t('page.product.list.productTypePlaceholder'))
};

function createDefaultFormModel(): UpgradeTaskCreate {
  const defaultFormModel: UpgradeTaskCreate = {
    device_id_list: [],
    description: '',
    name: '',
    ota_upgrade_package_id: props.pid,
    remark: ''
  };
  return defaultFormModel;
}

function handleUpdateFormModel(model: Partial<UpgradeTaskCreate>) {
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
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addOtaTask(formModel);
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
const deviceVisible = ref(false);

const checkDevice = () => {
  deviceVisible.value = true;
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" :class="getPlatform ? 'w-90%' : 'w-700px'">
    <NForm ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.product.update-ota.taskName') /*任务名称*/" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem
          :span="24"
          :label="$t('page.product.update-ota.selectDevice') /*选择设备*/"
          path="device_id_list"
        >
          <NSpace class="w-full" :size="24" align="center">
            <NButton type="default" @click="checkDevice">
              <!-- 批量选择设备 -->
              {{ $t('page.product.update-ota.batchSelectDevice') }}
            </NButton>
            {{ formModel.device_id_list.length }}
            {{ $t('page.product.update-ota.selected') }}
            <!-- 已选 -->
            <TableActionModal
              v-model:visible="deviceVisible"
              v-model:selected-keys="formModel.device_id_list"
              :class="getPlatform ? 'w-90%' : 'w-800px'"
              :edit-data="props.editData"
            />
          </NSpace>
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.product.update-ota.desc') /*描述*/" path="description">
          <NInput v-model:value="formModel.description" type="textarea" />
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
