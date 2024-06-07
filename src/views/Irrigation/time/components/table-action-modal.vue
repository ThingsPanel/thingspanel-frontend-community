<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { CascaderOption, FormInst, FormItemRule } from 'naive-ui';
// import { genderOptions } from '@/constants'
import { createRequiredFormRule } from '@/utils/form/rule';
import {
  addTimeIrrigation,
  editTimeIrrigation,
  getIrrigationDistricts,
  getIrrigationDiveces,
  getIrrigationSpaces
} from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: UserManagement.User | null;
}

// const modalType = ref<ModalType>('add');
export type ModalType = NonNullable<Props['type']>;
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('page.irrigation.addIrrigationPlan'),
    edit: $t('common.edit')
  };
  return titles[props.type];
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

const spaceOptions = ref<any>([]);

const deviceOptions = ref<any>([]);

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

const formRef = ref<HTMLElement & FormInst>();

const formModel = reactive<Api.Irrigation.AddTimeIrrigation>(createDefaultFormModel());

function createDefaultFormModel(): Api.Irrigation.AddTimeIrrigation {
  return {
    name: '',
    space_id: '',
    district_id: '',
    device_id: null,
    irrigation_time: null,
    schedule: '',
    control_type: 'A',
    irrigation_duration: null,
    valve_opening: 100,
    remark: '',
    sapceAndDistrict: null,
    scheduleList: [],
    durationH: '',
    durationM: ''
  };
}

const rules: Record<keyof Api.Irrigation.AddTimeIrrigation, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  sapceAndDistrict: createRequiredFormRule($t('common.pleaseCheckValue')),
  device_id: createRequiredFormRule($t('common.pleaseCheckValue')),
  irrigation_time: createRequiredFormRule($t('common.pleaseCheckValue')),
  scheduleList: createRequiredFormRule($t('common.pleaseCheckValue')),
  control_type: createRequiredFormRule($t('common.pleaseCheckValue')),
  irrigation_duration: createRequiredFormRule($t('common.pleaseCheckValue')),
  valve_opening: createRequiredFormRule($t('common.pleaseCheckValue'))
};

async function handleUpdateFormModel(model: Partial<Api.Irrigation.AddTimeIrrigation>) {
  formModel.name = model.name || '';
  // 空间区域
  formModel.sapceAndDistrict = `${model.space_id},${model.district_id}`;
  const districts: any = await handleSpaceLoad({ id: model.space_id } as CascaderOption);
  const space = spaceOptions.value.find(i => i.id === model.space_id);
  space.children = districts;
  // 设备
  formModel.device_id = model.device_id || null;
  formModel.irrigation_time = model.irrigation_time || null;
  // 重复时间
  formModel.scheduleList = model.schedule?.split(',') || [];
  // 灌溉时长
  model.irrigation_duration = 100;
  formModel.durationH = `${(model.irrigation_duration / 60).toFixed(0)}` || '';
  formModel.durationM = `${model.irrigation_duration % 60}` || '';
  formModel.valve_opening = model.valve_opening || 100;
  formModel.id = model.id;
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      // const defaultFormModel = createDefaultFormModel();
      // handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

// 提交
async function handleSubmit() {
  console.error(formModel);
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addTimeIrrigation(formModel);
  } else if (props.type === 'edit') {
    data = await editTimeIrrigation(formModel);
  }
  if (!data.error) {
    emit('success');
  }
  closeModal();
}

// 区域选择请求空间
async function handleSpaceLoad(option_f: CascaderOption) {
  const { data } = await getIrrigationDistricts({ limit: 100, space_id: option_f.id });
  data.rows.forEach(i => {
    i.id = `${option_f.id},${i.id}`;
    i.depth = 2;
    i.isLeaf = true;
  });
  // eslint-disable-next-line require-atomic-updates
  option_f.children = data.rows;
  return data.rows;
}

