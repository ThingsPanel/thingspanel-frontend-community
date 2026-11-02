import type { DeviceGroup } from './device-group-native-transport'

export const ROOT_DEVICE_GROUP_SELECTION = '__device_group_root__'

export interface DeviceGroupEditorDraft {
  name: string
  parentId: string
  description: string
}

export interface DeviceGroupEditorVersion {
  group: DeviceGroup
  etag: string
}

export interface DeviceGroupEditorState {
  current: DeviceGroupEditorVersion
  draft: DeviceGroupEditorDraft
  conflict: boolean
}

export function initialParentSelection(parentId?: string | null): string {
  return parentId && parentId !== '0' ? parentId : ROOT_DEVICE_GROUP_SELECTION
}

export function canManageDeviceGroups(roles?: string[]): boolean {
  return roles?.includes('TENANT_ADMIN') ?? false
}

export function createDeviceGroupEditorState(current: DeviceGroupEditorVersion): DeviceGroupEditorState {
  return {
    current,
    conflict: false,
    draft: {
      name: current.group.name,
      parentId: current.group.parentId ?? ROOT_DEVICE_GROUP_SELECTION,
      description: current.group.description ?? ''
    }
  }
}

export function markDeviceGroupEditorConflict(
  state: DeviceGroupEditorState,
  draft: DeviceGroupEditorDraft
): DeviceGroupEditorState {
  return { ...state, draft: { ...draft }, conflict: true }
}

export function canSubmitDeviceGroupEditor(state: DeviceGroupEditorState | null): boolean {
  return state !== null && !state.conflict
}

/** Call only after the user confirms the explicit reload action. */
export function acceptDeviceGroupEditorReload(current: DeviceGroupEditorVersion): DeviceGroupEditorState {
  return createDeviceGroupEditorState(current)
}

export function advanceDeviceGroupEditorVersion(
  state: DeviceGroupEditorState,
  current: DeviceGroupEditorVersion
): DeviceGroupEditorState {
  return { ...state, current, conflict: false }
}
