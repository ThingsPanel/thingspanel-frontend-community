/**
 * 创建物联网可视化平台目录结构脚本
 * 根据 TARGET_DIRECTORY_STRUCTURE.md 创建完整的空架构
 * 遵循"先集中"原则，将所有系统集中到 iot-visualization-platform 目录下
 * 
 * 重要：所有文件都留空，但会写好相互引用关系
 */

const fs = require('fs');
const path = require('path');

// 基础路径
const basePath = '/mnt/e/wbh/things2/thingspanel-frontend-community/src';

// 目录结构定义 - 集中到 iot-visualization-platform
const targetStructure = {
  'iot-visualization-platform': {
    // 🏗️ core/ - 核心基础层 (原 src/core)
    'core': {
      'types': [
        'index.ts',           // 类型统一导出
        'component.ts',       // 组件相关类型
        'data-source.ts',     // 数据源类型
        'configuration.ts',   // 配置相关类型
        'renderer.ts',        // 渲染器类型
        'integration.ts'      // 系统集成类型
      ],
      'data-engine': {
        'executors': [
          'index.ts',
          'http-executor.ts',
          'script-executor.ts',
          'device-api-executor.ts',
          'static-data-executor.ts'
        ],
        'processors': [
          'index.ts',
          'filter-processor.ts',
          'transform-processor.ts',
          'merge-processor.ts'
        ],
        'cache': [
          'index.ts',
          'memory-cache.ts',
          'persistent-cache.ts'
        ],
        files: [
          'index.ts',                    // 数据引擎入口
          'data-source-manager.ts',      // 数据源管理器
          'data-binding-manager.ts',     // 数据绑定管理器
          'data-transform-pipeline.ts'   // 数据转换管道
        ]
      },
      'config-engine': {
        'templates': [
          'index.ts',
          'component-template.ts',
          'data-source-template.ts',
          'renderer-template.ts'
        ],
        'persistence': [
          'index.ts',
          'local-storage.ts',
          'remote-storage.ts'
        ],
        files: [
          'index.ts',              // 配置引擎入口
          'config-manager.ts',     // 配置管理器
          'config-validator.ts',   // 配置验证器
          'config-transformer.ts'  // 配置转换器
        ]
      },
      'event-engine': {
        'listeners': [
          'index.ts',
          'component-listener.ts',
          'data-listener.ts',
          'config-listener.ts'
        ],
        'emitters': [
          'index.ts',
          'component-emitter.ts',
          'data-emitter.ts',
          'lifecycle-emitter.ts'
        ],
        files: [
          'index.ts',          // 事件引擎入口
          'event-bus.ts',      // 事件总线
          'event-manager.ts'   // 事件管理器
        ]
      },
      'registry-engine': {
        'discovery': [
          'index.ts',
          'component-discovery.ts',
          'auto-loader.ts'
        ],
        files: [
          'index.ts',                  // 注册引擎入口
          'component-registry.ts',     // 组件注册表
          'data-source-registry.ts',   // 数据源注册表
          'renderer-registry.ts',      // 渲染器注册表
          'template-registry.ts'       // 模板注册表
        ]
      },
      'interaction-engine': {
        'components': [
          'index.ts',
          'InteractionCardWizard.vue',
          'InteractionPreview.vue',
          'InteractionTemplateSelector.vue'
        ],
        files: [
          'index.ts',              // 交互引擎入口
          'interaction-manager.ts', // 交互管理器
          'config-registry.ts'     // 配置注册表
        ]
      },
      'script-engine': {
        'components': [
          'index.ts',
          'ScriptEditor.vue',
          'SimpleScriptEditor.vue'
        ],
        'templates': [
          'built-in-templates.ts'
        ],
        files: [
          'index.ts',              // 脚本引擎入口
          'script-engine.ts',      // 脚本引擎核心
          'executor.ts',           // 脚本执行器
          'sandbox.ts',            // 沙箱环境
          'context-manager.ts',    // 上下文管理器
          'template-manager.ts'    // 模板管理器
        ]
      },
      'initialization': [
        'index.ts',              // 初始化入口
        'system-initializer.ts', // 系统初始化器
        'dependency-resolver.ts', // 依赖解析器
        'lifecycle-manager.ts',  // 生命周期管理器
        'health-checker.ts'      // 健康检查器
      ],
      'utils': [
        'index.ts',           // 工具库入口
        'validation.ts',      // 验证工具
        'transformation.ts',  // 转换工具
        'performance.ts',     // 性能工具
        'security.ts',        // 安全工具
        'debug.ts'           // 调试工具
      ]
    },

    // 🎨 visual-system/ - 可视化系统层 (原 src/components/visual-editor)
    'visual-system': {
      'editor': {
        'components': [
          'index.ts',
          'ToolbarComponent.vue',
          'PropertyPanel.vue',
          'ComponentLibrary.vue',
          'CanvasArea.vue',
          'ConfigPanel.vue'
        ],
        'modes': [
          'index.ts',
          'design-mode.ts',
          'preview-mode.ts',
          'debug-mode.ts'
        ],
        'plugins': [
          'index.ts',
          'grid-plugin.ts',
          'snap-plugin.ts',
          'undo-redo-plugin.ts'
        ],
        files: [
          'index.ts',         // 编辑器入口
          'editor-core.ts',   // 编辑器核心
          'editor-state.ts'   // 编辑器状态管理
        ]
      },
      'renderers': {
        'base': [
          'index.ts',
          'BaseRenderer.ts',
          'RendererManager.ts',
          'RenderContext.ts'
        ],
        'canvas': [
          'index.ts',
          'CanvasRenderer.vue',
          'CanvasWrapper.vue',
          'canvas-utils.ts'
        ],
        'grid': [
          'index.ts',
          'GridRenderer.vue',
          'GridWrapper.vue',
          'grid-layout.ts',
          'grid-utils.ts'
        ],
        'layout': [
          'index.ts',
          'FlexRenderer.vue',
          'AbsoluteRenderer.vue',
          'layout-utils.ts'
        ],
        files: ['index.ts']  // 渲染器入口
      },
      'layout-engine': {
        'algorithms': [
          'index.ts',
          'grid-algorithm.ts',
          'flex-algorithm.ts',
          'absolute-algorithm.ts'
        ],
        'constraints': [
          'index.ts',
          'size-constraints.ts',
          'position-constraints.ts',
          'collision-detection.ts'
        ],
        files: [
          'index.ts',               // 布局引擎入口
          'layout-manager.ts',      // 布局管理器
          'layout-calculator.ts',   // 布局计算器
          'responsive-handler.ts'   // 响应式处理
        ]
      },
      'visual-interaction': {
        'commands': [
          'index.ts',
          'DragCommand.ts',
          'ResizeCommand.ts',
          'SelectCommand.ts',
          'DeleteCommand.ts'
        ],
        files: [
          'index.ts',              // 可视化交互入口
          'drag-drop-manager.ts',  // 拖放管理器
          'selection-manager.ts',  // 选择管理器
          'resize-manager.ts',     // 调整大小管理器
          'gesture-handler.ts',    // 手势处理器
          'keyboard-handler.ts',   // 键盘处理器
          'mouse-handler.ts',      // 鼠标处理器
          'touch-handler.ts'       // 触摸处理器
        ]
      }
    },

    // 🧩 component-system/ - 组件系统层 (原 src/card2.1)
    'component-system': {
      'framework': [
        'index.ts',                // 组件框架入口
        'component-base.ts',       // 组件基类
        'component-lifecycle.ts',  // 组件生命周期
        'component-props.ts',      // 组件属性系统
        'component-events.ts',     // 组件事件系统
        'component-slots.ts',      // 组件插槽系统
        'component-validator.ts'   // 组件验证器
      ],
      'library': {
        'statistics': {
          'AccessCounter': [
            'index.ts',
            'AccessCounter.vue',
            'AccessCounterConfig.vue',
            'access-counter.types.ts'
          ],
          'AppDownload': [
            'index.ts',
            'AppDownload.vue',
            'AppDownloadConfig.vue',
            'app-download.types.ts'
          ]
        },
        'dashboard': {
          'GaugeDashboard': [
            'index.ts',
            'GaugeDashboard.vue',
            'GaugeConfig.vue',
            'gauge.types.ts'
          ]
        },
        'charts': {
          'BarChart': [
            'index.ts',
            'BarChart.vue',
            'BarChartConfig.vue',
            'bar-chart.types.ts'
          ],
          'LineChart': [
            'index.ts',
            'LineChart.vue',
            'LineChartConfig.vue',
            'line-chart.types.ts'
          ],
          'PieChart': [
            'index.ts',
            'PieChart.vue',
            'PieChartConfig.vue',
            'pie-chart.types.ts'
          ]
        },
        'controls': {
          'Switch': [
            'index.ts',
            'Switch.vue',
            'SwitchConfig.vue',
            'switch.types.ts'
          ],
          'Slider': [
            'index.ts',
            'Slider.vue',
            'SliderConfig.vue',
            'slider.types.ts'
          ],
          'Button': [
            'index.ts',
            'Button.vue',
            'ButtonConfig.vue',
            'button.types.ts'
          ]
        },
        'displays': {
          'TextDisplay': [
            'index.ts',
            'TextDisplay.vue',
            'TextDisplayConfig.vue',
            'text-display.types.ts'
          ],
          'ImageDisplay': [
            'index.ts',
            'ImageDisplay.vue',
            'ImageDisplayConfig.vue',
            'image-display.types.ts'
          ],
          'VideoPlayer': [
            'index.ts',
            'VideoPlayer.vue',
            'VideoPlayerConfig.vue',
            'video-player.types.ts'
          ]
        },
        files: [
          'index.ts',       // 组件库入口
          'categories.ts'   // 组件分类
        ]
      },
      'loader': [
        'index.ts',            // 加载器入口
        'component-loader.ts', // 组件加载器
        'lazy-loader.ts',      // 懒加载器
        'async-loader.ts',     // 异步加载器
        'cache-loader.ts'      // 缓存加载器
      ],
      'builder': [
        'index.ts',            // 构建器入口
        'component-builder.ts', // 组件构建器
        'template-builder.ts',  // 模板构建器
        'config-builder.ts',    // 配置构建器
        'instance-builder.ts'   // 实例构建器
      ],
      'integration': [
        'index.ts',              // 集成入口
        'vue-integration.ts',    // Vue集成
        'data-integration.ts',   // 数据集成
        'config-integration.ts', // 配置集成
        'event-integration.ts'   // 事件集成
      ]
    },

    // 🗄️ store/ - 状态管理层
    'store': {
      'modules': {
        'editor': [
          'index.ts',
          'editor-state.ts',
          'editor-actions.ts',
          'editor-getters.ts',
          'editor-mutations.ts'
        ],
        'components': [
          'index.ts',
          'component-state.ts',
          'component-actions.ts',
          'component-getters.ts'
        ],
        'data': [
          'index.ts',
          'data-state.ts',
          'data-actions.ts',
          'data-getters.ts'
        ],
        'config': [
          'index.ts',
          'config-state.ts',
          'config-actions.ts',
          'config-getters.ts'
        ],
        files: ['index.ts']
      },
      'persistence': [
        'index.ts',
        'local-persistence.ts',
        'session-persistence.ts',
        'remote-persistence.ts'
      ],
      'middleware': [
        'index.ts',
        'logger-middleware.ts',
        'persistence-middleware.ts',
        'sync-middleware.ts'
      ],
      files: [
        'index.ts',       // 状态管理入口
        'root-store.ts'   // 根状态存储
      ]
    },

    // 🌐 views/ - 视图页面层
    'views': {
      'visualization': {
        'editor-page': [
          'index.vue',
          'EditorLayout.vue',
          'editor-page.types.ts'
        ],
        'preview-page': [
          'index.vue',
          'PreviewLayout.vue',
          'preview-page.types.ts'
        ],
        'dashboard-page': [
          'index.vue',
          'DashboardLayout.vue',
          'dashboard-page.types.ts'
        ],
        files: ['index.ts']
      },
      'management': {
        'project-management': [
          'index.vue',
          'ProjectList.vue',
          'ProjectEditor.vue',
          'project-management.types.ts'
        ],
        'component-management': [
          'index.vue',
          'ComponentList.vue',
          'ComponentEditor.vue',
          'component-management.types.ts'
        ],
        'template-management': [
          'index.vue',
          'TemplateList.vue',
          'TemplateEditor.vue',
          'template-management.types.ts'
        ],
        files: ['index.ts']
      }
    },

    // 🔧 services/ - 服务层
    'services': {
      'api': [
        'index.ts',
        'project-api.ts',
        'component-api.ts',
        'data-source-api.ts',
        'template-api.ts'
      ],
      'data': [
        'index.ts',
        'data-fetch-service.ts',
        'data-cache-service.ts',
        'data-sync-service.ts'
      ],
      'config': [
        'index.ts',
        'config-load-service.ts',
        'config-save-service.ts',
        'config-sync-service.ts'
      ],
      files: ['index.ts']  // 服务层入口
    },

    // 🛠️ utils/ - 工具层
    'utils': {
      'common': [
        'index.ts',
        'object-utils.ts',
        'array-utils.ts',
        'string-utils.ts',
        'date-utils.ts'
      ],
      'validation': [
        'index.ts',
        'schema-validator.ts',
        'type-validator.ts',
        'format-validator.ts'
      ],
      'performance': [
        'index.ts',
        'lazy-loading.ts',
        'debounce.ts',
        'throttle.ts'
      ],
      files: ['index.ts']  // 工具层入口
    },

    // 🎛️ hooks/ - Hooks层
    'hooks': {
      'core': [
        'index.ts',
        'useSystemCore.ts',
        'useRegistryEngine.ts',
        'useDataEngine.ts'
      ],
      'visual': [
        'index.ts',
        'useVisualEditor.ts',
        'useRenderer.ts',
        'useLayoutEngine.ts'
      ],
      'component': [
        'index.ts',
        'useComponentSystem.ts',
        'useComponentBuilder.ts',
        'useComponentIntegration.ts'
      ],
      'data': [
        'index.ts',
        'useDataBinding.ts',
        'useDataSource.ts',
        'useDataTransform.ts'
      ],
      files: ['index.ts']  // Hooks入口
    },

    // 📝 types/ - 全局类型层
    'types': [
      'index.ts',        // 全局类型入口
      'global.d.ts',     // 全局类型声明
      'api.d.ts',        // API类型声明
      'component.d.ts',  // 组件类型声明
      'integration.d.ts' // 集成类型声明
    ]
  }
};

