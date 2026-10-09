import type { GroupView } from '@/service/api/notification-v2.types'

export function isNotificationGroupEditable(state: GroupView['migrationState']) {
  return state === 'native'
}

export function canEnableNotificationGroup(state: GroupView['migrationState']) {
  return state === 'native'
}
