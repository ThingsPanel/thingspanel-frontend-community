<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUpdate, computed } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NFlex, useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { IosAlert, IosRefresh } from '@vicons/ionicons4'
import { repeat } from 'seemly'
import { deviceGroupTree } from '@/service/api'
import {
  configMetricsConditionMenu,
  deviceConfigAll,
  deviceListAll,
  deviceMetricsConditionMenu
} from '@/service/api/automation'
import { $t } from '@/locales'
import { useI18n } from 'vue-i18n'

interface Emits {
  (e: 'conditionChose', data: any): void
}

const route = useRoute()
const emit = defineEmits<Emits>()
const { locale } = useI18n()

const premiseFormRef = ref<FormInst | null>(null)
const premiseForm = ref({
  ifGroups: [] as any
})
// 场景表单规则
const premiseFormRules = ref({
  ifType: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  trigger_conditions_type: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  trigger_source: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  trigger_param: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  trigger_operator: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  trigger_value: {
    required: true,
    message: "输入",
    trigger: 'blur'
  },
  minValue: {
    required: true,
    message: "输入",
    trigger: 'blur'
  },
  maxValue: {
    required: true,
    message: "输入",
    trigger: 'blur'
  },
  onceTimeValue: {
    required: true,
    message: "选择"
  },
  expiration_time: {
    required: true,
    message: "选择"
  },
  task_type: {
    required: true,
    message: "选择",
    trigger: 'change'
  },
  hourTimeValue: {
    required: true,
    message: "选择"
  },
  dayTimeValue: {
    required: true,
    message: "选择"
  },
  weekChoseValue: {
    required: true,
    message: "选择"
  },
  weekTimeValue: {
    required: true,
    message: "选择"
  },
  monthChoseValue: {
    required: true,
    message: "选择"
  },
  monthTimeValue: {
    required: true,
    message: "选择"
  },
  startTimeValue: {
    required: true,
    message: "选择"
  },
  endTimeValue: {
    required: true,
    message: "选择"
  },
  weatherValue: {
    required: true,
    message: "选择",
    trigger: 'change'
  }
})



const getIfTypeOptions = (ifGroup, ifIndex) => {
  return [
    {
      label: "设备条件",
      value: '1',
      disabled: ifGroup.some(item => {
        return (item.trigger_conditions_type === '20' || item.trigger_conditions_type === '21') && ifIndex > 0
      })
    },
    {
      label: "时间条件",
      value: '2'
    }
  ]
}
const ifTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_conditions_type = null
  ifItem = judgeItem.value
  ifItem.ifType = data
}

// 设备条件类型下选项2使用的下拉
const deviceConditionOptions = computed(() => [
  {
    label: "单个设备",
    value: '10'
  },
  {
    label: "单类设备",
    value: '11'
  }
])
const deviceConfigDisabled = ref(false)
const triggerConditionsTypeChange = (ifItem: any, data: any) => {
  ifItem.trigger_source = null
  ifItem.trigger_param_type = null
  ifItem.trigger_param = null
  ifItem.trigger_param_key = null
  ifItem.trigger_operator = null
  ifItem.trigger_value = null
  ifItem.minValue = null
  ifItem.maxValue = null
  deviceConfigDisabled.value = false

  if (data === '11') {
    deviceConfigDisabled.value = true
  }
  emit('conditionChose', data)
}

// 设备分组列表
const deviceGroupOptions = ref([] as any)
// 获取设备分组
const getGroup = async () => {
  deviceGroupOptions.value = []
  const res = await deviceGroupTree({})
  // eslint-disable-next-line array-callback-return
  res.data.map((item: any) => {
    deviceGroupOptions.value.push(item.group)
  })
}

// 设备列表
const deviceOptions = ref([] as any)
const queryDevice = ref({
  group_id: null as any,
  device_name: null as any,
  bind_config: 0
})
const btnloading = ref(false)

