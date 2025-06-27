<script setup lang="tsx">
import { computed, defineProps, getCurrentInstance, nextTick, onMounted, reactive, ref } from 'vue';
import { NButton, NDataTable, NForm, NFormItem, NInput, NModal, NPagination, NPopconfirm, NTag } from 'naive-ui';
import Codemirror from 'codemirror-editor-vue3';
import { $t } from '@/locales';
import { isJSON } from '@/utils/common/tool';
import {
  deviceCustomControlAdd,
  deviceCustomControlDel,
  deviceCustomControlList,
  deviceCustomControlPut
} from '@/service/api/system-data';

const props = defineProps<{
  id: string;
}>();
const configFormRules = ref({
  name: {
    required: true,
    message: "按钮名称",
    trigger: 'blur'
  }
});

const commandjson: any = reactive({
  configForm: false,
  listData: [],
  total: 0,
  queryjson: {
    page: 1,
    page_size: 100
  },
  formjson: {
    name: '',
    description: '',
    content: '',
    enable_status: 'disable'
  }
});
const getControlList = (page: number = 1) => {
  const queryjson = { ...commandjson.queryjson, page, device_template_id: props.id };
  deviceCustomControlList(queryjson).then(({ data }) => {
    commandjson.listData = data.list || [];
    commandjson.total = data.total;
  });
};
const cmRef = ref();
const cmOptions = {
  mode: 'text/javascript',
  lineNumbers: false
};

const onReady = cm => {
  const lastLine = cm.lineCount() - 1;
  const lastCh = cm.getLine(lastLine).length;
  cm.focus();
  cm.setCursor({ line: lastLine, ch: lastCh });
};
const setupEditor = () => {
  nextTick(() => {
    if (cmRef.value) {
      cmRef.value.refresh(); // ensure the editor is correctly refreshed
    }
  });
};
const openCommandDialog = () => {
  commandjson.formjson = {
    name: '',

    description: '',
    content: '',
    enable_status: 'disable'
  };
  commandjson.configForm = !commandjson.configForm;
};
const handleDeleteTable = async id => {
  const { error } = await deviceCustomControlDel(id);

  if (!error) {
    getControlList();
  }
};
const handleEditTable = (row: any) => {
  openCommandDialog();
  commandjson.formjson = row;
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
const columns: any = [
  {
    key: 'name',
    minWidth: '100px',
    title: "按钮名称"
  },
  {
    key: 'content',
    minWidth: '100px',
    title: "指令内容"
  },
  {
    key: 'enable_status',
    minWidth: '100px',
    title: "启用状态",
    render: row => {
      if (row?.enable_status === 'enable') {
        return <NTag type="success">{"启用"}</NTag>;
      }
      return <NTag type="warning">{"禁用"}</NTag>;
    }
  },
  {
    key: 'description',
    minWidth: '100px',
    title: "描述"
  },
  {
    key: 'actions',
    minWidth: '100px',
    title: "操作",
    align: 'center',
    render: row => {
      return (
        <div class="flex gap-20px flex-justify-center">
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {"编辑"}
          </NButton>

          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      );
    }
  }
];
const configFormRef = ref();
const onCommandSubmit = async e => {
  const params = { ...commandjson.formjson, device_template_id: props.id, control_type: 'telemetry' };
  e.preventDefault();
  configFormRef.value?.validate(async errors => {
    if (!errors && isJSON(commandjson.formjson?.content)) {
      const { error } = commandjson.formjson?.id
        ? await deviceCustomControlPut(params)
        : await deviceCustomControlAdd(params);
      if (!error) {
        openCommandDialog();
        getControlList();
      }
    }
  });
};

onMounted(() => {
  getControlList();
});
const validationJson = computed(() => {
  if (commandjson?.formjson?.content && !isJSON(commandjson.formjson.content)) {
    return 'error';
  }
  return undefined;
});
const inputFeedback = computed(() => {
  if (commandjson?.formjson?.content && !isJSON(commandjson.formjson.content)) {
    return "输入的不是有效的JSON格式";
  }
  return '';
});
</script>

<template>
  <div class="p-t-20px">
    <div class="flex-align-end m-b-20px flex flex-justify-between">
      <div>{{ "自定义控制" }}</div>
      <NButton class="justify-end" type="primary" @click="openCommandDialog">
        {{ "新增自定义命令" }}
      </NButton>
    </div>
    <NDataTable :columns="columns" :data="commandjson.listData" class="flex-1-hidden" />

    <div class="w-full flex justify-end">
      <NPagination
        :item-count="commandjson.total"
        :page-size="commandjson.queryjson.page_size"
        @update:page="getControlList"
      />
    </div>
    <NModal
      v-model:show="commandjson.configForm"
      :title="自定义命令"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
      @after-enter="setupEditor"
    >
      <n-card>
        <NForm
          ref="configFormRef"
          :model="commandjson.formjson"
          label-placement="left"
          class="flex-wrap"
          :rules="configFormRules"
          label-width="auto"
        >
          <div>
            <NH3>{{ "自定义命令" }}</NH3>
          </div>
          <NFormItem :label="按钮名称" path="name">
            <NInput v-model:value="commandjson.formjson.name" :placeholder="或在此输入" />
          </NFormItem>

          <NFormItem
            :label="指令内容"
            path="content"
            :validation-status="validationJson"
            :feedback="inputFeedback"
          >
            <Codemirror
              ref="cmRef"
              v-model:value="commandjson.formjson.content"
              :options="cmOptions"
              height="100"
              keepcursorinend
              border
              @ready="onReady"
            ></Codemirror>
            <!-- <NInput v-model:value="commandjson.formjson.content" :placeholder="或在此输入" /> -->
          </NFormItem>
          <NFormItem :label="启用状态" path="enable_status">
            <n-switch
              v-model:value="commandjson.formjson.enable_status"
              checked-value="enable"
              unchecked-value="disable"
            />
          </NFormItem>
          <NFormItem :label="描述" path="description">
            <NInput v-model:value="commandjson.formjson.description" type="textarea" />
          </NFormItem>

          <NFlex justify="end">
            <NButton @click="openCommandDialog">{{ "取消" }}</NButton>
            <NButton type="primary" @click="onCommandSubmit">{{ "确定" }}</NButton>
          </NFlex>
        </NForm>
      </n-card>
    </NModal>
  </div>
</template>

<style scoped>
.flex-align-end {
  align-items: flex-end;
}
</style>
