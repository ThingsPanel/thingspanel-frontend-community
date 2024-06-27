<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NFlex } from 'naive-ui';
import type { FormInst } from 'naive-ui';
import { IosAlert, IosRefresh } from '@vicons/ionicons4';
import { repeat } from 'seemly';
import { deviceGroupTree } from '@/service/api';
import {
  configMetricsConditionMenu,
  deviceConfigAll,
  deviceListAll,
  deviceMetricsConditionMenu
} from '@/service/api/automation';
import { $t } from '@/locales';

interface Emits {
  (e: 'conditionChose', data: any): void;
}

const route = useRoute();
const emit = defineEmits<Emits>();

const premiseFormRef = ref<FormInst | null>(null);
const premiseForm = ref({
  ifGroups: [] as any
});
// 场景表单规则
const premiseFormRules = ref({
  ifType: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_conditions_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_source: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_param: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_operator: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  trigger_value: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  minValue: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  maxValue: {
    required: true,
    message: $t('common.input'),
    trigger: 'blur'
  },
  onceTimeValue: {
    required: true,
    message: $t('common.select')
  },
  expiration_time: {
    required: true,
    message: $t('common.select')
  },
  task_type: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  hourTimeValue: {
    required: true,
    message: $t('common.select')
  },
  dayTimeValue: {
    required: true,
    message: $t('common.select')
  },
  weekChoseValue: {
    required: true,
    message: $t('common.select')
  },
  weekTimeValue: {
    required: true,
    message: $t('common.select')
  },
  monthChoseValue: {
    required: true,
    message: $t('common.select')
  },
  monthTimeValue: {
    required: true,
    message: $t('common.select')
  },
  startTimeValue: {
    required: true,
    message: $t('common.select')
  },
  endTimeValue: {
    required: true,
    message: $t('common.select')
  },
  weatherValue: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  }
});

/** if分组的数据类型 */
// 选项一条件类型的下拉
// const ifTypeOptions = ref([
//   {
//     label: $t('common.deviceConditions'),
//     value: '1'
//   },
//   {
//     label: $t('common.timeConditions'),
//     value: '2'
//   }
//   // {
//   //   label: '服务条件',
//   //   value: '3'
//   // }
// ]);

const getIfTypeOptions = (ifGroup, ifIndex) => {
  return [
    {
      label: $t('common.deviceConditions'),
      value: '1',
      disabled: ifGroup.some(item => {
        return (item.trigger_conditions_type === '20' || item.trigger_conditions_type === '21') && ifIndex > 0;
      })
    },
    {
      label: $t('common.timeConditions'),
      value: '2'
    }
  ];
};
const ifTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_conditions_type = null;
  // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-use-before-define
  ifItem = judgeItem.value;
  ifItem.ifType = data;
};

// 设备条件类型下选项2使用的下拉
const deviceConditionOptions = ref([
  {
    label: $t('common.singleDevice'),
    value: '10'
  },
  {
    label: $t('common.singleClassDevice'),
    value: '11'
  }
]);
const deviceConfigDisabled = ref(false);
const triggerConditionsTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_source = null;
  ifItem.trigger_param_type = null;
  ifItem.trigger_param = null;
  ifItem.trigger_param_key = null;
  ifItem.trigger_operator = null;
  ifItem.trigger_value = null;
  ifItem.minValue = null;
  ifItem.maxValue = null;
  deviceConfigDisabled.value = false;

  if (data === '11') {
    deviceConfigDisabled.value = true;
  }
  emit('conditionChose', data);
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
  group_id: null as any,
  device_name: null as any,
  bind_config: 0
});
const btnloading = ref(false);