const selectInstRef = ref({})
const onKeydownEnter = e => {
  // selectInstRef.value = true;
  e.preventDefault()

  return false
}
const onDeviceKeydownEnter = (e: any, ifIndex: number) => {
  selectInstRef.value[ifIndex] = true
  e.preventDefault()
  return false
}
// 获取设备列表
const getDevice = async (groupId: any, name: any) => {
  queryDevice.value.group_id = groupId || null
  queryDevice.value.device_name = name || null
  btnloading.value = false
  deviceOptions.value = []
  const res = await deviceListAll(queryDevice.value)
  btnloading.value = true
  deviceOptions.value = res.data || []
  // if (!deviceOptions.value.length) {
  //   selectInstRef.value = false;
  // }
}
// 选择设备
const triggerSourceChange = (ifItem: any, ifIndex: number) => {
  ifItem.trigger_param_type = null
  ifItem.trigger_param = null
  ifItem.trigger_param_key = null
  ifItem.trigger_operator = null
  ifItem.trigger_value = null
  ifItem.minValue = null
  ifItem.maxValue = null
  selectInstRef.value[ifIndex] = false
  // ifItem.action_param_type = null;
  // ifItem.action_param = null;
  // ifItem.action_value = null;
}

// const testFocus = () => {
//   setTimeout(() => {
//     queryDeviceName.value[0].focus();
//   }, 100);
// };

const queryDeviceName = ref<Record<number, any>>({})

// 清理 refs 的函数
onBeforeUpdate(() => {
  queryDeviceName.value = {}
})

// 设置 ref 的函数
const setQueryDeviceNameRef = (el: any, index: number) => {
  if (el) {
    queryDeviceName.value[index] = el
  }
}

const handleFocus = (ifIndex: any) => {
  if (queryDeviceName.value[ifIndex]) {
    queryDeviceName.value[ifIndex].focus()
  } else {
    console.warn(`Ref for queryDeviceName at index ${ifIndex} not found.`)
  }
}

// 设备配置列表
const deviceConfigOption = ref([])
// 设备配置列表查询条件
const queryDeviceConfig = ref({
  device_config_name: ''
})
// 获取设备配置列表
const getDeviceConfig = async (name: string) => {
  queryDeviceConfig.value.device_config_name = name || ''
  const res = await deviceConfigAll(queryDeviceConfig.value)
  deviceConfigOption.value = res.data || []
}

// 新增：主动加载选项的函数
const loadTriggerParamOptions = async (ifItem: any) => {
  // 避免重复加载，如果选项已存在则不重新加载
  if (ifItem.triggerParamOptions && ifItem.triggerParamOptions.length > 0) {
    return
  }

  if (ifItem.trigger_source && (ifItem.trigger_conditions_type === '10' || ifItem.trigger_conditions_type === '11')) {
    ifItem.triggerParamOptions = [] // 初始化为空数组
    let res = null as any
    try {
      if (ifItem.trigger_conditions_type === '10') {
        res = await deviceMetricsConditionMenu({
          device_id: ifItem.trigger_source
        })
      } else if (ifItem.trigger_conditions_type === '11') {
        res = await configMetricsConditionMenu({
          device_config_id: ifItem.trigger_source
        })
      }

      if (res && res.data) {
        // (Processing logic copied from actionParamShow)
        res.data.map((item: any) => {
          item.value = item.data_source_type
          item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`
          item.options.map((subItem: any) => {
            subItem.value = `${item.value}/${subItem.key}`
            subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`
          })
        })
        ifItem.triggerParamOptions = res.data // Assign processed data
      } else {
        ifItem.triggerParamOptions = [] // Ensure array on API failure
      }
    } catch (error) {
      console.error('Error loading trigger param options during echo:', error)
      ifItem.triggerParamOptions = [] // Ensure array on error
    } finally {
      // Add statusData regardless of API outcome
      // Ensure statusData is not added multiple times if loaded elsewhere
      if (!ifItem.triggerParamOptions.some(opt => opt.value === 'status')) {
        ifItem.triggerParamOptions.push(statusData.value)
      }
    }
  }
}

