<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 13:31:30
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 19:43:18
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { addWarningMessage, editInfo } from '@/service/api/alarm'
import { getNotificationDefaultPolicy } from '@/service/api/notification'
import type { NotificationDefaultPolicySummary } from '@/service/api/notification'
import { useAuthStore } from '@/store/modules/auth'
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
  'update:visible': [visible: boolean]
  newEdit: []
}

const message = useMessage()
const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
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
  availablePolicies: [] as NotificationDefaultPolicySummary[],
  defaultPolicy: null as NotificationDefaultPolicySummary | null,
  loading: false,
  error: ''
})
const policyOptions = computed(() => {
  const options: Array<{ label: string; value: string; disabled?: boolean }> = [
    {
      label: state.defaultPolicy
        ? state.defaultPolicy.ready
          ? tx(
              `使用租户默认策略（${state.defaultPolicy.name}）`,
              `Use tenant default policy (${state.defaultPolicy.name})`
            )
          : tx(
              `使用租户默认策略（${state.defaultPolicy.name}当前不可用）`,
              `Use tenant default policy (${state.defaultPolicy.name} is unavailable)`
            )
        : tx(
            '使用租户默认策略（未设置时只记录告警）',
            'Use tenant default policy (records only when no default is set)'
          ),
      value: ''
    },
    ...state.availablePolicies
      .filter(policy => policy.ready)
      .map(policy => ({
        label: policy.name,
        value: policy.aliasGroupId
      }))
  ]
  const currentId = formData.value.notification_group_id
  if (currentId && !options.some(option => option.value === currentId)) {
    options.push({
      label: tx(
        '当前规则指定的策略不可用（保存时不会改为默认）',
        'This rule’s explicit policy is unavailable (it will not fall back to the default)'
      ),
      value: currentId,
      disabled: true
    })
  }
  return options
})
function updateNotificationGroupId(value: string | null) {
  formData.value.notification_group_id = value ?? ''
}
let policyLoadGeneration = 0
let policyLoadController: AbortController | null = null
const loadNotificationPolicies = async () => {
  policyLoadGeneration += 1
  const generation = policyLoadGeneration
  policyLoadController?.abort()
  policyLoadController = new AbortController()
  const controller = policyLoadController
  state.loading = true
  state.error = ''
  try {
    const response = await getNotificationDefaultPolicy(controller.signal)
    if (generation !== policyLoadGeneration || controller.signal.aborted) return
    if (!response.data)
      throw response.error ?? new Error(tx('可用策略响应为空。', 'Available policy response was empty.'))
    const result = response.data
    state.availablePolicies = result.availablePolicies
    state.defaultPolicy = result.selected
  } catch (error) {
    if (generation !== policyLoadGeneration || controller.signal.aborted) return
    state.error =
      error instanceof Error ? error.message : tx('无法读取可用策略。', 'Could not load available policies.')
  } finally {
    if (generation === policyLoadGeneration && !controller.signal.aborted) state.loading = false
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) void loadNotificationPolicies()
  },
  { immediate: true }
)
watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => {
    policyLoadGeneration += 1
    policyLoadController?.abort()
    policyLoadController = null
    state.availablePolicies = []
    state.defaultPolicy = null
    state.loading = false
    state.error = ''
    if (props.visible && auth.token) void loadNotificationPolicies()
  }
)
onBeforeUnmount(() => {
  policyLoadGeneration += 1
  policyLoadController?.abort()
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

watch(
  props,
  newValue => {
    logger.info(newValue)
    if (props.type === 'edit') {
      formData.value = {
        ...props.editData,
        notification_group_id: String(props.editData?.notification_group_id ?? '')
      }
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
  },
  { immediate: true }
)
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-500px">
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

      <n-form-item :label="tx('通知策略', 'Notification policy')" path="notification_group_id">
        <n-select
          :value="formData.notification_group_id"
          :placeholder="tx('选择策略', 'Select a policy')"
          :options="policyOptions"
          :loading="state.loading"
          @update:value="updateNotificationGroupId"
        />
        <div class="mt-4px text-12px text-gray-500">
          {{
            tx(
              '选择具体策略后优先使用该策略；选择“使用租户默认策略”时，如果没有可用默认策略，告警仍会记录但不会发送通知。保存规则不会发送通知。',
              'An explicit policy takes priority. “Use tenant default policy” records the alert without sending when no usable default is set. Saving this rule does not send a notification.'
            )
          }}
        </div>
        <div v-if="state.error" class="mt-4px text-12px text-error">
          {{ state.error }}
        </div>
      </n-form-item>

      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleReset">{{ $t('common.save') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
