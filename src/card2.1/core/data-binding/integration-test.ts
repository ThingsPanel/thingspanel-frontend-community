/**
 * 数据绑定系统集成测试
 * 验证完整的数据流：组件需求声明 → 数据源 → 转换管道 → 响应式绑定
 */

import { componentRequirementManager } from './component-requirement-manager'
import { DataSourceFactory } from './data-sources'
import { DataTransformPipelineFactory } from './data-transform-pipeline'
import { ReactiveDataBindingImpl, UpdateTriggerFactory } from './reactive-binding'
import type { ComponentDataRequirement } from './types'

export interface TestResult {
  testName: string
  success: boolean
  message: string
  data?: any
  error?: Error
  duration: number
}

export interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
}

export class DataBindingIntegrationTester {
  private testResults: TestSuite[] = []

  /**
   * 运行完整的集成测试套件
   */
  async runFullTestSuite(): Promise<TestSuite[]> {
    this.testResults = []
    // 测试套件1: 基础功能测试
    await this.runBasicFunctionalityTests()

    // 测试套件2: 数据类型测试
    await this.runDataTypeTests()

    // 测试套件3: 数据关系测试
    await this.runDataRelationshipTests()

    // 测试套件4: 响应式更新测试
    await this.runReactiveUpdateTests()

    // 测试套件5: 错误处理测试
    await this.runErrorHandlingTests()

    // 输出测试总结
    this.printTestSummary()

    return this.testResults
  }

  /**
   * 基础功能测试套件
   */
  private async runBasicFunctionalityTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: '基础功能测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    }

