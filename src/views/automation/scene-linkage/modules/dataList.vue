<script lang="tsx" setup>
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { NButton, NCard, NFlex, NGrid, NGridItem, NPagination, useDialog } from 'naive-ui';
import { CopyOutline as copyIcon, PencilOutline as editIcon, TrashOutline as trashIcon } from '@vicons/ionicons5';
import moment from 'moment';
import { useRouterPush } from '@/hooks/common/router';
import {
  sceneAutomationsDel,
  sceneAutomationsGet,
  sceneAutomationsLog,
  sceneAutomationsSwitch
} from '@/service/api/automation';
import { $t } from '@/locales';
import { deviceAlarmList } from '@/service/api';
const dialog = useDialog();
const { routerPushByKey } = useRouterPush();

interface Props {
  // eslint-disable-next-line vue/prop-name-casing
  device_id?: string;
  // eslint-disable-next-line vue/prop-name-casing
  device_config_id?: string;
  isAlarm?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  // eslint-disable-next-line vue/require-valid-default-prop
  device_id: '',
  device_config_id: '',
  isAlarm: false
});

const sceneLinkageList = ref([] as any);

// 新建场景
const linkAdd = () => {
  routerPushByKey('automation_linkage-edit', {
    query: { device_id: props.device_id, device_config_id: props.device_config_id }
  });
};

// 编辑场景
const linkEdit = (item: any) => {
  routerPushByKey('automation_linkage-edit', { query: { id: item.id } });
};

// 开启/关闭场景
const linkActivation = async (item: any) => {
  const res = await sceneAutomationsSwitch(item.id);
  if (!res.error) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    await getData();
  }
};

const queryData = ref({
  name: '',
  page: 1,
  page_size: 12,
  device_id: '',
  device_config_id: ''
});
const dataTotal = ref(0);

