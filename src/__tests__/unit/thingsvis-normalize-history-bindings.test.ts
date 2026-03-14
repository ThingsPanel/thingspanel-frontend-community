import { describe, expect, it } from 'vitest'
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings'

describe('normalizeThingsVisHistoryBindings', () => {
  it('rewrites chart data bindings to the history array root', () => {
    const config = {
      nodes: [
        {
          type: 'chart-line',
          data: [
            {
              targetProp: 'data',
              expression: '{{ ds.__platform__.data.device_total }}'
            }
          ]
        }
      ]
    }

    normalizeThingsVisHistoryBindings(config)

    expect(config.nodes[0].data[0].expression).toBe('{{ ds.__platform__.data.device_total__history }}')
  })

  it('collapses nested history leaf bindings back to the history array root', () => {
    const config = {
      nodes: [
        {
          schemaRef: { type: 'chart-line' },
          data: [
            {
              targetProp: 'dataset',
              expression: '{{ ds.__platform__.data.device_online__history[].value }}'
            }
          ]
        }
      ]
    }

    normalizeThingsVisHistoryBindings(config)

    expect(config.nodes[0].data[0].expression).toBe('{{ ds.__platform__.data.device_online__history }}')
  })

  it('leaves non-chart bindings untouched', () => {
    const config = {
      nodes: [
        {
          type: 'text-basic',
          data: [
            {
              targetProp: 'value',
              expression: '{{ ds.__platform__.data.device_total }}'
            }
          ]
        }
      ]
    }

    normalizeThingsVisHistoryBindings(config)

    expect(config.nodes[0].data[0].expression).toBe('{{ ds.__platform__.data.device_total }}')
  })
})
