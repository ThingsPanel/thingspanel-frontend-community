<script setup lang="tsx">
import { computed, getCurrentInstance, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { NumberAnimationInst } from 'naive-ui';
import dayjs from 'dayjs';
import { Activity } from '@vicons/tabler';
import { DocumentOnePage24Regular } from '@vicons/fluent';
import { useWebSocket } from '@vueuse/core';
import { MovingNumbers } from 'moving-numbers-vue3';
import moment from 'moment';
import {
  expectMessageAdd,
  getSimulation,
  getTelemetryLogList,
  sendSimulation,
  telemetryDataCurrent,
  telemetryDataDel,
  telemetryDataPub
} from '@/service/api';
import { localStg } from '@/utils/storage';
import { deviceDetail } from '@/service/api/device';
import { $t } from '@/locales';
import { getWebsocketServerUrl, isJSON } from '@/utils/common/tool';
import { deviceCustomControlList } from '@/service/api/system-data';
import HistoryData from './modules/history-data.vue';
import TimeSeriesData from './modules/time-series-data.vue';
import { useLoading } from '~/packages/hooks';
const props = defineProps<{
  id: string;
  deviceTemplateId: string;
}>();

let wsUrl = getWebsocketServerUrl();
wsUrl += '/telemetry/datas/current/ws';
const showDialog = ref(false);
const showLogDialog = ref(false);
const showHistory = ref(false);
const telemetryId = ref();
const telemetryKey = ref();
const telemetryName = ref();
const telemetryUnit = ref();
const modelType = ref<string>('');

const formValue = ref('');
const form = reactive({
  expected: false,
  time: null
});
const operationType = ref('');
const sendResult = ref('');
const tableData = ref([]);

const telemetryData = ref<DeviceManagement.telemetryData[]>([]);
const initTelemetryData = ref<any>();
const numberAnimationInstRef = ref<NumberAnimationInst[] | []>([]);
const nowTime = ref<any>();
const { loading, startLoading, endLoading } = useLoading();
const total = ref(0);
const showLog = ref(false);
const device_order = ref('');
const operationOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.device_details.manualOperation'), value: '1' },
  { label: $t('custom.device_details.triggerOperation'), value: '2' }
  // 其他操作类型选项...
];
const resultOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.devicePage.success'), value: '1' },
  { label: $t('custom.devicePage.fail'), value: '2' }
  // 其他发送结果选项...
];
const cardHeight = ref(160); // 卡片的高度
const cardMargin = ref(15); // 卡片的间距
const log_page = ref(1);
const showError = ref(false);
const erroMessage = ref('');

const token = localStg.get('token');

const { status, send, close } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  onMessage(ws: WebSocket, event: MessageEvent) {
    console.log(ws, 'ws---');
    if (event.data && event.data !== 'pong') {
      const info = JSON.parse(event.data);
      const currTelemetryKey = telemetryData.value
        .map(item => {
          return item.key === 'systime' ? false : item.key;
        })
        .filter(item => Boolean(item));
      const newData = telemetryData.value.map(item => {
        return {
          ...item,
          value: info[item.key] || item.value,
          ts: info[item.key] && info.systime ? info.systime : item.ts || ''
        };
      });
      const newTelemetry: any[] = [];
      for (const key in info) {
        if (key !== 'systime' && !currTelemetryKey.includes(key)) {
          const { key: _originKey, label: _label, ...rest } = initTelemetryData.value;
          newTelemetry.push({
            ...rest,
            key,
            value: info[key],
            ts: info.systime,
            unit: ''
          });
        }
      }
      telemetryData.value = [...newData, ...newTelemetry];
    }
  }
});

const columns = [
  {
    title: $t('custom.device_details.command'),
    minWidth: '140px',
    key: 'data'
  },
  {
    title: $t('custom.device_details.operationType'),
    key: 'operation_type',
    minWidth: '140px',
    render: row => (row.operation_type === '1' ? $t('custom.device_details.manualOperation') : '触发操作')
  },
  {
    title: $t('custom.device_details.operationUsers'),
    minWidth: '140px',
    key: 'username',
    render: row => (row.operation_type === '1' ? row.username : '系统')
  },
  {
    title: $t('custom.device_details.operationTime'),
    key: 'created_at',
    minWidth: '140px',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('custom.device_details.sendResults'),
    minWidth: '140px',
    key: 'status',
    render: row => (row.status === '1' ? $t('custom.devicePage.success') : $t('custom.devicePage.fail'))
  }
];
const requestSimulationList = async () => {
  const { data, error } = await getSimulation({
    device_id: props.id
  });
  if (!error) {
    device_order.value = data;
  }
};

