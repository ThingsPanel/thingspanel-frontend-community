<script setup lang="tsx">
import { h, onBeforeMount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { DrawerPlacement, StepsProps } from 'naive-ui';
import { NSpace, NTag } from 'naive-ui';
import _ from 'lodash';
import type { TreeSelectOption } from 'naive-ui/es/tree-select/src/interface';
import { localStg } from '@/utils/storage';
import {
  checkDevice,
  deleteDevice,
  devicCeonnectForm,
  deviceDictProtocolService,
  deviceGroupTree,
  deviceList,
  getDeviceConfigList,
  putDeviceActive
} from '@/service/api/device';
import type { SearchConfig } from '@/components/data-table-page/index.vue';
import AddDevicesStep1 from '@/views/device/manage/modules/add-devices-step1.vue';
import AddDevicesStep2 from '@/views/device/manage/modules/add-devices-step2.vue';
import AddDevicesStep3 from '@/views/device/manage/modules/add-devices-step3.vue';
import AddDevicesServer1 from '@/views/device/manage/modules/add-devices-server1.vue';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

const addKey = ref();
const deviceNumber = ref();
const configOptions = ref();
const deviceId = ref();
const deviceObj = ref();
const configId = ref();
const formData = ref();
const tablePageRef = ref();
const buttonDisabled = ref(true);
const showMessage = ref(false);
const messageColor = ref('');
const getFormJson = async id => {
  const res = await devicCeonnectForm({ device_id: id });

  formData.value = res.data;
};
const setUpId = (dId, cId, dobj) => {
  deviceId.value = dId;
  configId.value = cId;
  deviceObj.value = JSON.parse(dobj);
  getFormJson(dId);
};
const getDeviceGroupOptions = async () => {
  // 将原始数据转换为树形结构
  function convertTreeNodeToTarget(treeNode: DeviceManagement.TreeNode): TreeSelectOption {
    const { group, children } = treeNode;
    const targetNode: TreeSelectOption = {
      label: group.name,
      key: group.id
    };

    if (children && children.length > 0) {
      targetNode.children = children.map(convertTreeNodeToTarget);
    }

    return targetNode;
  }

  // 将 TreeNode 数组转换为目标数据结构的数组
  function convertTreeNodesToTarget(treeNodes: DeviceManagement.TreeNode[]): TreeSelectOption[] {
    return treeNodes.map(convertTreeNodeToTarget);
  }

  const res = await deviceGroupTree({});
  let options: any[] = [];
  if (res.data) {
    options = convertTreeNodesToTarget(res.data);
  }
  return options;
};

const getDeviceConfigOptions = async pattern => {
  console.log(pattern, '我请求了筛选');
  const res = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    device_type: pattern
  });
  const options: any[] = [];
  if (res.data && res.data.list) {
    // eslint-disable-next-line array-callback-return
    res.data.list.map(ietm => {
      options.push({
        label: ietm.name,
        value: ietm.id
      });
    });
  }
  configOptions.value = [{ label: $t('custom.devicePage.unlimitedDeviceConfig'), value: '' }, ...options];
  return options;
};

const columns_to_show: Ref<any> = ref([
  {
    key: 'name',
    minWidth: '180px',
    label: () => $t('custom.devicePage.deviceName')
  },
  {
    key: 'device_number',
    minWidth: '180px',
    label: () => $t('custom.devicePage.deviceNumber')
  },
  {
    key: 'is_online',
    minWidth: '100px',
    label: () => $t('custom.devicePage.onlineStatus'),
    render: row => {
      if (row?.is_online === 1) {
        return (
          <NSpace>
            <NTag type="success">{$t('custom.devicePage.online')}</NTag>
          </NSpace>
        );
      }
      return (
        <NSpace>
          <NTag type="warning">{$t('custom.devicePage.offline')}</NTag>
        </NSpace>
      );

      // return row?.is_online === 1 ? $t('custom.devicePage.online') : $t('custom.devicePage.offline');
    }
  },
  {
    key: 'warn_status',
    minWidth: '100px',
    label: () => $t('custom.devicePage.alarmStatus'),
    render: row => {
      if (row?.warn_status === 'Y') {
        return (
          <NSpace>
            <NTag type="success">{$t('custom.devicePage.alarmed')}</NTag>
          </NSpace>
        );
      }
      return (
        <NSpace>
          <NTag type="warning">{$t('custom.devicePage.notAlarmed')}</NTag>
        </NSpace>
      );

      // return row?.warn_status === 'Y' ? $t('custom.devicePage.alarmed') : $t('custom.devicePage.notAlarmed');
    }
  },
  {
    key: 'device_config_name',
    minWidth: '100px',
    label: () => $t('custom.devicePage.deviceConfig')
  },
  {
    key: 'ts',
    minWidth: '140px',
    label: () => $t('custom.devicePage.lastPushTime')
  }
  // {
  //   key: 'device_type',
  //   minWidth: '160px',
  //   label: () => $t('custom.devicePage.accessServiceProtocol'),
  //   render: row => {
  //     console.log(row, '当前行')
  //     if (row?.access_way === '') return '此项为空';
  //     return row?.access_way === 'A'
  //       ? `${$t('custom.devicePage.byProtocol')}(${row?.protocol_type || '-'})`
  //       : `${$t('custom.devicePage.byService')}(${row?.protocol_type || '-'})`;
  //   }
  // }
]) as Ref<any>;

