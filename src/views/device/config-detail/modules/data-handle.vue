<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';
import { type FormInst, NButton, useDialog } from 'naive-ui';
import { PencilOutline as editIcon, TrashOutline as trashIcon } from '@vicons/ionicons5';
import Codemirror from 'codemirror-editor-vue3';
import 'codemirror/mode/javascript/javascript.js';
import {
  dataScriptAdd,
  dataScriptDel,
  dataScriptEdit,
  dataScriptQuiz,
  getDataScriptList,
  setDeviceScriptEnable
} from '@/service/api/device';
import { $t } from '@/locales';
// const message = useMessage();
const dialog = useDialog();

interface Props {
  configInfo?: object | any;
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
});
const configFormRef = ref<HTMLElement & FormInst>();

const modalTitle = ref($t('generate.add'));
const configForm: any = ref({});
const scripTypeOpt = ref([
  {
    label: $t('custom.devicePage.reportPreprocessing'),
    value: 'A'
  },
  {
    label: $t('custom.devicePage.transmissionPreprocessing'),
    value: 'B'
  },
  {
    label: $t('custom.devicePage.attributeReporting'),
    value: 'C'
  },
  {
    label: $t('custom.devicePage.attributeDistribution'),
    value: 'D'
  }
]);

function defaultConfigForm() {
  return {
    id: null,
    content: `function encodeInp(msg,topic)
-- 说明：该函数为编码函数，将输入的消息编码为平台可识别的消息格式或者设备可识别的消息格式，请根据实际需求编写编码逻辑
-- 入参：输入的msg，可以是任意数据类型的字符串。
-- 出参：返回值为编码后的消息,需要是json字符串形式
-- 注意：string与jsonObj互转需导入json库：local json = require("json")
-- 例，string转jsonObj：local jsonData = json.decode(msgString)
-- 例，jsonObj转string：local jsonStr = json.encode(jsonTable)
local json = require("json")
local jsonData = json.decode(msg)
-- 例 if jsonData.temp then
-- 例 jsonData.temp = jsonData.temp * 10
-- 例 end
local newJsonString = json.encode(jsonData)
return newJsonString
end`,
    description: null,
    device_config_id: null,
    enable_flag: 'Y',
    analog_input: null,
    last_analog_input: null,
    name: null,
    remark: null,
    script_type: null,
    resolt_analog_input: ''
  };
}

const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-title'),
    trigger: 'blur'
  },
  content: {
    required: true,
    message: $t('generate.parse-script'),
    trigger: 'blur'
  },
  enable_flag: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  script_type: {
    required: true,
    message: $t('generate.select-processing-type'),
    trigger: 'change'
  }
});
const showModal = ref(false);

const openModal = (type: any, item: any) => {
  modalTitle.value = type;
  configForm.value = defaultConfigForm();
  if (modalTitle.value === $t('common.edit')) {
    // 查询详情
    configForm.value = JSON.parse(JSON.stringify(item));
  }
  showModal.value = true;
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
const bodyStyle = ref({
  width: getPlatform.value ? '90%' : '600px'
});
const queryData: any = ref({
  device_config_id: '',
  script_type: '',
  page: 1,
  page_size: 10
});

interface DataScriptItem {
  id: string;
  name: string;
  content: string;
  description: string;
  device_config_id: string;
  enable_flag: string;
  script_type: string;
}
const dataScriptList = ref<Array<DataScriptItem>>([]);
const dataScriptTotal = ref(0);
const queryDataScriptList = async () => {
  queryData.value.device_config_id = props.configInfo.id;
  const res = await getDataScriptList(queryData.value);
  dataScriptList.value = res.data.list;
  dataScriptTotal.value = res.data.total;
};
const findScriptType = (scriptType: any) => {
  if (scriptType) {
    return scripTypeOpt.value.find((data: any) => {
      return scriptType === data.value;
    })?.label;
  }
  return '';
};
const searchDataScript = () => {
  queryData.value.page = 1;
  queryDataScriptList();
};

const handleChange = async (item: object) => {
  console.log(item);
  await setDeviceScriptEnable(item);
};
const handleClose = () => {
  configFormRef.value?.restoreValidation();
  showModal.value = false;
};
// 提交表单
const handleSubmit = async () => {
  await configFormRef?.value?.validate();
  configForm.value.device_config_id = props.configInfo.id;
  if (!configForm.value.id) {
    const res = await dataScriptAdd(configForm.value);
    if (!res.error) {
      // message.success('新增成功');
      handleClose();
      searchDataScript();
    }
  } else {
    const res = await dataScriptEdit(configForm.value);
    if (!res.error) {
      handleClose();
      // message.success('修改成功');
      searchDataScript();
    }
  }
};
const deleteData = async (item: any) => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteProcessing'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await dataScriptDel({ id: item.id });
      // message.success($t('custom.grouping_details.operationSuccess'));
      searchDataScript();
    }
  });
};
const doQuiz = async () => {
  await configFormRef?.value?.validate();

  dataScriptQuiz(configForm.value).then(({ data }: any) => {
    configForm.value.resolt_analog_input = data.message || '';
  });
  // const { data, error } = await dataScriptQuiz(configForm.value);
  // if (!error) {
  //   console.log(data);
  //   // configForm.value.resolt_analog_input = data.message || '';
  // }
};