const openDialog = () => {
  showDialog.value = true;
  formValue.value = '';
  form.expected = false;
  form.time = null;
};
const openUpLog = () => {
  showError.value = false;
  showLogDialog.value = true;
  requestSimulationList();
};

const sendSimulationList = async () => {
  if (!device_order.value) {
    window.$message?.error($t('custom.device_details.sendInputData'));
    return;
  }
  const { error } = await sendSimulation({
    command: device_order.value
  });
  if (!error) {
    showLogDialog.value = false;
    showError.value = false;
  } else {
    showError.value = true;
    erroMessage.value = error?.response?.data?.message;
  }
};
const fetchData = async () => {
  startLoading();
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { data, error } = await getTelemetryLogList({
    page: log_page.value,
    page_size: 5,
    device_id: props.id,
    operation_type: operationType.value,
    status: sendResult.value
  });
  if (!error) {
    tableData.value = data?.value || data.list;
    total.value = Math.ceil(data.count / 5);
    endLoading();
  }
};

const fetchTelemetry = async () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { data, error } = await telemetryDataCurrent(props.id);
  if (!error && data) {
    telemetryData.value = data;
    initTelemetryData.value = data[0] || {}; // 存储一份模板
    initTelemetryData.value.device_id = props.id;
    const dataw = {
      // eslint-disable-next-line no-constant-binary-expression
      device_id: props.id,
      token
    };

    send(JSON.stringify(dataw));
  }
};
const setItemRef = el => {
  console.log(el);

  if (el) {
    const index = el.$attrs['data-index'];
    numberAnimationInstRef.value[index] = el;
  }
};
const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(props.id);
  if (!error) {
    if (data.device_config !== undefined) {
      if (data.device_config.protocol_type === 'MQTT') {
        showLog.value = true;
      } else {
        showLog.value = false;
      }
    } else {
      showLog.value = true;
    }
  }
  console.log(showLog.value);
};
getDeviceDetail();

const options = ref([
  {
    label: $t('custom.device_details.deleteAttribute'),
    key: '1'
  }
]);

const delparam: any = ref({});

const handleDeleteTable = async () => {
  const { error }: any = await telemetryDataDel(delparam.value);

  if (!error) {
    fetchTelemetry();
  }
};

const handleSelect = (key, item) => {
  if (String(key) === '1') {
    delparam.value = {
      key: item.key,
      device_id: props.id
    };
    handleDeleteTable();
  }
};
const copy = event => {
  const input = event.target;
  input.select();
  document.execCommand('copy');
  window.$message?.success($t('theme.configOperation.copySuccess'));
};
const handlePositiveClick = async () => {
  if (isJSON(formValue.value)) {
    let res: any = {};
    if (form.expected) {
      // 新增期望消息
      const expiry = new Date().getTime() + (form.time ? form.time * 60 * 60 * 1000 : 0);
      res = await expectMessageAdd({
        device_id: props.id,
        payload: formValue.value,
        send_type: 'telemetry',
        expiry: moment(expiry).format('YYYY-MM-DDTHH:mm:ssZ')
      });
    } else {
      // 发送属性的逻辑...
      res = await telemetryDataPub({
        device_id: props.id,
        value: formValue.value
      });
    }
    if (res && !res.error) {
      showDialog.value = false;
      fetchData();
      fetchTelemetry();
    }
  }
};

const onTapTableTools = (i: any) => {
  if (typeof i.value === 'number') {
    modelType.value = $t('custom.device_details.sequential');
    telemetryKey.value = i.key;
    telemetryName.value = i.label;
    telemetryId.value = i.device_id;
    telemetryUnit.value = i.unit;
    showHistory.value = true;
  }
};

const isColor = (i: any) => {
  if (typeof i.value === 'string' || typeof i.value === 'boolean') {
    return '#cccccc';
  }
  return '';
};

