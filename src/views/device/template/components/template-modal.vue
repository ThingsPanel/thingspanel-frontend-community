<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { $t } from '@/locales';
import { initTemplateInfoData, templateInfoData } from '../utils';
import AddInfo from './step/add-info.vue';
import ModelDefinition from './step/model-definition.vue';
import WebChartConfig from './step/web-chart-config.vue';
import AppChartConfig from './step/app-chart-config.vue';
import Complete from './step/complete.vue';

export interface Props {
  visible: boolean;
  type: 'add' | 'edit';
  templateId: string;
  getTableData: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'add'
});

const stepCurrent = ref<number>(1);
const deviceTemplateId = ref<string>(props.type === 'add' ? '' : props.templateId);

const componentsList: { id: number; components: any }[] = [
  { id: 1, components: AddInfo },
  { id: 2, components: ModelDefinition },
  { id: 3, components: WebChartConfig },
  { id: 4, components: AppChartConfig },
  { id: 5, components: Complete }
];
const SwitchComponents = computed<any>(() => {
  return componentsList.find(item => item.id === stepCurrent.value)?.components;
});

export type ModalType = NonNullable<Props['type']>;

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    stepCurrent.value = 1;
    if (!props.visible) {
      templateInfoData.value = { ...initTemplateInfoData };
    }
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('device_template.templateInfo'),
    edit: $t('device_template.editTemplateInfo')
  };
  return titles[props.type];
});

watchEffect(() => {
  console.log(props.templateId);
  deviceTemplateId.value = props.templateId;
});

defineOptions({ name: 'TableActionModal' });
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="title"
    class="w-80%"
    @after-leave="
      () => {
        deviceTemplateId = props.templateId;
        props.getTableData();
      }
    "
  >
    <n-steps :current="stepCurrent" status="process">
      <n-step :title="$t('device_template.templateInfo')" :description="$t('device_template.addDeviceInfo')" />
      <n-step
        :title="$t('device_template.modelDefinition')"
        :description="$t('device_template.deviceParameterDescribe')"
      />
      <n-step
        :title="$t('device_template.webChartConfiguration')"
        :description="$t('device_template.bindTheCorrespondingChart')"
      />
      <n-step
        :title="$t('device_template.appChartConfiguration')"
        :description="$t('device_template.editAppDetailsPage')"
      />
      <n-step :title="$t('device_template.release')" :description="$t('device_template.releaseAppStore')" />
    </n-steps>

    <component
      :is="SwitchComponents"
      v-model:stepCurrent="stepCurrent"
      v-model:modalVisible="modalVisible"
      v-model:deviceTemplateId="deviceTemplateId"
    ></component>
  </NModal>
</template>

<style scoped></style>
