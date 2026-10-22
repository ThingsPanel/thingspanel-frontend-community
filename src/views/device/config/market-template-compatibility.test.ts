import assert from 'node:assert/strict'
import test from 'node:test'
import { marketTemplateCompatibility } from './market-template-compatibility'

test('checks the selected version and keeps legacy browsing separate from native installation', () => {
  const detail = {
    versions: [
      { version: '2.0.0', contract: 'native-thing-model-v1', installable: true },
      { version: '1.0.0', contract: 'legacy-device-template', installable: false }
    ]
  }
  assert.equal(marketTemplateCompatibility(detail, '2.0.0'), 'native')
  assert.equal(marketTemplateCompatibility(detail, '1.0.0'), 'legacy')
  assert.equal(marketTemplateCompatibility(detail, 'missing'), 'unavailable')
})

test('does not guess support for malformed data or an older market service', () => {
  assert.equal(marketTemplateCompatibility(null, '1.0.0'), 'unavailable')
  assert.equal(marketTemplateCompatibility({ versions: [{ version: '1.0.0' }] }, '1.0.0'), 'unavailable')
  assert.equal(
    marketTemplateCompatibility(
      { versions: [{ version: '1.0.0', contract: 'native-thing-model-v1', installable: false }] },
      '1.0.0'
    ),
    'unavailable'
  )
})
