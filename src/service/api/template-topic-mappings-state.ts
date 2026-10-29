import {
  clearTemplateConfigurationAttempt,
  configurationErrorStatus,
  createTemplateConfigurationAttempt,
  getTemplateConfigurationAttempt,
  getTemplateConfigurationSessionGeneration,
  isCurrentTemplateConfigurationSession,
  markTemplateConfigurationUnknown,
  shouldRetainConfigurationAttempt,
  syncTemplateConfigurationSession,
  type TemplateConfigurationAttempt
} from './template-configuration-attempt'
import { replaceConfigurationMemberAndExtract } from './template-configuration-raw'

export type TopicDirection = 'up' | 'down'
export type TopicDataKind = 'TELEMETRY' | 'ATTRIBUTE' | 'EVENT' | 'COMMAND'

/** Mirrors the native contract's TopicMapping; ids are configuration-item UUIDs. */
export interface TopicMapping {
  id: string
  name: string
  description: string | null
  direction: TopicDirection
  sourceTopic: string
  targetTopic: string
  dataIdentifier: string | null
  priority: number
  enabled: boolean
  dataKind: TopicDataKind | null
}

/**
 * The shared receipt store keys by configuration member, so this alias keeps
 * the Topic-mapping view of the same frozen request.
 */
export type TopicMappingSaveAttempt = TemplateConfigurationAttempt

export const TOPIC_DATA_KINDS: TopicDataKind[] = ['TELEMETRY', 'ATTRIBUTE', 'EVENT', 'COMMAND']

const MAX_MAPPINGS = 1000

const TOPIC_MEMBER = 'topicMappings' as const

export function syncTemplateTopicSession(loggedIn: boolean, subjectId: string, tenantId: string): boolean {
  return syncTemplateConfigurationSession(loggedIn, subjectId, tenantId)
}

export function getTemplateTopicSessionGeneration(): number {
  return getTemplateConfigurationSessionGeneration()
}

export function isCurrentTemplateTopicSession(generation: number): boolean {
  return isCurrentTemplateConfigurationSession(generation)
}

export function getTemplateTopicAttempt(templateId: string): TopicMappingSaveAttempt | undefined {
  return getTemplateConfigurationAttempt(templateId, TOPIC_MEMBER)
}

export function createTemplateTopicAttempt(
  templateId: string,
  configurationJson: string,
  etag: string,
  key: string,
  generation: number
): TopicMappingSaveAttempt {
  return createTemplateConfigurationAttempt(templateId, TOPIC_MEMBER, configurationJson, etag, key, generation)
}

export function markTemplateTopicUnknown(templateId: string, generation: number): TopicMappingSaveAttempt | undefined {
  return markTemplateConfigurationUnknown(templateId, TOPIC_MEMBER, generation)
}

export function clearTemplateTopicAttempt(templateId: string, generation: number): boolean {
  return clearTemplateConfigurationAttempt(templateId, TOPIC_MEMBER, generation)
}

export function topicMappingErrorStatus(error: unknown): number | undefined {
  return configurationErrorStatus(error)
}

export function shouldRetainTemplateTopicAttempt(status: number | undefined, previouslyUnknown: boolean): boolean {
  return shouldRetainConfigurationAttempt(status, previouslyUnknown)
}

export function makeTopicMapping(id: string): TopicMapping {
  return {
    id,
    name: '',
    description: null,
    direction: 'up',
    sourceTopic: '',
    targetTopic: '',
    dataIdentifier: null,
    priority: 100,
    enabled: true,
    dataKind: null
  }
}

export function cloneTopicMappings(mappings: TopicMapping[]): TopicMapping[] {
  return mappings.map(mapping => ({ ...mapping }))
}

export function upsertTopicMapping(mappings: TopicMapping[], next: TopicMapping): TopicMapping[] {
  const index = mappings.findIndex(mapping => mapping.id === next.id)
  if (index === -1) return [...cloneTopicMappings(mappings), { ...next }]
  const copy = cloneTopicMappings(mappings)
  copy[index] = { ...next }
  return copy
}

