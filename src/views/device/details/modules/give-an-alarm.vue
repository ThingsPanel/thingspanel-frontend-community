<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NFlex, NInput } from 'naive-ui';
import { EyeOutline, Refresh } from '@vicons/ionicons5';
import moment from 'moment/moment';
import { Heart, HeartBroken } from '@vicons/fa';
import { Edit } from '@vicons/carbon';
import { $t } from '@/locales';
import { deviceAlarmHistory, deviceAlarmHistoryPut } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import alarmDataList from '@/views/automation/scene-linkage/modules/dataList.vue';

const { routerPushByKey } = useRouterPush();

const props = defineProps<{
  id: string;
}>();
const tabValue = ref(1);
const choseTab = data => {
  tabValue.value = data;
  if (data === 1) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    refresh();
  }
};
const queryParams = ref({
  selected_time: ref<[number, number]>([moment().subtract(7, 'days').valueOf(), moment().valueOf()]),
  alarm_status: '',
  page: 1,
  page_size: 10,
  start_time: '',
  end_time: '',
  device_id: ''
});
const alarmStatusOptions = ref([
  {
    label: $t('common.allStatus'),
    value: ''
  },
  {
    label: $t('common.highAlarm'),
    value: 'H'
  },
  {
    label: $t('common.intermediateAlarm'),
    value: 'M'
  },
  {
    label: $t('common.lowAlarm'),
    value: 'L'
  },
  {
    label: $t('common.normal'),
    value: 'N'
  }
]);
const refresh = () => {
  queryParams.value = {
    selected_time: [moment().subtract(7, 'days').valueOf(), moment().valueOf()],
    alarm_status: '',
    page: 1,
    page_size: 10,
    start_time: '',
    end_time: '',
    device_id: ''
  };
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  alarmHistory.value = [];
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  noMore.value = false;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getAlarmHistory();
};
const alarmHistory = ref([] as any);
const alarmHistoryTotal = ref(0);

const getAlarmHistory = async () => {
  queryParams.value.device_id = props.id;
  if (queryParams.value.selected_time && queryParams.value.selected_time.length > 0) {
    queryParams.value.start_time = moment(queryParams.value.selected_time[0]).format('YYYY-MM-DDTHH:mm:ssZ');
    queryParams.value.end_time = moment(queryParams.value.selected_time[1]).format('YYYY-MM-DDTHH:mm:ssZ');
  } else {
    queryParams.value.start_time = '';
    queryParams.value.end_time = '';
  }
  const res = await deviceAlarmHistory(queryParams.value);
  alarmHistory.value.push(...(res.data.list || []));
  alarmHistoryTotal.value = res.data.total;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  loading.value = false;
  if (alarmHistory.value.length === alarmHistoryTotal.value) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    noMore.value = true;
  }
};
const resetQuery = () => {
  queryParams.value.page = 1;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  alarmHistory.value = [];
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  noMore.value = false;
  getAlarmHistory();
};
const showDialog = ref(false);
const closeModal = () => {
  showDialog.value = false;
};
const infoData = ref({} as any);
const getInfo = (data: any) => {
  infoData.value = data;
  showDialog.value = true;
};
const showModal = ref(false);
const description = ref('');
const cancelCallback = () => {
  description.value = '';
  showModal.value = false;
};
const submitCallback = async () => {
  if (description.value === '') {
    window.$message?.error($t('common.enterAlarmDesc'));
    return;
  }
  const putData = {
    id: infoData.value.id,
    description: description.value
  };
  await deviceAlarmHistoryPut(putData);
  cancelCallback();
  await getAlarmHistory();
};
const alarmAdd = () => {
  routerPushByKey('automation_linkage-edit', {
    query: { device_id: props.id }
  });
};
const loading = ref(false);
const noMore = ref(false);
const handleLoad = () => {
  if (loading.value || noMore.value) return;
  loading.value = true;
  queryParams.value.page += 1;
  getAlarmHistory();
};

