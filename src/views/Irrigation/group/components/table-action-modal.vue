<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import dayjs from 'dayjs';
import { useBoolean } from '@sa/hooks';
// import { genderOptions } from '@/constants'
// import { controlModalLabels } from '@/constants/business';
import { addIrrigationGroup, irrigationGroupDeviceDetail } from '@/service/api';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';
import DevicesModal from './devices-modal.vue';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: any;
}

const modalType = ref<ModalType>('add');
const { bool: devicesVisible, setTrue: openDevicesModal } = useBoolean();
export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('page.irrigation.group.addGroupPlane'),
    edit: $t('common.edit')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

interface FormModel {
  id?: string;
  name: string;
  start_irrigation_datetime: number | null;
  device_ids: string;
  control_type: 'A' | 'B';
  irrigation_duration: number | null;
  durationH?: number | null;
  durationM?: number | null;
  valve_opening: number | null;
  schedule_type: 'A' | 'B';
  cycle_index: number | null;
  interval_time: number | null;
  durationSH?: number | null;
  durationSM?: number | null;
  status: 'PND';
}

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<any, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  start_irrigation_datetime: createRequiredFormRule($t('common.pleaseCheckValue')),
  device_ids: createRequiredFormRule($t('common.pleaseCheckValue')),
  control_type: createRequiredFormRule($t('common.pleaseCheckValue')),
  irrigation_duration: createRequiredFormRule($t('common.pleaseCheckValue')),
  valve_opening: createRequiredFormRule($t('common.pleaseCheckValue')),
  schedule_type: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function openDevicesModalFn() {
  openDevicesModal();
}

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    start_irrigation_datetime: null,
    device_ids: '',
    control_type: 'A',
    irrigation_duration: null,
    durationH: null,
    durationM: null,
    valve_opening: null,
    schedule_type: 'A',
    cycle_index: null,
    interval_time: null,
    status: 'PND',
    durationSH: null,
    durationSM: null
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

const formatTime = (time: string | null) => {
  if (time) {
    return new Date(time + 8 * 60 * 60 * 1000).toISOString().toString();
  }
  return '';
};

