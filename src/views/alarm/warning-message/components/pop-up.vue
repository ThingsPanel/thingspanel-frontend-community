<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 13:31:30
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 19:43:18
-->
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { addWarningMessage, editInfo } from '@/service/api/alarm'
import { getNotificationGroupList } from '@/service/api/notification'
import { useNaiveForm } from '@/hooks/common/form'
import { $t } from '@/locales'
import { createLogger } from '@/utils/logger'
const logger = createLogger('PopUp')
// interface ColumnsData {
//   [key: string]: any;
// }
export interface Props {
  visible: boolean
  type?: 'add' | 'edit'
  editData: any
}

export type ModalType = NonNullable<Props['type']>

defineOptions({ name: 'PopUp' })
const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
})

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('generate.addAlarm'),
    edit: $t('generate.editAlarm')
  }
  return titles[props.type]
})

interface Emits {
  (e: 'update:visible', visible: boolean): void

  (e: 'newEdit'): void
}

const message = useMessage()
const emit = defineEmits<Emits>()
const { formRef } = useNaiveForm()
const modalVisible = computed({
  get() {
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})

const state = reactive({
  generalOptions: [] as Array<{ id: string; name: string }>,
  notificationGroupTotal: 0,
  notificationGroupLoading: false,
  notificationGroupPageNo: 1,
  notificationGroupPageSize: 20,
  notificationGroupHasMore: true
})
const loadMoreNotificationGroupData = async () => {
  if (state.notificationGroupLoading || !state.notificationGroupHasMore) return
  state.notificationGroupLoading = true
  try {
    const params = {
      page: state.notificationGroupPageNo,
      page_size: state.notificationGroupPageSize
    }
    const res = await getNotificationGroupList(params)
    let list = res?.data?.list || []
    // list = list.filter(item => item.status === 'OPEN'); // 只展示生效的通知组
    const total = res?.data?.total || 0
    state.generalOptions = [...state.generalOptions, ...list]

    state.generalOptions = state.generalOptions.map((item: any) => {
      console.log(item, 'item')
      return {
        id: item.id,
        name: item.name,
        disabled: item?.status !== 'OPEN'
      }
    })
    state.notificationGroupTotal = total
    state.notificationGroupPageNo += 1
    state.notificationGroupHasMore = total > state.notificationGroupPageNo * state.notificationGroupPageSize
  } finally {
    state.notificationGroupLoading = false
  }
}
const notificationGroupHandleScroll = async e => {
  const target = e.target
  if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
    await loadMoreNotificationGroupData()
  }
}
onMounted(() => {
  loadMoreNotificationGroupData()
})
// const alarmRepeatTime = ref([
//   {
//     label: $t('common.times1'),
//     value: '1'
//   },
//   {
//     label: $t('common.times2'),
//     value: '2'
//   },
//   {
//     label: $t('common.times3'),
//     value: '3'
//   },
//   {
//     label: $t('common.times4'),
//     value: '4'
//   },
//   {
//     label: $t('common.times5'),
//     value: '5'
//   },
//   {
//     label: $t('common.times6'),
//     value: '6'
//   },
//   {
//     label: $t('common.times7'),
//     value: '7'
//   },
//   {
//     label: $t('common.times8'),
//     value: '8'
//   },
//   {
//     label: $t('common.times9'),
//     value: '9'
//   },
//   {
//     label: $t('common.times10'),
//     value: '10'
//   }
// ]);
const alarmLevel = ref([
  {
    label: $t('common.high'),
    value: 'H'
  },
  {
    label: $t('common.middle'),
    value: 'M'
  },
  {
    label: $t('common.low'),
    value: 'L'
  }
])
/** 触发时间下拉 */
// const alarmKeepTime = ref([
//   {
//     label: $t('common.minute1'),
//     value: '1'
//   },
//   {
//     label: $t('common.minute2'),
//     value: '2'
//   },
//   {
//     label: $t('common.minutes3'),
//     value: '3'
//   },
//   {
//     label: $t('common.minutes4'),
//     value: '4'
//   },
//   {
//     label: $t('common.minutes5'),
//     value: '5'
//   },
//   {
//     label: $t('common.minutes6'),
//     value: '6'
//   },
//   {
//     label: $t('common.minutes7'),
//     value: '7'
//   },
//   {
//     label: $t('common.minutes8'),
//     value: '8'
//   },
//   {
//     label: $t('common.minutes9'),
//     value: '9'
//   },
//   {
//     label: $t('common.minutes10'),
//     value: '10'
//   }
// ]);
/** 关闭弹框 */
const closeModal = () => {
  modalVisible.value = false
  emit('newEdit')
}

