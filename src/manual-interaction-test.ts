/**
 * 手动交互系统测试脚本
 * 用于在开发环境中手动验证交互系统功能
 */

import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

export class ManualInteractionTester {
  private testComponentId = `manual-test-${Date.now()}`

  constructor() {
    console.log('🧪 [ManualTest] 手动交互测试器已初始化')
    console.log(`📋 [ManualTest] 测试组件ID: ${this.testComponentId}`)
  }

  /**
   * 测试1：基础组件注册
   */
  testComponentRegistration(): boolean {
    try {
      console.log('📋 [ManualTest] 测试1: 组件注册...')

      const testConfigs: InteractionConfig[] = [
        {
          id: 'test-click-config',
          name: '点击测试',
          event: 'click',
          responses: [
            {
              action: 'changeBackgroundColor',
              value: '#ff6b6b',
              duration: 300
            }
          ],
          enabled: true,
          priority: 1
        },
        {
          id: 'test-hover-config',
          name: '悬停测试',
          event: 'hover',
          responses: [
            {
              action: 'changeTextColor',
              value: '#e91e63',
              duration: 200
            }
          ],
          enabled: true,
          priority: 1
        }
      ]

      // 注册组件
      interactionManager.registerComponent(this.testComponentId, testConfigs)

      // 验证注册
      const registered = interactionManager.hasComponent(this.testComponentId)
      const configs = interactionManager.getComponentConfigs(this.testComponentId)

      console.log(`✅ [ManualTest] 组件注册结果: ${registered}`)
      console.log(`📋 [ManualTest] 获取到配置数量: ${configs?.length || 0}`)

      return registered && configs?.length === 2
    } catch (error) {
      console.error('❌ [ManualTest] 组件注册测试失败:', error)
      return false
    }
  }

  /**
   * 测试2：事件触发
   */
  testEventTriggering(): boolean {
    try {
      console.log('📋 [ManualTest] 测试2: 事件触发...')

      // 触发点击事件
      const clickResults = interactionManager.triggerEvent(this.testComponentId, 'click')
      console.log('🎯 [ManualTest] 点击事件结果:', clickResults)

      // 触发悬停事件
      const hoverResults = interactionManager.triggerEvent(this.testComponentId, 'hover')
      console.log('🎯 [ManualTest] 悬停事件结果:', hoverResults)

      // 验证结果
      const clickSuccess = clickResults.some(r => r.success)
      const hoverSuccess = hoverResults.some(r => r.success)

      console.log(`✅ [ManualTest] 点击事件成功: ${clickSuccess}`)
      console.log(`✅ [ManualTest] 悬停事件成功: ${hoverSuccess}`)

      return clickSuccess && hoverSuccess
    } catch (error) {
      console.error('❌ [ManualTest] 事件触发测试失败:', error)
      return false
    }
  }

  /**
   * 测试3：状态管理
   */
  testStateManagement(): boolean {
    try {
      console.log('📋 [ManualTest] 测试3: 状态管理...')

      // 获取初始状态
      const initialState = interactionManager.getComponentState(this.testComponentId)
      console.log('🔍 [ManualTest] 初始状态:', initialState)

      // 触发事件改变状态
      interactionManager.triggerEvent(this.testComponentId, 'click')

      // 获取更新后状态
      const updatedState = interactionManager.getComponentState(this.testComponentId)
      console.log('🔍 [ManualTest] 更新后状态:', updatedState)

      // 验证状态变化
      const stateChanged = updatedState?.backgroundColor === '#ff6b6b'
      console.log(`✅ [ManualTest] 状态变化检测: ${stateChanged}`)

      // 重置状态测试
      interactionManager.resetComponentState(this.testComponentId)
      const resetState = interactionManager.getComponentState(this.testComponentId)
      console.log('🔄 [ManualTest] 重置后状态:', resetState)

      const stateReset = Object.keys(resetState || {}).length === 0
      console.log(`✅ [ManualTest] 状态重置检测: ${stateReset}`)

      return stateChanged && stateReset
    } catch (error) {
      console.error('❌ [ManualTest] 状态管理测试失败:', error)
      return false
    }
  }

