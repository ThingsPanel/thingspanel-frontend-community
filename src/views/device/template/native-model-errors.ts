import {
  ThingModelNativeError,
  type ModelCommandResult,
  type ModelField,
  type ValueType
} from '../../../service/api/thingmodel-native-transport'

/** Only locally authored messages may be shown verbatim. Server payloads stay in diagnostics. */
export class ModelEditorError extends Error {}

const messages: Record<string, string> = {
  aborted: '物模型已被其他编辑者更新，请重新读取后检查修改，再保存。',
  CONFLICT: '物模型已被其他编辑者更新，请重新读取后检查修改，再保存。',
  FIELD_IDENTIFIER_DUPLICATE: '同一分类中已有这个标识符，请修改后保存。',
  FIELD_IDENTIFIER_REQUIRED: '请输入字段标识符。',
  PARAMETER_IDENTIFIER_REQUIRED: '请输入每个参数的标识符。',
  PARAMETER_IDENTIFIER_DUPLICATE: '参数标识符重复，请修改后保存。',
  invalid_argument: '字段定义不符合要求，请检查名称、标识符、枚举值和参数后重试。',
  unauthenticated: '登录已失效，请重新登录后重试。',
  permission_denied: '当前账号没有修改此物模型的权限。',
  not_found: '物模型或版本已不存在，请返回列表重新选择。',
  unavailable: '物模型服务暂时不可用，请稍后重试。'
}

export function modelErrorMessage(error: unknown, fallback = '操作未完成，请检查输入后重试。'): string {
  if (error instanceof ModelEditorError) return error.message
  if (error instanceof ThingModelNativeError) {
    return (
      messages[error.apiError?.code ?? ''] ??
      (
        {
          400: messages.invalid_argument,
          401: messages.unauthenticated,
          403: messages.permission_denied,
          404: messages.not_found,
          409: messages.aborted,
          422: messages.invalid_argument,
          502: messages.unavailable,
          503: messages.unavailable
        } as Record<number, string>
      )[error.status] ??
      fallback
    )
  }
  // The mapper retains detailed diagnostics; do not expose its raw input in the UI.
  if (error instanceof Error && error.message.startsWith('Cannot map ThingModel field:')) {
    if (/enum|additional_info/i.test(error.message))
      return '枚举配置无效，请至少添加一个枚举值，并检查值与所选类型是否一致。'
    if (/params\[/.test(error.message)) return '参数配置不完整，请检查参数名称、标识符和数据类型。'
    return '字段配置不完整，请检查名称、标识符和数据类型。'
  }
  return fallback
}

export function modelCommandError(result: ModelCommandResult, fallback: string): ModelEditorError {
  return new ModelEditorError(
    messages[result.status === 'CONFLICT' ? 'CONFLICT' : (result.errorCode ?? '')] ?? fallback
  )
}

export function validateEditedField(field: ModelField, others: ModelField[]): void {
  if (!field.nameI18n.default.trim()) throw new ModelEditorError('请输入字段名称。')
  if (!field.identifier.trim()) throw new ModelEditorError(messages.FIELD_IDENTIFIER_REQUIRED)
  if (others.some(item => item.kind === field.kind && item.identifier === field.identifier)) {
    throw new ModelEditorError(messages.FIELD_IDENTIFIER_DUPLICATE)
  }
  const validateEnum = (valueType: ValueType) => {
    if (valueType.kind !== 'ENUM') return
    const keys = valueType.enumValues.map(item => JSON.stringify(item.code))
    if (new Set(keys).size !== keys.length) throw new ModelEditorError('枚举值重复，请修改后保存。')
  }
  if ('valueType' in field && field.valueType) validateEnum(field.valueType)
  if ('parameters' in field && field.parameters) {
    const keys = new Set<string>()
    for (const parameter of field.parameters.items) {
      if (!parameter.nameI18n.default.trim()) throw new ModelEditorError('请输入每个参数的名称。')
      if (!parameter.identifier.trim()) throw new ModelEditorError(messages.PARAMETER_IDENTIFIER_REQUIRED)
      if (keys.has(parameter.identifier)) throw new ModelEditorError(messages.PARAMETER_IDENTIFIER_DUPLICATE)
      keys.add(parameter.identifier)
      validateEnum(parameter.valueType)
    }
  }
}
