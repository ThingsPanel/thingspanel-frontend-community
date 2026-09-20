import type { DeviceTemplate, ThingModelItem, ValidateResponse } from './types'
import { thingmodelClient } from './client'

export const validateApi = {
  validateThingModelItem: (body: Partial<ThingModelItem>) =>
    thingmodelClient.post<ValidateResponse>('/api/validate/thing-model-item', body),
  validateDeviceTemplate: (body: Partial<DeviceTemplate>) =>
    thingmodelClient.post<ValidateResponse>('/api/validate/device-template', body)
}
