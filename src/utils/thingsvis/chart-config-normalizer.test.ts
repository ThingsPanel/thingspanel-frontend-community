import assert from 'node:assert/strict'
import test from 'node:test'
import { extractPlatformFields, findPlatformField } from './platform-fields'
import {
  canHydrateThingsVisPreview,
  canonicalizeThingsVisConfig,
  ensureInteractiveWriteEvents
} from './chart-config-normalizer'
import { normalizePlatformWriteValue } from './platform-fields'

test('legacy API payload is converted to the ThingsVis canonical node schema', () => {
  const config = canonicalizeThingsVisConfig({
    canvasConfig: { mode: 'grid', width: 1200, height: 800, gridCols: 12, gridRowHeight: 40, gridGap: 8 },
    nodes: [
      {
        id: 'fan-card',
        type: 'interaction/basic-switch',
        x: 2,
        y: 3,
        w: 4,
        h: 2,
        label: '风机',
        data: [{ target: 'value', expression: '{{ ds.__platform_device-1__.data.fan_mode }}' }],
        events: [{ event: 'change', actions: [] }]
      }
    ],
    dataSources: [{ id: '__platform_device-1__', type: 'PLATFORM', config: {} }]
  })

  assert.equal(config.canvas.mode, 'grid')
  assert.deepEqual(config.nodes[0].grid, {
    x: 2,
    y: 3,
    w: 4,
    h: 2,
    static: false,
    isDraggable: true,
    isResizable: true
  })
  assert.deepEqual(config.nodes[0].position, { x: 200, y: 144 })
  assert.deepEqual(config.nodes[0].size, { width: 400, height: 80 })
  assert.equal(config.nodes[0].data[0].targetProp, 'value')
  assert.equal(config.nodes[0].baseStyle.opacity, 1)
  assert.equal(config.nodes[0].events[0].event, 'change')
  assert.deepEqual(config.dataSources[0].config.requestedFields, ['fan_mode'])
})

test('grid layouts get usable outer spacing and keep edge-to-edge as an explicit opt-out', () => {
  const normalized = canonicalizeThingsVisConfig({
    canvas: { mode: 'grid', gridCols: 4 },
    nodes: []
  })

  assert.equal(normalized.canvas.gridGap, 8)
  assert.equal(normalized.canvas.padding, 16)

  const migratedLegacy = canonicalizeThingsVisConfig({
    canvas: { mode: 'grid', gridGap: 5, padding: 0 },
    nodes: []
  })
  assert.equal(migratedLegacy.canvas.padding, 16)

  const edgeToEdge = canonicalizeThingsVisConfig({
    canvas: { mode: 'grid', padding: 0, applyMarginToSides: false },
    nodes: []
  })
  assert.equal(edgeToEdge.canvas.padding, 0)
})

test('platform fields keep stable identifiers and expose labels and enum options', () => {
  const fields = extractPlatformFields({
    telemetry: [
      {
        key: 'runtime-key',
        data_identifier: 'ha_state',
        data_name: '开关',
        data_type: 'string',
        additional_info: JSON.stringify({ value_schema: { type: 'string', enum: ['on', 'off'] } })
      }
    ],
    commands: [
      {
        data_identifier: 'fan_mode',
        data_name: '风速',
        params: JSON.stringify({ command: 'set_fan_mode', fan_mode: { type: 'string', enum: ['low', 'high'] } }),
        read_write_flag: 'RW'
      }
    ]
  })

  assert.deepEqual(fields[0], {
    id: 'ha_state',
    name: '开关',
    type: 'string',
    dataType: 'telemetry',
    unit: undefined,
    description: undefined,
    options: [
      { label: 'on', value: 'on' },
      { label: 'off', value: 'off' }
    ],
    writable: false
  })
  assert.equal(fields[0].type, 'string')
  assert.equal(fields[1].id, 'fan_mode')
  assert.equal(fields[1].name, '风速')
  assert.equal(fields[1].writable, true)
  assert.deepEqual(fields[1].write, {
    target: 'command',
    property: 'fan_mode',
    payloadType: 'string'
  })
  assert.equal(
    findPlatformField([{ id: 'command-db-id', name: 'fan_mode', dataType: 'command' }], 'fan_mode')?.dataType,
    'command'
  )
})

test('generated write binding preserves field id and creates an explicit platform request', () => {
  const config = canonicalizeThingsVisConfig({
    canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
    nodes: [
      {
        id: 'temperature-control',
        type: 'interaction/basic-slider',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        bindings: [{ targetProp: 'value', fieldId: 'target_temp', dataSourceId: '__platform_ac-1__' }]
      }
    ],
    dataSources: [{ id: '__platform_ac-1__', type: 'PLATFORM_FIELD', config: { fieldMappings: {} } }]
  })

  assert.equal(config.nodes[0].data[0].expression, '{{ ds.__platform_ac-1__.data.target_temp }}')
  assert.deepEqual(config.dataSources[0].config.requestedFields, ['target_temp'])
  assert.equal(config.nodes[0].data[0].targetProp, 'value')
})

test('viewer hydration is blocked until both ready and loaded signals arrive', () => {
  assert.equal(canHydrateThingsVisPreview({ ready: false, loaded: false }), false)
  assert.equal(canHydrateThingsVisPreview({ ready: true, loaded: false }), false)
  assert.equal(canHydrateThingsVisPreview({ ready: false, loaded: true }), false)
  assert.equal(canHydrateThingsVisPreview({ ready: true, loaded: true }), true)
})

test('select change creates a platform callWrite command request without coercing payload types', () => {
  const config = ensureInteractiveWriteEvents(
    canonicalizeThingsVisConfig({
      canvas: { mode: 'grid', width: 375, height: 844, gridCols: 4 },
      nodes: [
        {
          id: 'fan-mode',
          type: 'interaction/basic-select',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          data: [{ targetProp: 'value', expression: '{{ ds.__platform_ac-1__.data.fan_mode }}' }]
        }
      ],
      dataSources: [{ id: '__platform_ac-1__', type: 'PLATFORM_FIELD', config: {} }]
    })
  )

  const action = config.nodes[0].events.find((handler: any) => handler.event === 'change').actions[0]
  assert.equal(action.type, 'callWrite')
  assert.equal(action.dataSourceId, '__platform_ac-1__')
  assert.equal(action.payload, '({ "fan_mode": payload })')
  assert.equal(
    normalizePlatformWriteValue(
      {
        id: 'ha_state',
        type: 'string',
        options: [
          { label: 'on', value: 'on' },
          { label: 'off', value: 'off' }
        ]
      },
      true
    ),
    'on'
  )
  assert.equal(normalizePlatformWriteValue({ id: 'target_temp', type: 'number' }, 23.5), 23.5)
})