// 下拉获取的动作标识符
const actionParamShow = async (ifItem: any, data: any) => {
  // 调用主动加载函数，它会处理重复加载的问题
  if (data === true) {
    await loadTriggerParamOptions(ifItem)
  }
  // 原有的 actionParamShow 逻辑可以简化或移除，因为 loadTriggerParamOptions 做了主要工作
  // 保留原始注释掉的逻辑以供参考，或者完全移除
  // if (data === true && ifItem.trigger_source) {
  //   ifItem.triggerParamOptions = [];
  //   let res = null as any;
  //   if (ifItem.trigger_conditions_type === '10') {
  //     res = await deviceMetricsConditionMenu({
  //       device_id: ifItem.trigger_source
  //     });
  //   } else if (ifItem.trigger_conditions_type === '11') {
  //     res = await configMetricsConditionMenu({
  //       device_config_id: ifItem.trigger_source
  //     });
  //   }
  //   // eslint-disable-next-line array-callback-return
  //   if (res.data) {
  //     // eslint-disable-next-line array-callback-return
  //     res.data.map((item: any) => {
  //       item.value = item.data_source_type;
  //       item.label = `${item.data_source_type}${item.label ? `(${item.label})` : ''}`;

  //       // eslint-disable-next-line array-callback-return
  //       item.options.map((subItem: any) => {
  //         subItem.value = `${item.value}/${subItem.key}`;
  //         subItem.label = `${subItem.key}${subItem.label ? `(${subItem.label})` : ''}`;
  //       });
  //     });
  //     // eslint-disable-next-line require-atomic-updates
  //     ifItem.triggerParamOptions = res.data;
  //   }
  //   const statusData = {
  //     value: 'status',
  //     label: 'status(状态)',
  //     options: [
  //       {
  //         value: 'status/On-line',
  //         label: 'On-line(上线)',
  //         key: 'On-line'
  //       },
  //       {
  //         value: 'status/Off-line',
  //         label: 'Off-line(下线)',
  //         key: 'Off-line'
  //       },
  //       {
  //         value: 'status/All',
  //         label: 'All(全部)',
  //         key: 'All'
  //       }
  //     ]
  //   };
  //   ifItem.triggerParamOptions.push(statusData);
  // }
}

// 创建全局的statusData计算属性
const statusData = computed(() => ({
  value: 'status',
  label: "状态",
  options: [
    {
      value: 'status/On-line',
      label: "上线",
      key: 'On-line'
    },
    {
      value: 'status/Off-line',
      label: "下线",
      key: 'Off-line'
    },
    {
      value: 'status/All',
      label: "全部",
      key: 'All'
    }
  ]
}))

const message = useMessage()

// 动作值标识
const actionValueChange = (ifItem: any) => {
  if (ifItem.trigger_param_type === 'event') {
    try {
      JSON.parse(ifItem.trigger_value)
      if (typeof JSON.parse(ifItem.trigger_value) === 'object') {
        ifItem.inputFeedback = ''
        ifItem.inputValidationStatus = undefined
      } else {
        message.error("请输入JSON")
        ifItem.inputValidationStatus = 'error'
      }
    } catch (e) {
      message.error("请输入JSON")
      ifItem.inputValidationStatus = 'error'
    }
  }
}

// 时间条件类型下选项2使用的下拉
const getTimeConditionOptions = ifGroup => {
  return [
    {
      label: "单次",
      value: '20',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: "重复",

      value: '21',
      disabled: ifGroup.some(item => item.ifType === '1')
    },
    {
      label: "时间框架",
      value: '22'
    }
  ]
}

const serviceConditionOptions = computed(() => [
  {
    label: "天气",
    value: 'weather'
  }
])

// const deviceOptions = ref([]);

// 时间条件下，重复时，使用的周期选项
const cycleOptions = computed(() => [
  {
    label: "每小时",
    value: 'HOUR'
  },
  {
    label: "每天",
    value: 'DAY'
  },
  {
    label: "每周",
    value: 'WEEK'
  },
  {
    label: "每月",
    value: 'MONTH'
  }
])

// 时间条件下，范围时，使用的周期选项
const weekOptions = computed(() => [
  {
    label: "周一",
    value: '1'
  },
  {
    label: "周二",
    value: '2'
  },
  {
    label: "周三",
    value: '3'
  },
  {
    label: "周四",
    value: '4'
  },
  {
    label: "周五",
    value: '5'
  },
  {
    label: "周六",
    value: '6'
  },
  {
    label: "周日",
    value: '7'
  }
])
// 天气条件选项
const weatherOptions = computed(() => [
  {
    label: "日出",
    value: 'sunrise'
  },
  {
    label: "日落",
    value: 'sunset'
  }
])