const { routerPushByKey } = useRouterPush();
const goDeviceDetails = row => {
  routerPushByKey('device_details', {
    query: {
      d_id: row.id
    }
  });
};
const actions = [
  {
    label: () => $t('custom.devicePage.details'),

    callback: goDeviceDetails
  },
  {
    label: () => $t('custom.devicePage.delete'),
    theKey: $t('custom.devicePage.delete'),
    callback: async row => {
      await deleteDevice({ id: row?.id });
    }
  }
];

const searchConfigs = ref<SearchConfig[]>([
  {
    key: 'group_id',
    label: $t('custom.devicePage.group'),
    type: 'tree-select',
    multiple: false,
    options: [{ label: $t('generate.group'), key: '' }],
    loadOptions: getDeviceGroupOptions
  },
  {
    key: 'device_config_id',
    label: $t('custom.devicePage.unlimitedDeviceConfig'),
    type: 'select',
    options: [{ label: () => $t('custom.devicePage.unlimitedDeviceConfig'), value: '' }],
    loadOptions: pattern => getDeviceConfigOptions(pattern)
  },
  {
    key: 'is_online',
    label: $t('custom.devicePage.unlimitedOnlineStatus'),
    type: 'select',
    options: [
      { label: () => $t('custom.devicePage.unlimitedOnlineStatus'), value: '' },
      { label: () => $t('custom.devicePage.online'), value: 1 },
      { label: () => $t('custom.devicePage.offline'), value: 0 }
    ]
  },
  {
    key: 'warn_status',
    label: $t('custom.devicePage.unlimitedAlarmStatus'),
    type: 'select',
    options: [
      { label: () => $t('custom.devicePage.unlimitedAlarmStatus'), value: '' },
      { label: () => $t('custom.devicePage.alarm'), value: 'Y' },
      { label: () => $t('custom.devicePage.noAlarm'), value: 'N' }
    ]
  },
  {
    key: 'device_type',
    label: $t('custom.devicePage.unlimitedAccessType'),
    type: 'select',
    options: [
      { label: $t('custom.devicePage.unlimitedAccessType'), value: '' },
      { label: $t('custom.devicePage.directConnectedDevices'), value: '1' },
      { label: $t('custom.devicePage.gateway'), value: '2' },
      { label: $t('custom.devicePage.gatewaySubEquipment'), value: '3' }
      // { label: $t('custom.devicePage.byProtocol'), value: 'A' },
      // { label: $t('custom.devicePage.byService'), value: 'B' }
    ]
  },
  {
    key: 'protocol_dict',
    label: $t('custom.devicePage.unlimitedAccessMode'),
    type: 'select',
    renderLabel(option: any) {
      const deviceText = {
        '1': $t('generate.direct-connected-device'),
        '2': $t('generate.gateway'),
        '3': $t('custom.device_details.deviceAnalysis')
      };
      return h(
        'div',
        {
          class: 'm-b-5px'
        },
        [
          h('div', null, option.label as string),
          h(
            'div',
            {
              class: ' color-#ccc'
            },
            deviceText[option.device_type] as string
          )
        ]
      );
    },
    renderTag({ option }: any) {
      return h('div', option.label as string);
    },
    extendParams: [
      {
        label: 'protocol_type',
        value: 'dict_value'
      },
      {
        label: 'device_type',
        value: 'device_type'
      }
    ],
    options: []
  },
  {
    key: 'search',
    label: $t('custom.devicePage.deviceNameOrNumber'),
    type: 'input'
  },
  {
    key: 'label',
    label: $t('custom.devicePage.label'),
    type: 'input'
  }
]);
const dropOption = [
  {
    label: () => $t('custom.devicePage.manualAdd'),
    key: 'hands'
  },
  {
    label: () => $t('custom.devicePage.addByNumber'),
    key: 'number'
  },
  {
    label: () => $t('custom.devicePage.addByServer'),
    key: 'server'
  }
];
const getDictServiceList = async () => {
  const { data }: any = await deviceDictProtocolService({ language_code: localStg.get('lang') });

  data.map((item: any) => {
    item.value = item.dict_value + item.device_type;
    item.label = item.translation;
    return item;
  });
  searchConfigs.value.map((item: any) => {
    if (item.key === 'protocol_dict') {
      item.options = data;
    }
    return item;
  });
};

onBeforeMount(() => {
  getDictServiceList();
});
const topActions = [
  {
    element: () => (
      <n-dropdown options={dropOption} trigger="hover" onSelect={handleSelect}>
        <n-button type="primary">+{$t('custom.devicePage.addDevice')}</n-button>
      </n-dropdown>
    )
  }
];
const active = ref(false);
const isSuccess = ref(false);