const getData = async () => {
  queryData.value.device_id = props.device_id;
  queryData.value.device_config_id = props.device_config_id;
  let res: any = null;
  if (props.isAlarm) {
    res = await deviceAlarmList(queryData.value);
  } else {
    res = await sceneAutomationsGet(queryData.value);
  }
  if (res && !res.error) {
    sceneLinkageList.value = res.data.list || [];
    dataTotal.value = res.data.total;
  }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleQuery = async () => {
  queryData.value.page = 1;
  await getData();
};
const bodyStyle = ref({
  width: '1000px'
});
const execution_result_options = ref([
  {
    label: $t('custom.device_details.whole'),
    value: ''
  },
  {
    label: $t('generate.execution-successful'),
    value: 'S'
  },
  {
    label: $t('generate.execution-failed'),
    value: 'F'
  }
]);
const showLog = ref(false);
const logQuery = ref({
  page: 1,
  page_size: 10,
  scene_automation_id: '',
  execution_result: '',
  execution_start_time: '',
  execution_end_time: '',
  queryTime: ref<[number, number]>([moment().subtract(7, 'days').valueOf(), moment().valueOf()])
});
const logDataTotal = ref(0);
const logData = ref([]);
const queryLog = () => {
  logQuery.value.page = 1;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getLogList();
};
const getLogList = async () => {
  if (logQuery.value.queryTime) {
    logQuery.value.execution_start_time = moment(logQuery.value.queryTime[0]).format();
    logQuery.value.execution_end_time = moment(logQuery.value.queryTime[1]).format();
  }
  const res = await sceneAutomationsLog(logQuery.value);
  logData.value = res.data.list;
  logDataTotal.value = res.data.total;
};

// 查看日志
const openLog = (item: any) => {
  logQuery.value.scene_automation_id = item.id;
  getLogList();
  showLog.value = true;
};
// 删除场景
const deleteLink = async (item: any) => {
  dialog.warning({
    title: $t('common.deletePrompt'),
    content: $t('common.sceneLinkageInfo'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      const res = await sceneAutomationsDel(item.id);
      if (!res.error) {
        await getData();
      }
    }
  });
};
const closeLog = () => {
  logQuery.value = {
    page: 1,
    page_size: 10,
    scene_automation_id: '',
    execution_result: '',
    execution_start_time: '',
    execution_end_time: '',
    queryTime: [moment().subtract(7, 'days').valueOf(), moment().valueOf()]
  };
  showLog.value = false;
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(() => {
  getData();
});
</script>

<template>
  <NCard class="w-full">
    <NFlex v-if="!isAlarm" justify="space-between" class="mb-4">
      <NButton type="primary" @click="linkAdd()">{{ $t('generate.+add-scene-linkage') }}</NButton>
      <NFlex align="center" justify="flex-end" :wrap="false">
        <NInput
          v-model:value="queryData.name"
          :placeholder="$t('generate.enter-scene-linkage-name')"
          class="search-input"
          type="text"
          clearable
        ></NInput>
        <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
      </NFlex>
    </NFlex>
    <n-empty
      v-if="sceneLinkageList.length === 0"
      size="huge"
      :description="$t('common.nodata')"
      class="min-h-60 justify-center"
    ></n-empty>
    <NGrid v-else x-gap="20px" y-gap="20px" cols="1 s:2 m:3 l:4" responsive="screen">
      <NGridItem v-for="(item, index) in sceneLinkageList" :key="index">
        <NCard hoverable style="height: 180px">
          <NFlex justify="space-between" align="center" class="mb-4">
            <div class="text-16px font-600">
              {{ item.name }}
            </div>
            <n-switch
              v-model:value="item.enabled"
              checked-value="Y"
              unchecked-value="N"
              @update-value="() => linkActivation(item)"
            />
          </NFlex>
          <n-ellipsis :line-clamp="2" class="h-40px">
            {{ item.description }}
          </n-ellipsis>
          <NFlex justify="flex-end" class="mt-4">
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton tertiary circle type="warning" @click="linkEdit(item)">
                  <template #icon>
                    <n-icon>
                      <editIcon />
                    </n-icon>
                  </template>
                </NButton>
              </template>
              {{ $t('common.edit') }}
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton circle tertiary type="info" @click="openLog(item)">
                  <template #icon>
                    <n-icon>
                      <copyIcon />
                    </n-icon>
                  </template>
                </NButton>
              </template>
              {{ $t('page.irrigation.time.log.name') }}
            </NTooltip>
            <NTooltip trigger="hover">
              <template #trigger>
                <NButton circle tertiary type="error" @click="deleteLink(item)">
                  <template #icon>
                    <n-icon>
                      <trashIcon />
                    </n-icon>
                  </template>
                </NButton>
              </template>
              {{ $t('common.delete') }}
            </NTooltip>
          </NFlex>
        </NCard>
      </NGridItem>
    </NGrid>
    <NFlex justify="flex-end" class="mt-4">
      <NPagination
        v-model:page="queryData.page"
        :page-size="queryData.page_size"
        :item-count="dataTotal"
        @update:page="getData"
      />
    </NFlex>
  </NCard>
  <n-modal
    v-model:show="showLog"
    :style="bodyStyle"
    preset="card"
    :title="$t('page.irrigation.time.log.name')"
    size="huge"
    :bordered="false"
    :class="getPlatform ? 'max-w-90%' : 'w-600px'"
    @close="closeLog()"
  >
    <NFlex class="mb-6">
      <n-date-picker v-model:value="logQuery.queryTime" type="datetimerange" @update:value="queryLog" />
      <n-select
        v-model:value="logQuery.execution_result"
        :options="execution_result_options"
        class="max-w-40"
        :placeholder="$t('generate.select-execution-status')"
        @update:value="queryLog"
      ></n-select>
      <NButton type="primary" @click="queryLog()">{{ $t('common.search') }}</NButton>
    </NFlex>
    <n-empty
      v-if="logDataTotal === 0"
      size="huge"
      :description="$t('common.nodata')"
      class="min-h-60 justify-center"
    ></n-empty>
    <template v-else>
      <NTable size="small" :bordered="false" :single-line="false" class="mb-6">
        <thead>
          <tr>
            <th>{{ $t('generate.order-number') }}</th>
            <th class="min-w-180px">{{ $t('generate.execution-time') }}</th>
            <th>{{ $t('generate.execution-description') }}</th>
            <th class="min-w-120px">{{ $t('generate.execution-status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(sceneItem, index) in logData" :key="index">
            <td class="min-w-100px">{{ index + 1 }}</td>
            <td>{{ moment(sceneItem['executed_at']).format('yyyy-MM-DD HH:mm:ss') }}</td>
            <td>{{ sceneItem['detail'] }}</td>
            <td>
              <span v-if="sceneItem['execution_result'] === 'S'">{{ $t('generate.execution-successful') }}</span>
              <span v-if="sceneItem['execution_result'] === 'F'">{{ $t('generate.execution-failed') }}</span>
            </td>
          </tr>
        </tbody>
      </NTable>
      <NFlex justify="end">
        <NPagination
          v-model:page="logQuery.page"
          :page-size="logQuery.page_size"
          :item-count="logDataTotal"
          @update:page="getLogList"
        />
      </NFlex>
    </template>
  </n-modal>
</template>

<style scoped lang="scss">
.config-content {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 0;

  .scene-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 18px;
    flex: 0 0 26%;
    margin-right: calc(20% / 2);
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

  .scene-item:hover {
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  /* 去除每行尾多余的边距 */
  .scene-item:nth-child(3n) {
    margin-right: 0;
  }
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
}

.search-input {
  width: 200px;
}

.log-card {
  width: 600px;
}
</style>
