<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, FormInst, FormItemRule, SelectOption } from 'naive-ui';
import { dataServiceFlagOptions, dataServiceSignModeOptions } from '@/constants/business';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: DataService.Data | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  (e: 'getTableData'): void;
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
    add: $t('generate.addRule'),
    edit: $t('generate.editRule')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<
  DataService.Data,
  'name' | 'signMode' | 'ip' | 'flag' | 'desc' | 'appKey' | 'dataInterval' | 'SQL' | 'status' | 'SQLWritingAid'
>;

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('generate.ruleName')),
  signMode: createRequiredFormRule($t('generate.signatureMethod')),
  ip: createRequiredFormRule($t('generate.IPwhitelist')),
  flag: createRequiredFormRule($t('generate.supportFlag')),
  desc: createRequiredFormRule($t('device_template.table_header.PleaseEnterADescription')),
  appKey: createRequiredFormRule($t('generate.supportFlag')),
  dataInterval: createRequiredFormRule($t('generate.dataInterval')),
  SQL: createRequiredFormRule($t('generate.dataInterval')),
  status: createRequiredFormRule($t('generate.selectStatus')),
  SQLWritingAid: createRequiredFormRule($t('generate.selectStatus'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    signMode: null,
    ip: null,
    flag: null,
    desc: null,
    appKey: '',
    dataInterval: null,
    SQL: null,
    status: null,
    SQLWritingAid: null
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
  const titles: Record<ModalType, string> = {
    add: $t('generate.add'),
    edit: $t('common.edit')
  };
  window.$message?.success(`${titles[props.type] + $t('custom.devicePage.success')}!`);
  emit('getTableData');
  closeModal();
}

interface Columns {
  name: string;
  dataType: string;
  annotation: string;
}

const columns: Ref<DataTableColumns<Columns>> = ref([
  {
    key: 'name',
    title: $t('generate.fieldName'),
    align: 'left'
  },
  {
    key: 'dataType',
    title: $t('device_template.table_header.dataType'),
    align: 'left'
  },
  {
    key: 'annotation',
    title: $t('generate.annotation'),
    align: 'left'
  }
]) as Ref<DataTableColumns<Columns>>;

const tableData = ref<Columns[]>([]);

function setTableData(data: Columns[]) {
  tableData.value = data;
}

function handleChangeFlag(value: string, option: SelectOption) {
  console.log(value);
  console.log(option);
  setTableData([{ name: 'ceshi', dataType: 'ceshi', annotation: 'ceshi' }]);
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
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('generate.rule-name')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.signature-method')" path="signMode">
          <NSelect v-model:value="formModel.signMode" :options="dataServiceSignModeOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.ip2')">
          <NInput v-model:value="formModel.ip" type="textarea" :placeholder="$t('generate.ip')" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.api-support-flag')" path="flag">
          <NSelect v-model:value="formModel.flag" :options="dataServiceFlagOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('device_template.table_header.description')">
          <NInput v-model:value="formModel.desc" type="textarea" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.sql2')">
          <div class="flex-1">
            <NSelect
              v-model:value="formModel.SQLWritingAid"
              :options="dataServiceFlagOptions"
              @update:value="handleChangeFlag"
            />
            <NDataTable :columns="columns" :data="tableData" class="mt-20px flex-1-hidden" />
          </div>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" label="SQL">
          <NInput v-model:value="formModel.SQL" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
