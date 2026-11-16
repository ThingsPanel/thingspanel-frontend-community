import { expect, it } from 'vitest'
import { connectionTopicRows, connectionTopicReason } from '@/views/device/details/modules/connection-topics'
import type { ConnectionInfo } from '@/service/api/device-runtime-native-transport'
const info = (mqttTopics?: ConnectionInfo['mqttTopics']) =>
  ({
    deviceId: 'd',
    protocol: 'mqtt',
    endpoint: null,
    clientIdentifier: null,
    gatewayId: null,
    observedAt: null,
    mqttTopics
  }) as ConnectionInfo
it('displays exact owner topics and never synthesizes missing or unavailable topics', () => {
  const rows = [
    { purpose: 'command_response', direction: 'publish' as const, topic: 'devices/command/response/{message_id}' },
    { purpose: 'command', direction: 'subscribe' as const, topic: 'devices/command/device-number/+' }
  ]
  expect(
    connectionTopicRows(info({ available: true, reason: null, mappingVersion: 'standard-v1', items: rows }))
  ).toEqual(rows)
  expect(connectionTopicRows(info())).toEqual([])
  expect(
    connectionTopicRows(info({ available: false, reason: 'custom_mapping', mappingVersion: null, items: rows }))
  ).toEqual([])
  expect(connectionTopicReason(info())).toBe('custom.connectionTopics.owner_unavailable')
  expect(
    connectionTopicReason(info({ available: false, reason: 'custom_mapping', mappingVersion: null, items: [] }))
  ).toBe('custom.connectionTopics.custom_mapping')
})
