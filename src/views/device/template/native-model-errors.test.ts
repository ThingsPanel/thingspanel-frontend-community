import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ThingModelNativeError,
  type ModelField,
  type ModelCommandResult
} from '../../../service/api/thingmodel-native-transport'
import { modelCommandError, modelErrorMessage, validateEditedField } from './native-model-errors'
import { toNativeFieldFromEditor } from './native-field-mapping'

const field = () =>
  toNativeFieldFromEditor('TELEMETRY', {
    data_name: '温度',
    data_identifier: 'temp',
    data_type: 'Number',
    read_write_flag: 'R'
  })

test('server payload is never shown and CAS conflict is actionable', () => {
  const api = new ThingModelNativeError(409, { code: 'aborted', message: 'private raw payload', requestID: 'internal' })
  assert.match(modelErrorMessage(api), /重新读取/)
  assert.doesNotMatch(modelErrorMessage(api), /private|raw|payload/)
  assert.equal(modelErrorMessage(new Error('secret payload')), '操作未完成，请检查输入后重试。')
  const command = modelCommandError({ status: 'CONFLICT', errorMessage: 'private' } as ModelCommandResult, '保存失败')
  assert.match(modelErrorMessage(command), /重新读取/)
})
test('field names and same-kind duplicate identifiers are rejected locally', () => {
  const empty = field()
  empty.nameI18n.default = '  '
  assert.throws(() => validateEditedField(empty, []), /名称/)
  assert.throws(() => validateEditedField(field(), [field()]), /标识符/)
  const attribute = { ...field(), kind: 'ATTRIBUTE' } as ModelField
  assert.doesNotThrow(() => validateEditedField(field(), [attribute]))
})
test('enum duplicates and malformed scalar values produce safe Chinese feedback', () => {
  const model = field()
  if ('valueType' in model)
    model.valueType = {
      kind: 'ENUM',
      baseKind: 'NUMBER',
      enumValues: [
        { code: 1, label: { default: '一' } },
        { code: 1, label: { default: '重复' } }
      ]
    }
  assert.throws(() => validateEditedField(model, []), /枚举值重复/)
  const error = new Error('Cannot map ThingModel field: additional_info[0].value does not match secret')
  assert.match(modelErrorMessage(error), /枚举配置无效/)
  assert.doesNotMatch(modelErrorMessage(error), /secret/)
})
