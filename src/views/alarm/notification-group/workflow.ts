import type { Channel, GroupView } from '@/service/api/notification-v2.types'

export function isNotificationGroupEditable(state: GroupView['migrationState']) {
  return state === 'native'
}

export function canEnableNotificationGroup(state: GroupView['migrationState']) {
  return state === 'native'
}

export function supportsNotificationMemberTarget(channel: Channel) {
  return channel === 'email' || channel === 'sms' || channel === 'voice'
}

export function isNotificationMemberContactSupported(channel: Channel | undefined, contactField: string) {
  return (
    (channel === 'email' && contactField === 'email') ||
    ((channel === 'sms' || channel === 'voice') && contactField === 'phone')
  )
}