onMounted(async () => {
  const { data } = await getIrrigationSpaces();
  data.rows.forEach(i => {
    i.depth = 1;
    i.isLeaf = false;
  });
  spaceOptions.value = data.rows;
  handleUpdateFormModelByModalType();
});

const loadDivices = async (id: string) => {
  const { data } = await getIrrigationDiveces({ id });
  const list: any = [];
  data.list.forEach(i => {
    list.push({
      label: i.name,
      value: i.id
    });
  });
  deviceOptions.value = list;
};

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
  () => formModel.scheduleList,
  () => {
    if (formModel.scheduleList) {
      formModel.schedule = formModel.scheduleList.join(',');
    }
  }
);
watch(
  () => formModel.sapceAndDistrict,
  () => {
    if (formModel.sapceAndDistrict) {
      formModel.space_id = formModel.sapceAndDistrict.split(',')[0];
      formModel.district_id = formModel.sapceAndDistrict.split(',')[1];
      loadDivices(formModel.sapceAndDistrict.split(',')[1]);
    }
  }
);
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-800px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.planName')" path="name">
          <NInput v-model:value="formModel.name" class="important-w-200px" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.areaOrSpace')" path="sapceAndDistrict">
          <NCascader
            v-model:value="formModel.sapceAndDistrict"
            :placeholder="$t('common.select')"
            :options="spaceOptions"
            :show-path="true"
            label-field="name"
            value-field="id"
            check-strategy="child"
            remote
            :on-load="handleSpaceLoad"
            class="important-w-400px"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.device')" path="device_id">
          <NSelect
            v-model:value="formModel.device_id"
            :placeholder="$t('common.select')"
            class="w-200px"
            clearable
            :options="deviceOptions"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.irrigationTime')" path="irrigation_time">
          <n-time-picker
            v-model:formatted-value="formModel.irrigation_time"
            format="HH:mm"
            value-format="HH:mm"
            :placeholder="$t('common.select')"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.repeatTime')" path="scheduleList">
          <n-checkbox-group v-model:value="formModel.scheduleList">
            <n-space item-style="display: flex;">
              <n-checkbox value="1" :label="$t('page.irrigation.time.week.monday')" />
              <n-checkbox value="2" :label="$t('page.irrigation.time.week.tuesday')" />
              <n-checkbox value="3" :label="$t('page.irrigation.time.week.wednesday')" />
              <n-checkbox value="4" :label="$t('page.irrigation.time.week.thursday')" />
              <n-checkbox value="5" :label="$t('page.irrigation.time.week.friday')" />
              <n-checkbox value="6" :label="$t('page.irrigation.time.week.saturday')" />
              <n-checkbox value="7" :label="$t('page.irrigation.time.week.sunday')" />
            </n-space>
          </n-checkbox-group>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.controlType')" path="control_type">
          <n-radio-group v-model:value="formModel.control_type" name="radiogroup">
            <n-space>
              <n-radio value="A">{{ $t('page.irrigation.duration') }}</n-radio>
              <n-radio value="B">{{ $t('page.irrigation.capacity') }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItemGridItem>
        <NFormItemGridItem
          v-if="formModel.control_type === 'A'"
          :span="24"
          :label="$t('page.irrigation.irrigationDuration')"
          path="irrigation_duration"
        >
          <NInput v-model:value="formModel.durationH" class="important-w-100px" />
          <label class="ml-10px mr-20px text-nowrap">{{ $t('page.irrigation.hour') }}</label>
          <NInput v-model:value="formModel.durationM" class="important-w-100px" />
          <label class="ml-10px text-nowrap">{{ $t('page.irrigation.minute') }}</label>
        </NFormItemGridItem>
        <NFormItemGridItem v-else :span="24" :label="$t('page.irrigation.capacity')" path="irrigation_duration">
          <NInputNumber v-model:value="formModel.irrigation_duration" class="important-w-200px" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.irrigation.time.doorOpeing')" path="valve_opening">
          <NSelect v-model:value="formModel.valve_opening" class="w-200px" clearable :options="valveOpenOptions" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
