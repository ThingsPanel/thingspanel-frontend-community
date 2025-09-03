/**
 * 交互系统兼容性测试
 * 验证新旧配置格式之间的转换和兼容性
 */

import { InteractionAdapter } from './interaction-adapter'
import type { JumpConfig, ModifyConfig } from './interaction-types'

/**
 * 兼容性测试套件
 */
export class InteractionCompatibilityTest {
  /**
   * 测试旧格式跳转配置转换
   */
  static testLegacyJumpConversion() {

    // 测试外部链接
    const legacyExternalJump = {
      action: 'navigateToUrl' as const,
      value: 'https://example.com',
      target: '_blank'
    }

    const convertedExternal = InteractionAdapter.convertLegacyJumpToNew(legacyExternalJump)

    // 验证转换结果
    const expectedExternal = {
      action: 'jump',
      jumpConfig: {
        jumpType: 'external',
        url: 'https://example.com',
        target: '_blank'
      },
      value: 'https://example.com',
      target: '_blank'
    }

    // 测试内部路径
    const legacyInternalJump = {
      action: 'navigateToUrl' as const,
      value: '/dashboard/overview',
      target: '_self'
    }

    const convertedInternal = InteractionAdapter.convertLegacyJumpToNew(legacyInternalJump)

    return {
      externalSuccess: JSON.stringify(convertedExternal) === JSON.stringify(expectedExternal),
      internalSuccess:
        convertedInternal.jumpConfig.jumpType === 'internal' &&
        convertedInternal.jumpConfig.internalPath === '/dashboard/overview'
    }
  }

  /**
   * 测试旧格式修改配置转换
   */
  static testLegacyModifyConversion() {

    const legacyModify = {
      action: 'updateComponentData' as const,
      targetComponentId: 'test-component-123',
      targetProperty: 'backgroundColor',
      updateValue: '#ff0000'
    }

    const converted = InteractionAdapter.convertLegacyModifyToNew(legacyModify)

    const expected = {
      action: 'modify',
      modifyConfig: {
        targetComponentId: 'test-component-123',
        targetProperty: 'backgroundColor',
        updateValue: '#ff0000',
        updateMode: 'replace'
      },
      targetComponentId: 'test-component-123',
      targetProperty: 'backgroundColor',
      updateValue: '#ff0000'
    }

    return {
      success: JSON.stringify(converted) === JSON.stringify(expected)
    }
  }

  /**
   * 测试新格式到旧格式的反向转换
   */
  static testNewToLegacyConversion() {

    // 测试跳转配置反向转换
    const newJump = {
      action: 'jump' as const,
      jumpConfig: {
        jumpType: 'external' as const,
        url: 'https://example.com',
        target: '_blank' as const
      }
    }

    const legacyJump = InteractionAdapter.convertNewJumpToLegacy(newJump)

    // 测试修改配置反向转换
    const newModify = {
      action: 'modify' as const,
      modifyConfig: {
        targetComponentId: 'test-component-456',
        targetProperty: 'title',
        updateValue: '新标题',
        updateMode: 'replace' as const
      }
    }

    const legacyModify = InteractionAdapter.convertNewModifyToLegacy(newModify)

    return {
      jumpSuccess: legacyJump.action === 'navigateToUrl' && legacyJump.value === 'https://example.com',
      modifySuccess:
        legacyModify.action === 'updateComponentData' && legacyModify.targetComponentId === 'test-component-456'
    }
  }

  /**
   * 测试格式检测功能
   */
  static testFormatDetection() {

    const legacyResponse = { action: 'navigateToUrl', value: '/test' }
    const newResponse = { action: 'jump', jumpConfig: { jumpType: 'internal', internalPath: '/test' } }

    const legacyDetected = InteractionAdapter.detectResponseFormat(legacyResponse as any)
    const newDetected = InteractionAdapter.detectResponseFormat(newResponse as any)

    return {
      legacyDetected: legacyDetected === 'legacy',
      newDetected: newDetected === 'new'
    }
  }

  /**
   * 测试批量交互配置标准化
   */
  static testBatchNormalization() {

    const mixedInteraction = {
      event: 'click',
      enabled: true,
      responses: [
        {
          action: 'navigateToUrl',
          value: 'https://example.com',
          target: '_blank'
        },
        {
          action: 'updateComponentData',
          targetComponentId: 'test-123',
          targetProperty: 'title',
          updateValue: '测试标题'
        }
      ]
    }

    const normalizedToNew = InteractionAdapter.normalizeInteractionResponses(mixedInteraction, 'new')
    const normalizedToLegacy = InteractionAdapter.normalizeInteractionResponses(mixedInteraction, 'legacy')
    return {
      newFormatValid: normalizedToNew.responses.every((r: any) => r.action === 'jump' || r.action === 'modify'),
      legacyFormatValid: normalizedToLegacy.responses.every(
        (r: any) => r.action === 'navigateToUrl' || r.action === 'updateComponentData'
      )
    }
  }

  /**
   * 运行完整的兼容性测试套件
   */
  static runFullCompatibilityTest() {
    const results = {
      legacyJumpConversion: this.testLegacyJumpConversion(),
      legacyModifyConversion: this.testLegacyModifyConversion(),
      newToLegacyConversion: this.testNewToLegacyConversion(),
      formatDetection: this.testFormatDetection(),
      batchNormalization: this.testBatchNormalization()
    }

    // 计算总体成功率
    const allTests = Object.values(results).flatMap(result => Object.values(result))
    const successCount = allTests.filter(Boolean).length
    const totalCount = allTests.length
    const successRate = (successCount / totalCount) * 100
    return {
      success: successRate === 100,
      successRate,
      details: results
    }
  }
}

/**
 * 导出测试函数供外部调用
 */
export function runInteractionCompatibilityTest() {
  return InteractionCompatibilityTest.runFullCompatibilityTest()
}

export default InteractionCompatibilityTest
