/**
 * 多层级执行器链使用示例
 * 展示如何在实际项目中使用4层数据处理管道
 */

import { createExecutorChain, DataSourceConfiguration, ExecutionResult } from './index'

/**
 * 创建示例配置数据生成器
 */
export class ExampleConfigGenerator {
  /**
   * 生成JSON数据源示例配置
   */
  generateJsonExample(): DataSourceConfiguration {
    return {
      componentId: 'dashboard-widget-001',
      dataSources: [
        {
          sourceId: 'user-stats',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify({
                    user: {
                      name: '张三',
                      level: 5,
                      points: 1200,
                      badges: ['新手', '活跃用户']
                    },
                    performance: {
                      daily: { visits: 45, duration: 120 },
                      weekly: { visits: 280, duration: 840 }
                    }
                  })
                }
              },
              processing: {
                filterPath: '$.user',
                customScript: `
                  return {
                    ...data,
                    displayName: data.name + ' (Lv.' + data.level + ')',
                    totalBadges: data.badges.length
                  };
                `,
                defaultValue: { name: '未知用户', level: 0 }
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        },
        {
          sourceId: 'system-metrics',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify([
                    { metric: 'cpu', value: 75, unit: '%' },
                    { metric: 'memory', value: 4.2, unit: 'GB' },
                    { metric: 'disk', value: 850, unit: 'GB' }
                  ])
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return data.map(item => ({
                    name: item.metric.toUpperCase(),
                    value: item.value,
                    unit: item.unit,
                    status: item.value > 80 ? 'warning' : 'normal'
                  }));
                `,
                defaultValue: []
              }
            }
          ],
          mergeStrategy: { type: 'array' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * 生成HTTP数据源示例配置
   */
  generateHttpExample(): DataSourceConfiguration {
    return {
      componentId: 'api-widget-002',
      dataSources: [
        {
          sourceId: 'external-api',
          dataItems: [
            {
              item: {
                type: 'http',
                config: {
                  url: 'https://jsonplaceholder.typicode.com/users/1',
                  method: 'GET',
                  timeout: 5000
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    company: data.company?.name || '无',
                    address: data.address?.city || '未知'
                  };
                `,
                defaultValue: { name: '数据加载失败' }
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * 生成混合数据源示例配置
   */
  generateMixedExample(): DataSourceConfiguration {
    return {
      componentId: 'mixed-widget-003',
      dataSources: [
        // JSON数据源
        {
          sourceId: 'local-config',
          dataItems: [
            {
              item: {
                type: 'json',
                config: {
                  jsonString: JSON.stringify({
                    theme: 'dark',
                    language: 'zh-CN',
                    features: ['charts', 'tables', 'export']
                  })
                }
              },
              processing: {
                filterPath: '$',
                defaultValue: {}
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        },
        // 脚本生成数据源
        {
          sourceId: 'generated-data',
          dataItems: [
            {
              item: {
                type: 'script',
                config: {
                  script: `
                    const now = new Date();
                    return {
                      timestamp: now.toISOString(),
                      random: Math.floor(Math.random() * 100),
                      dayOfWeek: now.getDay(),
                      isWeekend: now.getDay() === 0 || now.getDay() === 6
                    };
                  `,
                  context: {}
                }
              },
              processing: {
                filterPath: '$',
                customScript: `
                  return {
                    ...data,
                    formatted: {
                      time: new Date(data.timestamp).toLocaleString('zh-CN'),
                      weekStatus: data.isWeekend ? '周末' : '工作日'
                    }
                  };
                `,
                defaultValue: {}
              }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }
}

/**
 * 执行器链使用示例类
 */
export class ExecutorChainUsageExample {
  private executorChain = createExecutorChain()
  private configGenerator = new ExampleConfigGenerator()

  /**
   * 运行JSON数据处理示例
   */
  async runJsonExample(): Promise<ExecutionResult> {
    console.log('🔄 执行JSON数据处理示例...')

    const config = this.configGenerator.generateJsonExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)

    console.log('✅ JSON示例完成')
    console.log('组件数据:', JSON.stringify(result.componentData, null, 2))
    console.log('执行时间:', result.executionTime + 'ms')

    return result
  }

  /**
   * 运行HTTP数据处理示例
   */
  async runHttpExample(): Promise<ExecutionResult> {
    console.log('🔄 执行HTTP数据处理示例...')

    const config = this.configGenerator.generateHttpExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)

    console.log('✅ HTTP示例完成')
    console.log('组件数据:', JSON.stringify(result.componentData, null, 2))
    console.log('执行时间:', result.executionTime + 'ms')

    return result
  }

  /**
   * 运行混合数据源处理示例
   */
  async runMixedExample(): Promise<ExecutionResult> {
    console.log('🔄 执行混合数据源处理示例...')

    const config = this.configGenerator.generateMixedExample()
    const result = await this.executorChain.executeDataProcessingChain(config, true)

    console.log('✅ 混合示例完成')
    console.log('组件数据:', JSON.stringify(result.componentData, null, 2))
    console.log('执行时间:', result.executionTime + 'ms')

    return result
  }

  /**
   * 运行所有示例
   */
  async runAllExamples(): Promise<void> {
    console.log('=== 多层级执行器链使用示例 ===\n')

    try {
      await this.runJsonExample()
      console.log('')

      await this.runHttpExample()
      console.log('')

      await this.runMixedExample()
      console.log('')

      // 显示执行器链统计信息
      const stats = this.executorChain.getChainStatistics()
      console.log('📊 执行器链统计信息:')
      console.log(JSON.stringify(stats, null, 2))
    } catch (error) {
      console.error('❌ 示例执行失败:', error)
    }

    console.log('\n=== 示例执行完成 ===')
  }
}

// 便捷导出
export const exampleRunner = new ExecutorChainUsageExample()
export const configGenerator = new ExampleConfigGenerator()

// 浏览器环境下不支持require.main检查
// 如需运行示例，请手动调用: exampleRunner.runAllExamples()
