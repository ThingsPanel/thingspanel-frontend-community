#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * 提取所有 console.log 语句的位置和内容
 * 支持嵌套括号、字符串中的括号、模板字符串等复杂情况
 */
function findConsoleLogs(code) {
  const results = []
  const regex = /console\.log\s*\(/g
  let match

  while ((match = regex.exec(code)) !== null) {
    const start = match.index
    let pos = match.index + match[0].length
    let depth = 1
    let inString = false
    let stringChar = ''
    let escaped = false

    while (pos < code.length && depth > 0) {
      const char = code[pos]

      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (!inString && (char === '"' || char === "'" || char === '`')) {
        inString = true
        stringChar = char
      } else if (inString && char === stringChar) {
        inString = false
        stringChar = ''
      } else if (!inString) {
        if (char === '(') {
          depth++
        } else if (char === ')') {
          depth--
        }
      }

      pos++
    }

    if (depth === 0) {
      results.push({
        start,
        end: pos,
        content: code.substring(start, pos)
      })
    }
  }

  return results.reverse() // 反转数组，从后往前删除避免索引变化
}

/**
 * 分析 console.log 的上下文环境，判断如何安全删除
 */
function analyzeConsoleLogContext(code, start, end) {
  // 获取 console.log 前面的代码片段 (最多 300 个字符)
  const beforeCode = code.substring(Math.max(0, start - 300), start)
  // 获取 console.log 后面的代码片段 (最多 100 个字符)
  const afterCode = code.substring(end, Math.min(code.length, end + 100))

  // 检查是否在 try-catch-finally 块中
  const tryBlockPatterns = [
    /try\s*\{\s*$/, // try {
    /catch\s*\([^)]*\)\s*\{\s*$/, // catch (error) {
    /finally\s*\{\s*$/ // finally {
  ]

  const isInTryBlock = tryBlockPatterns.some(pattern => pattern.test(beforeCode.trim()))

  // 检查是否是 try-catch 块中的唯一语句
  const isTryCatchOnlyStatement = /try\s*\{\s*$/.test(beforeCode.trim()) && /^\s*\}\s*catch/.test(afterCode)

  const isCatchOnlyStatement = /catch\s*\([^)]*\)\s*\{\s*$/.test(beforeCode.trim()) && /^\s*\}/.test(afterCode)

  // 检查是否在箭头函数中 - 更精确的匹配
  const arrowFunctionPatterns = [
    /=>\s*$/, // 基本箭头函数: () =>
    /=>\s*console\.log/, // 直接跟console.log
    /"[^"]*=>\s*$/, // Vue模板中: @click="() =>
    /'[^']*=>\s*$/ // Vue模板中: @click='() =>
  ]

  const isInArrowFunction = arrowFunctionPatterns.some(pattern => pattern.test(beforeCode))

  // 检查是否在 Vue 模板的事件处理器中
  // 更精确的 Vue 事件处理器检测
  const vueEventPattern = /@\w+\s*=\s*["'][^"']*=>\s*console\.log/
  const isInVueEventHandler = vueEventPattern.test(beforeCode + 'console.log')

  // 检查 console.log 后是否直接跟着引号结束 (Vue 模板场景)
  const endsWithQuote = /^\s*["']/.test(afterCode)

  // 更通用的箭头函数检测 - 检查前面是否有 =>
  const hasArrowBefore = /=>\s*$/.test(beforeCode.trim())

  // 检查是否整行只有 console.log
  const lines = code.split('\n')
  let lineStart = code.lastIndexOf('\n', start - 1) + 1
  let lineEnd = code.indexOf('\n', end)
  if (lineEnd === -1) lineEnd = code.length

  const currentLine = code.substring(lineStart, lineEnd)
  const beforeLogInLine = code.substring(lineStart, start)
  const afterLogInLine = code.substring(end, lineEnd)

  const lineWithoutLog = (beforeLogInLine + afterLogInLine).trim()
  const isFullLine = lineWithoutLog === '' || lineWithoutLog === ';'

  // 检查是否在对象属性中
  const isInObjectProperty = /:\s*$/.test(beforeCode.trim())

  // 检查是否在函数调用的参数中
  const isInFunctionCall = /\(\s*$/.test(beforeCode.trim()) && /^\s*[,)]/.test(afterCode)

  // 检查是否在注释中
  const isInComment = checkIfInComment(code, start, end)

  return {
    isFullLine,
    isInArrowFunction,
    isInVueEventHandler,
    isInObjectProperty,
    isInFunctionCall,
    isInTryBlock,
    isTryCatchOnlyStatement,
    isCatchOnlyStatement,
    isInComment,
    endsWithQuote,
    hasArrowBefore,
    lineStart,
    lineEnd,
    beforeCode: beforeCode.slice(-80), // 调试用
    afterCode: afterCode.slice(0, 40) // 调试用
  }
}

/**
 * 检查 console.log 是否在注释中
 */
function checkIfInComment(code, start, end) {
  // 找到 console.log 所在的行
  const lineStart = code.lastIndexOf('\n', start - 1) + 1
  const lineEnd = code.indexOf('\n', start)
  const currentLine = code.substring(lineStart, lineEnd === -1 ? code.length : lineEnd)

  // 检查是否在单行注释中 // console.log(...)
  const singleLineCommentIndex = currentLine.indexOf('//')
  if (singleLineCommentIndex !== -1) {
    const consoleLogInLineIndex = start - lineStart
    if (consoleLogInLineIndex > singleLineCommentIndex) {
      return true
    }
  }

  // 检查是否在多行注释中 /* console.log(...) */
  const beforeConsoleLog = code.substring(0, start)
  const afterConsoleLog = code.substring(end)

  // 向前查找最近的 /* 和 */
  const lastMultiCommentStart = beforeConsoleLog.lastIndexOf('/*')
  const lastMultiCommentEnd = beforeConsoleLog.lastIndexOf('*/')

  // 向后查找最近的 */
  const nextMultiCommentEnd = afterConsoleLog.indexOf('*/')

  // 如果最近的 /* 在最近的 */ 之后，且后面有对应的 */，说明在多行注释中
  if (lastMultiCommentStart > lastMultiCommentEnd && nextMultiCommentEnd !== -1) {
    return true
  }

  return false
}

/**
 * 从代码中移除所有 console.log 语句
 * 智能处理各种语法结构，避免破坏代码
 */
function removeConsoleLogs(code) {
  const consoleLogs = findConsoleLogs(code)
  let result = code

  consoleLogs.forEach(log => {
    const beforeLog = result.substring(0, log.start)
    const afterLog = result.substring(log.end)

    // 分析上下文
    const context = analyzeConsoleLogContext(result, log.start, log.end)

    // 如果在注释中，跳过不处理
    if (context.isInComment) {
      return // 跳过这个 console.log，不做任何处理
    }

    if (context.isFullLine) {
      // 整行只有 console.log，删除整行包括换行符
      const lineStart = context.lineStart
      const lineEnd = context.lineEnd + (context.lineEnd < result.length ? 1 : 0) // +1 for \n
      result = result.substring(0, lineStart) + result.substring(lineEnd)
    } else if (context.isTryCatchOnlyStatement) {
      // try 块中只有 console.log，需要保持语法完整
      result = beforeLog + '// try block content removed' + afterLog
    } else if (context.isCatchOnlyStatement) {
      // catch 块中只有 console.log，需要保持语法完整
      result = beforeLog + '// catch block content removed' + afterLog
    } else if (context.isInTryBlock) {
      // 在 try-catch 块中，但不是唯一语句，直接删除
      result = beforeLog + afterLog
    } else if (context.hasArrowBefore && context.endsWithQuote) {
      // 箭头函数 + 引号结尾的情况（主要是Vue模板）
      // () => console.log(...)" 变成 () => {}"
      result = beforeLog + '{}' + afterLog
    } else if (context.hasArrowBefore) {
      // 普通箭头函数，不在引号中
      result = beforeLog + 'void 0' + afterLog
    } else if (context.isInVueEventHandler) {
      // Vue 模板事件处理器的其他情况
      result = beforeLog + '{}' + afterLog
    } else if (context.isInArrowFunction) {
      // 其他箭头函数情况的兜底
      if (context.endsWithQuote) {
        result = beforeLog + '{}' + afterLog
      } else {
        result = beforeLog + 'void 0' + afterLog
      }
    } else if (context.isInObjectProperty) {
      // 在对象属性中，替换为 undefined
      result = beforeLog + 'undefined' + afterLog
    } else if (context.isInFunctionCall) {
      // 在函数调用参数中，替换为 undefined
      result = beforeLog + 'undefined' + afterLog
    } else {
      // 其他情况，直接删除
      result = beforeLog + afterLog
    }
  })

  return result
}

/**
 * 递归获取指定目录下的所有文件
 */
function getAllFiles(dir, fileTypes = ['.js', '.ts', '.vue']) {
  const files = []

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        // 跳过 node_modules、dist、.git 等目录
        if (!['node_modules', 'dist', 'build', '.git', '.nuxt', '.next', 'coverage'].includes(entry.name)) {
          traverse(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (fileTypes.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  traverse(dir)
  return files
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8')
    const cleanedContent = removeConsoleLogs(originalContent)

    if (originalContent !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8')

      // 统计删除的 console.log 数量
      const originalLogs = findConsoleLogs(originalContent)
      const remainingLogs = findConsoleLogs(cleanedContent)
      const removedCount = originalLogs.length - remainingLogs.length

      return removedCount
    }

    return 0
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message)
    return 0
  }
}

/**
 * 主函数
 */
function main() {
  const projectRoot = process.cwd()

  // 获取所有需要处理的文件
  const files = getAllFiles(projectRoot)

  let totalRemoved = 0
  let processedFiles = 0

  // 处理每个文件
  files.forEach(filePath => {
    const removed = processFile(filePath)
    if (removed > 0) {
      totalRemoved += removed
      processedFiles++
    }
  })

  if (totalRemoved === 0) {
  }
}

// 运行脚本
const __filename = fileURLToPath(import.meta.url)
if (process.argv[1] === __filename) {
  main()
}

export { findConsoleLogs, removeConsoleLogs, processFile, getAllFiles }