// 引用关系定义 - 重要的相互引用关系
const importRelations = {
  // 主入口文件
  'iot-visualization-platform/index.ts': [
    './core',
    './visual-system',
    './component-system',
    './store',
    './types'
  ],

  // Core 层引用关系
  'iot-visualization-platform/core/index.ts': [
    './types',
    './data-engine',
    './config-engine',
    './event-engine',
    './registry-engine',
    './interaction-engine',
    './script-engine',
    './initialization',
    './utils'
  ],

  'iot-visualization-platform/core/data-engine/index.ts': [
    '../types/data-source',
    '../types/configuration',
    './executors',
    './processors',
    './cache'
  ],

  'iot-visualization-platform/core/config-engine/index.ts': [
    '../types/configuration',
    '../event-engine',
    './templates',
    './persistence'
  ],

  'iot-visualization-platform/core/registry-engine/index.ts': [
    '../types/component',
    '../types/renderer',
    '../event-engine',
    './discovery'
  ],

  // Visual System 层引用关系
  'iot-visualization-platform/visual-system/index.ts': [
    '../core',
    '../types',
    './editor',
    './renderers',
    './layout-engine',
    './visual-interaction'
  ],

  'iot-visualization-platform/visual-system/editor/index.ts': [
    '../../core/registry-engine',
    '../../core/config-engine',
    '../../core/event-engine',
    './components',
    './modes',
    './plugins'
  ],

  'iot-visualization-platform/visual-system/renderers/index.ts': [
    '../../core/types/renderer',
    '../../component-system',
    './base',
    './canvas',
    './grid',
    './layout'
  ],

  // Component System 层引用关系
  'iot-visualization-platform/component-system/index.ts': [
    '../core',
    '../types',
    './framework',
    './library',
    './loader',
    './builder',
    './integration'
  ],

  'iot-visualization-platform/component-system/framework/index.ts': [
    '../../core/types/component',
    '../../core/event-engine',
    '../../core/registry-engine'
  ],

  'iot-visualization-platform/component-system/library/index.ts': [
    '../framework',
    './statistics',
    './dashboard',
    './charts',
    './controls',
    './displays'
  ],

  // Store 层引用关系
  'iot-visualization-platform/store/index.ts': [
    '../core',
    '../types',
    './modules',
    './persistence',
    './middleware'
  ],

  'iot-visualization-platform/store/modules/index.ts': [
    './editor',
    './components',
    './data',
    './config'
  ],

  // Services 层引用关系
  'iot-visualization-platform/services/index.ts': [
    '../core',
    '../types',
    './api',
    './data',
    './config'
  ],

  // Hooks 层引用关系
  'iot-visualization-platform/hooks/index.ts': [
    '../core',
    '../visual-system',
    '../component-system',
    '../store',
    './core',
    './visual',
    './component',
    './data'
  ],

  // Types 层引用关系
  'iot-visualization-platform/types/index.ts': [
    './global',
    './api',
    './component',
    './integration'
  ]
};

