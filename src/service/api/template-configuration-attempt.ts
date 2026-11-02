/**
 * Frozen save receipts for the template `configuration` PATCH.
 *
 * The PATCH replaces the whole configuration, so a request that was sent but
 * whose outcome is unknown must be replayed byte-for-byte: same configuration
 * text, same `If-Match`, same `Idempotency-Key`. The receipt therefore lives
 * outside component state, keyed by template and configuration member, and is
 * dropped whenever the authenticated actor changes.
 */

export type TemplateConfigurationMember = 'topicMappings' | 'processingScripts' | 'customFieldDefinitions'

/**
 * A frozen request is scoped to the part of the template it changes: the three
 * configuration members that are replaced wholesale, plus the members that sit
 * next to `configuration` and are patched on their own.
 */
export type TemplatePatchScope = TemplateConfigurationMember | 'administrativeState' | 'imageAssetId' | 'accessPolicy'

export interface TemplateConfigurationAttempt {
  templateId: string
  member: TemplatePatchScope
  /**
   * Exact frozen payload: the `configuration` object text for the three
   * configuration members, or the full PATCH body for the scopes that are
   * patched next to `configuration`.
   */
  configurationJson: string
  etag: string
  key: string
  previouslyUnknown: boolean
  generation: number
}

const attempts = new Map<string, TemplateConfigurationAttempt>()
let sessionIdentity: string | null = null
let sessionGeneration = 0

function attemptKey(templateId: string, member: TemplatePatchScope): string {
  return `${templateId}\u0000${member}`
}

/** Returns true when the actor changed and every frozen receipt was dropped. */
export function syncTemplateConfigurationSession(loggedIn: boolean, subjectId: string, tenantId: string): boolean {
  const nextIdentity = JSON.stringify([loggedIn, subjectId, tenantId])
  if (nextIdentity === sessionIdentity) return false
  sessionIdentity = nextIdentity
  sessionGeneration += 1
  attempts.clear()
  return true
}

export function getTemplateConfigurationSessionGeneration(): number {
  return sessionGeneration
}

export function isCurrentTemplateConfigurationSession(generation: number): boolean {
  return sessionGeneration === generation
}

export function getTemplateConfigurationAttempt(
  templateId: string,
  member: TemplatePatchScope
): TemplateConfigurationAttempt | undefined {
  return attempts.get(attemptKey(templateId, member))
}

/** Returns the receipt already frozen for this member instead of starting a second one. */
export function createTemplateConfigurationAttempt(
  templateId: string,
  member: TemplatePatchScope,
  configurationJson: string,
  etag: string,
  key: string,
  generation: number
): TemplateConfigurationAttempt {
  if (!isCurrentTemplateConfigurationSession(generation)) throw new Error('Template edit session changed')
  const existing = attempts.get(attemptKey(templateId, member))
  if (existing) return existing
  const attempt: TemplateConfigurationAttempt = {
    templateId,
    member,
    configurationJson,
    etag,
    key,
    previouslyUnknown: false,
    generation
  }
  attempts.set(attemptKey(templateId, member), attempt)
  return attempt
}

/** Marks an indeterminate result without touching the frozen payload, ETag, or key. */
export function markTemplateConfigurationUnknown(
  templateId: string,
  member: TemplatePatchScope,
  generation: number
): TemplateConfigurationAttempt | undefined {
  if (!isCurrentTemplateConfigurationSession(generation)) return undefined
  const key = attemptKey(templateId, member)
  const attempt = attempts.get(key)
  if (!attempt || attempt.generation !== generation) return undefined
  const unknownAttempt = { ...attempt, previouslyUnknown: true }
  attempts.set(key, unknownAttempt)
  return unknownAttempt
}

export function clearTemplateConfigurationAttempt(
  templateId: string,
  member: TemplatePatchScope,
  generation: number
): boolean {
  if (!isCurrentTemplateConfigurationSession(generation)) return false
  const key = attemptKey(templateId, member)
  const attempt = attempts.get(key)
  if (attempt?.generation === generation) attempts.delete(key)
  return true
}

/** True when any member of this template still holds an unresolved receipt. */
export function hasTemplateConfigurationAttempt(templateId: string): boolean {
  for (const attempt of attempts.values()) {
    if (attempt.templateId === templateId) return true
  }
  return false
}

export function configurationErrorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' ? status : undefined
}

/** A known rejection can be corrected; any failure after uncertainty keeps the frozen receipt. */
export function shouldRetainConfigurationAttempt(status: number | undefined, previouslyUnknown: boolean): boolean {
  if (previouslyUnknown) return true
  return status !== 409 && status !== 412 && status !== 422 && status !== 400
}