const setIsSuccess = (flag: boolean) => {
  isSuccess.value = flag;
};
const placement = ref<DrawerPlacement>('right');
const current = ref<number>(1);
const currentStatus = ref<StepsProps['status']>('process');
const currentServer = ref<number>(1);
const currentServerStatus = ref<StepsProps['status']>('process');
const activate = (place: DrawerPlacement, key: string | number) => {
  current.value = 1;
  currentServer.value = 1;
  active.value = true;
  addKey.value = key;
  placement.value = place;
};

const completeAdd = async () => {
  const { error } = await putDeviceActive({
    device_number: deviceNumber.value
  });
  if (!error) {
    active.value = true;
  }
};

const completeHandAdd = () => {
  tablePageRef.value?.handleReset();
};

function handleSelect(key: string | number) {
  activate('bottom', key);
}

const messageStyle = ref({
  color: messageColor,
  marginLeft: '10px',
  marginTop: '5px'
});

watch(
  deviceNumber,
  _.debounce(async newDeviceNumber => {
    try {
      if (!newDeviceNumber) {
        showMessage.value = false;
        return;
      }
      const { data, error } = await checkDevice(newDeviceNumber);
      if (!error && data && data.is_available) {
        buttonDisabled.value = false;
        messageColor.value = 'rgb(2,153,52)';
      } else {
        buttonDisabled.value = true;
        messageColor.value = 'rgb(255, 26, 26)';
      }
      showMessage.value = true;
    } catch (error) {
      console.error(error);
    }
  }, 500)
);
</script>

<template>
  <div>
    <data-table-page
      ref="tablePageRef"
      :fetch-data="deviceList"
      :columns-to-show="columns_to_show"
      :table-actions="actions"
      :search-configs="searchConfigs"
      :top-actions="topActions"
      :row-click="goDeviceDetails"
    />
    <n-drawer v-model:show="active" :height="720" :placement="placement" @after-leave="completeHandAdd">
      <n-drawer-content
        v-if="addKey === 'hands'"
        :title="$t('generate.manually-add-device')"
        class="flex-center pt-24px"
      >
        <n-steps :current="current" :status="currentStatus">
          <n-step :title="$t('custom.devicePage.step1Title')" :description="$t('custom.devicePage.step1Desc')" />
          <n-step :title="$t('custom.devicePage.step2Title')" :description="$t('custom.devicePage.step2Desc')" />
          <n-step :title="$t('custom.devicePage.step3Title')" :description="$t('custom.devicePage.step3Desc')" />
        </n-steps>
        <n-card class="mt-6" bordered border>
          <div v-if="current === 1">
            <AddDevicesStep1
              :set-id-callback="setUpId"
              :config-options="configOptions"
              :next-callback="
                () => {
                  current += 1;
                }
              "
            />
          </div>
          <div v-if="current === 2">
            <AddDevicesStep2
              :set-is-success="setIsSuccess"
              :device_id="deviceId"
              :form-data="deviceObj"
              :form-elements="formData"
              :next-callback="
                () => {
                  current += 1;
                }
              "
            />
          </div>
          <div v-if="current === 3">
            <AddDevicesStep3
              :is-success="isSuccess"
              :close-callback="
                () => {
                  active = false;
                }
              "
              :back-callback="
                () => {
                  current -= 1;
                }
              "
            />
          </div>
        </n-card>
      </n-drawer-content>
      <n-drawer-content
        v-if="addKey === 'number'"
        class="flex-left pt-24px"
        style="margin-left: 500px"
        :title="$t('custom.devicePage.addByNumber')"
      >
        <n-h4 align-text>
          <n-li>
            <NText strong>{{ $t('custom.devicePage.tips') }}</NText>
          </n-li>
        </n-h4>
        <div style="display: flex; margin-bottom: 20px">
          <n-input
            v-model:value="deviceNumber"
            :placeholder="$t('custom.devicePage.enterDeviceNumber')"
            class="max-w-240px"
          ></n-input>
          <NText v-if="showMessage" :style="messageStyle">
            {{
              buttonDisabled
                ? $t('custom.devicePage.deviceNumberNotVvailable')
                : $t('custom.devicePage.enterDeviceNumber')
            }}
          </NText>
        </div>
        <n-button type="primary" :disabled="buttonDisabled" @click="completeAdd">
          {{ $t('custom.devicePage.finish') }}
        </n-button>
      </n-drawer-content>
      <n-drawer-content
        v-if="addKey === 'server'"
        class="flex-center pt-24px"
        :title="$t('custom.devicePage.addByServer')"
      >
        <n-steps :current="currentServer" :status="currentServerStatus">
          <n-step
            :title="$t('custom.devicePage.serverStep1Title')"
            :description="$t('custom.devicePage.serverStep1Desc')"
          />
          <n-step
            :title="$t('custom.devicePage.serverStep2Title')"
            :description="$t('custom.devicePage.serverStep2Desc')"
          />
          <n-step :title="$t('custom.devicePage.step3Title')" :description="$t('custom.devicePage.step3Desc')" />
        </n-steps>
        <n-card class="mt-6" bordered border>
          <AddDevicesServer1
            :next-callback="
              () => {
                currentServer += 1;
              }
            "
          />
        </n-card>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