async function handleSubmit() {
  await formRef.value?.validate();
  const params = JSON.parse(JSON.stringify(formModel));
  params.start_irrigation_datetime = formatTime(params.start_irrigation_datetime);
  let data: any;
  if (props.type === 'add') {
    data = await addIrrigationGroup(params);
  } else if (props.type === 'edit') {
    data = await addIrrigationGroup(params);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}

const columns: Ref<any> = ref([
  {
    key: 'spaceAndDistrictName',
    title: () => $t('page.irrigation.group.detail.spaceOrArea'),
    align: 'center',
    render: row => {
      return row.spaceAndDistrictName || `${row.spaces_name}|${row.disticts_name}`;
    }
  },
  {
    key: 'name',
    title: () => $t('page.irrigation.group.deviceName'),
    align: 'center',
    render: row => {
      return row.name || row.disticts_name;
    }
  }
]) as Ref<any>;

// 选择设备
const tabelDeviceData = ref<any>([]);
const handleChooseDevice = (list: any) => {
  tabelDeviceData.value = list;
};
// 详情
const loadDetail = async () => {
  const { data } = await irrigationGroupDeviceDetail(props.editData?.id);
  formModel.id = data.id;
  formModel.name = data.name;
  formModel.start_irrigation_datetime = dayjs(data.start_irrigation_datetime).valueOf();
  formModel.device_ids = '';

  formModel.control_type = data.control_type;
  formModel.irrigation_duration = null;
  formModel.durationH = Number((data.irrigation_duration / 60).toFixed(0)) || null;
  formModel.durationM = data.irrigation_duration % 60 || null;
  formModel.valve_opening = data.valve_opening;
  formModel.schedule_type = data.schedule_type;
  if (formModel.schedule_type === 'B') {
    formModel.interval_time = null;
    formModel.durationSH = Number((data.interval_time / 60).toFixed(0)) || null;
    formModel.durationSM = data.interval_time % 60 || null;
    formModel.cycle_index = data.cycle_index;
  }
  formModel.status = data.status;
  tabelDeviceData.value = data.devices;
};

onMounted(() => {
  if (props.type === 'edit') {
    loadDetail();
  }
});

watch(tabelDeviceData, () => {
  const list: any = tabelDeviceData.value.map(i => i.id || i.device_id);
  formModel.device_ids = list;
});

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
watch(
  () => formModel.durationH,
  () => {
    if (Boolean(formModel.durationH) && Boolean(formModel.durationM)) {
      formModel.irrigation_duration = Number(formModel.durationM) + Number(formModel.durationH) * 60;
    } else {
      formModel.irrigation_duration = null;
    }
  }
);
watch(
  () => formModel.durationM,
  () => {
    if (Boolean(formModel.durationH) && Boolean(formModel.durationM)) {
      formModel.irrigation_duration = Number(formModel.durationM) + Number(formModel.durationH) * 60;
    } else {
      formModel.irrigation_duration = null;
    }
  }
);
watch(
  () => formModel.durationSH,
  () => {
    if (Boolean(formModel.durationSH) && Boolean(formModel.durationSM)) {
      formModel.interval_time = Number(formModel.durationSM) + Number(formModel.durationSH) * 60;
    } else {
      formModel.interval_time = null;
    }
  }
);
watch(
  () => formModel.durationSM,
  () => {
    if (Boolean(formModel.durationSH) && Boolean(formModel.durationSM)) {
      formModel.interval_time = Number(formModel.durationSM) + Number(formModel.durationSH) * 60;
    } else {
      formModel.interval_time = null;
    }
  }
);
const valveOpenOptions = [
  {
    label: '100%',
    value: 100
  },
  {
    label: '90%',
    value: 90
  },
  {
    label: '80%',
    value: 80
  },
  {
    label: '70%',
    value: 70
  },
  {
    label: '60%',
    value: 60
  },
  {
    label: '50%',
    value: 50
  },
  {
    label: '40%',
    value: 40
  },
  {
    label: '30%',
    value: 30
  },
  {
    label: '20%',
    value: 20
  },
  {
    label: '10%',
    value: 10
  }
];
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-1000px">
    <NForm ref="formRef" label-placement="left" :label-width="100" :model="formModel" :rules="rules">
      <NGrid :cols="24">
        <NGridItem :span="14">
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.planName')" path="name">
            <NInput v-model:value="formModel.name" class="important-w-200px" />
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.startTime')" path="start_irrigation_datetime">
            <NDatePicker v-model:value="formModel.start_irrigation_datetime" type="datetime" clearable />
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.addDevice')" path="device_ids">
            <NButton type="info" @click="openDevicesModalFn">
              {{ $t('page.irrigation.group.clickToAdd') }}
            </NButton>
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.controlType')" path="control_type">
            <NRadioGroup v-model:value="formModel.control_type" name="radiogroup">
              <NSpace>
                <NRadio value="A">{{ $t('page.irrigation.duration') }}</NRadio>
                <NRadio value="B">{{ $t('page.irrigation.capacity') }}</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGridItem>
          <NFormItemGridItem
            v-if="formModel.control_type === 'A'"
            :span="24"
            :label="$t('page.irrigation.group.duration')"
            path="irrigation_duration"
          >
            <NInputNumber v-model:value="formModel.durationH" class="important-w-150px" />
            <label class="ml-10px mr-20px text-nowrap">{{ $t('page.irrigation.hour') }}</label>
            <NInputNumber v-model:value="formModel.durationM" class="important-w-150px" />
            <label class="ml-10px text-nowrap">{{ $t('page.irrigation.minute') }}</label>
          </NFormItemGridItem>
          <NFormItemGridItem v-else :span="24" :label="$t('page.irrigation.capacity')" path="irrigation_duration">
            <NInputNumber v-model:value="formModel.irrigation_duration" class="important-w-200px" />
            <label class="ml-10px mr-20px text-nowrap">L</label>
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.doorOpeing')" path="valve_opening">
            <NSelect v-model:value="formModel.valve_opening" class="w-200px" clearable :options="valveOpenOptions" />
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.controlModel')" path="schedule_type">
            <NRadioGroup v-model:value="formModel.schedule_type" name="radiogroup2">
              <NSpace>
                <NRadio value="A">{{ $t('page.irrigation.group.singleControl') }}</NRadio>
                <NRadio value="B">{{ $t('page.irrigation.group.loopControl') }}</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGridItem>
          <NFormItemGridItem
            v-if="formModel.schedule_type === 'B'"
            :span="24"
            :label="$t('page.irrigation.group.cycleNumber')"
            path="cycle_index"
          >
            <NInputNumber v-model:value="formModel.cycle_index" class="important-w-200px" />
          </NFormItemGridItem>
          <NFormItemGridItem
            v-if="formModel.schedule_type === 'B'"
            :span="24"
            :label="$t('page.irrigation.group.intervalDuration')"
            path="interval_time"
          >
            <NInputNumber v-model:value="formModel.durationSH" class="important-w-150px" />
            <label class="ml-10px mr-20px text-nowrap">{{ $t('page.irrigation.hour') }}</label>
            <NInputNumber v-model:value="formModel.durationSM" class="important-w-150px" />
            <label class="ml-10px text-nowrap">{{ $t('page.irrigation.minute') }}</label>
          </NFormItemGridItem>
        </NGridItem>
        <NGridItem :span="10" class="ml-50px flex-col">
          <div class="mb-5px">{{ $t('page.irrigation.group.choosedDevice') }}：</div>
          <NDataTable
            :columns="columns"
            :data="tabelDeviceData"
            :pagination="false"
            :flex-height="true"
            class="flex-1-hidden"
          />
        </NGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
    <DevicesModal
      v-if="devicesVisible"
      v-model:visible="devicesVisible"
      :type="modalType"
      :ids="formModel.device_ids"
      @success="handleChooseDevice"
    />
  </NModal>
</template>

<style scoped></style>
