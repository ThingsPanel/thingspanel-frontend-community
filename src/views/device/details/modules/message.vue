<script setup lang="tsx">
import type { Ref } from 'vue';
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { FormInst } from 'naive-ui';
import { NButton, NPopconfirm, NSpace, NSwitch, useMessage } from 'naive-ui';
import { deviceConfigInfo, deviceDetail, deviceLocation } from '@/service/api';
import { deviceConfigEdit } from '@/service/api/device';
import { $t } from '@/locales';
import TencentMap from './public/tencent-map.vue'; // 路径根据实际位置调整

const props = defineProps<{
  id: string;
  deviceConfigId: string;
}>();
const latitude = ref('');
const longitude = ref('');
const isShow = ref(false);
const editIndex = ref(-1);
const isEdit = ref(true);
const additionInfo = ref([] as any[]);
const extendFormRef = ref<HTMLElement & FormInst>();
const extendForm = ref(defaultExtendForm());
const visible = ref(false);
const postData = reactive({
  additional_info: '',
  id: ''
});
const { query } = useRoute();
const message = useMessage();
const modalClose = () => {};
const handleClose = () => {
  extendFormRef.value?.restoreValidation();
  extendForm.value = defaultExtendForm();
  visible.value = false;
  isEdit.value = false;
  editIndex.value = -1;
};

function defaultExtendForm() {
  return {
    name: null,
    type: null,
    default_value: null,
    desc: null,
    enable: false
  };
}
const handleSave = async () => {
  const res = await deviceLocation({
    id: props.id,
    location: `${longitude.value},${latitude.value}`,
    additional_info: JSON.stringify({ extendedInfo: additionInfo.value })
  });
  if (!res.error) {
    message.success("修改成功");
  }
  handleClose();
};
const handleAdditionSave = async () => {
  postData.id = props.deviceConfigId;
  postData.additional_info = JSON.stringify(additionInfo.value);
  const res = await deviceConfigEdit(postData);
  if (!res.error) {
    message.success("修改成功");
  }
  handleClose();
};
const handleSubmit = async () => {
  await extendFormRef?.value?.validate();
  if (editIndex.value >= 0) {
    additionInfo.value[editIndex.value] = extendForm.value;
  } else {
    extendForm.value.enable = false;
    additionInfo.value.push(extendForm.value);
  }
  handleAdditionSave();
};

const handleSwitchChange = async row => {
  const index = (additionInfo.value || []).findIndex(item => {
    return (
      item.name === row.name &&
      item.type === row.type &&
      item.default_value === row.default_value &&
      item.desc === row.desc
    );
  });
  if (index >= 0) {
    additionInfo.value[index].enable = !additionInfo.value[index].enable;
    handleAdditionSave();
  }
};
const handleDeleteTable = async row => {
  const index = (additionInfo.value || []).findIndex(item => {
    return (
      item.name === row.name &&
      item.type === row.type &&
      item.default_value === row.default_value &&
      item.desc === row.desc
    );
  });
  if (index >= 0) {
    additionInfo.value.splice(index, 1);
    handleSave();
  }
  window.$message?.info("扩展信息已删除");
};

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
const handleEditTable = async row => {
  editIndex.value = (additionInfo.value || []).findIndex(item => {
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
    title: "名称",
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'type',
    minWidth: '140px',
    title: "类型",
    align: 'left'
  },
  {
    key: 'default_value',
    title: "默认值",
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'desc',
    title: "描述",
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'enable',
    minWidth: '140px',
    title: "启用",
    align: 'left',
    render: (row: any) => {
      return <NSwitch value={Boolean(row.enable)} onChange={() => handleSwitchChange(row)} />;
    }
  },
  {
    key: 'operate',
    minWidth: '140px',
    title: "操作",
    align: 'left',
    render: (row: any) => {
      return (
        <NSpace>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {"编辑"}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]);

const onPositionSelected = position => {
  latitude.value = position.lat.toString();
  longitude.value = position.lng.toString();
  isShow.value = false;
};

const openMapAndGetPosition = () => {
  isShow.value = true;
};
const getConfigInfo = async () => {
  const result = await deviceDetail(query.d_id as string);
  const location = result?.data?.location || '';
  const deviceAdditionalInfo = JSON.parse(result?.data?.additional_info || '');
  const locationData = location?.split(',') || [];
  latitude.value = locationData[1] || '';
  longitude.value = locationData[0] || '';

  if (props.deviceConfigId) {
    const resultData = await deviceConfigInfo({ id: props.deviceConfigId });
    const tempAdditionalInfo = resultData?.data?.additional_info || '';
    if (tempAdditionalInfo) {
      const extendedInfo = deviceAdditionalInfo?.extendedInfo || [];
      additionInfo.value = (JSON.parse(tempAdditionalInfo) || []).map(item => {
        return {
          id: resultData?.data?.device_config?.id,
          enable: item.enable,
          desc: item.desc,
          name: item.name,
          type: item.type,
          default_value: item.default_value,
          value: extendedInfo.find(info => info.name === item.name)?.value || item.default_value
        };
      });
    }
  }
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(getConfigInfo);
</script>

<template>
  <div>
    <NCard :title="设备位置" class="mb-4">
      <NSpace>
        <NInput v-model:value="longitude" :placeholder="经度" class="w-140px" />
        <NInput v-model:value="latitude" :placeholder="纬度" class="w-140px" />

        <NButton type="primary" @click="openMapAndGetPosition">{{ "定位" }}</NButton>
      </NSpace>
    </NCard>

    <NCard :title="扩展信息" class="mb-4">
      <NDataTable :columns="columns" :data="additionInfo" size="small" class="m-tb-10" />
    </NCard>

    <NButton type="primary" @click="handleSave">{{ "保存" }}</NButton>
    <NModal v-model:show="isShow" class="flex-center" :class="getPlatform ? 'max-w-90%' : 'max-w-720px'">
      <NCard class="flex flex-1">
        <TencentMap
          v-show="isShow"
          class="flex-1 h-440px w-680px"
          :longitude="longitude"
          :latitude="latitude"
          @position-selected="onPositionSelected"
        />
      </NCard>
    </NModal>
    <NModal
      v-model:show="visible"
      :mask-closable="false"
      :title="isEdit ? "编辑扩展信息" : "添加扩展信息"
      :class="getPlatform ? 'w-90%' : 'w-400px'"
      preset="card"
      @after-leave="modalClose"
    >
      <NForm ref="extendFormRef" :model="extendForm" label-placement="left" label-width="auto">
        <NFormItem :label="名称" path="name">
          <NInput v-model:value="extendForm.name" :placeholder="请输入设备名称" />
        </NFormItem>
        <NFormItem :label="类型" path="type">
          <NSelect
            v-model:value="extendForm.type"
            :options="typeOptions"
            :placeholder="请选择类型"
          ></NSelect>
        </NFormItem>
        <NFormItem :label="默认值" path="default_value">
          <NInput v-model:value="extendForm.default_value" :placeholder="请输入默认值" />
        </NFormItem>
        <NFormItem :label="描述" path="device_ids">
          <NInput v-model:value="extendForm.desc" :placeholder="请输入描述" type="textarea" />
        </NFormItem>
        <NFlex justify="flex-end">
          <NButton @click="handleClose">{{ "取消" }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ "确定" }}</NButton>
        </NFlex>
      </NForm>
    </NModal>
  </div>
</template>