const controlList = ref([]);
const getControlList = () => {
  if (props.deviceTemplateId) {
    const queryjson = {
      device_template_id: props.deviceTemplateId,
      page: 1,
      page_size: 100
    };
    deviceCustomControlList(queryjson).then(({ data }) => {
      controlList.value = data.list || [];
    });
  }
};

watch(
  () => props.deviceTemplateId,
  val => {
    if (!val) return;
    getControlList();
  }
);
onMounted(() => {
  fetchData();
  fetchTelemetry();
  getControlList();
});

onUnmounted(() => {
  if (status.value === 'OPEN') {
    close();
  }
});

const onControlChange = async (row: any) => {
  await telemetryDataPub({
    device_id: props.id,
    value: row.content
  });
  fetchData();
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});

const validationJson = computed(() => {
  if (formValue.value && !isJSON(formValue.value)) {
    return 'error';
  }
  return undefined;
});
const inputFeedback = computed(() => {
  if (formValue.value && !isJSON(formValue.value)) {
    return $t('generate.inputRightJson');
  }
  return '';
});
</script>

<template>
  <n-card class="w-full">
    <!-- 第一行 -->
    <NFlex justify="space-between">
      <n-button type="primary" class="mb-4" @click="openDialog">{{ $t('generate.issue-control') }}</n-button>

      <n-button v-if="showLog" type="primary" class="mb-4" @click="openUpLog">
        {{ $t('generate.simulate-report-data') }}
      </n-button>
    </NFlex>

    <!-- 自定义控制 -->
    <NGrid x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen" class="mb-4">
      <NGridItem v-for="item in controlList" :key="item.id">
        <NCard hoverable>
          <div class="title cursor-pointer ellipsis-text text-16px font-600" @click="onControlChange(item)">
            {{ item.name }}
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 第二行 -->
    <n-card class="mb-4">
      <n-grid :x-gap="cardMargin" :y-gap="cardMargin" cols="1 600:2 900:3 1200:4">
        <n-gi v-for="(i, index) in telemetryData" :key="i.tenant_id">
          <n-card header-class="border-b h-36px" hoverable :style="{ height: cardHeight + 'px' }">
            <div class="card-body">
              <span v-if="isColor(i)" style="font-size: 24px">
                {{ i.value }}
              </span>
              <MovingNumbers
                v-else
                :ref="setItemRef"
                :data-index="index"
                class="c1"
                :m-num="i.value"
                :quantile-show="true"
              ></MovingNumbers>
              <span v-if="i.unit">{{ i.unit }}</span>
            </div>
            <template #header>
              <div class="line1" :title="i.key">
                <template v-if="i.label">
                  <span v-if="i.label">{{ i.label }}</span>
                  <span>({{ i.key }})</span>
                </template>
                <template v-else>
                  <span>{{ i.key }}</span>
                </template>
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end">
                {{ i.ts ? dayjs(i.ts).format('YYYY-MM-DD HH:mm:ss') : nowTime }}
              </div>
            </template>
            <template #header-extra>
              <div class="h-24px w-120px flex items-center justify-end">
                <NIcon
                  size="24"
                  @click="
                    () => {
                      modelType = $t('custom.device_details.history');
                      telemetryKey = i.key;
                      telemetryName = i.label;
                      telemetryUnit = i.unit;
                      telemetryId = i.device_id;
                      showHistory = true;
                    }
                  "
                >
                  <DocumentOnePage24Regular />
                </NIcon>
                <NDivider vertical />
                <NIcon size="24" :color="isColor(i)" @click="onTapTableTools(i)">
                  <Activity />
                </NIcon>
                <NDivider vertical />
                <n-dropdown trigger="click" :options="options" @select="handleSelect($event, i)">
                  <svg
                    style="width: 20px"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 16 16"
                  >
                    <g fill="none">
                      <path
                        d="M5 8a1 1 0 1 1-2 0a1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0a1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2z"
                        fill="currentColor"
                      ></path>
                    </g>
                  </svg>
                </n-dropdown>
              </div>
            </template>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- 第三行 -->
    <n-space>
      <n-select
        v-model:value="operationType"
        :options="operationOptions"
        style="width: 200px"
        @update:value="fetchData"
      />
      <n-select v-model:value="sendResult" :options="resultOptions" style="width: 200px" @update:value="fetchData" />
    </n-space>

    <!-- 第四行 -->

    <n-data-table :loading="loading" class="mt-4" :columns="columns" :data="tableData" :pagination="false" />
    <div class="mt-4 w-full flex justify-end">
      <n-pagination
        :page-count="total"
        :page-size="5"
        @update:page="
          page => {
            log_page = page;
            fetchData();
          }
        "
      />
    </div>
    <n-modal v-model:show="showLogDialog" :title="$t('generate.report-data')" :class="getPlatform ? 'w-90%' : 'w-40%'">
      <n-card>
        <n-form>
          <div class="m-b-20px" :class="getPlatform ? ' flex-col ' : ' flex'">
            <span class="flex-1">{{ $t('generate.mqtt') }}</span>
            <span class="flex-1">{{ $t('generate.copy-commands-to-local') }}</span>
          </div>
          <div class="flex items-center gap-15px">
            <n-input v-model:value="device_order" type="textarea" class="flex-1" @click="copy" />

            <n-button type="primary" @click="sendSimulationList">
              {{ $t('generate.send') }}
            </n-button>
          </div>
          <div v-if="showError" class="w-100% flex" style="border: 2px solid #eee; border-radius: 5px">
            <SvgIcon
              local-icon="AlertFilled"
              style="margin-left: 5px; color: red; margin-right: 5px; margin-top: 5px; margin-bottom: 5px"
              class="text-20px text-primary"
            />
            <span
              style="
                display: inline-block;
                margin-top: 5px;
                margin-bottom: 5px;
                width: 300px;
                wite-space: nowrap;
                overflow: hidden;
                overflow: hidden;
                text-overflow: ellipsis;
              "
            >
              {{ erroMessage }}99999
            </span>
          </div>
        </n-form>
      </n-card>
    </n-modal>
    <n-modal v-model:show="showDialog" :class="getPlatform ? 'w-90%' : 'w-400px'">
      <n-card :title="$t('generate.distributeControlToDevice')">
        <n-form label-placement="left">
          <div class="flex">
            <n-form-item>
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
            </n-form-item>
            <n-form-item v-if="form.expected" :label="$t('generate.expirationTime')" class="ml-20px">
              <div class="flex-ai-c flex">
                <n-input-number v-model:value="form.time" :show-button="false" class="w-80px" />
                <div class="fs-0">{{ $t('generate.hour') }}</div>
              </div>
            </n-form-item>
          </div>
          <n-form-item label="" :validation-status="validationJson" :feedback="inputFeedback">
            <n-input v-model:value="formValue" type="textarea" />
          </n-form-item>
          <n-space align="end">
            <n-button @click="showDialog = false">{{ $t('generate.cancel') }}</n-button>

            <n-popconfirm @positive-click="handlePositiveClick">
              <template #trigger>
                <n-button type="primary">{{ $t('generate.send') }}</n-button>
              </template>
              确定发送指令吗
            </n-popconfirm>
          </n-space>
        </n-form>
      </n-card>
    </n-modal>
    <n-modal
      v-model:show="showHistory"
      :title="$t('generate.telemetry-history-data')"
      :class="getPlatform ? 'w-90%' : 'chart-table-dialog'"
    >
      <NCard>
        <HistoryData
          v-if="modelType === $t('custom.device_details.history')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
        <TimeSeriesData
          v-if="modelType === $t('custom.device_details.sequential')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
      </NCard>
    </n-modal>
  </n-card>
</template>

<style lang="scss" oped>
.line1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    &:nth-child(2) {
      color: #ccc;
      padding-left: 5px;
    }
  }
}

.card-body {
  padding: 10px 0 10px;
  display: flex;
  align-items: end;
  gap: 4px;

  span {
    &:first-child {
      font-size: 32px;
      line-height: 1;
    }
  }
}
.ml-20px {
  margin-left: 20px;
}
.flex-ai-c {
  align-items: center;
}
.w-80px {
  width: 80px;
}
.fs-0 {
  flex-shrink: 0;
}
.chart-table-dialog {
  width: 80%;
  max-width: 1000px;
}
</style>
