<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { FormInst } from 'naive-ui';
import { routeSysFlagOptions, routeTypeOptions } from '@/constants/business';
import { addElement, editElement, fetchElementList } from '@/service/api/route';
import { deepClone } from '@/utils/common/tool';
import { createRequiredFormRule } from '@/utils/form/rule';
import { icons } from '@/plugins/icon/icons';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: CustomRoute.Route | null;
  tableList: CustomRoute.Route[];
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const common_cancel = $t('common.cancel');
const common_confirm = $t('common.confirm');

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

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
    add: $t('common.add'),
    edit: $t('common.edit')
  };
  return titles[props.type];
});

const parentOptions = ref<CustomRoute.Route[]>([]);

async function getTableData() {
  const { data } = await fetchElementList({
    page: 1,
    page_size: 99
  });
  if (data) {
    const list: Api.Route.MenuRoute[] = data.list;
    parentOptions.value = list;
  }
}

getTableData();

/* eslint-disable logical-assignment-operators */
// const parentOptions = computed(() => {
//   return props.tableList.map((item: CustomRoute.Route) => {
//     return JSON.parse(JSON.stringify(item));
//   });
// });

/* eslint-disable logical-assignment-operators */
const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<
  CustomRoute.Route,
  | 'parent_id'
  | 'element_code'
  | 'param1'
  | 'element_type'
  | 'authority'
  | 'route_path'
  | 'remark'
  | 'multilingual'
  | 'param2'
  | 'param3'
  | 'orders'
  | 'description'
>;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules = {
  description: createRequiredFormRule($t('common.pleaseCheckValue')),
  element_code: createRequiredFormRule($t('common.pleaseCheckValue')),
  authority: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function createDefaultFormModel(): FormModel {
  return {
    parent_id: '0',
    element_code: '',
    param1: '',
    multilingual: 'default',
    param2: '',
    param3: '0',
    orders: 1,
    description: '',
    element_type: 1,
    authority: [],
    route_path: '',
    remark: ''
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
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
  const formData = deepClone(formModel);
  formData.parent_id = formData.parent_id || '0';
  formData.authority = JSON.stringify(formData.authority);
  let data: any;
  if (props.type === 'add') {
    data = await addElement(formData);
  } else if (props.type === 'edit') {
    data = await editElement(formData);
  }
  if (!data.error) {
    window.$message?.success(data.msg);
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
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-800px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.parent')" path="parent_id">
          <NTreeSelect
            v-model:value="formModel.parent_id"
            :options="parentOptions"
            label-field="description"
            key-field="id"
          />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.title')" path="description">
          <NInput v-model:value="formModel.description" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.multilingual')" path="multilingual">
          <NInput v-model:value="formModel.multilingual" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.name')" path="element_code">
          <NInput v-model:value="formModel.element_code" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.path')" path="param1">
          <NInput v-model:value="formModel.param1" />
        </NFormItemGridItem>
        <!--
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.route_path')">
          <NInput v-model:value="formModel.route_path" />
        </NFormItemGridItem>
        -->
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.icon')" path="param2">
          <IconSelect v-model:value="formModel.param2" :icons="icons" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.order')" path="orders">
          <NInputNumber v-model:value="formModel.orders" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.type')" path="element_type">
          <NRadioGroup v-model:value="formModel.element_type">
            <NRadio v-for="item in routeTypeOptions" :key="item.value" :value="Number(item.value)">
              {{ item.label }}
            </NRadio>
          </NRadioGroup>
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.form.authority')" path="authority">
          <NCheckboxGroup v-model:value="formModel.authority">
            <NSpace item-style="display: flex;">
              <NCheckbox v-for="item in routeSysFlagOptions" :key="item.value" :value="item.value" :label="item.label">
                {{ item.label }}
              </NCheckbox>
            </NSpace>
          </NCheckboxGroup>
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.menu.hideInMenu')" path="param3">
          <n-switch v-model:value="formModel.param3" checked-value="1" unchecked-value="0" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('common.description')">
          <NInput v-model:value="formModel.remark" type="textarea" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">
          {{ common_cancel }}
        </NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">
          {{ common_confirm }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