// 操作符选项
const determineOptions = computed(() => [
  {
    label: "等于",
    value: '='
  },
  {
    label: "不等于",
    value: '!='
  },
  {
    label: "通过",
    value: '>'
  },
  {
    label: "小于",
    value: '<'
  },
  {
    label: "大于等于",
    value: '>='
  },
  {
    label: "小于等于",
    value: '<='
  },
  {
    label: "之间",
    value: 'between'
  },
  {
    label: "包含列表",
    value: 'in'
  }
])
// 过期时间选项
const expirationTimeOptions = computed(() => [
  {
    label: "5分钟",
    value: 5
  },
  {
    label: "10分钟",
    value: 10
  },
  {
    label: "30分钟",
    value: 30
  },
  {
    label: "1小时",
    value: 60
  },
  {
    label: "1天",
    value: 1440
  }
])

// 月份范围选项
const mouthRangeOptions = repeat(31, undefined).map((_, i) => ({
  label: String(i + 1),
  value: i + 1
}))
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
})
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
  await premiseFormRef.value?.validate()
  premiseForm.value.ifGroups[ifGroupIndex].push(JSON.parse(JSON.stringify(judgeItem.value)))
}
// 删除某个条进组中的某个条件
const deleteIfGroupsSubItem = (ifGroupIndex: any, ifIndex: any) => {
  premiseForm.value.ifGroups[ifGroupIndex].splice(ifIndex, 1)
}
// 删除某个条件组
const deleteIfGroupsItem = (ifIndex: any) => {
  premiseForm.value.ifGroups.splice(ifIndex, 1)
}
// 新增一个条件组
const addIfGroupItem = (data: any) => {
  // await premiseFormRef.value?.validate();
  const groupObj: any = []
  if (!data) {
    groupObj.push(JSON.parse(JSON.stringify(judgeItem.value)))
    premiseForm.value.ifGroups.push(groupObj)
  } else {
    groupObj.push(data)
    premiseForm.value.ifGroups.push(groupObj)
  }
}

const ifGroupsData = () => {
  return premiseForm.value.ifGroups
}
const premiseFormRefReturn = () => {
  return premiseFormRef.value
}

defineExpose({
  ifGroupsData,
  premiseFormRefReturn
})

const triggerParamChange = (ifItem: any, data: any) => {
  ifItem.trigger_param_type = data[0].value
  ifItem.trigger_param = data[1].key
}

interface Props {
  // eslint-disable-next-line vue/no-unused-properties
  conditionData?: object | any
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_id?: string | any
  // eslint-disable-next-line vue/no-unused-properties,vue/prop-name-casing
  device_config_id?: string | any
}

const props = withDefaults(defineProps<Props>(), {
  // eslint-disable-next-line vue/require-valid-default-prop
  conditionData: [],
  device_id: '',
  device_config_id: ''
})

const onTapInput = (item: any, ifIndex: number) => {
  if (item.group_id || item.device_name) {
    getDevice(item.group_id, item.device_name)
  } else {
    selectInstRef.value[ifIndex] = true
  }
}

watch(
  () => props.conditionData,
  newValue => {
    if (newValue && Array.isArray(newValue)) {
      // 使用深拷贝确保响应性
      premiseForm.value.ifGroups = JSON.parse(JSON.stringify(newValue))
      // 遍历并主动加载选项
      premiseForm.value.ifGroups.forEach(ifGroup => {
        if (Array.isArray(ifGroup)) {
          ifGroup.forEach(ifItem => {
            // Call the function defined earlier to load options
            loadTriggerParamOptions(ifItem)
          })
        }
      })
    }
  },
  { deep: true } // Options object
)
const configId = ref(route.query.id || null)
onMounted(() => {
  getGroup()
  getDevice(null, null)
  getDeviceConfig('')
  if (!configId.value) {
    const judgeItemData = JSON.parse(JSON.stringify(judgeItem.value))
    if (props.device_id) {
      judgeItemData.ifType = '1'
      judgeItemData.trigger_conditions_type = '10'
      judgeItemData.trigger_source = props.device_id
      // eslint-disable-next-line array-callback-return
    } else if (props.device_config_id) {
      judgeItemData.ifType = '1'
      judgeItemData.trigger_conditions_type = '11'
      judgeItemData.trigger_source = props.device_config_id
      deviceConfigDisabled.value = true
    }
    emit('conditionChose', judgeItemData.trigger_conditions_type)
    addIfGroupItem(judgeItemData)
  }
})

