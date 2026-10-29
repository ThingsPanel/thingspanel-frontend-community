import { localStg } from '@/utils/storage'
import { createDeviceGroupNativeClient } from './device-group-native-transport'

/** Encore v2 device groups; credentials continue to come from the existing Community auth store. */
export const deviceGroupNative = createDeviceGroupNativeClient({
  fetch: (input, init) => globalThis.fetch(input, init),
  getToken: () => localStg.get('token') as string | undefined,
  getLanguage: () => localStg.get('lang') as string | undefined
})

export {
  createDeviceGroupNativeClient,
  createDeviceGroupOperationKey,
  DeviceGroupNativeError
} from './device-group-native-transport'
export type {
  CreateDeviceGroup,
  DeviceGroup,
  GroupMember,
  GroupMemberListQuery,
  GroupMemberPage,
  DeviceGroupListQuery,
  DeviceGroupNativeClient,
  DeviceGroupNativeOptions,
  EncoreAuthError,
  GroupTree,
  GroupTreeNode,
  MoveDeviceGroup,
  SetGroupMembers,
  Problem,
  UpdateDeviceGroup
} from './device-group-native-transport'
