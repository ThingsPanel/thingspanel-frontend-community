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
    console.log('🧪 [兼容性测试] 测试旧格式跳转配置转换')

    // 测试外部链接
    const legacyExternalJump = {
      action: 'navigateToUrl' as const,
      value: 'https://example.com',
      target: '_blank'
    }

    const convertedExternal = InteractionAdapter.convertLegacyJumpToNew(legacyExternalJump)
    console.log('外部链接转换结果:', convertedExternal)

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
    console.log('内部路径转换结果:', convertedInternal)

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
    console.log('🧪 [兼容性测试] 测试旧格式修改配置转换')

    const legacyModify = {
      action: 'updateComponentData' as const,
      targetComponentId: 'test-component-123',
      targetProperty: 'backgroundColor',
      updateValue: '#ff0000'
    }

    const converted = InteractionAdapter.convertLegacyModifyToNew(legacyModify)
    console.log('修改配置转换结果:', converted)

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
    console.log('🧪 [兼容性测试] 测试新格式到旧格式的反向转换')

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
    console.log('跳转配置反向转换结果:', legacyJump)

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
    console.log('修改配置反向转换结果:', legacyModify)

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
    console.log('🧪 [兼容性测试] 测试格式检测功能')

    const legacyResponse = { action: 'navigateToUrl', value: '/test' }
    const newResponse = { action: 'jump', jumpConfig: { jumpType: 'internal', internalPath: '/test' } }

    const legacyDetected = InteractionAdapter.detectResponseFormat(legacyResponse as any)
    const newDetected = InteractionAdapter.detectResponseFormat(newResponse as any)

    console.log('格式检测结果:', { legacyDetected, newDetected })

    return {
      legacyDetected: legacyDetected === 'legacy',
      newDetected: newDetected === 'new'
    }
  }

  /**
   * 测试批量交互配置标准化
   */
  static testBatchNormalization() {
    console.log('🧪 [兼容性测试] 测试批量交互配置标准化')

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

    console.log('标准化到新格式:', normalizedToNew)
    console.log('标准化到旧格式:', normalizedToLegacy)

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
    console.log('🚀 [兼容性测试] 开始运行完整的兼容性测试套件')

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

    console.log('🎯 [兼容性测试] 测试结果摘要:')
    console.log(`总测试项目: ${totalCount}`)
    console.log(`成功项目: ${successCount}`)
    console.log(`成功率: ${successRate.toFixed(1)}%`)
    console.log('详细结果:', results)

    if (successRate === 100) {
      console.log('✅ [兼容性测试] 所有测试通过！交互系统新旧格式完全兼容')
    } else {
      console.warn('⚠️ [兼容性测试] 部分测试失败，需要进一步检查兼容性问题')
    }

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
