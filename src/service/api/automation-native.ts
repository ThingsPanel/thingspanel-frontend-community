import { localStg } from '@/utils/storage'
import { createAutomationNativeClient } from './automation-native-transport'

/** Same-origin automation owner client. Requests are raw JSON and single-attempt. */
export const automationNative = createAutomationNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export {
  AutomationNativeError,
  createAutomationRequestId,
  createAutomationNativeClient,
  createAutomationNativeRequester,
  mergeAutomationAlarmPages
} from './automation-native-transport'
export type {
  AckAlarmResponse,
  AlarmsResponse,
  AutomationAlarm,
  AutomationAttachRequest,
  AutomationBinding,
  AutomationBindingResponse,
  AutomationIssue,
  AutomationNativeClient,
  AutomationNativeErrorBody,
  AutomationNativeRequester,
  AutomationParam,
  AutomationRule,
  AutomationRulesQuery,
  DeviceAutomationResponse,
  EffectiveAutomationRule,
  RulesResponse,
  TemplateBindingsResponse
} from './automation-native-transport'
