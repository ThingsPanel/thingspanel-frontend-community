import assert from 'node:assert/strict';
import { createOtaAdditionalInfo } from '../src/views/product/update-package/components/ota-additional-info.mjs';

const info = JSON.parse(createOtaAdditionalInfo('', 2917428));
assert.deepEqual(info, {
  deliveryProtocol: 'ygsoul_http',
  orchestrationRoute: 'device_integration',
  size: 2917428
});

const merged = JSON.parse(createOtaAdditionalInfo('{"channel":"stable","size":1}', 42));
assert.deepEqual(merged, {
  deliveryProtocol: 'ygsoul_http',
  orchestrationRoute: 'device_integration',
  channel: 'stable',
  size: 42
});

assert.equal(createOtaAdditionalInfo('{invalid', 42), null);
