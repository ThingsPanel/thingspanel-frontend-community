<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import { $t } from '@/locales';
import { addEvents, putEvents } from '@/service/api/system-data';

const emit = defineEmits(['update:addAndEditModalVisible', 'update:objItem', 'determine']);

const addParameter: Ref<boolean> = ref(false);
let eventsData: any = reactive([]);
const generalOptions: any = reactive(
  ['String', 'Number', 'Boolean'].map(v => ({
    label: v,
    value: v
  }))
);

const props = defineProps({
  addAndEditModalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  },
  objItem: {
    type: Object,
    required: true
  }
});

const deviceTemplateId = ref<string>(props.deviceTemplateId);
const objItem = reactive<any>(props.objItem);

// 添加参数配置
let addParameterFrom: any = reactive({
  data_name: '',
  data_identifier: '',
  read_write_flag: 'string',
  description: ''
});

const addParameterRules: any = reactive({
  data_name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.table_header.PleaseEnterTheParameterName')
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.table_header.PleaseEnterTheParameterIdentifier')
  },
  read_write_flag: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.table_header.PleaseSelectParameterType')
  }
});

// 编辑
const addFlag: Ref<boolean> = ref(true);
const edit: (row: any) => void = row => {
  addParameter.value = true;
  addFlag.value = false;
  addParameterFrom = reactive({ ...row });
};

// 删除
const del: (id: string) => void = async id => {
  const index: number = eventsData.findIndex(item => item.id === id);
  eventsData.splice(index, 1);
};

