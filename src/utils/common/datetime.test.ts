import assert from 'node:assert/strict';
import { formatDateTime } from './datetime';

assert.equal(formatDateTime('2026-09-01T14:43:15.254577Z'), '2026-09-01 22:43:15');
assert.equal(formatDateTime(null), null);

console.log('PASS: Asia/Shanghai device time formatting');
