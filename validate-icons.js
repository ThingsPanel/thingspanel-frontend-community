/**
 * 图标兼容性验证脚本
 * 检查项目中使用的 @vicons/ionicons5 图标是否都存在
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 已知存在的 ionicons5 图标列表（常用的）
const validIcons = [
  'AddOutline',
  'ArrowBackOutline',
  'ArrowForwardOutline',
  'CheckmarkOutline',
  'CloseOutline',
  'CopyOutline',
  'CreateOutline',
  'DocumentOutline',
  'DownloadOutline',
  'EllipsisHorizontalOutline',
  'EyeOutline',
  'FlashOutline',
  'FunnelOutline',
  'GridOutline',
  'HelpOutline',
  'HomeOutline',
  'InformationCircleOutline',
  'ListOutline',
  'MenuOutline',
  'OptionsOutline',
  'PlayOutline',
  'RefreshOutline',
  'SaveOutline',
  'SearchOutline',
  'SettingsOutline',
  'StarOutline',
  'SwapHorizontalOutline',
  'TrashOutline',
  'WarningOutline'
]

// 已知不存在的图标（需要替换）
const invalidIcons = [
  'DocumentDuplicateOutline', // 应该用 DocumentOutline 或 CopyOutline
  'AlignHorizontalCenter' // 应该用 OptionsOutline 或其他
]

/**
 * 扫描文件中的图标导入
 */
function scanFileForIcons(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // 匹配从 @vicons/ionicons5 导入的图标
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@vicons\/ionicons5['"]/g
    const iconUsageRegex = /(\w+Outline)/g

    const foundIcons = new Set()

    // 查找导入语句中的图标
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1]
      const icons = imports
        .split(',')
        .map(icon => icon.trim())
        .filter(Boolean)
      icons.forEach(icon => foundIcons.add(icon))
    }

    // 查找使用中的图标（在模板和脚本中）
    while ((match = iconUsageRegex.exec(content)) !== null) {
      const icon = match[1]
      if (icon.endsWith('Outline')) {
        foundIcons.add(icon)
      }
    }

    return Array.from(foundIcons)
  } catch (error) {
    console.warn(`读取文件失败: ${filePath}`, error.message)
    return []
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir, extensions = ['.vue', '.ts', '.js']) {
  const results = []

  try {
    const files = fs.readdirSync(dir)

    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        // 跳过 node_modules 和其他无关目录
        if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
          results.push(...scanDirectory(filePath, extensions))
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const icons = scanFileForIcons(filePath)
        if (icons.length > 0) {
          results.push({ file: filePath, icons })
        }
      }
    }
  } catch (error) {
    console.warn(`扫描目录失败: ${dir}`, error.message)
  }

  return results
}

/**
 * 验证图标
 */
function validateIcons() {
  console.log('🔍 开始扫描项目中的图标使用...')

  const srcDir = path.join(__dirname, 'src')
  const scanResults = scanDirectory(srcDir)

  const allIcons = new Set()
  const invalidUsages = []

  // 收集所有使用的图标
  scanResults.forEach(({ file, icons }) => {
    icons.forEach(icon => {
      allIcons.add(icon)

      // 检查是否是已知的无效图标
      if (invalidIcons.includes(icon)) {
        invalidUsages.push({ file, icon })
      }
    })
  })

  console.log(`📊 扫描结果:`)
  console.log(`- 扫描文件数: ${scanResults.length}`)
  console.log(`- 发现图标数: ${allIcons.size}`)
  console.log(`- 使用的图标: ${Array.from(allIcons).join(', ')}`)

  // 检查无效图标
  if (invalidUsages.length > 0) {
    console.log('\n❌ 发现无效图标:')
    invalidUsages.forEach(({ file, icon }) => {
      console.log(`  - ${icon} in ${file}`)
    })

    console.log('\n💡 建议替换:')
    invalidUsages.forEach(({ icon }) => {
      switch (icon) {
        case 'DocumentDuplicateOutline':
          console.log(`  - ${icon} → DocumentOutline 或 CopyOutline`)
          break
        case 'AlignHorizontalCenter':
          console.log(`  - ${icon} → OptionsOutline 或 MenuOutline`)
          break
        default:
          console.log(`  - ${icon} → 需要查找合适的替代品`)
      }
    })
  } else {
    console.log('\n✅ 所有图标都有效！')
  }

  // 检查可能有问题的图标
  const suspiciousIcons = Array.from(allIcons).filter(
    icon => !validIcons.includes(icon) && !invalidIcons.includes(icon)
  )

  if (suspiciousIcons.length > 0) {
    console.log('\n⚠️ 需要验证的图标:')
    suspiciousIcons.forEach(icon => {
      console.log(`  - ${icon} (请确认此图标在 @vicons/ionicons5 中存在)`)
    })
  }

  return {
    totalFiles: scanResults.length,
    totalIcons: allIcons.size,
    invalidCount: invalidUsages.length,
    suspiciousCount: suspiciousIcons.length,
    isValid: invalidUsages.length === 0
  }
}

// 如果作为脚本运行
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateIcons()
  process.exit(result.isValid ? 0 : 1)
}

export { validateIcons }