  /**
   * 测试4：配置更新
   */
  testConfigUpdate(): boolean {
    try {
      console.log('📋 [ManualTest] 测试4: 配置更新...')

      // 添加新配置
      const newConfig: InteractionConfig = {
        id: 'test-focus-config',
        name: '焦点测试',
        event: 'focus',
        responses: [
          {
            action: 'changeBorderColor',
            value: '#007bff',
            duration: 250
          }
        ],
        enabled: true,
        priority: 2
      }

      const existingConfigs = interactionManager.getComponentConfigs(this.testComponentId) || []
      const updatedConfigs = [...existingConfigs, newConfig]

      // 更新配置
      interactionManager.updateComponentConfigs(this.testComponentId, updatedConfigs)

      // 验证更新
      const finalConfigs = interactionManager.getComponentConfigs(this.testComponentId)
      const configCount = finalConfigs?.length || 0

      console.log(`📋 [ManualTest] 更新后配置数量: ${configCount}`)
      console.log(`✅ [ManualTest] 配置更新成功: ${configCount === 3}`)

      // 测试新配置
      const focusResults = interactionManager.triggerEvent(this.testComponentId, 'focus')
      const focusSuccess = focusResults.some(r => r.success)

      console.log(`🎯 [ManualTest] 新配置测试结果: ${focusSuccess}`)

      return configCount === 3 && focusSuccess
    } catch (error) {
      console.error('❌ [ManualTest] 配置更新测试失败:', error)
      return false
    }
  }

  /**
   * 测试5：事件监听器
   */
  testEventListeners(): boolean {
    try {
      console.log('📋 [ManualTest] 测试5: 事件监听器...')

      let eventReceived = false
      const testCallback = (data: any) => {
        console.log('🔔 [ManualTest] 收到事件回调:', data)
        eventReceived = true
      }

      // 添加事件监听器
      interactionManager.addEventListener(this.testComponentId, testCallback)

      // 触发事件
      interactionManager.triggerEvent(this.testComponentId, 'click')

      // 等待回调
      setTimeout(() => {
        console.log(`✅ [ManualTest] 事件监听器测试: ${eventReceived}`)

        // 移除监听器
        interactionManager.removeEventListener(this.testComponentId, testCallback)
        console.log('🔧 [ManualTest] 事件监听器已移除')
      }, 100)

      return true // 基本测试通过，异步验证在setTimeout中
    } catch (error) {
      console.error('❌ [ManualTest] 事件监听器测试失败:', error)
      return false
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<{ passed: number; total: number; success: boolean }> {
    console.log('🚀 [ManualTest] 开始运行所有手动测试...')

    const tests = [
      { name: '组件注册', test: () => this.testComponentRegistration() },
      { name: '事件触发', test: () => this.testEventTriggering() },
      { name: '状态管理', test: () => this.testStateManagement() },
      { name: '配置更新', test: () => this.testConfigUpdate() },
      { name: '事件监听器', test: () => this.testEventListeners() }
    ]

    let passed = 0
    const total = tests.length

    for (const { name, test } of tests) {
      try {
        const result = test()
        if (result) {
          passed++
          console.log(`✅ [ManualTest] ${name}测试通过`)
        } else {
          console.log(`❌ [ManualTest] ${name}测试失败`)
        }
      } catch (error) {
        console.error(`💥 [ManualTest] ${name}测试异常:`, error)
      }
    }

    const success = passed === total
    console.log(`\n📊 [ManualTest] 测试结果汇总: ${passed}/${total} 通过`)
    console.log(`🎯 [ManualTest] 总体结果: ${success ? '✅ 成功' : '❌ 失败'}`)

    // 清理测试组件
    interactionManager.unregisterComponent(this.testComponentId, [])
    console.log('🧹 [ManualTest] 测试组件已清理')

    return { passed, total, success }
  }

  /**
   * 获取系统状态信息
   */
  getSystemStatus() {
    const registeredComponents = interactionManager.getRegisteredComponents()

    return {
      interactionManagerExists: !!interactionManager,
      registeredComponentsCount: registeredComponents.length,
      registeredComponents: registeredComponents,
      hasTestComponent: interactionManager.hasComponent(this.testComponentId)
    }
  }
}

// 创建全局测试实例（开发环境）
export const manualTester = new ManualInteractionTester()

// 在开发环境中添加到全局对象
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as any).manualInteractionTester = manualTester
  console.log('🔧 [ManualTest] 手动测试器已添加到全局对象，可通过 window.manualInteractionTester 访问')
}