const selectInstRef = ref(false);
const onKeydownEnter = e => {
  selectInstRef.value = true;
  e.preventDefault();

  return false;
};
// 获取设备列表
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null;
  queryDevice.value.device_name = name || null;
  btnloading.value = false;
  deviceOptions.value = [];
  const res = await deviceListAll(queryDevice.value);
  btnloading.value = true;
  deviceOptions.value = res.data || [];
  // if (!deviceOptions.value.length) {
  //   selectInstRef.value = false;
  // }
};
// 选择设备
const triggerSourceChange = (ifItem: any) => {
  ifItem.trigger_param_type = null;
  ifItem.trigger_param = null;
  ifItem.trigger_param_key = null;
  ifItem.trigger_operator = null;
  ifItem.trigger_value = null;
  ifItem.minValue = null;
  ifItem.maxValue = null;
  selectInstRef.value = false;
  // ifItem.action_param_type = null;
  // ifItem.action_param = null;
  // ifItem.action_value = null;
};

// const testFocus = () => {
//   setTimeout(() => {
//     queryDeviceName.value[0].focus();
//   }, 100);
// };

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
const getDeviceConfig = async (name: string) => {
  queryDeviceConfig.value.device_config_name = name || '';
  const res = await deviceConfigAll(queryDeviceConfig.value);
  deviceConfigOption.value = res.data || [];
};

