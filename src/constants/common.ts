import { transformRecordToOption } from '@/utils/common4';
import { createServiceConfig } from '~/env.config';

export const yesOrNoRecord: Record<CommonType.YesOrNo, App.I18n.I18nKey> = {
  Y: 'common.yesOrNo.yes',
  N: 'common.yesOrNo.no'
};

export const yesOrNoOptions = transformRecordToOption(yesOrNoRecord);

export const IS_DEV = import.meta.env.MODE === 'development';
export const STATIC_BASE_URL = IS_DEV
  ? createServiceConfig(import.meta.env).otherBaseURL.demo.replace('/api/v1', '')
  : '';

export const KANBANCOLNUM = 24;

export const KANBANROWHEIGHT = 30;