const cmRef = ref();
const cmOptions = {
  mode: 'text/javascript',
  lineNumbers: false
};

const onChange = (val, cm) => {
  console.log(val);
  console.log(cm.getValue());
};

const onInput = val => {
  console.log(val);
};

const onReady = cm => {
  const lastLine = cm.lineCount() - 1;
  const lastCh = cm.getLine(lastLine).length;
  cm.focus();
  cm.setCursor({ line: lastLine, ch: lastCh });
  console.log(cm);
};
const setupEditor = () => {
  nextTick(() => {
    if (cmRef.value) {
      console.log(cmRef.value);
      cmRef.value.refresh(); // ensure the editor is correctly refreshed
    }
  });
};

watch(queryData.value, () => queryDataScriptList(), { deep: true });

onMounted(() => {
  queryDataScriptList();
});
</script>

<template>
  <div class="m-b-20px flex items-center gap-20px">
    <n-select v-model:value="queryData.script_type" :options="scripTypeOpt" class="max-w-40" />
    <NButton type="primary" @click="openModal($t('common.add'), null)">
      {{ $t('generate.add-data-processing') }}
    </NButton>
  </div>
  <n-empty v-if="dataScriptList.length === 0" size="huge" :description="$t('common.nodata')"></n-empty>
  <NGrid v-else x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen">
    <NGridItem v-for="item in dataScriptList" :key="item.id">
      <NCard hoverable style="height: 180px">
        <div class="item-name item-center flex">
          <div class="flex-1">
            {{ item.name }}
          </div>
          <NSwitch
            v-model:value="item.enable_flag"
            checked-value="Y"
            unchecked-value="N"
            @update-value="handleChange(item)"
          />
        </div>
        <div class="h-80px flex-1">
          <div class="item-desc description">{{ item.description }}</div>
          <div class="item-desc">{{ findScriptType(item.script_type) }}</div>
        </div>
        <NFlex justify="end">
          <NButton tertiary circle type="info" @click="openModal($t('common.edit'), item)">
            <template #icon>
              <n-icon>
                <editIcon />
              </n-icon>
            </template>
          </NButton>
          <NButton circle tertiary type="error" @click="deleteData(item)">
            <template #icon>
              <n-icon>
                <trashIcon />
              </n-icon>
            </template>
          </NButton>
        </NFlex>
      </NCard>
    </NGridItem>
  </NGrid>

  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :title="modalTitle + $t('common.dataProces')"
    :show-icon="false"
    :style="bodyStyle"
    :closable="false"
    @after-enter="setupEditor"
  >
    <NForm
      ref="configFormRef"
      class="flex-wrap"
      :class="getPlatform ? 'flex-col' : 'flex'"
      :model="configForm"
      :rules="configFormRules"
      label-placement="left"
      label-width="auto"
    >
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('page.manage.menu.form.title')" path="name">
        <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-title')" />
      </NFormItem>
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('generate.processing-type')" path="script_type">
        <NSelect
          v-model:value="configForm.script_type"
          :options="scripTypeOpt"
          :placeholder="$t('generate.select-processing-type')"
        ></NSelect>
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('device_template.table_header.description')" path="description">
        <NInput
          v-model:value="configForm.description"
          type="textarea"
          :placeholder="$t('generate.enter-description')"
        />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.parse-script')" :rules="configFormRules" path="content">
        <Codemirror
          ref="cmRef"
          v-model:value="configForm.content"
          :options="cmOptions"
          height="200"
          keepcursorinend
          border
          @change="onChange"
          @input="onInput"
          @ready="onReady"
        ></Codemirror>
        <!--        <NInput v-model:value="configForm.content" type="textarea" placeholder="请输入解析脚本" />-->
      </NFormItem>
      <NFormItem
        v-if="0"
        class="w-100%"
        :label="$t('page.manage.setting.dataClearSetting.form.enabled')"
        path="enable_flag"
      >
        <NSwitch v-model:value="configForm.enable_flag" checked-value="Y" unchecked-value="N" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.simulate-input')" path="last_analog_input">
        <NInput v-model:value="configForm.last_analog_input" type="textarea" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.debug-run-result')" path="resolt_analog_input">
        <NInput v-model:value="configForm.resolt_analog_input" :disabled="true" type="textarea" />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="doQuiz">{{ $t('common.debug') }}</NButton>
      </NFormItem>
    </NForm>
    <NFlex justify="end">
      <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
      <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </NFlex>
  </n-modal>
</template>

<style scoped lang="scss">
.alarm-box {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 40px;

  .alarm-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    //margin: 0 10px;
    padding: 18px;
    flex: 0 0 23%;
    margin-right: calc(30% / 3);
    margin-bottom: 30px;

    .item-name {
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: space-between;
    }

    .item-desc {
      margin: 15px 0;
    }

    .item-operate {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.description {
  height: 40px;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
