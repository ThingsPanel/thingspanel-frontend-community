import * as legacy from './alarm'
import * as native from './alarm-native'
import { routeAutomationCall } from './automation-runtime'

export const warningMessageList = routeAutomationCall(legacy.warningMessageList, native.warningMessageList)
export const addWarningMessage = routeAutomationCall(legacy.addWarningMessage, native.addWarningMessage)
export const editInfo = routeAutomationCall(legacy.editInfo, native.editInfo)
export const delInfo = routeAutomationCall(legacy.delInfo, native.delInfo)
export const alarmHistory = routeAutomationCall(legacy.alarmHistory, native.alarmHistory)
export const infoList = routeAutomationCall(legacy.infoList, native.infoList)
export const processingOperation = routeAutomationCall(legacy.processingOperation, native.processingOperation)
