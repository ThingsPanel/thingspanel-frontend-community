export function isNotificationConfigFieldReadOnly(
  fieldName: string,
  identityFields: string[] | undefined,
  editingExistingInstance: boolean
) {
  return editingExistingInstance && (identityFields === undefined || identityFields.includes(fieldName))
}

export function editableNotificationSecretFields(
  secretFields: string[],
  identityFields: string[] | undefined,
  editingExistingInstance: boolean
) {
  if (!editingExistingInstance) return secretFields
  if (identityFields === undefined) return []
  return secretFields.filter(field => !identityFields.includes(field))
}

export function omitReadOnlyNotificationIdentityFields<T extends Record<string, unknown>>(
  values: T,
  identityFields: string[] | undefined,
  editingExistingInstance: boolean
): T {
  if (!editingExistingInstance) return values
  if (identityFields === undefined) return {} as T
  return Object.fromEntries(Object.entries(values).filter(([field]) => !identityFields.includes(field))) as T
}
