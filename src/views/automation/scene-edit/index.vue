<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { type FormInst, NButton, NCard, NFlex, useDialog } from 'naive-ui';
import { deviceGroupTree } from '@/service/api';
import { warningMessageList } from '@/service/api/alarm';
import PopUp from '@/views/alarm/warning-message/components/pop-up.vue';
import {
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsMenu,
  sceneAdd,
  sceneEdit,
  sceneGet,
  sceneInfo
} from '@/service/api/automation';
// import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
import { useTabStore } from '@/store/modules/tab';
const route = useRoute();
const router = useRouter();
const dialog = useDialog();
// const { routerBack } = useRouterPush();

const configId = ref(route.query.id || '');

// 新建告警弹窗显示状态
const popUpVisible = ref(false);
// 新建告警回执
const newEdit = () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getAlarmList('');
};
// 场景表单实例
const configFormRef = ref<FormInst | null>(null);
// 场景表单数据
const configForm = ref({
  id: '',
  name: '',
  description: '',
  actions: [] as any
});
// 场景表单规则
const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-scene-name')
  },
  description: {
    required: false,
    message: $t('generate.enterSceneDesc')
  },
  actionType: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_target: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_param: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  action_value: {
    required: true,
    message: $t('common.input'),
    trigger: 'change'
  }
});
// 下拉选择器加载状态
const loadingSelect = ref(false);

// 动作选项
const actionOptions = ref([
  {
    label: $t('common.operateDevice'),
    value: '1',
    disabled: false
  },
  // {
  //   label: $t('common.activateScene'),
  //   value: '20'
  // },
  // {
  //   label: $t('common.triggerAlarm'),
  //   value: '30'
  // },
  {
    label: $t('common.triggerService'),
    value: '40'
  }
]);

// 动作选择action值改变时
const actionChange = (actionGroupItem: any, actionGroupIndex: any, data: any) => {
  // eslint-disable-next-line array-callback-return
  actionOptions.value.map(item => {
    item.disabled = false;
  });
  actionGroupItem.actionInstructList = [];
  actionGroupItem.action_type = null;
  actionGroupItem.action_target = null;
  if (data === '1') {
    // eslint-disable-next-line array-callback-return
    actionOptions.value.map(item => {
      if (item.value === '1') {
        item.disabled = true;
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    addIfGroupsSubItem(actionGroupIndex);
  }
};
// 设备类型选项
const actionTypeOptions = ref([
  {
    label: $t('common.singleDevice'),
    value: '10'
  },
  {
    label: $t('common.singleClassDevice'),
    value: '11'
  }
]);

// 选择设备类型
const actionTypeChange = (instructItem: any, data: any) => {
  instructItem.action_target = null;
  instructItem.action_param_type = null;
  instructItem.action_param = null;
  instructItem.action_param_key = null;
  instructItem.action_value = null;

  if (data === '10') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDevice(null, null);
  } else if (data === '11') {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDeviceConfig('');
  }
};

// 设备分组列表
const deviceGroupOptions = ref([] as any);
// 获取设备分组
const getGroup = async () => {
  deviceGroupOptions.value = [];
  const res = await deviceGroupTree({});
  // eslint-disable-next-line array-callback-return
  res.data.map((item: any) => {
    deviceGroupOptions.value.push(item.group);
  });
};

// 设备列表
const deviceOptions = ref([] as any);
const queryDevice = ref({
  group_id: null,
  device_name: null,
  bind_config: 2
});

// 获取设备列表
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null;
  queryDevice.value.device_name = name || null;
  const res = await deviceListAll(queryDevice.value);
  deviceOptions.value = res.data;
};

const queryDeviceName = ref([] as any);
const handleFocus = (ifIndex: any) => {
  queryDeviceName.value[ifIndex].focus();
};

// 设备配置列表
const deviceConfigOption = ref([]);
// 设备配置列表查询条件
const queryDeviceConfig = ref({
  device_config_name: ''
});
// 获取设备配置列表
const getDeviceConfig = async (name: any) => {
  queryDeviceConfig.value.device_config_name = name || '';
  const res = await deviceConfigAll(queryDeviceConfig.value);
  deviceConfigOption.value = res.data || [];
};

// 选择动作目标
const actionTargetChange = (instructItem: any) => {
  instructItem.action_param_type = null;
  instructItem.action_param = null;
  instructItem.action_param_key = null;
  instructItem.action_value = null;
};

// 下拉获取的动作标识符
const actionParamShow = async (instructItem: any, data: any) => {
  if (data === true && instructItem.action_target) {
    instructItem.actionParamType = [];
    let res = null as any;
    if (instructItem.action_type === '10') {
      res = await deviceMetricsMenu({ device_id: instructItem.action_target });
    } else if (instructItem.action_type === '11') {
      res = await deviceConfigMetricsMenu({
        device_config_id: instructItem.action_target
      });
    }
    // eslint-disable-next-line array-callback-return
    if (res.data) {
      // eslint-disable-next-line array-callback-return
      res.data.map((item: any) => {
        item.value = item.data_source_type;
        item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`;

        // eslint-disable-next-line array-callback-return
        item.options.map((subItem: any) => {
          // subItem.value = subItem.key;
          subItem.value = `${item.value}/${subItem.key}`;
          subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`;
        });
      });
      // eslint-disable-next-line require-atomic-updates
      instructItem.actionParamType = res.data;
    }
  }
};

