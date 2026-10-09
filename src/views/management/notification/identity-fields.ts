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
  const changesIdentity =
    identityFields === undefined
      ? Object.keys(values).length > 0
      : Object.keys(values).some(field => identityFields.includes(field))
  if (changesIdentity) throw new Error('identity_change_requires_new_instance')
  return values
}

export function snapshotNotificationMutation<T extends object>(key: string, body: T) {
  return { key, body: JSON.parse(JSON.stringify(body)) as T }
}

interface NotificationMutationSender<TBody, TResult> {
  // eslint-disable-next-line no-unused-vars
  send(request: { body: TBody; key: string }): Promise<TResult>
}

export function sendNotificationMutationSnapshot<TBody, TResult>(
  snapshot: { key: string; body: TBody },
  sender: NotificationMutationSender<TBody, TResult>
) {
  return sender.send({ body: snapshot.body, key: snapshot.key })
}
