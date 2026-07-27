import js from '@eslint/js'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier/recommended'

/**
 * ESLint Flat Config 配置
 */
export default [
  // 指定 ESLint 应该忽略的文件和目录
  {
    ignores: [
      '**/dist/**', // 构建输出目录
      '**/node_modules/**' // 依赖包目录
    ]
  },

  // 应用 ESLint 官方推荐的 JavaScript 规则
  js.configs.recommended,

  // 专门针对 .vue 文件的 lint 配置
  {
    files: ['**/*.vue'], // 匹配所有 .vue 文件
    languageOptions: {
      parser: vueParser, // 使用 Vue 解析器解析 .vue 文件
      parserOptions: {
        parser: tsParser, // 在 <script> 标签中使用 TypeScript 解析器
        ecmaVersion: 2021, // 支持 ES2021 语法
        sourceType: 'module', // 使用 ES 模块
        ecmaFeatures: {
          jsx: true // 支持 JSX 语法
        }
      }
    },
    plugins: {
      vue: vuePlugin, // 注册 Vue 插件
      '@typescript-eslint': tsPlugin // 注册 TypeScript 插件以支持 Vue 文件中的 TS 规则
    },
    rules: {
      // 应用 Vue 3 推荐规则
      ...vuePlugin.configs['vue3-recommended'].rules,
      // 关闭 props 解构检查（Vue 3 Composition API 中常用）
      'vue/no-setup-props-destructure': 'off',
      // 警告未定义的属性使用
      'vue/no-undef-properties': 'warn',
      // 关闭组件名必须多单词的限制
      'vue/multi-word-component-names': 'off',
      // 关闭模板中组件名大小写检查
      'vue/component-name-in-template-casing': 'off',
      // 关闭变量使用前定义检查（Vue文件中的 script setup 语法需要）
      '@typescript-eslint/no-use-before-define': 'off',
      // 未使用变量改为警告而非错误
      '@typescript-eslint/no-unused-vars': 'warn',
      // 未使用变量改为警告而非错误（普通JS规则）
      'no-unused-vars': 'warn'
    }
  },

  // 专门针对 .ts 文件的 lint 配置
  {
    files: ['**/*.ts'], // 匹配所有 .ts 文件
    languageOptions: {
      parser: tsParser // 使用 TypeScript 解析器
    },
    plugins: {
      '@typescript-eslint': tsPlugin // 注册 TypeScript 插件
    },
    rules: {
      // 应用 TypeScript 推荐规则
      ...tsPlugin.configs.recommended.rules,
      // 关闭变量使用前定义检查
      '@typescript-eslint/no-use-before-define': 'off',
      // 未使用变量改为警告而非错误
      '@typescript-eslint/no-unused-vars': 'warn',
      // 允许使用 any 类型
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许空接口声明
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  // 集成 Prettier 代码格式化工具
  prettierPlugin,

  // 应用于所有文件的通用规则设置
  {
    rules: {
      // 关闭数组回调返回值检查
      'array-callback-return': 'off',
      // 关闭导入顺序检查
      'import/order': 'off',
      // 关闭 Vue 属性简写偏好检查
      'vue/prefer-true-attribute-shorthand': 'off',
      // 允许使用 console
      'no-console': 'off',
      // 关闭未定义变量检查（由 TypeScript 处理）
      'no-undef': 'off',
      // 未使用变量改为警告而非错误
      'no-unused-vars': 'warn',
      // Prettier 格式化规则配置
      'prettier/prettier': [
        'warn',
        {
          printWidth: 120, // 每行最大字符数
          tabWidth: 2, // 缩进空格数
          useTabs: false, // 使用空格而非制表符
          semi: false, // 不使用分号
          singleQuote: true, // 使用单引号
          quoteProps: 'as-needed', // 仅在需要时给对象属性加引号
          jsxSingleQuote: false, // JSX 中使用双引号
          trailingComma: 'none', // 不使用尾随逗号
          bracketSpacing: true, // 对象字面量中括号前后加空格
          bracketSameLine: false, // 多行元素的 > 放在新行
          arrowParens: 'avoid', // 箭头函数单参数时不加括号
          proseWrap: 'preserve', // 保持原有的换行
          htmlWhitespaceSensitivity: 'ignore', // 忽略 HTML 空白敏感性
          vueIndentScriptAndStyle: false, // Vue 文件中不缩进 <script> 和 <style>
          endOfLine: 'lf', // 使用 LF 换行符
          embeddedLanguageFormatting: 'auto', // 自动格式化嵌入的代码
          singleAttributePerLine: false // 不强制单行单属性
        }
      ]
    },
    // 模块解析设置
    settings: {
      // 指定核心模块，避免导入检查报错
      'import/core-modules': [
        'uno.css', // UnoCSS 样式
        '~icons/*', // 图标模块
        'virtual:svg-icons-register' // SVG 图标注册
      ]
    }
  },

  {
    files: ['./scripts/*.ts'], // 匹配 scripts 目录下的 .ts 文件
    rules: {
      // 允许未使用的表达式（脚本文件中常见）
      'no-unused-expressions': 'off'
    }
  }
]
