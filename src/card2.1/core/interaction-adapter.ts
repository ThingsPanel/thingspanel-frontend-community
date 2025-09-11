/**
 * 交互系统类型适配层
 * 负责新旧交互配置格式之间的转换和兼容性处理
 */

import type { JumpConfig, ModifyConfig, InteractionActionType } from '@/card2.1/core/interaction-types'

// 旧格式的动作响应类型
interface LegacyJumpResponse {
  action: 'navigateToUrl'
  value: string
  target?: string
}

interface LegacyModifyResponse {
  action: 'updateComponentData'
  targetComponentId: string
  targetProperty: string
  updateValue: any
}

// 新格式的动作响应类型
interface NewJumpResponse {
  action: 'jump'
  jumpConfig: JumpConfig
  // 保留旧字段用于向后兼容
  value?: string
  target?: string
}

interface NewModifyResponse {
  action: 'modify'
  modifyConfig: ModifyConfig
  // 保留旧字段用于向后兼容
  targetComponentId?: string
  targetProperty?: string
  updateValue?: any
}

export type InteractionResponse = NewJumpResponse | NewModifyResponse | LegacyJumpResponse | LegacyModifyResponse

/**
 * 交互配置适配器
 */
export class InteractionAdapter {
  /**
   * 将旧格式的跳转响应转换为新格式
   */
  static convertLegacyJumpToNew(legacyResponse: LegacyJumpResponse): NewJumpResponse {
    const url = legacyResponse.value || ''
    const jumpConfig: JumpConfig = {
      jumpType: url.startsWith('http') ? 'external' : 'internal',
      target: legacyResponse.target || '_self'
    }

    if (jumpConfig.jumpType === 'external') {
      jumpConfig.url = url
    } else {
      jumpConfig.internalPath = url
    }

    return {
      action: 'jump',
      jumpConfig,
      // 保留旧字段用于兼容性
      value: legacyResponse.value,
      target: legacyResponse.target
    }
  }

  /**
   * 将旧格式的修改响应转换为新格式
   */
  static convertLegacyModifyToNew(legacyResponse: LegacyModifyResponse): NewModifyResponse {
    const modifyConfig: ModifyConfig = {
      targetComponentId: legacyResponse.targetComponentId,
      targetProperty: legacyResponse.targetProperty,
      updateValue: legacyResponse.updateValue,
      updateMode: 'replace'
    }

    return {
      action: 'modify',
      modifyConfig,
      // 保留旧字段用于兼容性
      targetComponentId: legacyResponse.targetComponentId,
      targetProperty: legacyResponse.targetProperty,
      updateValue: legacyResponse.updateValue
    }
  }

  /**
   * 将新格式的跳转响应转换为旧格式（用于向后兼容）
   */
  static convertNewJumpToLegacy(newResponse: NewJumpResponse): LegacyJumpResponse {
    const jumpConfig = newResponse.jumpConfig
    const url = jumpConfig.jumpType === 'external' ? jumpConfig.url : jumpConfig.internalPath

    return {
      action: 'navigateToUrl',
      value: url || '',
      target: jumpConfig.target
    }
  }

  /**
   * 将新格式的修改响应转换为旧格式（用于向后兼容）
   */
  static convertNewModifyToLegacy(newResponse: NewModifyResponse): LegacyModifyResponse {
    const modifyConfig = newResponse.modifyConfig

    return {
      action: 'updateComponentData',
      targetComponentId: modifyConfig.targetComponentId,
      targetProperty: modifyConfig.targetProperty,
      updateValue: modifyConfig.updateValue
    }
  }

  /**
   * 检测响应格式类型
   */
  static detectResponseFormat(response: InteractionResponse): 'new' | 'legacy' {
    if (response.action === 'jump' || response.action === 'modify') {
      return 'new'
    }
    if (response.action === 'navigateToUrl' || response.action === 'updateComponentData') {
      return 'legacy'
    }
    return 'legacy' // 默认为旧格式
  }

  /**
   * 标准化响应格式为新格式
   */
  static normalizeToNewFormat(response: InteractionResponse): NewJumpResponse | NewModifyResponse {
    const format = this.detectResponseFormat(response)

    if (format === 'new') {
      return response as NewJumpResponse | NewModifyResponse
    }

    // 转换旧格式到新格式
    if (response.action === 'navigateToUrl') {
      return this.convertLegacyJumpToNew(response as LegacyJumpResponse)
    }

    if (response.action === 'updateComponentData') {
      return this.convertLegacyModifyToNew(response as LegacyModifyResponse)
    }

    throw new Error(`不支持的响应动作类型: ${response.action}`)
  }

  /**
   * 标准化响应格式为旧格式（用于向后兼容）
   */
  static normalizeToLegacyFormat(response: InteractionResponse): LegacyJumpResponse | LegacyModifyResponse {
    const format = this.detectResponseFormat(response)

    if (format === 'legacy') {
      return response as LegacyJumpResponse | LegacyModifyResponse
    }

    // 转换新格式到旧格式
    if (response.action === 'jump') {
      return this.convertNewJumpToLegacy(response as NewJumpResponse)
    }

    if (response.action === 'modify') {
      return this.convertNewModifyToLegacy(response as NewModifyResponse)
    }

    throw new Error(`不支持的响应动作类型: ${response.action}`)
  }

  /**
   * 获取统一的动作类型
   */
  static getUnifiedActionType(response: InteractionResponse): InteractionActionType {
    if (response.action === 'jump' || response.action === 'navigateToUrl') {
      return 'jump'
    }
    if (response.action === 'modify' || response.action === 'updateComponentData') {
      return 'modify'
    }
    throw new Error(`不支持的响应动作类型: ${response.action}`)
  }

  /**
   * 批量转换交互配置中的所有响应
   */
  static normalizeInteractionResponses(interaction: any, targetFormat: 'new' | 'legacy' = 'new'): any {
    if (!interaction.responses || !Array.isArray(interaction.responses)) {
      return interaction
    }

    const normalizedResponses = interaction.responses.map((response: InteractionResponse) => {
      return targetFormat === 'new' ? this.normalizeToNewFormat(response) : this.normalizeToLegacyFormat(response)
    })

    return {
      ...interaction,
      responses: normalizedResponses
    }
  }
}

export default InteractionAdapter
