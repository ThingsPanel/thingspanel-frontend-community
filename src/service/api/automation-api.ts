import * as legacy from './automation'
import * as native from './automation-native'
import { routeAutomationCall } from './automation-runtime'

export {
  configMetricsConditionMenu,
  deviceConfigAll,
  deviceConfigMetricsMenu,
  deviceListAll,
  deviceMetricsConditionMenu,
  deviceMetricsMenu
} from './automation'

export const sceneGet = routeAutomationCall(legacy.sceneGet, native.sceneGet)
export const sceneInfo = routeAutomationCall(legacy.sceneInfo, native.sceneInfo)
export const sceneAdd = routeAutomationCall(legacy.sceneAdd, native.sceneAdd)
export const sceneEdit = routeAutomationCall(legacy.sceneEdit, native.sceneEdit)
export const sceneDel = routeAutomationCall(legacy.sceneDel, native.sceneDel)
export const sceneActive = routeAutomationCall(legacy.sceneActive, native.sceneActive)
export const sceneLog = routeAutomationCall(legacy.sceneLog, native.sceneLog)
export const sceneAutomationsGet = routeAutomationCall(legacy.sceneAutomationsGet, native.sceneAutomationsGet)
export const sceneAutomationsInfo = routeAutomationCall(legacy.sceneAutomationsInfo, native.sceneAutomationsInfo)
export const sceneAutomationsAdd = routeAutomationCall(legacy.sceneAutomationsAdd, native.sceneAutomationsAdd)
export const sceneAutomationsEdit = routeAutomationCall(legacy.sceneAutomationsEdit, native.sceneAutomationsEdit)
export const sceneAutomationsDel = routeAutomationCall(legacy.sceneAutomationsDel, native.sceneAutomationsDel)
export const sceneAutomationsSwitch = routeAutomationCall(legacy.sceneAutomationsSwitch, native.sceneAutomationsSwitch)
export const sceneAutomationsLog = routeAutomationCall(legacy.sceneAutomationsLog, native.sceneAutomationsLog)