// 创建目录的函数
function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// 创建文件的函数，包含引用关系
function createFile(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    // 获取相对于basePath的路径
    const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');
    
    // 检查是否有引用关系定义
    if (importRelations[relativePath]) {
      const imports = importRelations[relativePath];
      const importStatements = imports.map(imp => {
        if (filePath.endsWith('.vue')) {
          // Vue 文件的引用格式
          if (imp.startsWith('./') || imp.startsWith('../')) {
            return `// import from '${imp}'`;
          } else {
            return `// import { } from '${imp}'`;
          }
        } else {
          // TypeScript 文件的引用格式
          if (imp.startsWith('./') || imp.startsWith('../')) {
            return `export * from '${imp}';`;
          } else {
            return `// import type { } from '${imp}';`;
          }
        }
      }).join('\n');
      
      content = `/**\n * ${path.basename(filePath)}\n * 自动生成的引用关系\n */\n\n${importStatements}\n\n${content}`;
    } else if (filePath.endsWith('.ts') && !filePath.endsWith('.d.ts')) {
      // 为没有特定引用关系的 .ts 文件添加基本结构
      content = `/**\n * ${path.basename(filePath)}\n * 空实现 - 待填充\n */\n\n${content}`;
    } else if (filePath.endsWith('.vue')) {
      // 为 Vue 文件添加基本结构
      content = `<template>\n  <!-- ${path.basename(filePath)} - 待实现 -->\n</template>\n\n<script setup lang="ts">\n/**\n * ${path.basename(filePath)}\n * 空实现 - 待填充\n */\n</script>\n\n<style scoped>\n/* 样式 - 待添加 */\n</style>`;
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Created file: ${filePath}`);
  }
}

// 递归创建结构的函数
function createStructure(structure, currentPath = basePath) {
  for (const [key, value] of Object.entries(structure)) {
    if (Array.isArray(value)) {
      // 如果是数组，说明是文件列表
      const dirPath = currentPath;
      createDirectory(dirPath);
      
      // 创建数组中的所有文件
      value.forEach(fileName => {
        const filePath = path.join(dirPath, fileName);
        createFile(filePath);
      });
    } else if (typeof value === 'object' && value !== null) {
      // 如果是对象，说明是子目录
      const dirPath = path.join(currentPath, key);
      createDirectory(dirPath);
      
      // 如果有 files 属性，先创建这些文件
      if (value.files) {
        value.files.forEach(fileName => {
          const filePath = path.join(dirPath, fileName);
          createFile(filePath);
        });
      }
      
      // 递归创建子结构（排除 files 属性）
      const subStructure = { ...value };
      delete subStructure.files;
      createStructure(subStructure, dirPath);
    }
  }
}

// 主函数
function main() {
  console.log('开始创建物联网可视化平台目录结构...');
  console.log(`基础路径: ${basePath}`);
  
  // 确保基础目录存在
  createDirectory(basePath);
  
  // 创建整个结构
  createStructure(targetStructure);
  
  console.log('\n✅ 物联网可视化平台目录结构创建完成！');
  console.log('\n📁 创建的主要目录:');
  console.log('- src/iot-visualization-platform/ (物联网可视化平台)');
  console.log('  ├── core/ (核心基础层)');
  console.log('  ├── visual-system/ (可视化系统层)');
  console.log('  ├── component-system/ (组件系统层)');
  console.log('  ├── store/ (状态管理层)');
  console.log('  ├── views/ (视图页面层)');
  console.log('  ├── services/ (服务层)');
  console.log('  ├── utils/ (工具层)');
  console.log('  ├── hooks/ (Hooks层)');
  console.log('  └── types/ (全局类型层)');
  
  console.log('\n🔗 重要特性:');
  console.log('- 所有文件都已创建为空文件');
  console.log('- 已写好关键模块间的引用关系');
  console.log('- 遵循"先集中，后整合"的设计原则');
  console.log('- 为将来独立使用做好准备');
  
  console.log('\n🚀 下一步:');
  console.log('1. 逐步迁移现有代码到新架构');
  console.log('2. 填充空文件的具体实现');
  console.log('3. 测试引用关系的正确性');
  console.log('4. 完善统一的对外接口');
}

// 执行脚本
main();