// 下拉获取的动作标识符
const actionParamShow = async (ifItem: any, data: any) => {
  if (data === true && ifItem.trigger_source) {
    ifItem.triggerParamOptions = [];
    let res = null as any;
    if (ifItem.trigger_conditions_type === '10') {
      res = await deviceMetricsConditionMenu({
        device_id: ifItem.trigger_source
      });
    } else if (ifItem.trigger_conditions_type === '11') {
      res = await configMetricsConditionMenu({
        device_config_id: ifItem.trigger_source
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
          subItem.value = `${item.value}/${subItem.key}`;
          subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`;
        });
      });
      // eslint-disable-next-line require-atomic-updates
      ifItem.triggerParamOptions = res.data;
    }
    const statusData = {
      value: 'status',
      label: 'status(状态)',
      options: [
        {
          value: 'On-line',
          label: 'On-line(上线)',
          key: 'On-line'
        },
        {
          value: 'Off-line',
          label: 'Off-line(下线)',
          key: 'Off-line'
        },
        {
          value: 'All',
          label: 'All(全部)',
          key: 'All'
        }
      ]
    };
    ifItem.triggerParamOptions.push(statusData);
  }
};

// 时间条件类型下选项2使用的下拉
const getTimeConditionOptions = ifGroup => {
  return [
    {
      label: $t('common.single'),
      value: '20',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: $t('common.repeat'),

      value: '21',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: $t('common.timeFrame'),
      value: '22'
    }
  ];
};
// const timeConditionOptions = ref([
//   {
//     label: $t('common.single'),
//     value: '20'
//   },
//   {
//     label: $t('common.repeat'),
//     value: '21'
//   },
//   {
//     label: $t('common.timeFrame'),
//     value: '22'
//   }
// ]);
// 服务条件类型下选项2使用的下拉
const serviceConditionOptions = ref([
  {
    label: $t('common.weather'),
    value: 'weather'
  }
]);

// const deviceOptions = ref([]);

// 时间条件下，重复时，使用的周期选项
const cycleOptions = ref([
  {
    label: $t('common.everyHour'),
    value: 'HOUR'
  },
  {
    label: $t('common.everyDay'),
    value: 'DAY'
  },
  {
    label: $t('common.weekly'),
    value: 'WEEK'
  },
  {
    label: $t('common.monthly'),
    value: 'MONTH'
  }
]);

// 时间条件下，范围时，使用的周期选项
const weekOptions = ref([
  {
    label: $t('page.irrigation.time.week.monday'),
    value: '1'
  },
  {
    label: $t('page.irrigation.time.week.tuesday'),
    value: '2'
  },
  {
    label: $t('page.irrigation.time.week.wednesday'),
    value: '3'
  },
  {
    label: $t('page.irrigation.time.week.thursday'),
    value: '4'
  },
  {
    label: $t('page.irrigation.time.week.friday'),
    value: '5'
  },
  {
    label: $t('page.irrigation.time.week.saturday'),
    value: '6'
  },
  {
    label: $t('page.irrigation.time.week.sunday'),
    value: '7'
  }
]);
// 天气条件选项
const weatherOptions = ref([
  {
    label: $t('common.sunrise'),
    value: 'sunrise'
  },
  {
    label: $t('common.sunset'),
    value: 'sunset'
  }
]);

// 操作符选项
const determineOptions = ref([
  {
    label: $t('common.equal'),
    value: '='
  },
  {
    label: $t('common.unequal'),
    value: '!='
  },
  {
    label: $t('common.pass'),
    value: '>'
  },
  {
    label: $t('common.under'),
    value: '<'
  },
  {
    label: $t('common.greaterOrEqual'),
    value: '>='
  },
  {
    label: $t('common.lessOrEqual'),
    value: '<='
  },
  {
    label: $t('common.between'),
    value: 'between'
  },
  {
    label: $t('common.includeList'),
    value: 'in'
  }
]);
// 过期时间选项
const expirationTimeOptions = ref([
  {
    label: $t('common.minutes5'),
    value: 5
  },
  {
    label: $t('common.minutes10'),
    value: 10
  },
  {
    label: $t('common.minutes30'),
    value: 30
  },
  {
    label: $t('common.hours1'),
    value: 60
  },
  {
    label: $t('common.days1'),
    value: 1140
  }
]);

// 月份范围选项
const mouthRangeOptions = repeat(31, undefined).map((_, i) => ({
  label: String(i + 1),
  value: i + 1
}));
const judgeItem = ref({
  ifType: null, // 第一条件类型
  trigger_conditions_type: null, // 第二条件-后端
  trigger_source: null, // 设备/设备类ID值-后端
  trigger_param_type: null, // 触发消息标识符-后端
  trigger_param: null, // 触发参数-后端
  trigger_param_key: null, // 触发参数-
  trigger_operator: null, // 操作符
  trigger_value: null, // 目标值(后端)
  task_type: null, // 重复时间周期值-后端
  params: null, //  时间值-后端
  execution_time: null, // 执行时间-日时分值-后端
  expiration_time: null, // 过期时间-日时分值-后端
  timeValue: null, // 时分秒值
  onceTimeValue: null, // 单次执行时间-日时分值
  hourTimeValue: null, // 时间值-选择小时
  dayTimeValue: null, // 时间值-选择天
  weekTimeValue: null, // 时间值-选择周
  monthTimeValue: null, // 时间值-选择月

  // eslint-disable-next-line no-bitwise
  weekChoseValue: [], // 星期多选值
  monthChoseValue: null, // 月份某一天

  startTimeValue: null, // 范围的开始时间
  endTimeValue: null, // 范围的结束时间
  minValue: null, // 最小
  maxValue: null, // 最大
  weatherValue: null, // 天气值
  deviceGroupId: null, // 设备分组id
  triggerParamOptions: [] // 动作标识菜单下拉列表数据选项
});
// interface JudgeItem {
//   ifType: string; // 第一条件类型
//   trigger_conditions_type: string; // 第二条件--后端
//   trigger_source: string; // 设备类ID值--后端
//   trigger_param_type: string; // 触发消息标识符--后端
//   trigger_param: string; // 触发参数--后端
//   trigger_operator: string; // 操作符
//   trigger_value: string; // 目标值(后端)
//   onceTimeValue: string; // 单次执行时间-日时分值
//   execution_time: string; // 单次执行时间-后端
//   expiration_time: string; // 单次过期时间-后端
//
//   timeValue: string; // 时分秒值
//   task_type: string; // 重复时间周期值
//   params: string; //  时间值-后端
//   hourTimeValue: number; // 时间值-选择小时
//   dayTimeValue: number; // 时间值-选择天
//   weekTimeValue: number; // 时间值-选择周
//   monthTimeValue: number; // 时间值-选择月
//   weekChoseValue: (string | number)[] | null | undefined; // 星期多选值
//   monthChoseValue: string; // 月份某一天
//   startTimeValue: number; // 范围的开始时间
//   endTimeValue: number; // 范围的结束时间
//   minValue: string; // 最小
//   maxValue: string; // 最大
//   weatherValue: string; // 天气值
//   deviceGroupId: string; // 设备分组id
//   triggerParamOptions: object | any; // 动作标识菜单下拉列表数据选项
// }

// const ifGroups = ref([] as any);

// 给某个条件中增加条件
const addIfGroupsSubItem = async (ifGroupIndex: any) => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await premiseFormRef.value?.validate();
  premiseForm.value.ifGroups[ifGroupIndex].push(JSON.parse(JSON.stringify(judgeItem.value)));
};
// 删除某个条进组中的某个条件
const deleteIfGroupsSubItem = (ifGroupIndex: any, ifIndex: any) => {
  premiseForm.value.ifGroups[ifGroupIndex].splice(ifIndex, 1);
};
// 删除某个条件组
const deleteIfGroupsItem = (ifIndex: any) => {
  premiseForm.value.ifGroups.splice(ifIndex, 1);
};
// 新增一个条件组
const addIfGroupItem = (data: any) => {
  // await premiseFormRef.value?.validate();
  const groupObj: any = [];
  if (!data) {
    groupObj.push(JSON.parse(JSON.stringify(judgeItem.value)));
    premiseForm.value.ifGroups.push(groupObj);
  } else {
    groupObj.push(data);
    premiseForm.value.ifGroups.push(groupObj);
  }
};

const ifGroupsData = () => {
  return premiseForm.value.ifGroups;
};
const premiseFormRefReturn = () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return premiseFormRef.value;
};

defineExpose({
  ifGroupsData,
  premiseFormRefReturn
});

const triggerParamChange = (ifItem: any, data: any) => {
  ifItem.trigger_param_type = data[0].value;
  ifItem.trigger_param = data[1].key;
};

interface Props {
  // eslint-disable-next-line vue/no-unused-properties
  conditionData?: object | any;
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_id?: string | any;
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_config_id?: string | any;
}

const props = withDefaults(defineProps<Props>(), {
  // eslint-disable-next-line vue/require-valid-default-prop
  conditionData: [],
  device_id: '',
  device_config_id: ''
});

const onTapInput = (item: any) => {
  if (item.group_id || item.device_name) {
    getDevice(item.group_id, item.device_name);
  } else {
    selectInstRef.value = true;
  }
};

watch(
  () => props.conditionData,
  newValue => {
    if (newValue) {
      premiseForm.value.ifGroups = props.conditionData;
    }
  }
);
const configId = ref(route.query.id || null);
onMounted(() => {
  getGroup();
  getDevice(null, null);
  getDeviceConfig('');
  if (!configId.value) {
    const judgeItemData = JSON.parse(JSON.stringify(judgeItem.value));
    if (props.device_id) {
      judgeItemData.ifType = '1';
      judgeItemData.trigger_conditions_type = '10';
      judgeItemData.trigger_source = props.device_id;
      // eslint-disable-next-line array-callback-return
    } else if (props.device_config_id) {
      judgeItemData.ifType = '1';
      judgeItemData.trigger_conditions_type = '11';
      judgeItemData.trigger_source = props.device_config_id;
      deviceConfigDisabled.value = true;
    }
    emit('conditionChose', judgeItemData.trigger_conditions_type);
    addIfGroupItem(judgeItemData);
  }
});

watch(
  premiseForm.value.ifGroups,
  () => {
    selectInstRef.value = false;
  },
  { deep: true }
);
</script>

<template>
  <NFlex vertical class="mt-1 w-100%">
    <NForm
      ref="premiseFormRef"
      :model="premiseForm"
      :rules="premiseFormRules"
      :submit-on-enter="false"
      label-placement="left"
      size="small"
      :show-feedback="false"
      @keydown.enter="onKeydownEnter"
    >
      {{ $t('generate.condition-trigger') }}
      <NFlex v-for="(ifGroupItem, ifGroupIndex) in premiseForm.ifGroups" :key="ifGroupIndex" class="w-100%">
        <NCard class="mb-2 w-[calc(100%-78px)]">
          <NFlex v-for="(ifItem, ifIndex) in ifGroupItem" :key="ifIndex" class="ifGroupItem-class mb-2 w-100%">
            <NFlex class="flex-1" align="center">
              <NTag v-if="ifIndex !== 0" type="success" class="tag-class" size="small">{{ $t('generate.and') }}</NTag>
              <!-- 选项1条件类型下拉-->
              <NFormItem
                :show-label="false"
                :path="`ifGroups[${ifGroupIndex}][${ifIndex}].ifType`"
                :rule="premiseFormRules.ifType"
                class="ml-10 max-w-25 w-full"
              >
                <NSelect
                  v-model:value="ifItem.ifType"
                  :options="getIfTypeOptions(ifGroupItem, ifIndex)"
                  :placeholder="$t('common.select')"
                  @update-value="data => ifTypeChange(ifItem, data)"
                />
              </NFormItem>
              <NFlex v-if="ifItem.ifType === '1'" class="flex-1">
                <!--  设备条件->选择类型下拉-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-25 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="deviceConditionOptions"
                    :placeholder="$t('common.select')"
                    clearable
                    @update:value="data => triggerConditionsTypeChange(ifItem, data)"
                  />
                </NFormItem>
                <template v-if="ifItem.trigger_conditions_type === '10'">
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_source`"
                    :rule="premiseFormRules.trigger_source"
                    class="max-w-40 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.trigger_source"
                      :options="deviceOptions"
                      value-field="id"
                      label-field="name"
                      clearable
                      :show="selectInstRef"
                      :consistent-menu-width="false"
                      @click.prevent="onKeydownEnter"
                      @keydown.enter="onKeydownEnter"
                      @update:value="() => triggerSourceChange(ifItem)"
                    >
                      <template #header>
                        <NFlex align="center" class="w-500px">
                          {{ $t('generate.group') }}
                          <NSelect
                            v-model:value="queryDevice.group_id"
                            :options="deviceGroupOptions"
                            label-field="name"
                            value-field="id"
                            class="max-w-40"
                            clearable
                            :placeholder="$t('common.select')"
                            @keydown.enter="onKeydownEnter"
                            @update:value="data => getDevice(data, queryDevice.device_name)"
                          />
                          <NInput
                            ref="queryDeviceName"
                            v-model:value="queryDevice.device_name"
                            class="flex-1"
                            clearable
                            :placeholder="$t('common.input')"
                            @keydown.enter="onTapInput(queryDevice)"
                            @click="handleFocus(ifIndex)"
                          ></NInput>
                          <NButton
                            :disabled="!btnloading"
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
                <template v-if="ifItem.trigger_conditions_type === '11'">
                  <!--  设备条件下->单类设备>选择设备类型下拉-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_source`"
                    :rule="premiseFormRules.trigger_source"
                    class="max-w-40 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.trigger_source"
                      :options="deviceConfigOption"
                      label-field="name"
                      value-field="id"
                      :placeholder="$t('common.select')"
                      remote
                      filterable
                      @search="getDeviceConfig"
                      @update:value="() => triggerSourceChange(ifItem)"
                    />
                  </NFormItem>
                </template>
                <template v-if="ifItem.trigger_source">
                  <!--            设备条件下->单个设备/单类设备->设备ID/设备类ID->选择设备状态-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_param`"
                    :rule="premiseFormRules.trigger_param"
                    class="max-w-40 w-full"
                  >
                    <NCascader
                      v-model:value="ifItem.trigger_param_key"
                      :placeholder="$t('common.select')"
                      :options="ifItem.triggerParamOptions"
                      check-strategy="child"
                      children-field="options"
                      size="small"
                      @update:show="data => actionParamShow(ifItem, data)"
                      @update:value="(value, option, pathValues) => triggerParamChange(ifItem, pathValues)"
                    />
                  </NFormItem>
                  <template v-if="ifItem.trigger_param_type === 'telemetry'">
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是遥测->选择操作符 --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_operator`"
                      :rule="premiseFormRules.trigger_operator"
                      class="max-w-35 w-full"
                    >
                      <NSelect v-model:value="ifItem.trigger_operator" :options="determineOptions" />
                    </NFormItem>
                    <template v-if="ifItem.trigger_operator === 'in'">
                      <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是遥测->操作符是in(包含在)->输入范围值 --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                        :rule="premiseFormRules.trigger_value"
                        class="max-w-50 w-full"
                      >
                        <NInput
                          v-model:value="ifItem.trigger_value"
                          :placeholder="$t('generate.separated-by-commas')"
                        />
                      </NFormItem>
                    </template>
                    <template v-else-if="ifItem.trigger_operator == 'between'">
                      <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是遥测->操作符是between(介于)->输入最大/最小值 --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].minValue`"
                        :rule="premiseFormRules.minValue"
                        class="max-w-35 w-full"
                      >
                        <NInput v-model:value="ifItem.minValue" :placeholder="$t('generate.min-value')" />
                      </NFormItem>
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].maxValue`"
                        :rule="premiseFormRules.maxValue"
                        class="max-w-30 w-full"
                      >
                        <NInput v-model:value="ifItem.maxValue" :placeholder="$t('generate.max-value')" />
                      </NFormItem>
                    </template>
                    <template v-else>
                      <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是遥测->操作符是除以上外->输入目标值 --->
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                        :rule="premiseFormRules.trigger_value"
                        class="max-w-40 w-full"
                      >
                        <NInput v-model:value="ifItem.trigger_value" :placeholder="$t('generate.value')" />
                      </NFormItem>
                    </template>
                  </template>
                  <template v-if="ifItem.trigger_param_type === 'attributes'">
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是属性->输入参数 --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                      :rule="premiseFormRules.trigger_value"
                      class="max-w-40 w-full"
                    >
                      <NInput
                        v-model:value="ifItem.trigger_value"
                        :placeholder="$t('common.param') + '，' + $t('common.as') + '：{param1:1}'"
                      />
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.trigger_param_type === 'event'">
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是事件->输入参数 --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                      :rule="premiseFormRules.trigger_value"
                      class="max-w-40 w-full"
                    >
                      <NInput
                        v-model:value="ifItem.trigger_value"
                        :placeholder="$t('common.param') + '，' + $t('common.as') + '：{param1:1}'"
                      />
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.trigger_param_type === 'status'">
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是状态-> --->
                  </template>
                </template>
              </NFlex>
              <NFlex v-if="ifItem.ifType === '2'" class="flex-1">
                <!--  时间条件->选择类型下拉-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-25 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="getTimeConditionOptions(ifGroupItem)"
                    :placeholder="$t('common.select')"
                    @update:value="ifItem.task_type = null"
                  />
                </NFormItem>
                <template v-if="ifItem.trigger_conditions_type === '20'">
                  <!--  时间条件下->单次->输入时间-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].onceTimeValue`"
                    :rule="premiseFormRules.onceTimeValue"
                    class="max-w-40 w-full"
                  >
                    <n-date-picker
                      v-model:value="ifItem.onceTimeValue"
                      type="datetime"
                      :time-picker-props="{ format: 'HH:mm' }"
                      format="yyyy-MM-dd HH:mm"
                      :placeholder="$t('generate.please-select-day-hour-minute')"
                    />
                  </NFormItem>
                  <NFlex align="center">
                    {{ $t('generate.not-executed') }}
                    <NButton text class="refresh-class">
                      <n-icon>
                        <IosRefresh />
                      </n-icon>
                    </NButton>
                  </NFlex>
                  <!--                  <span class="ml-4"></span>-->
                  <NFormItem
                    :label="$t('generate.expiration-time')"
                    label-width="80px"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                    :rule="premiseFormRules.expiration_time"
                  >
                    <NSelect
                      v-model:value="ifItem.expiration_time"
                      :options="expirationTimeOptions"
                      :placeholder="$t('generate.please-select')"
                      class="w-25"
                    />
                    <n-tooltip placement="top-start" trigger="hover">
                      <template #trigger>
                        <n-icon size="24" class="ml-2">
                          <IosAlert />
                        </n-icon>
                      </template>
                      超过执行时间{{ expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || '' }}后失效
                    </n-tooltip>
                  </NFormItem>
                </template>
                <template v-if="ifItem.trigger_conditions_type === '21'">
                  <!--  时间条件下->重复->选择周期-->
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].task_type`"
                    :rule="premiseFormRules.task_type"
                    class="max-w-25 w-full"
                  >
                    <NSelect
                      v-model:value="ifItem.task_type"
                      :options="cycleOptions"
                      :placeholder="$t('generate.please-select')"
                      @update:value="
                        () => {
                          ifItem.hourTimeValue = null;
                          ifItem.expiration_time = null;
                          ifItem.dayTimeValue = null;
                          ifItem.weekTimeValue = null;
                          ifItem.monthChoseValue = null;
                          ifItem.weekChoseValue = null;
                          ifItem.monthTimeValue = null;
                        }
                      "
                    />
                  </NFormItem>
                  <template v-if="ifItem.task_type === 'HOUR'">
                    <!--  时间条件下->重复->每小时->选择分-->
                    <NFormItem
                      key="hourTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].hourTimeValue`"
                      :rule="premiseFormRules.hourTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.hourTimeValue"
                        :placeholder="$t('common.select')"
                        format="mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time0"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        超过执行时间{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}后失效
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'DAY'">
                    <!--  时间条件下->重复->每天->选择时分秒-->
                    <NFormItem
                      key="dayTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].dayTimeValue`"
                      :rule="premiseFormRules.dayTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.dayTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time1"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        超过执行时间{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}后失效
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'WEEK'">
                    <!--  时间条件下->重复->每周->选择星期和输入时分-->
                    <div class="weekChoseValue-box w-120">
                      <NFormItem
                        key="weekChoseValue"
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekChoseValue`"
                        :rule="premiseFormRules.weekChoseValue"
                        :show-feedback="true"
                        class="w-full"
                      >
                        <NCheckboxGroup v-model:value="ifItem.weekChoseValue">
                          <NSpace item-style="display: flex;">
                            <n-checkbox
                              v-for="(weekItem, weekIndex) in weekOptions"
                              :key="weekIndex"
                              :value="weekItem.value"
                              :label="weekItem.label"
                            />
                          </NSpace>
                        </NCheckboxGroup>
                      </NFormItem>
                    </div>
                    <NFormItem
                      key="weekTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekTimeValue`"
                      :rule="premiseFormRules.weekTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.weekTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time2"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        超过执行时间{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}后失效
                      </n-tooltip>
                    </NFormItem>
                  </template>
                  <template v-if="ifItem.task_type === 'MONTH'">
                    <!--  时间条件下->重复->每月->选择日期和时分-->
                    <NFormItem
                      key="monthChoseValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].monthChoseValue`"
                      :rule="premiseFormRules.monthChoseValue"
                      class="max-w-25 w-full"
                    >
                      <NSelect
                        v-model:value="ifItem.monthChoseValue"
                        :options="mouthRangeOptions"
                        :placeholder="$t('generate.please-select-date')"
                      />
                    </NFormItem>
                    <NFormItem
                      key="monthTimeValue"
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].monthTimeValue`"
                      :rule="premiseFormRules.monthTimeValue"
                      class="max-w-25 w-full"
                    >
                      <NTimePicker
                        v-model:value="ifItem.monthTimeValue"
                        :placeholder="$t('common.select')"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time3"
                      :label="$t('generate.expiration-time')"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="$t('generate.please-select')"
                        class="w-25"
                      />
                      <n-tooltip placement="top-start" trigger="hover">
                        <template #trigger>
                          <n-icon size="24" class="ml-2">
                            <IosAlert />
                          </n-icon>
                        </template>
                        超过执行时间{{
                          expirationTimeOptions.find(data => ifItem['expiration_time'])?.label || ''
                        }}后失效
                      </n-tooltip>
                    </NFormItem>
                  </template>
                </template>
                <template v-if="ifItem.trigger_conditions_type === '22'">
                  <!--  时间条件下->范围->选择星期和时间周期-->
                  <div class="weekChoseValue-box w-120">
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weekChoseValue`"
                      :rule="premiseFormRules.weekChoseValue"
                      :show-feedback="true"
                      class="w-full"
                    >
                      <NCheckboxGroup v-model:value="ifItem.weekChoseValue">
                        <NSpace item-style="display: flex;">
                          <NCheckbox
                            v-for="(weekItem, weekIndex) in weekOptions"
                            :key="weekIndex"
                            :value="weekItem.value"
                            :label="weekItem.label"
                          />
                        </NSpace>
                      </NCheckboxGroup>
                    </NFormItem>
                  </div>
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].startTimeValue`"
                    :rule="premiseFormRules.startTimeValue"
                    class="max-w-25 w-full"
                  >
                    <NTimePicker
                      v-model:value="ifItem.startTimeValue"
                      :placeholder="$t('common.select')"
                      value-format="HH:mm:ss"
                      format="HH:mm:ss"
                    />
                  </NFormItem>
                  -
                  <NFormItem
                    :show-label="false"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].endTimeValue`"
                    :rule="premiseFormRules.endTimeValue"
                    class="max-w-25 w-full"
                  >
                    <NTimePicker
                      v-model:value="ifItem.endTimeValue"
                      :placeholder="$t('common.select')"
                      value-format="HH:mm:ss"
                      format="HH:mm:ss"
                    />
                  </NFormItem>
                </template>
              </NFlex>
              <NFlex v-if="ifItem.ifType === '3'" class="flex-1">
                <!--            服务条件->选择类型下拉-->
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_conditions_type`"
                  :rule="premiseFormRules.trigger_conditions_type"
                  class="max-w-40 w-full"
                >
                  <NSelect
                    v-model:value="ifItem.trigger_conditions_type"
                    :options="serviceConditionOptions"
                    class="max-w-40"
                  />
                </NFormItem>
                <NFormItem
                  :show-label="false"
                  :path="`ifGroups[${ifGroupIndex}][${ifIndex}].weatherValue`"
                  :rule="premiseFormRules.weatherValue"
                  class="max-w-40 w-full"
                >
                  <NSelect v-model:value="ifItem.weatherValue" :options="weatherOptions" />
                </NFormItem>
              </NFlex>
            </NFlex>
            <NFlex class="w-100px">
              <NButton
                v-if="ifIndex === 0"
                type="primary"
                class="absolute right-0"
                @click="addIfGroupsSubItem(ifGroupIndex)"
              >
                {{ $t('generate.add-condition') }}
              </NButton>
              <NButton
                v-if="ifIndex !== 0"
                type="error"
                class="absolute right-0"
                @click="deleteIfGroupsSubItem(ifGroupIndex, ifIndex)"
              >
                {{ $t('generate.delete-condition') }}
              </NButton>
            </NFlex>
          </NFlex>
        </NCard>
        <NButton v-if="ifGroupIndex > 0" type="error" class="relative" @click="deleteIfGroupsItem(ifGroupIndex)">
          {{ $t('generate.delete-group') }}
        </NButton>
      </NFlex>
    </NForm>
    <NButton type="primary" class="w-30" @click="addIfGroupItem(null)">{{ $t('generate.add-group') }}</NButton>
  </NFlex>
</template>

<style scoped>
.ifGroupItem-class {
  position: relative;

  .tag-class {
    position: absolute;
    top: 5px;
  }
}

.refresh-class {
  font-size: 24px;
}

:deep(.n-card__content) {
  padding: 10px 10px 4px 10px !important;
}

.weekChoseValue-box {
  :deep(.n-form-item-feedback-wrapper) {
    position: absolute;
    top: 20px;
  }
}
</style>