const formData = ref({
  id: '',
  name: '',
  alarm_level: '',
  alarm_repeat_time: '', // 触发重复次数
  alarm_keep_time: '', // 触发持续时间
  notification_group_id: '', // 通知组ID
  enabled: 'Y', // 是否启用，Y-启用N-停止
  description: ''
})
const rules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('common.enterAlarmName')
  },
  alarm_level: {
    required: true,
    trigger: ['blur', 'change'],
    message: $t('common.enterAlarmLevel')
  },
  alarm_repeat_time: {
    required: true,
    trigger: ['blur', 'change'],
    message: $t('common.enterNumberTriggering')
  },
  alarm_keep_time: {
    required: true,
    trigger: ['blur', 'change'],
    message: $t('common.enterTriggeringDuration')
  }
}
/** 新增 */
const add = async () => {
  const data = {
    name: formData.value.name,
    alarm_level: formData.value.alarm_level,
    alarm_repeat_time: Number(formData.value.alarm_repeat_time),
    alarm_keep_time: Number(formData.value.alarm_keep_time),
    notification_group_id: formData.value.notification_group_id,
    enabled: 'Y',
    description: formData.value.description
  }
  const res = await addWarningMessage(data)
  if (res) {
    message.success($t('common.addSuccess'))
    modalVisible.value = false
    emit('newEdit')
  } else {
    message.error($t('common.addFail'))
  }
}

/** @param e 编辑 */
async function editInfoText() {
  const datas = {
    id: formData.value.id,
    name: formData.value.name,
    alarm_level: formData.value.alarm_level,
    alarm_repeat_time: Number(formData.value.alarm_repeat_time),
    alarm_keep_time: Number(formData.value.alarm_keep_time),
    notification_group_id: formData.value.notification_group_id,
    enabled: 'Y',
    description: formData.value.description
  }
  const { data } = await editInfo(datas)
  if (data) {
    message.success($t('common.editSuccess'))
    modalVisible.value = false
    emit('newEdit')
  } else {
    message.success($t('common.editFail'))
  }
}

function handleReset(e) {
  Object.assign(formData, {
    id: '',
    name: '',
    alarm_level: '',
    alarm_repeat_time: '',
    alarm_keep_time: '',
    notification_group_id: '',
    enabled: 'Y',
    description: ''
  })
  e.preventDefault()
  formRef.value?.validate(errors => {
    if (!errors) {
      if (props.type === 'add') {
        add()
      } else {
        editInfoText()
      }
    }
  })
}

watch(props, newValue => {
  logger.info(newValue)
  if (props.type === 'edit') {
    formData.value = props.editData
    formData.value.alarm_keep_time = String(formData.value.alarm_keep_time)
    formData.value.alarm_repeat_time = String(formData.value.alarm_repeat_time)
  } else {
    formData.value = {
      id: '',
      name: '',
      alarm_level: '',
      alarm_repeat_time: '',
      alarm_keep_time: '',
      notification_group_id: '',
      enabled: 'Y',
      description: ''
    }
  }
})
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title">
    <NForm ref="formRef" :rules="rules" :model="formData">
      <n-form-item :label="$t('generate.alarm-name')" path="name">
        <n-input v-model:value="formData.name" :placeholder="$t('generate.alarm-name')" />
      </n-form-item>

      <n-form-item :label="$t('generate.alarm-description')">
        <n-input v-model:value="formData.description" :placeholder="$t('generate.alarm-description')" />
      </n-form-item>

      <n-form-item :label="$t('generate.alarm-level')" path="alarm_level">
        <n-select
          v-model:value="formData.alarm_level"
          :placeholder="$t('generate.alarm-level')"
          :options="alarmLevel"
        />
      </n-form-item>

      <!--
 <n-form-item :label="$t('generate.trigger-repeat-count')" path="alarm_repeat_time">
        <n-select
          v-model:value="formData.alarm_repeat_time"
          :placeholder="$t('generate.trigger-repeat-count')"
          :options="alarmRepeatTime"
        />
      </n-form-item>

      <n-form-item :label="$t('generate.trigger-duration')" path="alarm_keep_time">
        <n-select
          v-model:value="formData.alarm_keep_time"
          :placeholder="$t('generate.trigger-duration')"
          :options="alarmKeepTime"
        />
      </n-form-item>
-->

      <n-form-item :label="$t('generate.notification-group')" path="selectValue">
        <n-select
          v-model:value="formData.notification_group_id"
          :placeholder="$t('generate.select-notification-group')"
          :options="state.generalOptions"
          label-field="name"
          value-field="id"
          :loading="state.notificationGroupLoading"
          @scroll="notificationGroupHandleScroll"
        />
      </n-form-item>

      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleReset">{{ $t('common.save') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
