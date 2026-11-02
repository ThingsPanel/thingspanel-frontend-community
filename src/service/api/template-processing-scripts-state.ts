/**
 * Pure state rules for the template `processingScripts` member.
 *
 * The native configuration accepts at most 100 scripts, exactly one enabled
 * script per phase, a fixed `lua` / `encodeInp` execution contract, and content
 * up to 256 KiB. These helpers mirror those rules so a rejected save is not the
 * first feedback the operator gets, and they keep every list edit immutable so
 * a frozen save receipt cannot be mutated by a later click.
 */

import { replaceConfigurationMemberAndExtract } from './template-configuration-raw'

export type ProcessingPhase =
  | 'telemetry_up'
  | 'telemetry_down'
  | 'attribute_up'
  | 'attribute_down'
  | 'command_down'
  | 'event_up'

export interface ProcessingScript {
  id: string
  name: string
  description: string | null
  phase: ProcessingPhase
  language: 'lua'
  entrypoint: 'encodeInp'
  content: string
  enabled: boolean
  lastSampleInput: string | null
}

export interface ProcessingPhaseOption {
  value: ProcessingPhase
  label: string
  /** Legacy 数据处理 tab grouped the same six phases under the letters A–F. */
  legacyCode: string
}

export const PROCESSING_PHASES: ProcessingPhaseOption[] = [
  { value: 'telemetry_up', label: '遥测上报预处理', legacyCode: 'A' },
  { value: 'telemetry_down', label: '遥测下发预处理', legacyCode: 'B' },
  { value: 'attribute_up', label: '属性上报预处理', legacyCode: 'C' },
  { value: 'attribute_down', label: '属性下发预处理', legacyCode: 'D' },
  { value: 'command_down', label: '命令下发预处理', legacyCode: 'E' },
  { value: 'event_up', label: '事件上报预处理', legacyCode: 'F' }
]

export const PROCESSING_LANGUAGE = 'lua' as const
export const PROCESSING_ENTRYPOINT = 'encodeInp' as const

const MAX_SCRIPTS = 100
const MAX_NAME = 128
const MAX_DESCRIPTION = 2000
const MAX_CONTENT = 262144

export function processingPhaseLabel(phase: ProcessingPhase): string {
  return PROCESSING_PHASES.find(option => option.value === phase)?.label ?? phase
}

export function makeProcessingScript(id: string, phase: ProcessingPhase = 'telemetry_up'): ProcessingScript {
  return {
    id,
    name: '',
    description: null,
    phase,
    language: PROCESSING_LANGUAGE,
    entrypoint: PROCESSING_ENTRYPOINT,
    content: '',
    enabled: false,
    lastSampleInput: null
  }
}

export function cloneProcessingScripts(scripts: ProcessingScript[]): ProcessingScript[] {
  return scripts.map(script => ({ ...script }))
}

export function upsertProcessingScript(scripts: ProcessingScript[], next: ProcessingScript): ProcessingScript[] {
  const index = scripts.findIndex(script => script.id === next.id)
  if (index === -1) return [...cloneProcessingScripts(scripts), { ...next }]
  const copy = cloneProcessingScripts(scripts)
  copy[index] = { ...next }
  return copy
}

export function removeProcessingScript(scripts: ProcessingScript[], id: string): ProcessingScript[] {
  return scripts.filter(script => script.id !== id).map(script => ({ ...script }))
}

export function setProcessingScriptEnabled(
  scripts: ProcessingScript[],
  id: string,
  enabled: boolean
): ProcessingScript[] {
  return scripts.map(script => (script.id === id ? { ...script, enabled } : { ...script }))
}

export interface ProcessingScriptValidationOptions {
  /** Scripts already stored for the template, used for the per-phase enabled rule. */
  existing?: ProcessingScript[]
}

/** Mirrors the native configuration rules for one script. */
export function validateProcessingScript(
  script: ProcessingScript,
  options: ProcessingScriptValidationOptions = {}
): string | undefined {
  const name = script.name.trim()
  if (!name) return '请输入脚本名称。'
  if (name.length > MAX_NAME) return `脚本名称不能超过 ${MAX_NAME} 个字符。`
  if (script.description !== null && script.description.length > MAX_DESCRIPTION)
    return `描述不能超过 ${MAX_DESCRIPTION} 个字符。`
  if (!PROCESSING_PHASES.some(option => option.value === script.phase)) return '处理阶段无效。'
  if (script.language !== PROCESSING_LANGUAGE) return '脚本语言必须是 lua。'
  if (script.entrypoint !== PROCESSING_ENTRYPOINT) return '入口函数必须是 encodeInp。'
  if (script.content.length < 1) return '请输入脚本内容。'
  if (script.content.length > MAX_CONTENT) return '脚本内容不能超过 262144 个字符。'
  if (script.lastSampleInput !== null && script.lastSampleInput.length > MAX_CONTENT)
    return '示例输入不能超过 262144 个字符。'
  if (script.enabled) {
    const conflict = (options.existing ?? []).some(
      item => item.id !== script.id && item.phase === script.phase && item.enabled
    )
    if (conflict) return '同一处理阶段只能有一条启用的脚本。'
  }
  return undefined
}

/** Serializes only the contract's fields, in a stable order, so retries stay byte-identical. */
export function serializeProcessingScripts(scripts: ProcessingScript[]): string {
  if (scripts.length > MAX_SCRIPTS) throw new Error('Processing scripts cannot exceed 100 items')
  const items = scripts.map(script => ({
    id: script.id,
    name: script.name,
    description: script.description,
    phase: script.phase,
    language: script.language,
    entrypoint: script.entrypoint,
    content: script.content,
    enabled: script.enabled,
    lastSampleInput: script.lastSampleInput
  }))
  return JSON.stringify(items)
}

/**
 * Produces the exact `configuration` text to PATCH: only `processingScripts`
 * changes, every other member keeps the server's original tokens.
 */
export function buildProcessingScriptsConfiguration(rawText: string, scripts: ProcessingScript[]): string {
  return replaceConfigurationMemberAndExtract(rawText, 'processingScripts', serializeProcessingScripts(scripts))
}
