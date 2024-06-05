import { ref } from 'vue';
import { createRequiredFormRule } from '@/utils/form/rule';

export const initTemplateInfoData = {
  name: '',
  tags: [],
  description: '',
  author: '',
  version: '',
  path: ''
};

export const templateInfoData = ref({ ...initTemplateInfoData });

export const templateInfoRules = {
  name: createRequiredFormRule('请输入模板名称')
};

// device model
export const deviceModelTabs = [
  { name: 'telemetry', tab: '遥测' },
  { name: 'property', tab: '属性' },
  { name: 'event', tab: '事件' },
  { name: 'command', tab: '命令' }
];

export const initTelemetryModel = {};

export const telemetryModelData = ref({ ...initTelemetryModel });

export const telemetryModelDataTypeOptions = [
  {
    label: 'String',
    value: 'String'
  },
  {
    label: 'Boolean',
    value: 'Boolean'
  },
  {
    label: 'Number',
    value: 'Number'
  }
];

export const getAdditionalInfo = additionalInfoStr => {
  let additionalInfo = [];
  if (typeof additionalInfoStr === 'string') {
    try {
      additionalInfo = JSON.parse(additionalInfoStr);
      if (!Array.isArray(additionalInfo)) {
        additionalInfo = [];
      }
    } catch {
      additionalInfo = [];
    }
  }

  return additionalInfo;
};
