<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { CascaderOption, FormInst, FormItemRule } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import { createRequiredFormRule } from '@/utils/form/rule';
import { getIrrigationDistricts, getIrrigationDiveces, getIrrigationSpaces } from '@/service/api';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

interface QueryFormModel {
  sapceAndDistrict: string | null;
  deviceId: string;
}

const spaceOptions = ref<any>([]);

// 区域选择请求空间
async function handleSpaceLoad(option_f: CascaderOption) {
  const { data } = await getIrrigationDistricts({ limit: 100, space_id: option_f.id });
  data.rows.forEach(i => {
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
});

const formModel = reactive<QueryFormModel>({
  sapceAndDistrict: null,
  deviceId: ''
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success', arg: any): void;
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

const formRef = ref<HTMLElement & FormInst>();
const refNCascader = ref();
const onSave = async () => {
  await formRef.value?.validate();
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const device = deviceOptions.value.find(i => i.value === formModel.deviceId);
  spaceOptions.value.forEach(s => {
    const child = s.children.find(c => c.id === formModel.sapceAndDistrict);
    if (child) {
      device.label = `${s.name}|${child.name}`;
    }
  });
  emit('success', device);
  modalVisible.value = false;
};

const rules: Record<string, FormItemRule | FormItemRule[]> = {
  sapceAndDistrict: createRequiredFormRule($t('common.pleaseCheckValue')),
  deviceId: createRequiredFormRule($t('common.pleaseCheckValue'))
};

const deviceOptions = ref<any>([]);
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
  () => formModel.sapceAndDistrict,
  () => {
    if (formModel.sapceAndDistrict) {
      loadDivices(formModel.sapceAndDistrict);
    }
  }
);
</script>

<template>
  <div class="overflow-auto">
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="$t('page.irrigation.rotation.chooseDevice')"
      class="w-600px"
    >
      <div class="h-full flex-col">
        <NForm ref="formRef" label-placement="left" :label-width="100" :model="formModel" :rules="rules">
          <NFormItem :label="$t('page.irrigation.group.detail.spaceOrArea')" path="sapceAndDistrict">
            <NCascader
              ref="refNCascader"
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
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.time.device')" path="deviceId">
            <NSelect v-model:value="formModel.deviceId" class="w-150px" :options="deviceOptions" />
          </NFormItem>
          <NSpace class="w-full pt-16px" :size="24" justify="end">
            <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
            <NButton class="w-72px" type="primary" @click="onSave">{{ $t('common.confirm') }}</NButton>
          </NSpace>
        </NForm>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
