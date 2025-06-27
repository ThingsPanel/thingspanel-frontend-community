<script setup lang="tsx">
import type { Ref } from 'vue';
import { reactive, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import { $t } from '@/locales';
import { addCommands, putCommands } from '@/service/api/system-data';

const emit = defineEmits(['update:addAndEditModalVisible', 'update:objItem', 'determine']);

const addParameter: Ref<boolean> = ref(false);
let eventsData: any = reactive([]);

const generalOptions: any = reactive(
  ['String', 'Number', 'Boolean', 'Enum'].map(v => ({
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
  param_type: 'string',
  description: '',
  data_type: 'string',
  enum_config: []
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
  param_type: {
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
    key: 'param_type',
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
    message: "请输入命令名称"
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入命令标识符"
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
    const response: any = await putCommands(addFrom);
    if (response.data) {
      emit('update:objItem', {});
      emit('update:addAndEditModalVisible', false);
      emit('determine');
    }
  } else {
    const response: any = await addCommands(addFrom);
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
    param_type: 'string',
    description: '',
    enum_config: []
  });
};

// 添加枚举值
const addEnumItem = () => {
  addParameterFrom.enum_config.push({
    value: '',
    desc: ''
  });
};
// 移除枚举值
const removeEnumItem = index => {
  addParameterFrom.enum_config.splice(index, 1);
};

// 新增确定参数的按钮
const parameterSubmit: () => void = async () => {
  await formRefs.value?.validate();
  if (addParameterFrom.param_type === 'Enum') {
    const enum_config = addParameterFrom.enum_config.filter(v => v.value && v.desc);
    if (enum_config.length < 1) {
      window.$message?.error('请添加枚举项！');
      return;
    }
    addParameterFrom.enum_config = enum_config;
  }
  if (addFlag.value) {
    if (addParameterFrom.param_type === 'Enum') {
      const enum_config = addParameterFrom.enum_config.filter(v => v.value && v.desc);
      if (enum_config.length < 1) {
        window.$message?.error('请添加枚举项！');
        return;
      }
      addParameterFrom.enum_config = enum_config;
    }
    eventsData.push({ ...addParameterFrom, id: Math.random() });
    addParameterFrom = reactive({
      data_name: '',
      data_identifier: '',
      param_type: 'string',
      description: '',
      data_type: 'string',
      enum_config: []
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
    <n-form-item :label="命令名称" path="data_name">
      <n-grid :cols="2">
        <n-gi>
          <n-input v-model:value.trim="addFrom.data_name" placeholder=" />
        </n-gi>
      </n-grid>
    </n-form-item>
    <n-form-item :label="命令标识符" path="data_identifier">
      <n-grid :cols="2">
        <n-gi>
          <n-input v-model:value.trim="addFrom.data_identifier" placeholder=" />
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
    <n-form-item :label="命令描述">
      <n-input
        v-model:value.trim="addFrom.description"
        :placeholder="请输入命令描述"
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
    class="mw-600px w-50%"
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
      <n-form-item :label="参数类型" path="param_type">
        <div>
          <n-select
            v-model:value="addParameterFrom.param_type"
            :options="generalOptions"
            :placeholder="请选择参数类型"
            class="w-150px"
          />
          <template v-if="addParameterFrom.param_type === 'Enum'">
            <div class="mtb-10px">{{ "设置枚举项" }}</div>

            <div class="flex">
              <div class="data-type-label">
                {{ "数据类型" }}
              </div>
              <n-select
                v-model:value="addParameterFrom.data_type"
                :options="generalOptions.filter(v => v.value !== 'Enum')"
                :placeholder="请选择"
              />
            </div>
            <div class="enum-item-list">
              <div class="row th">
                <div class="col">{{ "枚举值" }}</div>
                <div class="col">{{ "枚举描述" }}</div>
                <div class="col"></div>
              </div>
              <div v-for="(item, index) in addParameterFrom.enum_config" :key="index" class="row tr">
                <div class="col value">
                  <n-input v-model:value.trim="item.value" :placeholder="输入" />
                </div>
                <div class="col desc">
                  <n-input v-model:value.trim="item.desc" :placeholder="输入" />
                </div>
                <div class="col">
                  <NButton type="primary" @click="removeEnumItem(index)">{{ "移除" }}</NButton>
                </div>
              </div>
              <NButton type="primary" @click="addEnumItem">{{ "添加枚举项" }}</NButton>
            </div>
          </template>
        </div>
      </n-form-item>
      <n-form-item :label="描述">
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
.mw-600px {
  min-width: 600px !important;
}
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
.flex {
  display: flex;
}
.data-type-label {
  flex-shrink: 0;
  margin-right: 10px;
}
.mtb-10px {
  margin: 10px 0;
}
.enum-item-list {
  .row {
    display: flex;
    .col {
      flex-shrink: 0;
      padding: 5px 10px 5px 0;
      width: 100px;
      box-sizing: border-box;
      &.desc {
        width: 200px;
      }
    }
  }
}
</style>
