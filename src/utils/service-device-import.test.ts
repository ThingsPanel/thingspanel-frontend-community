import assert from 'node:assert/strict'
import test from 'node:test'
import { buildServiceDeviceImportItem, serializeServiceDeviceJSONField } from './service-device-import'

test('builds a service device import without requiring a device template', () => {
  const item = buildServiceDeviceImportItem('svc-device-1', {
    device_number: 'svc-device-1',
    device_name: 'HA lamp',
    device_config_id: '',
    protocol_config: '{"device_number":"switch.lamp","entity_id":"switch.lamp"}'
  })

  assert.equal(item.device_number, 'svc-device-1')
  assert.equal(item.device_config_id, undefined)
  assert.deepEqual(JSON.parse(item.protocol_config!), {
    device_number: 'switch.lamp',
    entity_id: 'switch.lamp'
  })

  const nilTemplateItem = buildServiceDeviceImportItem('svc-device-1b', {
    device_name: 'HA lamp without template',
    device_config_id: null
  })
  assert.equal(nilTemplateItem.device_config_id, undefined)
})

test('serializes protocol config and additional info from text or objects without losing mappings', () => {
  const item = buildServiceDeviceImportItem('svc-device-2', {
    device_number: 'svc-device-2',
    device_name: 'Bedroom light',
    device_config_id: 'config-1',
    protocol_config: { device_number: 'light.bedroom', entity_id: 'light.bedroom' },
    additional_info: '{"source_entity":"light.bedroom"}'
  })

  assert.deepEqual(JSON.parse(item.protocol_config!), {
    device_number: 'light.bedroom',
    entity_id: 'light.bedroom'
  })
  assert.deepEqual(JSON.parse(item.additional_info!), { source_entity: 'light.bedroom' })
  assert.equal(item.device_config_id, 'config-1')
})

test('omits absent JSON fields but reports invalid JSON instead of dropping communication config', () => {
  assert.equal(serializeServiceDeviceJSONField(undefined, '通信配置'), undefined)
  assert.equal(serializeServiceDeviceJSONField('', '通信配置'), undefined)
  assert.throws(
    () => buildServiceDeviceImportItem('svc-device-3', { device_name: 'Invalid config', protocol_config: '{invalid' }),
    /通信配置不是有效的 JSON，未提交设备/
  )
})

test('rejects a paginated selection without its device draft instead of guessing its import mapping', () => {
  assert.throws(
    () => buildServiceDeviceImportItem('svc-device-4'),
    /无法读取设备 svc-device-4 的导入信息，请刷新列表后重新选择设备/
  )
})