// 选择动作标识符
const actionParamChange = (instructItem: any, pathValues: any) => {
  instructItem.action_param_type = pathValues[0].value;
  instructItem.action_param = pathValues[1].key;
  // instructItem.action_param_type = pathValues[0].value;
  instructItem.action_value = null;
};

// 场景列表
const sceneList = ref([]);
// 场景查询条件
const queryScene = ref({
  page: 1,
  page_size: 10,
  name: ''
});
// 获取场景列表
const getSceneList = async (name: string) => {
  queryScene.value.name = name || '';
  loadingSelect.value = true;
  const res = await sceneGet(queryScene.value);
  sceneList.value = res.data.list;
  loadingSelect.value = false;
};

// 告警列表
const alarmList = ref([]);
// 告警列表查询条件
const queryAlarm = ref({
  page: 1,
  page_size: 10,
  name: ''
});
const getAlarmList = async (name: string) => {
  queryAlarm.value.name = name || '';
  loadingSelect.value = true;
  const res = await warningMessageList(queryAlarm.value);
  loadingSelect.value = false;
  alarmList.value = res.data.list;
};

// 操作设备类型的数据Item
const instructListItem = ref({
  action_target: null, //  动作目标id  设备id、设备配置id，场景id、告警id
  action_type: null, // 动作标识符类型
  action_param_type: null, // 动作标识符类型
  action_param: null, // 动作标识符类型
  action_param_key: null,
  action_value: null, // 参数值
  deviceGroupId: null, // 设备分组ID
  actionParamType: [] // 动作标识菜单下拉列表数据选项
});

// interface ActionInstructItem {
//   action_target: string;
//   action_type: string;
//   action_param_type: string;
//   action_param: string; // 动作标识符类型
//   action_value: string; // 参数值
//   deviceGroupId: string;
//   actionParamType: object | any;
// }

// 动作数组的item
const actionItem = ref({
  actionType: null,
  action_type: null, // 动作类型后端
  action_target: null, // 动作目标id   设备id、设备配置id，场景id、告警id
  actionInstructList: []
});
// interface ActionItem {
//   actionType: string;
//   action_type: string;
//   action_target: string;
//   actionInstructList: Array<ActionInstructItem>;
// }

// 动作数组的值
// let actionGroups: Array<ActionItem> = reactive([] as any);

// 新增一个动作组
const addActionGroupItem = async () => {
  if (configForm.value.actions.length !== 0) {
    await configFormRef.value?.validate();
  }
  const actionItemData = JSON.parse(JSON.stringify(actionItem.value));
  // actionItemData.actionInstructList.push(JSON.parse(JSON.stringify(instructListItem.value)));
  configForm.value.actions.push(actionItemData);
};
// 删除一个动作组
const deleteActionGroupItem = (actionGroupIndex: any) => {
  configForm.value.actions.splice(actionGroupIndex, 1);
};

// 给某个动作组中增加指令
const addIfGroupsSubItem = async (actionGroupIndex: any) => {
  // if (configForm.value.actions[actionGroupIndex].actionInstructList.length != 0) {
  //   await configFormRef.value?.validate();
  // }
  configForm.value.actions[actionGroupIndex].actionInstructList.push(
    JSON.parse(JSON.stringify(instructListItem.value))
  );
};
// 删除某个动作组中的某个指令
const deleteIfGroupsSubItem = (actionGroupIndex: any, ifIndex: any) => {
  configForm.value.actions[actionGroupIndex].actionInstructList.splice(ifIndex, 1);
};

