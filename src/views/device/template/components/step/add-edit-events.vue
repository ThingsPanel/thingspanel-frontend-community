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
    message: "请输入参数名称"
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入参数标识符"
  },
  read_write_flag: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请选择参数类型"
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
    title: "参数名称",
    align: 'center'
  },
  {
    key: 'data_identifier',
    title: "请输入参数标识符",
    align: 'center'
  },
  {
    key: 'read_write_flag',
    title: "参数类型",
    align: 'center'
  },
  {
    key: 'description',
    title: "描述",
    align: 'center'
  },
  {
    key: 'actions',
    width: 350,
    title: () => "操作",
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
            {"编辑"}
          </NButton>
          <NPopconfirm onPositiveClick={() => del(row.id)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton quaternary type="primary" size={'small'}>
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
    if (objItem.id) {
      addFrom = reactive({
        device_template_id: deviceTemplateId,
        ...newVal
      });
      eventsData = reactive(JSON.parse(newVal.paramsOrigin));
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
    message: "请输入事件名称"
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入事件标识符"
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
    <n-form-item :label="事件名称" path="data_name">
      <n-grid :cols="2">
        <n-gi>
          <n-input
            v-model:value.trim="addFrom.data_name"
            :placeholder="单次控制任务"
          />
        </n-gi>
      </n-grid>
    </n-form-item>
    <n-form-item :label="事件标识符" path="data_identifier">
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
        {{ "添加参数" }}
      </NButton>
      <n-data-table :columns="col" :data="eventsData" class="m-b4 flex-1-hidden" />
    </div>
    <n-form-item :label="事件描述">
      <n-input
        v-model:value.trim="addFrom.description"
        :placeholder="请输入事件描述"
        type="textarea"
      />
    </n-form-item>
  </n-form>
  <div class="box2">
    <NButton class="m-r3" @click="clear">{{ "取消" }}</NButton>
    <NButton type="primary" @click="submit">{{ "确定" }}</NButton>
  </div>
  <NModal
    v-model:show="addParameter"
    preset="card"
    :title="新增/编辑参数"
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
      <n-form-item :label="参数名称" path="data_name">
        <n-input
          v-model:value.trim="addParameterFrom.data_name"
          :placeholder="请输入参数名称"
        />
      </n-form-item>
      <n-form-item :label="参数标识符" path="data_identifier">
        <n-input
          v-model:value.trim="addParameterFrom.data_identifier"
          :placeholder="请输入参数标识符"
        />
      </n-form-item>
      <n-form-item :label="参数类型" path="read_write_flag">
        <n-select
          v-model:value="addParameterFrom.read_write_flag"
          :options="generalOptions"
          :placeholder="请选择参数类型"
        />
      </n-form-item>
      <n-form-item :label="命令描述">
        <n-input
          v-model:value.trim="addParameterFrom.description"
          :placeholder="请输入描述"
          type="textarea"
        />
      </n-form-item>
    </n-form>
    <div class="box2">
      <NButton class="m-r3" @click="addParameter = false">{{ "取消" }}</NButton>
      <NButton type="primary" @click="parameterSubmit">{{ "确定" }}</NButton>
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
