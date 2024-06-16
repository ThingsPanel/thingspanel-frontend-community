<script setup lang="ts">
import { computed, defineExpose, getCurrentInstance, onMounted, ref } from 'vue';
import { NButton, NDataTable, NForm, NFormItem, NInput, NModal, NPagination } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { Refresh } from '@vicons/ionicons5';
import type { FlatResponseFailData, FlatResponseSuccessData } from '@sa/axios';
import { commandDataById, commandDataPub, deviceCustomCommandsIdList } from '@/service/api';
import { $t } from '@/locales';
const props = defineProps<{
  id: string;
  noRefresh?: boolean;
  isCommand?: boolean;
  buttonName?: string;
  tableColumns: any[] | undefined;
  submitApi?: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>;
  fetchDataApi: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>;
}>();
const tableData = ref<any[] | undefined>();
const page_coune = ref(0);
const the_page = ref(1);
const showDialog = ref(false);
const textValue = ref('');
const commandValue = ref('');
const options = ref();
const { loading, startLoading, endLoading } = useLoading();
const paramsSelect = ref<any>([
  { label: 'true', value: true },
  { label: 'false', value: false }
]);
const paramsData = ref<any>([]);
const fetchDataFunction = async () => {
  startLoading();

  const { data, error } = await props.fetchDataApi({
    page: !props.noRefresh ? the_page.value : undefined,
    page_size: !props.noRefresh ? 4 : undefined,
    device_id: props.id
  });
  if (!error) {
    tableData.value = data?.value || data?.list || data || [];
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
};

const submit = async () => {
  let parms;
  const params: any = {};
  paramsData.value.filter((item: any) => {
    params[item.data_identifier] = item[item.data_identifier];
  });
  textValue.value = JSON.stringify(params);
  if (props.isCommand) {
    parms = { device_id: props.id, value: textValue.value, identify: commandValue.value };
  } else {
    parms = { device_id: props.id, value: textValue.value };
  }

  if (props.submitApi) {
    await props.submitApi(parms);
  }
  await fetchDataFunction();
  closeDialog();
};

const onCommandChange = async (row: any) => {
  const parms = { device_id: props.id, value: row.instruct, identify: row.data_identifier };
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
    <NModal
      v-if="submitApi"
      v-model:show="showDialog"
      :title="$t('generate.issue-attribute')"
      :class="getPlatform ? 'w-90%' : 'w-400px'"
    >
      <n-card>
        <NForm>
          <NFormItem v-if="isCommand" :label="$t('generate.command-identifier')" required :options="options">
            <NSelect
              v-model:value="commandValue"
              label-field="data_name"
              value-field="data_identifier"
              :options="options"
              @update:show="getOptions"
              @update:value="selectVal"
            />
            <span class="ml-4 mr-4">{{ $t('generate.or') }}</span>
            <NInput v-model:value="commandValue" :placeholder="$t('generate.or-enter-here')" />
          </NFormItem>
          <div v-if="commandValue !== ''" class="title">参数</div>
          <div v-for="item in paramsData" :key="item.id" class="form_box">
            <div class="form_table">
              <NFormItem :label="item.data_identifier" required label-placement="left">
                <NInput v-if="item.param_type === 'string'" v-model:value="item[item.data_identifier]" />
                <n-input-number v-else-if="item.param_type === 'Number'" v-model:value="item[item.data_identifier]" />
                <n-select
                  v-else-if="item.param_type === 'Boolean'"
                  v-model:value="item[item.data_identifier]"
                  :options="paramsSelect"
                />
                <div class="description">{{ item.description }}</div>
              </NFormItem>
            </div>
          </div>
          <!--
 <NFormItem :label="$t('generate.attribute')">
            <NInput v-model:value="textValue" type="textarea" />
          </NFormItem> 
-->
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
</style>
