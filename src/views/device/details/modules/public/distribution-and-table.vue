<script setup lang="ts">
import { computed, defineExpose, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import { NButton, NDataTable, NForm, NFormItem, NInput, NModal, NPagination } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { Refresh } from '@vicons/ionicons5';
import type { FlatResponseFailData, FlatResponseSuccessData } from '@sa/axios';
import moment from 'moment';
import { commandDataById, commandDataPub, deviceCustomCommandsIdList } from '@/service/api';
import { $t } from '@/locales';
import { isJSON } from '@/utils/common/tool';

const props = defineProps<{
  id: string;
  noRefresh?: boolean;
  isCommand?: boolean;
  buttonName?: string;
  tableColumns: any[] | undefined;
  expect?: boolean;
  submitApi?: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>;
  expectApi?: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>;
  fetchDataApi: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>;
}>();
const tableData = ref<any[] | undefined>();
const page_coune = ref(0);
const the_page = ref(1);
const showDialog = ref(false);
const textValue = ref('');
const commandValue = ref('');
const form = reactive({
  expected: false,
  time: null
});
const options = ref();
const { loading, startLoading, endLoading } = useLoading();
const paramsSelect = ref<any>([
  { label: 'true', value: true },
  { label: 'false', value: false }
]);
const paramsData = ref<any>([]);
const isTextArea = ref<any>(true);
const fetchDataFunction = async () => {
  startLoading();

  const { data, error } = await props.fetchDataApi({
    page: !props.noRefresh ? the_page.value : undefined,
    page_size: !props.noRefresh ? 4 : undefined,
    device_id: props.id
  });
  if (!error) {
    tableData.value = data?.value || data?.list || (Array.isArray(data) ? data : []) || [];
    if (data?.count) {
      page_coune.value = Math.ceil(data.count / 4);
    }
    endLoading();
  }
};

const openDialog = () => {
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  textValue.value = '';
  paramsData.value = [];
  commandValue.value = '';
  isTextArea.value = true;
  form.value = {
    expected: false,
    time: null
  };
};

const submit = async () => {
  let parms;
  const params: any = {};
  if (!isTextArea.value) {
    paramsData.value.filter((item: any) => {
      params[item.data_identifier] = item[item.data_identifier];
    });
    textValue.value = JSON.stringify(params);
  }
  if (isJSON(textValue.value)) {
    if (props.isCommand) {
      parms = {
        device_id: props.id,
        value: textValue.value,
        identify: commandValue.value
      };
    } else {
      parms = { device_id: props.id, value: textValue.value };
    }
    if (form.expected) {
      if (props.expectApi) {
        const expiry = new Date().getTime() + (form.time ? form.time * 60 * 60 * 1000 : 0);
        await props.expectApi({
          device_id: props.id,
          payload: textValue.value,
          send_type: props.isCommand ? 'command' : 'attribute',
          expiry: moment(expiry).format('YYYY-MM-DDTHH:mm:ssZ')
        });
      }
    } else if (props.submitApi) {
      await props.submitApi(parms);
    }

    await fetchDataFunction();
    closeDialog();
  }
};

const onCommandChange = async (row: any) => {
  const parms = {
    device_id: props.id,
    value: row.instruct,
    identify: row.data_identifier
  };
  await commandDataPub(parms);
  fetchDataFunction();
};

const updatePage = (page: number) => {
  the_page.value = page;
  fetchDataFunction();
};
const refresh = () => {
  the_page.value = 1;
  fetchDataFunction();
};

defineExpose({ refresh });
const getOptions = async show => {
  if (show) {
    const res = await commandDataById(props.id);
    options.value = res.data;
  }
};

const selectBtn: () => void = () => {
  commandValue.value = '';
  isTextArea.value = !isTextArea.value;
};

const selectVal: (arr: any, option: any) => void = (arr, option) => {
  paramsData.value = JSON.parse(option.params);
  console.log(arr);
};

const commandList = ref();

const getListData = async () => {
  const { data } = await deviceCustomCommandsIdList(props.id);
  commandList.value = data;
};
onMounted(() => {
  props.isCommand && getListData();
  fetchDataFunction();
});
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
const validationJson = computed(() => {
  if (textValue.value && !isJSON(textValue.value)) {
    return 'error';
  }
  return undefined;
});
const inputFeedback = computed(() => {
  if (textValue.value && !isJSON(textValue.value)) {
    return $t('generate.inputRightJson');
  }
  return '';
});
// const validationJson1 = computed(() => {
//   if (isTextArea.value&&commandValue.value && !isJSON(commandValue.value)) {
//     return 'error';
//   }
//   return undefined;
// });
// const inputFeedback1 = computed(() => {
//   if (isTextArea.value&&commandValue.value && !isJSON(commandValue.value)) {
//     return $t('generate.inputRightJson');
//   }
//   return '';
// });
</script>

<template>
  <div class="">
    <div class="m-b-20px flex items-center">
      <NButton v-if="buttonName" type="primary" @click="openDialog">{{ buttonName }}</NButton>
      <div class="flex flex-1 flex-justify-end">
        <NButton v-if="!noRefresh" :bordered="false" class="justify-end" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('generate.refresh') }}
        </NButton>
      </div>
    </div>

    <NGrid v-if="isCommand" x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen">
      <NGridItem v-for="item in commandList" :key="item.id">
        <NCard hoverable>
          <div class="title cursor-pointer ellipsis-text text-16px font-600" @click="onCommandChange(item)">
            {{ item.buttom_name }}
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
    <NDataTable class="mb-4 mt-4" :loading="loading" :columns="tableColumns" :data="tableData" />
    <div class="flex flex-justify-end">
      <NPagination
        v-if="!noRefresh"
        :page-count="page_coune"
        :page="the_page"
        :page-size="4"
        @update:page="updatePage"
      />
    </div>
    <NModal v-if="submitApi" v-model:show="showDialog" :class="getPlatform ? 'w-90%' : 'w-400px'">
      <n-card :title="isCommand ? $t('generate.issueCommand') : $t('generate.issue-attribute')">
        <NForm :label-placement="expect ? 'left' : 'top'">
          <div v-if="expect" class="flex">
            <NFormItem>
              <template #label>
                <div class="flex-ai-c flex">
                  {{ $t('generate.expectedMessage') }}
                  <n-popover trigger="hover">
                    <template #trigger>
                      <svg
                        style="width: 20px"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 20 20"
                      >
                        <g fill="none">
                          <path
                            d="M10 2a8 8 0 1 1-3.613 15.14l-.121-.065l-3.645.91a.5.5 0 0 1-.62-.441v-.082l.014-.083l.91-3.644l-.063-.12a7.95 7.95 0 0 1-.83-2.887l-.025-.382L2 10a8 8 0 0 1 8-8zm0 1a7 7 0 0 0-6.106 10.425a.5.5 0 0 1 .063.272l-.014.094l-.756 3.021l3.024-.754a.502.502 0 0 1 .188-.01l.091.021l.087.039A7 7 0 1 0 10 3zm0 2.5a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm0 9a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5z"
                            fill="currentColor"
                          ></path>
                        </g>
                      </svg>
                    </template>
                    <span>{{ $t('generate.expectedMessageTip') }}</span>
                  </n-popover>
                </div>
              </template>

              <n-switch v-model:value="form.expected" />
            </NFormItem>
            <NFormItem v-if="form.expected" :label="$t('generate.expirationTime')" class="ml-20px">
              <div class="flex-ai-c flex">
                <n-input-number v-model:value="form.time" :show-button="false" class="w-80px" />
                <div class="fs-0">{{ $t('generate.hour') }}</div>
              </div>
            </NFormItem>
          </div>
          <NFormItem v-if="isCommand" :label="$t('generate.command-identifier')" required :options="options">
            <NInput v-if="isTextArea" v-model:value="commandValue" :placeholder="$t('generate.or-enter-here')" />
            <NSelect
              v-else
              v-model:value="commandValue"
              label-field="data_name"
              value-field="data_identifier"
              :options="options"
              @update:show="getOptions"
              @update:value="selectVal"
            />
            <NButton type="primary" class="selectBtn" @click="selectBtn">
              {{ isTextArea ? '从已有标识符里选择' : '手动输入' }}
            </NButton>
            <!-- <span class="ml-4 mr-4">{{ $t('generate.or') }}</span> -->
          </NFormItem>
          <NFormItem v-if="isTextArea" label="" :validation-status="validationJson" :feedback="inputFeedback">
            <NInput v-model:value="textValue" type="textarea" />
          </NFormItem>
          <div v-else>
            <div v-if="commandValue !== ''" class="title">参数</div>
            <div v-for="item in paramsData" :key="item.id" class="form_box">
              <div class="form_table">
                <NFormItem :label="item.data_name" label-placement="left" label-width="80px" label-align="left">
                  <NInput v-if="item.param_type === 'string'" v-model:value="item[item.data_identifier]" />
                  <n-input-number v-else-if="item.param_type === 'Number'" v-model:value="item[item.data_identifier]" />
                  <n-select
                    v-else-if="item.param_type === 'Boolean'"
                    v-model:value="item[item.data_identifier]"
                    :options="paramsSelect"
                  />
                  <n-select
                    v-else-if="item.param_type === 'Enum'"
                    v-model:value="item[item.data_identifier]"
                    :options="
                      item.enum_config.map(v => {
                        return {
                          ...v,
                          label: v.desc
                        };
                      })
                    "
                    :placeholder="$t('generate.please-select')"
                  />
                  <div class="description">{{ item.description }}</div>
                </NFormItem>
              </div>
            </div>
          </div>
          <NFlex justify="end">
            <NButton @click="closeDialog">{{ $t('generate.cancel') }}</NButton>
            <NButton type="primary" @click="submit">{{ $t('page.irrigation.distribute') }}</NButton>
          </NFlex>
        </NForm>
      </n-card>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.form_box {
  width: 100%;
}

.title {
  font-weight: 900;
  font-size: 16px;
  margin-bottom: 10px;
}

.form_table {
  display: flex;

  .n-form-item {
    flex: 1;
    margin-right: 10px;

    :deep(.n-form-item-blank) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .description {
      margin-top: 10px;
      font-size: 12px;
    }
  }

  .n-input-number {
    width: 100%;
  }
}

.selectBtn {
  margin-left: 20px;
}
</style>