// 表格配置
const col: Ref<DataTableColumns<AddDeviceModel.Device>> = ref([
  {
    key: 'data_name',
    title: $t('device_template.table_header.parameterName'),
    align: 'center'
  },
  {
    key: 'data_identifier',
    title: $t('device_template.table_header.PleaseEnterTheParameterIdentifier'),
    align: 'center'
  },
  {
    key: 'read_write_flag',
    title: $t('device_template.table_header.ParameterType'),
    align: 'center'
  },
  {
    key: 'description',
    title: $t('device_template.table_header.description'),
    align: 'center'
  },
  {
    key: 'actions',
    width: 350,
    title: () => $t('common.action'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => del(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton quaternary type="primary" size={'small'}>
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

// 提交表单
const formRef: any = ref(null);
const formRefs: any = ref(null);

let addFrom: any = reactive({
  device_template_id: deviceTemplateId,
  data_name: '',
  data_identifier: '',
  description: '',
  params: ''
});

// 监听一下父组件传递过来的编辑数据
watch(
  objItem,
  newVal => {
    console.log('objItem changed', newVal.id);
    if (objItem.id) {
      addFrom = reactive({
        device_template_id: deviceTemplateId,
        ...newVal
      });
      eventsData = reactive(JSON.parse(newVal.params));
      console.log(JSON.parse(newVal.params), '父级');
    } else {
      addFrom = reactive({
        device_template_id: deviceTemplateId,
        data_name: '',
        data_identifier: '',
        description: '',
        params: ''
      });
    }
  },
  { deep: true, immediate: true }
);

type Rule = {
  required: boolean;
  trigger: string[];
  message: string;
};

type Rules = {
  data_name: Rule;
  data_identifier: Rule;
};

const fromRules: Rules = {
  data_name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.table_header.PleaseEventName')
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.table_header.PleaseEeventIdentifier')
  }
};

const addParams: () => void = () => {
  addParameter.value = true;
};

// 确定按钮
const submit: () => void = async () => {
  await formRef.value?.validate();
  addFrom.params = JSON.stringify(eventsData);
  if (props.objItem.id) {
    const response: any = await putEvents(addFrom);
    if (response.data) {
      emit('update:objItem', {});
      emit('update:addAndEditModalVisible', false);
      emit('determine');
    }
  } else {
    const response: any = await addEvents(addFrom);
    if (response.data) {
      emit('update:objItem', {});
      emit('update:addAndEditModalVisible', false);
      emit('determine');
    }
  }
};

// 取消按钮
const clear: () => void = () => {
  emit('update:objItem', {});
  emit('update:addAndEditModalVisible', false);
};

const addParameterClone: () => void = () => {
  addFlag.value = true;
  addParameterFrom = reactive({
    data_name: '',
    data_identifier: '',
    read_write_flag: 'string',
    description: ''
  });
};

// 新增确定参数的按钮
const parameterSubmit: () => void = async () => {
  await formRefs.value?.validate();
  if (addFlag.value) {
    eventsData.push({ ...addParameterFrom, id: Math.random() });
    addParameterFrom = reactive({
      data_name: '',
      data_identifier: '',
      read_write_flag: 'string',
      description: ''
    });
  } else {
    const index: number = eventsData.findIndex(item => item.id === addParameterFrom.id);
    eventsData[index] = reactive(addParameterFrom);
  }
  addParameter.value = false;
  addFlag.value = true;
};
</script>

<template>
  <n-form
    ref="formRef"
    :model="addFrom"
    :rules="fromRules"
    label-placement="left"
    label-width="100"
    require-mark-placement="right-hanging"
    class="addFrom"
  >
    <n-form-item :label="$t('device_template.table_header.eventName')" path="data_name">
      <n-grid :cols="2">
        <n-gi>
          <n-input
            v-model:value.trim="addFrom.data_name"
            :placeholder="$t('device_template.table_header.singleControlTaskl')"
          />
        </n-gi>
      </n-grid>
    </n-form-item>
    <n-form-item :label="$t('device_template.table_header.eventIdentifier')" path="data_identifier">
      <n-grid :cols="2">
        <n-gi>
          <n-input v-model:value.trim="addFrom.data_identifier" placeholder="oneControl" />
        </n-gi>
      </n-grid>
    </n-form-item>
    <div class="box">
      <NButton class="box-btn" type="primary" @click="addParams">
        <template #icon>
          <SvgIcon local-icon="add" class="more" />
        </template>
        {{ $t('device_template.table_header.addParameters') }}
      </NButton>
      <n-data-table :columns="col" :data="eventsData" class="m-b4 flex-1-hidden" />
    </div>
    <n-form-item :label="$t('device_template.table_header.eventDescription')">
      <n-input
        v-model:value.trim="addFrom.description"
        :placeholder="$t('device_template.table_header.PleaseEventDescription')"
        type="textarea"
      />
    </n-form-item>
  </n-form>
  <div class="box2">
    <NButton class="m-r3" @click="clear">{{ $t('device_template.cancellation') }}</NButton>
    <NButton type="primary" @click="submit">{{ $t('device_template.confirm') }}</NButton>
  </div>
  <NModal
    v-model:show="addParameter"
    preset="card"
    :title="$t('device_template.table_header.addEditParameters')"
    class="w-30%"
    @after-leave="addParameterClone"
  >
    <n-form
      ref="formRefs"
      :model="addParameterFrom"
      :rules="addParameterRules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
      class="addFrom"
    >
      <n-form-item :label="$t('device_template.table_header.parameterName')" path="data_name">
        <n-input
          v-model:value.trim="addParameterFrom.data_name"
          :placeholder="$t('device_template.table_header.PleaseEnterTheParameterName')"
        />
      </n-form-item>
      <n-form-item :label="$t('device_template.table_header.ParameterIdentifier')" path="data_identifier">
        <n-input
          v-model:value.trim="addParameterFrom.data_identifier"
          :placeholder="$t('device_template.table_header.PleaseEnterTheParameterIdentifier')"
        />
      </n-form-item>
      <n-form-item :label="$t('device_template.table_header.ParameterType')" path="read_write_flag">
        <n-select
          v-model:value="addParameterFrom.read_write_flag"
          :options="generalOptions"
          :placeholder="$t('device_template.table_header.PleaseSelectParameterType')"
        />
      </n-form-item>
      <n-form-item :label="$t('device_template.table_header.commandDescription')">
        <n-input
          v-model:value.trim="addParameterFrom.description"
          :placeholder="$t('device_template.table_header.PleaseEnterADescription')"
          type="textarea"
        />
      </n-form-item>
    </n-form>
    <div class="box2">
      <NButton class="m-r3" @click="addParameter = false">{{ $t('device_template.cancellation') }}</NButton>
      <NButton type="primary" @click="parameterSubmit">{{ $t('device_template.confirm') }}</NButton>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
.box {
  position: relative;
  padding-top: 3rem;

  .box-btn {
    position: absolute;
    top: 0;
    right: 0;
  }
}

.box2 {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