    // 测试1: 组件需求注册
    testSuite.tests.push(
      await this.runTest('组件需求注册', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            temperature: {
              type: 'value',
              valueType: 'number',
              required: true,
              description: '温度值'
            },
            status: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: '状态信息'
            }
          }
        }

        componentRequirementManager.registerRequirement('test-component-1', requirement)
        const retrieved = componentRequirementManager.getRequirement('test-component-1')

        if (!retrieved) {
          throw new Error('无法获取已注册的组件需求')
        }

        return { registeredFields: Object.keys(retrieved.fields) }
      })
    )

    // 测试2: 静态数据源创建和获取
    testSuite.tests.push(
      await this.runTest('静态数据源', async () => {
        const dataSource = DataSourceFactory.createStaticDataSource('test-static-1', '测试静态数据源', {
          temperature: 25.5,
          status: 'normal'
        })

        const data = await dataSource.fetchData()

        if (!data || data.temperature !== 25.5) {
          throw new Error('静态数据源返回的数据不正确')
        }

        return data
      })
    )

    // 测试3: 脚本数据源创建和执行
    testSuite.tests.push(
      await this.runTest('脚本数据源', async () => {
        const dataSource = DataSourceFactory.createScriptDataSource(
          'test-script-1',
          '测试脚本数据源',
          'return { temperature: 20 + Math.random() * 10, status: "active" };'
        )

        const data = await dataSource.fetchData()

        if (!data || typeof data.temperature !== 'number' || data.status !== 'active') {
          throw new Error('脚本数据源返回的数据格式不正确')
        }

        return data
      })
    )

    // 测试4: 数据转换管道
    testSuite.tests.push(
      await this.runTest('数据转换管道', async () => {
        const dataSource = DataSourceFactory.createStaticDataSource('test-pipeline-1', '管道测试数据源', {
          sensor: { temp: 23.5, online: true },
          location: 'room-a'
        })

        const mappingRules = [
          { sourcePath: 'sensor.temp', targetField: 'temperature', type: 'direct' as const },
          { sourcePath: 'sensor.online', targetField: 'isOnline', type: 'direct' as const },
          { sourcePath: 'location', targetField: 'location', type: 'direct' as const }
        ]

        const pipeline = DataTransformPipelineFactory.create('test-pipeline-1', dataSource, mappingRules)

        if (!pipeline.validate()) {
          throw new Error('数据转换管道验证失败')
        }

        const result = await pipeline.execute()

        if (result.temperature !== 23.5 || result.isOnline !== true || result.location !== 'room-a') {
          throw new Error('数据转换管道输出不正确')
        }

        return result
      })
    )

    this.calculateTestSuiteStats(testSuite)
    this.testResults.push(testSuite)
  }

  /**
   * 数据类型测试套件
   */
  private async runDataTypeTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: '数据类型测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    }

    // 测试1: 基础值类型（number, string, boolean）
    testSuite.tests.push(
      await this.runTest('基础值类型', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            temperature: { type: 'value', valueType: 'number', required: true, description: '温度' },
            deviceName: { type: 'value', valueType: 'string', required: true, description: '设备名称' },
            isOnline: { type: 'value', valueType: 'boolean', required: true, description: '在线状态' }
          }
        }

        componentRequirementManager.registerRequirement('test-values', requirement)

        const testData = {
          temperature: 25.6,
          deviceName: '传感器001',
          isOnline: true
        }

        const sampleData = componentRequirementManager.generateSampleData('test-values')

        if (!sampleData || typeof sampleData.temperature !== 'number') {
          throw new Error('数值类型生成失败')
        }

        return { original: testData, sample: sampleData }
      })
    )

    // 测试2: 对象类型
    testSuite.tests.push(
      await this.runTest('对象类型', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            sensorInfo: {
              type: 'object',
              required: true,
              description: '传感器信息',
              structure: {
                fields: {
                  id: { type: 'value', valueType: 'string', required: true, description: 'ID' },
                  name: { type: 'value', valueType: 'string', required: true, description: '名称' },
                  location: { type: 'value', valueType: 'string', required: false, description: '位置' }
                }
              }
            }
          }
        }

        componentRequirementManager.registerRequirement('test-object', requirement)

        const dataSource = DataSourceFactory.createStaticDataSource('test-object-data', '对象数据源', {
          device: {
            id: 'sensor-001',
            name: '环境传感器',
            location: '机房A区'
          }
        })

        const mappingRules = [{ sourcePath: 'device', targetField: 'sensorInfo', type: 'direct' as const }]

        const pipeline = DataTransformPipelineFactory.create('test-object-pipeline', dataSource, mappingRules)
        const result = await pipeline.execute()

        if (!result.sensorInfo || result.sensorInfo.id !== 'sensor-001') {
          throw new Error('对象类型映射失败')
        }

        return result
      })
    )

    // 测试3: 数组类型
    testSuite.tests.push(
      await this.runTest('数组类型', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            readings: {
              type: 'array',
              required: true,
              description: '读数数组',
              structure: {
                fields: {
                  time: { type: 'value', valueType: 'string', required: true, description: '时间' },
                  value: { type: 'value', valueType: 'number', required: true, description: '数值' }
                }
              }
            }
          }
        }

        componentRequirementManager.registerRequirement('test-array', requirement)

        const dataSource = DataSourceFactory.createStaticDataSource('test-array-data', '数组数据源', {
          measurements: [
            { time: '14:00', value: 24.5 },
            { time: '14:30', value: 25.1 },
            { time: '15:00', value: 25.6 }
          ]
        })

        const mappingRules = [{ sourcePath: 'measurements', targetField: 'readings', type: 'direct' as const }]

        const pipeline = DataTransformPipelineFactory.create('test-array-pipeline', dataSource, mappingRules)
        const result = await pipeline.execute()

        if (!Array.isArray(result.readings) || result.readings.length !== 3) {
          throw new Error('数组类型映射失败')
        }

        return { count: result.readings.length, sample: result.readings[0] }
      })
    )

    this.calculateTestSuiteStats(testSuite)
    this.testResults.push(testSuite)
  }

  /**
   * 数据关系测试套件
   */
  private async runDataRelationshipTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: '数据关系测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    }

    // 测试1: 独立关系
    testSuite.tests.push(
      await this.runTest('独立关系', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            temperature: { type: 'value', valueType: 'number', required: true, description: '温度' }
          },
          relationships: {
            tempDisplay: {
              type: 'independent',
              inputs: ['temperature'],
              description: '温度显示值'
            }
          }
        }

        componentRequirementManager.registerRequirement('test-independent', requirement)

        const inputData = { temperature: 25.6 }
        const result = componentRequirementManager.calculateRelationshipValue(
          'test-independent',
          'tempDisplay',
          inputData
        )

        if (result !== 25.6) {
          throw new Error('独立关系计算失败')
        }

        return { input: inputData, result }
      })
    )

    // 测试2: 计算关系
    testSuite.tests.push(
      await this.runTest('计算关系', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            temperature: { type: 'value', valueType: 'number', required: true, description: '温度' },
            humidity: { type: 'value', valueType: 'number', required: true, description: '湿度' }
          },
          relationships: {
            comfortIndex: {
              type: 'calculated',
              inputs: ['temperature', 'humidity'],
              calculator: inputs => {
                const temp = inputs.temperature || 0
                const hum = inputs.humidity || 0
                if (temp >= 20 && temp <= 26 && hum >= 40 && hum <= 70) {
                  return '舒适'
                } else {
                  return '不适'
                }
              },
              description: '舒适度指数'
            }
          }
        }

        componentRequirementManager.registerRequirement('test-calculated', requirement)

        const inputData = { temperature: 23, humidity: 60 }
        const result = componentRequirementManager.calculateRelationshipValue(
          'test-calculated',
          'comfortIndex',
          inputData
        )

        if (result !== '舒适') {
          throw new Error('计算关系计算失败')
        }

        return { input: inputData, result }
      })
    )

    // 测试3: 派生关系
    testSuite.tests.push(
      await this.runTest('派生关系', async () => {
        const requirement: ComponentDataRequirement = {
          fields: {
            isOnline: { type: 'value', valueType: 'boolean', required: true, description: '在线状态' }
          },
          relationships: {
            statusText: {
              type: 'derived',
              inputs: ['isOnline'],
              description: '状态文本'
            }
          }
        }

        componentRequirementManager.registerRequirement('test-derived', requirement)

        const inputData = { isOnline: true }
        const result = componentRequirementManager.calculateRelationshipValue('test-derived', 'statusText', inputData)

        if (result !== true) {
          throw new Error('派生关系计算失败')
        }

        return { input: inputData, result }
      })
    )

    this.calculateTestSuiteStats(testSuite)
    this.testResults.push(testSuite)
  }

  /**
   * 响应式更新测试套件
   */
  private async runReactiveUpdateTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: '响应式更新测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    }

    // 测试1: 手动触发器
    testSuite.tests.push(
      await this.runTest('手动触发器', async () => {
        const dataSource = DataSourceFactory.createScriptDataSource(
          'test-manual-source',
          '手动触发测试',
          'return { value: Math.random(), timestamp: Date.now() };'
        )

        const mappingRules = [
          { sourcePath: 'value', targetField: 'value', type: 'direct' as const },
          { sourcePath: 'timestamp', targetField: 'timestamp', type: 'direct' as const }
        ]

        const pipeline = DataTransformPipelineFactory.create('test-manual-pipeline', dataSource, mappingRules)
        const trigger = UpdateTriggerFactory.createManualTrigger()

        let updateCount = 0
        let lastData: any = null

        const binding = new ReactiveDataBindingImpl(
          'test-manual-binding',
          'test-component',
          pipeline,
          [trigger],
          newData => {
            updateCount++
            lastData = newData
          }
        )

        // 启动绑定
        binding.start()

        // 手动触发更新
        if ('trigger' in trigger) {
          ;(trigger as any).trigger()
          await new Promise(resolve => setTimeout(resolve, 100)) // 等待异步更新
        }

        // 停止绑定
        binding.stop()

        if (updateCount === 0 || !lastData) {
          throw new Error('手动触发器未正常工作')
        }

        return { updateCount, lastData }
      })
    )

    // 测试2: 定时器触发器
    testSuite.tests.push(
      await this.runTest('定时器触发器', async () => {
        const dataSource = DataSourceFactory.createScriptDataSource(
          'test-timer-source',
          '定时器测试',
          'return { counter: Math.floor(Math.random() * 100) };'
        )

        const mappingRules = [{ sourcePath: 'counter', targetField: 'counter', type: 'direct' as const }]

        const pipeline = DataTransformPipelineFactory.create('test-timer-pipeline', dataSource, mappingRules)
        const trigger = UpdateTriggerFactory.createTimerTrigger(500, true) // 500ms间隔，立即执行

        let updateCount = 0
        const updateData: any[] = []

        const binding = new ReactiveDataBindingImpl(
          'test-timer-binding',
          'test-component',
          pipeline,
          [trigger],
          newData => {
            updateCount++
            updateData.push(newData)
          }
        )

        // 启动绑定并等待几次更新
        binding.start()
        await new Promise(resolve => setTimeout(resolve, 1200)) // 等待至少2次更新
        binding.stop()

        if (updateCount < 2) {
          throw new Error('定时器触发器更新次数不足')
        }

        return { updateCount, dataCount: updateData.length }
      })
    )

    this.calculateTestSuiteStats(testSuite)
    this.testResults.push(testSuite)
  }

  /**
   * 错误处理测试套件
   */
  private async runErrorHandlingTests(): Promise<void> {
    const testSuite: TestSuite = {
      name: '错误处理测试',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0
    }

    // 测试1: 无效的组件需求
    testSuite.tests.push(
      await this.runTest('无效组件需求处理', async () => {
        try {
          const invalidRequirement = {
            fields: {} // 空字段定义，应该导致验证失败
          }

          componentRequirementManager.registerRequirement('test-invalid', invalidRequirement as any)
          throw new Error('应该抛出验证错误')
        } catch (error) {
          if (error instanceof Error && error.message.includes('验证失败')) {
            return { handled: true, error: error.message }
          }
          throw error
        }
      })
    )

    // 测试2: 数据源执行错误
    testSuite.tests.push(
      await this.runTest('数据源错误处理', async () => {
        const dataSource = DataSourceFactory.createScriptDataSource(
          'test-error-source',
          '错误脚本',
          'throw new Error("脚本执行错误");'
        )

        try {
          await dataSource.fetchData()
          throw new Error('应该抛出脚本执行错误')
        } catch (error) {
          if (error instanceof Error && error.message.includes('脚本执行错误')) {
            return { handled: true, error: error.message }
          }
          throw error
        }
      })
    )

    // 测试3: 映射路径错误
    testSuite.tests.push(
      await this.runTest('映射路径错误处理', async () => {
        const dataSource = DataSourceFactory.createStaticDataSource('test-mapping-error', '映射错误测试', {
          temperature: 25.5
        })

        const mappingRules = [
          { sourcePath: 'nonexistent.path', targetField: 'value', type: 'direct' as const, defaultValue: 'default' }
        ]

        const pipeline = DataTransformPipelineFactory.create('test-mapping-error-pipeline', dataSource, mappingRules)
        const result = await pipeline.execute()

        // 应该返回默认值而不是抛出错误
        if (result.value !== 'default') {
          throw new Error('映射错误未正确处理')
        }

        return { result, handled: true }
      })
    )

    this.calculateTestSuiteStats(testSuite)
    this.testResults.push(testSuite)
  }

  /**
   * 运行单个测试
   */
  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now()

    try {
      const data = await testFn()
      const duration = Date.now() - startTime

      return {
        testName,
        success: true,
        message: '测试通过',
        data,
        duration
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        testName,
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        error: error instanceof Error ? error : new Error(String(error)),
        duration
      }
    }
  }

  /**
   * 计算测试套件统计信息
   */
  private calculateTestSuiteStats(testSuite: TestSuite): void {
    testSuite.totalTests = testSuite.tests.length
    testSuite.passedTests = testSuite.tests.filter(t => t.success).length
    testSuite.failedTests = testSuite.tests.filter(t => !t.success).length
    testSuite.totalDuration = testSuite.tests.reduce((sum, t) => sum + t.duration, 0)
  }

  /**
   * 打印测试总结
   */
  private printTestSummary(): void {
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalDuration = 0

    this.testResults.forEach(suite => {
      totalTests += suite.totalTests
      totalPassed += suite.passedTests
      totalFailed += suite.failedTests
      totalDuration += suite.totalDuration

      const passRate = ((suite.passedTests / suite.totalTests) * 100).toFixed(1)
      // 显示失败的测试
      suite.tests
        .filter(t => !t.success)
        .forEach(test => {
        })
    })
    const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1)
  
  }

  /**
   * 获取测试结果
   */
  getTestResults(): TestSuite[] {
    return this.testResults
  }

  /**
   * 清除测试结果
   */
  clearTestResults(): void {
    this.testResults = []
  }
}

// 创建全局测试实例
export const dataBindingTester = new DataBindingIntegrationTester()

export default DataBindingIntegrationTester
