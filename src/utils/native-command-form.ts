export type CommandParameterIssue = {
  field?: string
  label?: string
  reason: 'unavailable' | 'required' | 'type' | 'enum' | 'unknown'
}

// The native v1 contract declares a flat, required parameter list. Preserve
// JSON scalar types: false and 0 are values, not missing input.
export function validateNativeCommandForm(
  options: any[] | undefined,
  identifier: string,
  payload: unknown
): CommandParameterIssue[] {
  const command = Array.isArray(options) ? options.find(option => option.data_identifier === identifier) : undefined
  if (!command) return [{ reason: 'unavailable' }]
  let parameters: any[]
  try {
    parameters = typeof command.params === 'string' ? JSON.parse(command.params) : command.params
    if (!Array.isArray(parameters)) return [{ reason: 'unavailable' }]
  } catch {
    return [{ reason: 'unavailable' }]
  }
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return [{ reason: 'type' }]
  const values = payload as Record<string, unknown>
  const issues: CommandParameterIssue[] = []
  const names = new Set<string>()
  for (const parameter of parameters) {
    const field = parameter.data_identifier
    if (!field || names.has(field)) return [{ reason: 'unavailable' }]
    names.add(field)
    const label = parameter.data_name || field
    const value = values[field]
    if (!Object.prototype.hasOwnProperty.call(values, field) || value === undefined || value === null) {
      issues.push({ field, label, reason: 'required' })
      continue
    }
    switch (String(parameter.param_type).toLowerCase()) {
      case 'boolean':
        if (typeof value !== 'boolean') issues.push({ field, label, reason: 'type' })
        break
      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) issues.push({ field, label, reason: 'type' })
        break
      case 'string':
        if (typeof value !== 'string') issues.push({ field, label, reason: 'type' })
        break
      case 'enum':
        if (
          !Array.isArray(parameter.enum_config) ||
          !parameter.enum_config.some((option: any) => option.value === value)
        ) {
          issues.push({ field, label, reason: 'enum' })
        }
        break
      default:
        issues.push({ field, label, reason: 'unavailable' })
    }
  }
  for (const field of Object.keys(values)) {
    if (!names.has(field)) issues.push({ field, label: field, reason: 'unknown' })
  }
  return issues
}
