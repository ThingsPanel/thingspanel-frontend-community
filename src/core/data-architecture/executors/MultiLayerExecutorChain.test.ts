/**
 * 多层级执行器链测试用例
 */

import {
  MultiLayerExecutorChain,
  DataSourceConfiguration
} from '@/core/data-architecture/executors/MultiLayerExecutorChain'

/**
 * JSON数据项示例配置
 */
const createJsonExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-001',
    dataSources: [
      {
        sourceId: 'json-source-1',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({
                  user: { name: '张三', age: 25, hobbies: ['读书', '游泳'] },
                  stats: { score: 95, level: 'A' }
                })
              }
            },
            processing: {
              filterPath: '$.user',
              defaultValue: {}
            }
          },
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({
                  product: { name: '商品A', price: 199 },
                  categories: ['电子', '数码']
                })
              }
            },
            processing: {
              filterPath: '$.product',
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'object'
        }
      },
      {
        sourceId: 'json-source-2',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify([
                  { id: 1, name: '项目1' },
                  { id: 2, name: '项目2' },
                  { id: 3, name: '项目3' }
                ])
              }
            },
            processing: {
              filterPath: '$[0]', // 获取第一个元素
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'array'
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * HTTP数据项示例配置
 */
const createHttpExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-002',
    dataSources: [
      {
        sourceId: 'http-source-1',
        dataItems: [
          {
            item: {
              type: 'http',
              config: {
                url: 'https://jsonplaceholder.typicode.com/posts/1',
                method: 'GET',
                timeout: 5000
              }
            },
            processing: {
              filterPath: '$.title',
              defaultValue: '默认标题'
            }
          }
        ],
        mergeStrategy: {
          type: 'object'
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * 自定义脚本合并示例配置
 */
const createScriptMergeExampleConfig = (): DataSourceConfiguration => {
  return {
    componentId: 'test-component-003',
    dataSources: [
      {
        sourceId: 'script-merge-source',
        dataItems: [
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({ count: 10, name: '测试数据' })
              }
            },
            processing: {
              filterPath: '$',
              customScript: `
                // 对数据进行自定义处理
                return {
                  ...data,
                  processedAt: new Date().toISOString(),
                  doubled: data.count * 2
                };
              `,
              defaultValue: {}
            }
          },
          {
            item: {
              type: 'json',
              config: {
                jsonString: JSON.stringify({ value: 20, status: 'active' })
              }
            },
            processing: {
              filterPath: '$',
              defaultValue: {}
            }
          }
        ],
        mergeStrategy: {
          type: 'script',
          script: `
            // 自定义合并逻辑
            const result = {
              merged: true,
              totalValue: 0,
              items: []
            };
            
            for (const item of items) {
              result.items.push(item);
              if (item.count) result.totalValue += item.count;
              if (item.value) result.totalValue += item.value;
            }
            
            return result;
          `
        }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

/**
 * 测试执行器链功能
 */
async function testExecutorChain() {
  const executorChain = new MultiLayerExecutorChain()

  // 测试1: JSON数据处理
  try {
    const config1 = createJsonExampleConfig()
    const result1 = await executorChain.executeDataProcessingChain(config1, true)
  } catch (error) {}

  // 测试2: HTTP数据处理 (可能网络失败)
  try {
    const config2 = createHttpExampleConfig()
    const result2 = await executorChain.executeDataProcessingChain(config2, true)
  } catch (error) {}

  // 测试3: 自定义脚本处理
  try {
    const config3 = createScriptMergeExampleConfig()
    const result3 = await executorChain.executeDataProcessingChain(config3, true)
  } catch (error) {}

  // 测试4: 执行器链统计信息
  const statistics = executorChain.getChainStatistics()
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testExecutorChain().catch(console.error)
}

export { testExecutorChain }