const tabStore = useTabStore();
// 表单提交
const submitData = async () => {
  await configFormRef.value?.validate();
  const actionsData = [] as any;
  // eslint-disable-next-line array-callback-return
  configForm.value.actions.map((item: any) => {
    if (item.actionType === '1') {
      // eslint-disable-next-line array-callback-return
      item.actionInstructList.map((instructItem: any) => {
        actionsData.push(instructItem);
      });
    } else {
      item.action_type = item.actionType;
      actionsData.push(item);
    }
  });
  configForm.value.actions = actionsData;
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.saveSceneInfo'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      if (configId.value) {
        const res = await sceneEdit(configForm.value);
        if (!res.error) {
          router.replace({ path: '/automation/scene-linkage' });
          await tabStore.removeTab(route.path);
        }
      } else {
        const res = await sceneAdd(configForm.value);
        if (!res.error) {
          router.replace({ path: '/automation/scene-linkage' });
          await tabStore.removeTab(route.path);
        }
      }
    }
  });
};

const getSceneInfo = async () => {
  const res = await sceneInfo(configId.value);
  configForm.value = { ...configForm.value, ...res.data.info };
  configForm.value.actions = res.data.actions;
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  dataEcho(configForm.value.actions);
};

// 处理页面回去回显
const dataEcho = actionsData => {
  const actionGroupsData = [] as any;
  const actionInstructList = [] as any;
  // eslint-disable-next-line array-callback-return
  actionsData.map((item: any) => {
    if (item.action_type === '10' || item.action_type === '11') {
      item.action_param_key = `${item.action_param_type}/${item.action_param}`;
      actionInstructList.push(item);
    } else {
      item.actionType = item.action_type;
      actionGroupsData.push(item);
    }
  });
  if (actionInstructList.length > 0) {
    const type1Data = {
      actionType: '1',
      actionInstructList
    };
    actionGroupsData.push(type1Data);
  }
  configForm.value.actions = actionGroupsData;
};

onMounted(() => {
  getGroup();
  getDevice(null, null);
  getAlarmList('');
  getSceneList('');
  getDeviceConfig('');
  if (configId.value) {
    // eslint-disable-next-line no-unused-expressions
    typeof configId.value === 'string' ? (configForm.value.id = configId.value) : '';
    getSceneInfo();
  } else {
    addActionGroupItem();
  }
});
</script>

