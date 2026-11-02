import type { SetGroupMembers } from './device-group-native-transport'
import { createDeviceGroupOperationKey } from './device-group-native-transport'

export type DeviceGroupMembershipAction = 'add' | 'remove'

export interface DeviceGroupMembershipIntent {
  action: DeviceGroupMembershipAction
  groupId: string
  fingerprint: string
  key: string
  body: SetGroupMembers
}

export interface DeviceGroupMembershipSession {
  groupId: string
  generation: number
}

export function isCurrentDeviceGroupMembershipSession(
  captured: DeviceGroupMembershipSession,
  active: boolean,
  groupId: string,
  generation: number
): boolean {
  return active && captured.groupId === groupId && captured.generation === generation
}

export function createOrReuseDeviceGroupMembershipIntent(
  current: DeviceGroupMembershipIntent | null,
  action: DeviceGroupMembershipAction,
  groupId: string,
  expectedGroupVersion: number,
  deviceIds: string[],
  makeKey: () => string = createDeviceGroupOperationKey
): DeviceGroupMembershipIntent {
  const normalizedIds = [...new Set(deviceIds)].sort()
  if (normalizedIds.length === 0) throw new Error('Select at least one device')
  if (normalizedIds.length > 100) throw new Error('A group membership change can include at most 100 devices')

  const body: SetGroupMembers = { deviceIds: normalizedIds, expectedGroupVersion }
  const fingerprint = JSON.stringify({ action, groupId, body })
  if (current?.fingerprint === fingerprint) return current
  return { action, groupId, fingerprint, key: makeKey(), body }
}