// 监听国际化语言变化，更新triggerParamOptions中的statusData
watch(locale, () => {
  // 遍历所有ifGroups中的ifItems，更新其triggerParamOptions中的statusData
  premiseForm.value.ifGroups.forEach((ifGroup: any) => {
    ifGroup.ifItems.forEach((ifItem: any) => {
      if (ifItem.triggerParamOptions && Array.isArray(ifItem.triggerParamOptions)) {
        // 找到并更新statusData项
        const statusIndex = ifItem.triggerParamOptions.findIndex((opt: any) => opt.value === 'status')
        if (statusIndex !== -1) {
          // 用新的statusData替换旧的
          ifItem.triggerParamOptions[statusIndex] = statusData.value
        }
      }
    })
  })
})

watch(
  premiseForm.value.ifGroups,
  () => {
    // selectInstRef.value = false;
  },
  { deep: true }
)
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
      {{ "(满足以下任意一组条件即可触发)" }}
      <NFlex v-for="(ifGroupItem, ifGroupIndex) in premiseForm.ifGroups" :key="ifGroupIndex" class="w-100%">
        <NCard class="mb-2 w-[calc(100%-78px)]">
          <NFlex v-for="(ifItem, ifIndex) in ifGroupItem" :key="ifIndex" class="ifGroupItem-class mb-2 w-100%">
            <NFlex class="flex-1" align="center">
              <NTag v-if="ifIndex !== 0" type="success" class="tag-class" size="small">{{ "且" }}</NTag>
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
                  :placeholder="选择"
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
                    :placeholder="选择"
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
                      :consistent-menu-width="false"
                      @click.prevent="
                        e => {
                          onDeviceKeydownEnter(e, ifIndex)
                        }
                      "
                      @keydown.enter="
                        e => {
                          onDeviceKeydownEnter(e, ifIndex)
                        }
                      "
                      @update:value="() => triggerSourceChange(ifItem, ifIndex)"
                    >
                      <template #header>
                        <NFlex align="center" class="w-500px">
                          {{ "分组" }}
                          <NSelect
                            v-model:value="queryDevice.group_id"
                            :options="deviceGroupOptions"
                            label-field="name"
                            value-field="id"
                            class="max-w-40"
                            clearable
                            :placeholder="选择"
                            @keydown.enter="onKeydownEnter"
                            @update:value="data => getDevice(data, queryDevice.device_name)"
                          />
                          <NInput
                            :ref="el => setQueryDeviceNameRef(el, ifIndex)"
                            v-model:value="queryDevice.device_name"
                            class="flex-1"
                            clearable
                            :placeholder="输入"
                            @keydown.enter="onTapInput(queryDevice, ifIndex)"
                            @click="handleFocus(ifIndex)"
                          ></NInput>
                          <NButton
                            :disabled="!btnloading"
                            type="primary"
                            @click.stop="getDevice(queryDevice.group_id, queryDevice.device_name)"
                          >
                            {{ "搜索" }}
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
                      :placeholder="选择"
                      remote
                      filterable
                      @search="getDeviceConfig"
                      @update:value="() => triggerSourceChange(ifItem, ifIndex)"
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
                      :placeholder="选择"
                      :options="ifItem.triggerParamOptions"
                      check-strategy="child"
                      children-field="options"
                      size="small"
                      @update:show="data => actionParamShow(ifItem, data)"
                      @update:value="(value, option, pathValues) => triggerParamChange(ifItem, pathValues)"
                    />
                  </NFormItem>
                  <template
                    v-if="ifItem.trigger_param_type === 'telemetry' || ifItem.trigger_param_type === 'attributes'"
                  >
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是遥测/属性->选择操作符 --->
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
                          :placeholder="多个英文逗号隔开"
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
                        <NInput v-model:value="ifItem.minValue" :placeholder="最小值" />
                      </NFormItem>
                      <NFormItem
                        :show-label="false"
                        :path="`ifGroups[${ifGroupIndex}][${ifIndex}].maxValue`"
                        :rule="premiseFormRules.maxValue"
                        class="max-w-30 w-full"
                      >
                        <NInput v-model:value="ifItem.maxValue" :placeholder="最大值" />
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
                        <NInput v-model:value="ifItem.trigger_value" :placeholder="取值" />
                      </NFormItem>
                    </template>
                  </template>
                  <template v-if="ifItem.trigger_param_type === 'event'">
                    <!--          设备条件下->单个设备/单类设备>-设备ID/选择设备类ID>触发消息标识符是事件->输入参数 --->
                    <NFormItem
                      :show-label="false"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].trigger_value`"
                      :rule="premiseFormRules.trigger_value"
                      :validation-status="ifItem.inputValidationStatus"
                      :feedback="ifItem.inputFeedback"
                      class="max-w-40 w-full"
                    >
                      <NInput
                        v-model:value="ifItem.trigger_value"
                        :placeholder="`${"参数"},${"如"}:{&quot;param1&quot;:1}`"
                        @blur="actionValueChange(ifItem)"
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
                    :placeholder="选择"
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
                      :placeholder="请选择日时分"
                    />
                  </NFormItem>
                  <NFlex align="center">
                    {{ "未执行" }}
                    <NButton text class="refresh-class">
                      <n-icon>
                        <IosRefresh />
                      </n-icon>
                    </NButton>
                  </NFlex>
                  <!--                  <span class="ml-4"></span>-->
                  <NFormItem
                    :label="过期时间"
                    label-width="80px"
                    :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                    :rule="premiseFormRules.expiration_time"
                  >
                    <NSelect
                      v-model:value="ifItem.expiration_time"
                      :options="expirationTimeOptions"
                      :placeholder="请选择"
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
                      :placeholder="请选择"
                      @update:value="
                        () => {
                          ifItem.hourTimeValue = null
                          ifItem.expiration_time = null
                          ifItem.dayTimeValue = null
                          ifItem.weekTimeValue = null
                          ifItem.monthChoseValue = null
                          ifItem.weekChoseValue = null
                          ifItem.monthTimeValue = null
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
                        :placeholder="选择"
                        format="mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time0"
                      :label="过期时间"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="请选择"
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
                        :placeholder="选择"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time1"
                      :label="过期时间"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="请选择"
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
                        :placeholder="选择"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time2"
                      :label="过期时间"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="请选择"
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
                        :placeholder="请选择日期"
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
                        :placeholder="选择"
                        value-format="HH:mm"
                        format="HH:mm"
                      />
                    </NFormItem>
                    <NFormItem
                      key="expiration_time3"
                      :label="过期时间"
                      label-width="80px"
                      :path="`ifGroups[${ifGroupIndex}][${ifIndex}].expiration_time`"
                      :rule="premiseFormRules.expiration_time"
                    >
                      <NSelect
                        v-model:value="ifItem.expiration_time"
                        :options="expirationTimeOptions"
                        :placeholder="请选择"
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
                      :placeholder="选择"
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
                      :placeholder="选择"
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
                {{ "新增一个条件" }}
              </NButton>
              <NButton
                v-if="ifIndex !== 0"
                type="error"
                class="absolute right-0"
                @click="deleteIfGroupsSubItem(ifGroupIndex, ifIndex)"
              >
                {{ "删除一个条件" }}
              </NButton>
            </NFlex>
          </NFlex>
        </NCard>
        <NButton v-if="ifGroupIndex > 0" type="error" class="relative" @click="deleteIfGroupsItem(ifGroupIndex)">
          {{ "删除组" }}
        </NButton>
      </NFlex>
    </NForm>
    <NButton type="primary" class="w-30" @click="addIfGroupItem(null)">{{ "新增一个组" }}</NButton>
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