<template>
  <div class="scene-edit">
    <NCard :bordered="false" :title="`${configId ? $t('common.edit') : $t('common.add')}场景`">
      <NForm
        ref="configFormRef"
        :model="configForm"
        :rules="configFormRules"
        label-placement="left"
        label-width="100"
        size="small"
      >
        <NFormItem :label="$t('generate.labelName')" path="name" class="w-150">
          <NInput v-model:value="configForm.name" :placeholder="$t('generate.enterSceneName')" />
        </NFormItem>
        <NFormItem :label="$t('generate.description')" path="description" class="w-150">
          <NInput
            v-model:value="configForm.description"
            type="textarea"
            :placeholder="$t('generate.enter-description')"
            rows="1"
          />
        </NFormItem>
        <NFormItem :label="$t('generate.action')" required class="w-100%" :show-feedback="false">
          <NFlex vertical class="mt-1 w-100%">
            <NFlex
              v-for="(actionGroupItem, actionGroupIndex) in configForm.actions"
              :key="actionGroupIndex"
              class="mt-1 w-100%"
            >
              <NFormItem
                :show-label="false"
                :show-feedback="false"
                :path="`actions[${actionGroupIndex}].actionType`"
                :rule="configFormRules.actionType"
                class="max-w-30 w-full"
              >
                <NSelect
                  v-model:value="actionGroupItem.actionType"
                  :options="actionOptions"
                  @update:value="data => actionChange(actionGroupItem, actionGroupIndex, data)"
                />
              </NFormItem>
              <template v-if="actionGroupItem.actionType === '1'">
                <!--          执行动作是操作设备->添加指令--->
                <NCard class="flex-1">
                  <NFlex
                    v-for="(instructItem, instructIndex) in actionGroupItem.actionInstructList"
                    :key="instructIndex"
                    class="mb-2 mr-30"
                  >
                    <NFormItem
                      :show-label="false"
                      :show-feedback="false"
                      :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_type`"
                      :rule="configFormRules.action_type"
                      class="max-w-40 w-full"
                    >
                      <NSelect
                        v-model:value="instructItem.action_type"
                        :options="actionTypeOptions"
                        @update:value="data => actionTypeChange(instructItem, data)"
                      />
                    </NFormItem>
                    <template v-if="instructItem.action_type === '10'">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceOptions"
                          value-field="id"
                          label-field="name"
                          :consistent-menu-width="false"
                          :loading="loadingSelect"
                          @update:value="() => actionTargetChange(instructItem)"
                        >
                          <template #header>
                            <NFlex align="center" class="w-500px">
                              {{ $t('generate.group') }}
                              <n-select
                                v-model:value="queryDevice.group_id"
                                :options="deviceGroupOptions"
                                label-field="name"
                                value-field="id"
                                class="max-w-40"
                                clearable
                                @update:value="data => getDevice(data, queryDevice.device_name)"
                              />
                              <NInput
                                ref="queryDeviceName"
                                v-model:value="queryDevice.device_name"
                                class="flex-1"
                                clearable
                                autofocus
                                @click="handleFocus(instructIndex)"
                              ></NInput>
                              <NButton
                                type="primary"
                                @click.stop="getDevice(queryDevice.group_id, queryDevice.device_name)"
                              >
                                {{ $t('common.search') }}
                              </NButton>
                            </NFlex>
                          </template>
                        </NSelect>
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type === '11'">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_target`"
                        :rule="configFormRules.action_target"
                        class="max-w-40 w-full"
                      >
                        <NSelect
                          v-model:value="instructItem.action_target"
                          :options="deviceConfigOption"
                          label-field="name"
                          value-field="id"
                          :placeholder="$t('common.select')"
                          remote
                          filterable
                          @search="getDeviceConfig"
                          @update:value="() => actionTargetChange(instructItem)"
                        />
                      </NFormItem>
                    </template>
                    <template v-if="instructItem.action_type">
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_param`"
                        :rule="configFormRules.action_param"
                        class="max-w-40 w-full"
                      >
                        <NCascader
                          v-model:value="instructItem.action_param_key"
                          :placeholder="$t('common.select')"
                          :options="instructItem.actionParamType"
                          check-strategy="child"
                          children-field="options"
                          size="small"
                          class="max-w-40"
                          @update:show="data => actionParamShow(instructItem, data)"
                          @update:value="(value, option, pathValues) => actionParamChange(instructItem, pathValues)"
                        />
                      </NFormItem>
                      <NFormItem
                        :show-label="false"
                        :show-feedback="false"
                        :path="`actions[${actionGroupIndex}].actionInstructList[${instructIndex}].action_value`"
                        :rule="configFormRules.action_value"
                        class="max-w-40 w-full"
                      >
                        <NInput
                          v-model:value="instructItem.action_value"
                          :placeholder="$t('common.param') + '，' + $t('common.as') + '：{param1:1}'"
                        />
                      </NFormItem>
                    </template>
                    <NButton
                      v-if="instructIndex === 0"
                      type="primary"
                      class="absolute right-5"
                      @click="addIfGroupsSubItem(actionGroupIndex)"
                    >
                      {{ $t('generate.add-row') }}
                    </NButton>
                    <NButton
                      v-if="instructIndex !== 0"
                      type="error"
                      class="absolute right-5"
                      @click="deleteIfGroupsSubItem(actionGroupIndex, instructIndex)"
                    >
                      {{ $t('common.delete') }}
                    </NButton>
                  </NFlex>
                </NCard>
              </template>
              <template v-if="actionGroupItem.actionType === '20'">
                <NFlex class="ml-6 w-auto" align="center">
                  <NFormItem
                    :label="$t('generate.activate')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                    class="w-full"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="sceneList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      :loading="loadingSelect"
                      filterable
                      class="max-w-50"
                      remote
                      @search="getSceneList"
                    />
                  </NFormItem>
                </NFlex>
              </template>
              <template v-if="actionGroupItem.actionType === '30'">
                <NFlex class="ml-6 w-auto">
                  <NFormItem
                    :label="$t('generate.trigger')"
                    label-width="60px"
                    :show-feedback="false"
                    :path="`actions[${actionGroupIndex}].action_target`"
                    :rule="configFormRules.action_target"
                  >
                    <NSelect
                      v-model:value="actionGroupItem.action_target"
                      :options="alarmList"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      class="max-w-50"
                      filterable
                      remote
                      :loading="loadingSelect"
                      @search="getAlarmList"
                    />
                  </NFormItem>
                  <NButton class="w-20" dashed type="info" @click="popUpVisible = true">
                    {{ $t('generate.create-alarm') }}
                  </NButton>
                </NFlex>
              </template>
              <NButton v-if="actionGroupIndex > 0" type="error" @click="deleteActionGroupItem(actionGroupIndex)">
                {{ $t('generate.delete-execution-action') }}
              </NButton>
            </NFlex>
            <NButton type="primary" class="w-30" @click="addActionGroupItem()">
              {{ $t('generate.add-execution-action') }}
            </NButton>
          </NFlex>
        </NFormItem>
      </NForm>
      <n-divider class="divider-class" />
      <NFlex justify="center" class="mb-5">
        <NButton type="primary" @click="submitData">{{ $t('generate.save-scene-configuration') }}</NButton>
      </NFlex>
    </NCard>
    <PopUp v-model:visible="popUpVisible" type="add" @new-edit="newEdit" />
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}
</style>