export function removeTopicMapping(mappings: TopicMapping[], id: string): TopicMapping[] {
  return mappings.filter(mapping => mapping.id !== id).map(mapping => ({ ...mapping }))
}

export function setTopicMappingEnabled(mappings: TopicMapping[], id: string, enabled: boolean): TopicMapping[] {
  return mappings.map(mapping => (mapping.id === id ? { ...mapping, enabled } : { ...mapping }))
}

/** Same key the backend rejects as a duplicate: direction + source + target. */
function mappingPairKey(mapping: Pick<TopicMapping, 'direction' | 'sourceTopic' | 'targetTopic'>): string {
  return [mapping.direction, mapping.sourceTopic, mapping.targetTopic].join('\u0000')
}

export interface TopicMappingValidationOptions {
  /** A data reference can only resolve against a selected ThingModel version. */
  hasModel: boolean
  /** Mappings already stored for the template, used for duplicate detection. */
  existing?: TopicMapping[]
}

/** Mirrors the native configuration rules so a rejected save is not the first feedback. */
export function validateTopicMapping(
  mapping: TopicMapping,
  options: TopicMappingValidationOptions
): string | undefined {
  const name = mapping.name.trim()
  if (!name) return '请输入映射名称。'
  if (mapping.name.length > 128) return '映射名称不能超过 128 个字符。'
  if (mapping.sourceTopic.trim().length < 1 || mapping.sourceTopic.length > 1024)
    return '源主题不能为空，且不能超过 1024 个字符。'
  if (mapping.targetTopic.trim().length < 1 || mapping.targetTopic.length > 1024)
    return '目标主题不能为空，且不能超过 1024 个字符。'
  if (!Number.isInteger(mapping.priority) || mapping.priority < 0 || mapping.priority > 10000)
    return '优先级必须是 0 到 10000 之间的整数。'
  if (mapping.description !== null && mapping.description.length > 2000) return '描述不能超过 2000 个字符。'
  const hasKind = mapping.dataKind !== null
  const hasIdentifier = mapping.dataIdentifier !== null
  if (hasKind !== hasIdentifier) return '数据类别和数据标识必须同时填写或同时为空。'
  if (hasKind && !TOPIC_DATA_KINDS.includes(mapping.dataKind as TopicDataKind)) return '数据类别无效。'
  if (hasIdentifier && !String(mapping.dataIdentifier).trim()) return '数据标识不能为空。'
  if (hasKind && !options.hasModel) return '当前模板未选择物模型版本，不能绑定数据字段。'
  const duplicate = (options.existing ?? []).some(
    item => item.id !== mapping.id && mappingPairKey(item) === mappingPairKey(mapping)
  )
  if (duplicate) return '已存在相同方向、源主题和目标主题的映射。'
  return undefined
}

/** Serializes only the contract's fields, in a stable order, so retries stay byte-identical. */
export function serializeTopicMappings(mappings: TopicMapping[]): string {
  if (mappings.length > MAX_MAPPINGS) throw new Error('Topic mappings cannot exceed 1000 items')
  const items = mappings.map(mapping => ({
    id: mapping.id,
    name: mapping.name,
    description: mapping.description,
    direction: mapping.direction,
    sourceTopic: mapping.sourceTopic,
    targetTopic: mapping.targetTopic,
    dataIdentifier: mapping.dataIdentifier,
    priority: mapping.priority,
    enabled: mapping.enabled,
    dataKind: mapping.dataKind
  }))
  return JSON.stringify(items)
}

/**
 * Produces the exact `configuration` text to PATCH: only `topicMappings`
 * changes, every other member keeps the server's original tokens.
 */
export function buildTopicMappingsConfiguration(rawText: string, mappings: TopicMapping[]): string {
  return replaceConfigurationMemberAndExtract(rawText, 'topicMappings', serializeTopicMappings(mappings))
}
