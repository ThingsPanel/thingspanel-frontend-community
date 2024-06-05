<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import type { DataTableColumns, FormInst } from 'naive-ui';
import { NButton, NPopconfirm, NSpace, NSwitch, useMessage } from 'naive-ui';
import { deviceConfigEdit } from '@/service/api/device';
import { $t } from '@/locales';

const visible = ref(false);
const isEdit = ref(false);
const editIndex = ref(-1);
const extendFormRef = ref<HTMLElement & FormInst>();
const extendForm = ref(defaultExtendForm());
const message = useMessage();

interface Emits {
  (e: 'upDateConfig'): void;
}

const emit = defineEmits<Emits>();

interface Props {
  configInfo?: object | any;
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
});

function defaultExtendForm() {
  return {
    name: null,
    type: null,
    default_value: null,
    desc: null,
    enable: false
  };
}

const extendFormRules = ref({
  name: {
    required: true,
    message: $t('common.enterName'),
    trigger: 'blur'
  },
  type: {
    required: true,
    message: $t('generate.select-type'),
    trigger: 'change'
  }
});
const extendInfoList = ref([] as any[]);
const typeOptions = ref([
  {
    label: 'String',
    value: 'String'
  },
  {
    label: 'Number',
    value: 'Number'
  },
  {
    label: 'Boolean',
    value: 'Boolean'
  }
]);
const addDevice = () => {
  visible.value = true;
};
const modalClose = () => {};
const handleClose = () => {
  extendFormRef.value?.restoreValidation();
  extendForm.value = defaultExtendForm();
  visible.value = false;
  isEdit.value = false;
  editIndex.value = -1;
};

const handleSave = async () => {
  const postData = props.configInfo;
  postData.additional_info = JSON.stringify(extendInfoList.value);
  const res = await deviceConfigEdit(postData);
  if (!res.error) {
    message.success($t('common.modifySuccess'));
    emit('upDateConfig');
  }
  handleClose();
};

const handleSubmit = async () => {
  await extendFormRef?.value?.validate();
  if (editIndex.value >= 0) {
    extendInfoList.value[editIndex.value] = extendForm.value;
  } else {
    extendForm.value.enable = false;
    extendInfoList.value.push(extendForm.value);
  }
  handleSave();
};

const handleSwitchChange = async row => {
  const index = (extendInfoList.value || []).findIndex(item => {
    return (
      item.name === row.name &&
      item.type === row.type &&
      item.default_value === row.default_value &&
      item.desc === row.desc
    );
  });
  if (index >= 0) {
    extendInfoList.value[index].enable = !extendInfoList.value[index].enable;
    handleSave();
  }
};

const handleDeleteTable = async row => {
  const index = (extendInfoList.value || []).findIndex(item => {
    return (
      item.name === row.name &&
      item.type === row.type &&
      item.default_value === row.default_value &&
      item.desc === row.desc
    );
  });
  if (index >= 0) {
    extendInfoList.value.splice(index, 1);
    handleSave();
  }
  window.$message?.info($t('common.extensionInfoDeleted'));
};
const handleEditTable = async row => {
  editIndex.value = (extendInfoList.value || []).findIndex(item => {
    return (
      item.name === row.name &&
      item.type === row.type &&
      item.default_value === row.default_value &&
      item.desc === row.desc
    );
  });

  extendForm.value = row;
  isEdit.value = true;
  visible.value = true;
};

const columns: Ref<DataTableColumns<ServiceManagement.Service>> = ref([
  {
    key: 'name',
    title: $t('page.manage.menu.form.name'),
    minWidth: '140px',
    align: 'center'
  },
  {
    key: 'type',
    minWidth: '140px',
    title: $t('page.manage.menu.form.type'),
    align: 'center'
  },
  {
    key: 'default_value',
    title: $t('generate.default-value'),
    minWidth: '140px',
    align: 'center'
  },
  {
    key: 'desc',
    title: $t('custom.groupPage.description'),
    minWidth: '140px',
    align: 'center'
  },
  {
    key: 'enable',
    minWidth: '140px',
    title: $t('page.manage.common.status.enable'),
    align: 'center',
    render: (row: any) => {
      return <NSwitch value={Boolean(row.enable)} onChange={() => handleSwitchChange(row)} />;
    }
  },
  {
    key: 'operate',
    minWidth: '140px',
    title: $t('common.action'),
    align: 'center',
    render: (row: any) => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]);
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(() => {
  if (!props.configInfo.additional_info || props.configInfo.additional_info === '{}') {
    extendInfoList.value = [];
  } else {
    extendInfoList.value = JSON.parse(props.configInfo.additional_info);
  }
});
</script>

<template>
  <div class="extend-box">
    <NButton type="primary" @click="addDevice()">{{ $t('generate.add-extension-info') }}</NButton>
    <NDataTable :columns="columns" :data="extendInfoList" size="small" class="m-tb-10" />
    <!--    <div class="pagination-box">-->
    <!--      &lt;!&ndash; Data table to display device groups &ndash;&gt;-->
    <!--      &lt;!&ndash; Pagination component &ndash;&gt;-->
    <!--      <NPagination v-model:page="associatedQuery.page" :item-count="associatedTotal" @update:page="getTableData"  />-->
    <!--    </div>-->
    <NModal
      v-model:show="visible"
      :mask-closable="false"
      :title="isEdit ? $t('common.editExtendedInfo') : $t('common.addExtendedInfo')"
      :class="getPlatform ? 'w-90%' : 'w-400px'"
      preset="card"
      @after-leave="modalClose"
    >
      <NForm ref="extendFormRef" :model="extendForm" :rules="extendFormRules" label-placement="left" label-width="auto">
        <NFormItem :label="$t('page.manage.menu.form.name')" path="name">
          <NInput v-model:value="extendForm.name" :placeholder="$t('generate.enter-device-name')" />
        </NFormItem>
        <NFormItem :label="$t('generate.type')" path="type">
          <NSelect
            v-model:value="extendForm.type"
            :options="typeOptions"
            :placeholder="$t('generate.select-type')"
          ></NSelect>
        </NFormItem>
        <NFormItem :label="$t('generate.default-value')" path="default_value">
          <NInput v-model:value="extendForm.default_value" :placeholder="$t('generate.enter-default-value')" />
        </NFormItem>
        <NFormItem :label="$t('device_template.table_header.description')" path="device_ids">
          <NInput v-model:value="extendForm.desc" :placeholder="$t('generate.enter-description')" type="textarea" />
        </NFormItem>
        <NFlex justify="flex-end">
          <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</NButton>
        </NFlex>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.extend-box {
  .pagination-box {
    display: flex;
    justify-content: flex-end;
  }

  .m-tb-10 {
    margin: 10px;
  }
}
</style>
