import type { ConnectionInfo } from '@/service/api/device-runtime-native-transport'
export function connectionTopicRows(info: ConnectionInfo | null) {
  const topics = info?.mqttTopics
  if (!topics?.available) return []
  return topics.items.filter(item => item.topic.trim() && ['publish', 'subscribe'].includes(item.direction))
}
export function connectionTopicReason(info: ConnectionInfo | null) {
  const reason = info?.mqttTopics?.reason
  return `custom.connectionTopics.${['not_ready', 'unsupported_access', 'custom_mapping'].includes(reason ?? '') ? reason : 'owner_unavailable'}`
}