onMounted(() => {
  getAlarmHistory();
});
</script>

<template>
  <div class="w-full">
    <NFlex justify="space-between" class="mb-4">
      <n-button-group>
        <NButton :type="tabValue === 1 ? 'primary' : 'default'" @click="choseTab(1)">
          {{ $t('common.alarmHistory') }}
        </NButton>
        <NButton :type="tabValue === 2 ? 'primary' : 'default'" @click="choseTab(2)">
          {{ $t('common.alarmRules') }}
        </NButton>
      </n-button-group>
      <NFlex v-if="tabValue === 1" class="w-70%" justify="flex-end">
        <NDatePicker
          v-model:value="queryParams.selected_time"
          type="datetimerange"
          :clearable="false"
          separator="-"
          class="w-400px"
          @update:value="resetQuery"
        />
        <n-select
          v-model:value="queryParams.alarm_status"
          :options="alarmStatusOptions"
          class="w-150px"
          :clearable="false"
          @update:value="resetQuery"
        />
        <NButton :bordered="false" class="justify-end" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('generate.refresh') }}
        </NButton>
      </NFlex>
      <NFlex v-if="tabValue === 2" justify="flex-end">
        <NButton type="primary" @click="alarmAdd()">{{ $t('generate.addAlarmRule') }}</NButton>
      </NFlex>
    </NFlex>
    <div v-if="tabValue === 1" class="history-list">
      <n-infinite-scroll v-if="alarmHistory.length > 0" style="height: 100%" :distance="10" @load="handleLoad">
        <div v-for="(item, index) in alarmHistory" :key="index" class="alarm-item">
          <div class="alarm-time">
            <div class="line-style"></div>
            <span class="alarm-icon" :class="[item['alarm_status'] !== 'N' ? 'color-ye-bg' : 'color-gre-bg']"></span>
            <span>{{ moment(item['create_at']).format('YYYY-MM-DD HH:mm:ss') }}</span>
          </div>
          <div
            class="alarm-item-content"
            :class="[item['alarm_status'] !== 'N' ? 'color-ye-bg-low' : 'color-gre-bg-low']"
          >
            <NFlex class="mb-30px" justify="space-between">
              <NFlex class="alarm-type" :class="[item['alarm_status'] !== 'N' ? 'color-ye' : 'color-gre']">
                <NIcon v-if="item['alarm_status'] !== 'N'" size="22" class="ml-1">
                  <HeartBroken />
                </NIcon>
                <NIcon v-if="item['alarm_status'] === 'N'" size="22" class="ml-1">
                  <Heart />
                </NIcon>
                <span>
                  {{ alarmStatusOptions.find(data => data.value === item['alarm_status'])?.label || '' }}
                </span>
              </NFlex>
              <NFlex>
                <div>{{ item['name'] }}</div>
                <!--              <div style="color: #646cff">设备名称</div>-->
              </NFlex>
            </NFlex>
            <div>
              <NButton text @click="getInfo(item)">
                <NIcon size="18">
                  <EyeOutline />
                </NIcon>
                {{ $t('custom.devicePage.details') }}
              </NButton>
              <NButton text class="ml-8" @click="showModal = true">
                <NIcon size="18">
                  <Edit />
                </NIcon>
                {{ $t('custom.devicePage.maintenance') }}
              </NButton>
            </div>
          </div>
        </div>
        <div v-if="loading" class="text">加载中...</div>
        <div v-if="noMore" class="text">没有更多了</div>
      </n-infinite-scroll>
      <n-empty
        v-if="alarmHistory.length === 0"
        size="huge"
        :description="$t('common.nodata')"
        class="min-h-60 justify-center"
      ></n-empty>
      <n-modal v-model:show="showDialog" :title="$t('generate.alarm-info')" class="max-w-[800px]">
        <NCard>
          <div>
            <NH3>{{ $t('generate.alarm-info') }}</NH3>
          </div>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('generate.alarmConfugName')}:`">
            {{ infoData.name }}
          </n-form-item>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('generate.sceneLinkageName')}:`">
            {{ infoData['alarm_config_name'] }}
          </n-form-item>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('common.alarm_time')}:`">
            {{ moment(infoData['create_at']).format('YYYY-MM-DD HH:mm:ss') }}
          </n-form-item>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('generate.alarmStatus')}:`">
            {{ alarmStatusOptions.find(data => data.value === infoData['alarm_status'])?.label || '' }}
          </n-form-item>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('generate.alarmReason')}:`">
            {{ infoData.content }}
          </n-form-item>
          <n-form-item label-placement="left" :show-feedback="false" :label="`${$t('generate.alarm-description')}:`">
            {{ infoData.description }}
          </n-form-item>
          <n-form-item label-placement="top" :show-feedback="false" :label="`${$t('generate.alarmDevices')}:`">
            <NTable size="small" :bordered="false" :single-line="false" class="mb-6">
              <thead>
                <tr>
                  <th>{{ $t('generate.order-number') }}</th>
                  <th class="min-w-180px">{{ $t('generate.device-code') }}</th>
                  <th>{{ $t('generate.device-name') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(device, index) in infoData.alarm_device_list" :key="index">
                  <td class="min-w-100px">{{ index + 1 }}</td>
                  <td>{{ device.id }}</td>
                  <td>{{ device['name'] }}</td>
                </tr>
              </tbody>
            </NTable>
          </n-form-item>
          <NFlex justify="flex-end">
            <NButton @click="closeModal">{{ $t('custom.devicePage.close') }}</NButton>
          </NFlex>
        </NCard>
      </n-modal>
      <n-modal v-model:show="showModal" class="max-w-[600px]">
        <NCard>
          <n-form-item :show-feedback="false" :label="$t('generate.alarm-description')">
            <NInput v-model:value="description" type="textarea" />
          </n-form-item>
          <NFlex justify="flex-end" class="mt-4">
            <NButton @click="cancelCallback">{{ $t('generate.cancel') }}</NButton>
            <NButton @click="submitCallback">{{ $t('common.save') }}</NButton>
          </NFlex>
        </NCard>
      </n-modal>
    </div>
  </div>
  <div v-if="tabValue === 2" class="alarm-list">
    <alarmDataList :is-alarm="true" :device_id="props.id"></alarmDataList>
  </div>
</template>

<style scoped lang="scss">
.history-list {
  max-height: 700px;
  overflow: auto;
  height: 100%;
  .alarm-item {
    //padding: 20px;
    .alarm-time {
      display: flex;
      flex-flow: row;
      align-items: center;

      .alarm-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        //background: #dca550;
        display: block;
        margin-right: 20px;
        z-index: 1;
      }

      .line-style {
        position: relative;
        height: 20px;
        /* 线的高度 */
        width: 1px;
      }

      .line-style::after {
        content: '';
        position: absolute;
        left: 10px;
        right: 0;
        top: 18px;
        background: #e5e7ec;
        width: 1px;
        height: 150px;
      }
    }

    .alarm-item-content {
      //border-left: solid 2px #fdfaf6;
      //background: #fdfaf6;
      margin: 10px 40px;
      padding: 15px 10px;

      .alarm-type {
        //color: #dca550;
        margin-bottom: 30px;
      }
    }
  }
}

.alarm-list {
}

.color-ye {
  color: #dca550;
}

.color-ye-bg {
  background: #dca550;
}

.color-ye-bg-low {
  background: #fdfaf6;
}

.color-gre {
  color: #7ec050;
}

.color-gre-bg {
  background: #7ec050;
}

.color-gre-bg-low {
  background: #f8fcf6;
}
.text {
  text-align: center;
}
</style>
