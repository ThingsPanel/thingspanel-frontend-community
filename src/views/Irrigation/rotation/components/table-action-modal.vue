<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import dayjs from 'dayjs';
import { useBoolean } from '@sa/hooks';
// import { genderOptions } from '@/constants'
import { createRequiredFormRule } from '@/utils/form/rule';
import {
  addIrrigationRotation,
  editIrrigationRotation,
  irrigationRotationDetail,
  irrigationRotationDeviceList
} from '@/service/api';
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
    add: $t('page.irrigation.rotation.addRotationPlane'),
    edit: $t('common.edit')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

interface FormModel {
  id?: string;
  name: string;
  water_pump_device_id: string;
  water_pump_valve_opening: number | null;
  water_pump_pressure: number | null;
  irrigation_duration: number | null;
  durationH: number | null;
  durationM: number | null;
  start_irrigation_datetime: number | null;
  start_datetime: string;
  tasks: Array<{
    device_id: string;
    sort: number | null;
    valve_opening: number | null;
    irrigation_duration: number | null;
    pressure: number | null;
    durationH: number | null;
    durationM: number | null;
    [key: string]: any;
  }>;
}

// type FormModel = Pick<UserManagement.User, 'name'> & {
//   deviceList: Array<any>;
//   time: number;
// };

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  water_pump_device_id: createRequiredFormRule($t('common.pleaseCheckValue')),
  water_pump_valve_opening: createRequiredFormRule($t('common.pleaseCheckValue')),
  water_pump_pressure: createRequiredFormRule($t('common.pleaseCheckValue')),
  irrigation_duration: createRequiredFormRule($t('common.pleaseCheckValue')),
  start_irrigation_datetime: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function openDevicesModalFn() {
  openDevicesModal();
}

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    water_pump_device_id: '',
    water_pump_valve_opening: null,
    water_pump_pressure: null,
    irrigation_duration: null,
    durationH: null,
    durationM: null,
    start_irrigation_datetime: null,
    start_datetime: '',
    tasks: []
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

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  const prams = JSON.parse(JSON.stringify(formModel));
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  prams.start_irrigation_datetime = formatTime(prams.start_irrigation_datetime);
  prams.start_datetime = prams.start_irrigation_datetime;
  if (props.type === 'add') {
    data = await addIrrigationRotation(prams);
  } else if (props.type === 'edit') {
    data = await editIrrigationRotation(prams);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}

const onAddDivece = (device: any) => {
  formModel.tasks.push({
    device_id: device.value,
    deviceName: device.label,
    sort: formModel.tasks.length + 1,
    valve_opening: null,
    irrigation_duration: null,
    pressure: null,
    durationH: null,
    durationM: null
  });
};
const rotationDeviceOption = ref<any>([]);
const loadRotationDeviceList = async () => {
  const { data } = await irrigationRotationDeviceList();
  data.list.forEach(i => {
    i.label = i.name;
    i.value = i.id;
  });
  rotationDeviceOption.value = data.list;
};
const formatTime = (time: string | null) => {
  if (time) {
    return new Date(time + 8 * 60 * 60 * 1000).toISOString().toString();
  }
  return '';
};

const delteTask = (index: number) => {
  formModel.tasks.splice(index, 1);
};
// 详情
const loadDetail = async () => {
  const { data } = await irrigationRotationDetail(props.editData?.id);
  formModel.id = data.plan.id;
  formModel.name = data.plan.name;
  formModel.water_pump_device_id = data.plan.water_pump_device_id;
  formModel.water_pump_valve_opening = data.plan.water_pump_valve_opening;
  formModel.water_pump_pressure = data.plan.water_pump_pressure;
  formModel.irrigation_duration = null;
  formModel.durationH = Number((data.plan.irrigation_duration / 60).toFixed(0)) || null;
  formModel.durationM = data.plan.irrigation_duration % 60 || null;
  formModel.start_irrigation_datetime = dayjs(data.plan.start_irrigation_datetime).valueOf();
  formModel.start_datetime = data.plan.start_datetime;
  data.task.forEach(i => {
    formModel.tasks.push({
      device_id: i.device_id,
      deviceName: i.spaceAndDistrictName,
      sort: i.sort,
      valve_opening: i.valve_opening,
      irrigation_duration: null,
      pressure: i.pressure || 0,
      durationH: Number((i.irrigation_duration / 60).toFixed(0)) || 0,
      durationM: i.irrigation_duration % 60 || 0
    });
  });
};

onMounted(() => {
  loadRotationDeviceList();
  if (props.type === 'edit') {
    loadDetail();
  }
});
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
watch(formModel.tasks, () => {
  formModel.tasks.forEach(i => {
    if (Boolean(i.durationH) && Boolean(i.durationM)) {
      i.irrigation_duration = Number(i.durationM) + Number(i.durationH) * 60;
    } else {
      i.irrigation_duration = null;
    }
  });
});
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
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
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-1300px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <section class="h-70vh of-auto">
        <NGrid :cols="24" :x-gap="18">
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.planName')" path="name">
            <NInput v-model:value="formModel.name" class="important-w-200px" />
          </NFormItemGridItem>
          <NFormItemGridItem
            :span="24"
            :label="$t('page.irrigation.rotation.waterPumpEquipment')"
            path="water_pump_device_id"
          >
            <NSelect
              v-model:value="formModel.water_pump_device_id"
              class="important-w-200px"
              clearable
              :options="rotationDeviceOption"
            />
          </NFormItemGridItem>
          <NFormItemGridItem
            :span="24"
            :label="$t('page.irrigation.rotation.waterPumpDoorOpening')"
            path="water_pump_valve_opening"
          >
            <NInputNumber v-model:value="formModel.water_pump_valve_opening" class="important-w-200px" />
          </NFormItemGridItem>
          <NFormItemGridItem
            :span="24"
            :label="$t('page.irrigation.rotation.waterPumpPressure')"
            path="water_pump_pressure"
          >
            <NInputNumber v-model:value="formModel.water_pump_pressure" class="important-w-200px" />
          </NFormItemGridItem>
          <NFormItemGridItem
            :span="24"
            :label="$t('page.irrigation.rotation.rotationDuration')"
            path="irrigation_duration"
          >
            <NInputNumber v-model:value="formModel.durationH" class="important-w-100px" />
            <label class="ml-10px mr-20px text-nowrap">{{ $t('page.irrigation.hour') }}</label>
            <NInputNumber v-model:value="formModel.durationM" class="important-w-100px" />
            <label class="ml-10px text-nowrap">{{ $t('page.irrigation.minute') }}</label>
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.irrigation.group.startTime')" path="start_irrigation_datetime">
            <NDatePicker v-model:value="formModel.start_irrigation_datetime" type="datetime" clearable />
          </NFormItemGridItem>
        </NGrid>
        <div class="flex flex-justify-right">
          <NButton class="w-120px" @click="openDevicesModalFn">
            {{ $t('page.irrigation.rotation.addRotationDevice') }}
          </NButton>
        </div>
        <NDivider></NDivider>
        <NFlex v-for="(item, index) in formModel.tasks" :key="index" justify="space-between" class="mb-20px">
          <NFlex class="w-140px">
            <div>{{ item.deviceName }}</div>
            <div>
              <span>{{ $t('generate.order-number') }}</span>
              {{ item.sort }}
            </div>
          </NFlex>
          <n-input-group class="w-200px">
            <n-input-group-label>{{ $t('page.irrigation.rotation.valveStatus') }}</n-input-group-label>
            <NSelect v-model:value="item.valve_opening" class="w-200px" clearable :options="valveOpenOptions" />
          </n-input-group>
          <n-input-group class="w-450px">
            <n-input-group-label>{{ $t('page.irrigation.rotation.rotationDuration') }}</n-input-group-label>
            <n-input-number v-model:value="item.durationH" />
            <n-input-group-label>{{ $t('page.irrigation.hour') }}</n-input-group-label>
            <n-input-number v-model:value="item.durationM" />
            <n-input-group-label>{{ $t('page.irrigation.minute') }}</n-input-group-label>
          </n-input-group>
          <n-input-group class="w-250px">
            <n-input-group-label>{{ $t('page.irrigation.rotation.pressure') }}</n-input-group-label>
            <n-input-number v-model:value="item.pressure" />
            <n-input-group-label>Mpa</n-input-group-label>
          </n-input-group>
          <NButton class="w-72px" @click="delteTask(index)">{{ $t('common.delete') }}</NButton>
        </NFlex>
      </section>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
    <DevicesModal v-if="devicesVisible" v-model:visible="devicesVisible" @success="onAddDivece" />
  </NModal>
</template>

<style scoped></style>
