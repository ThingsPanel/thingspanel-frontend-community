import re

# Read the file
with open('src/card2.1/hooks/useCard2Props.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the isDataFromWarehouse check
old_pattern = r'''    // 🔥 关键修复：检查数据是否来自DataWarehouse且包含组件需要的字段
    const isDataFromWarehouse = hasValidDataSource &&
      // 检查是否包含组件需要的基本字段（如value, unit等）
      Object\.keys\(currentData\)\.some\(key =>
        \['value', 'unit', 'metricsName', 'data', 'title', 'amount', 'description', 'timestamp'\]\.includes\(key\)
      \)'''

new_code = '''    // 🔥 关键修复：检查数据是否来自DataWarehouse且包含组件需要的字段
    // 支持嵌套结构（如 { main: { data: { value, ... } } }）
    const isDataFromWarehouse = hasValidDataSource && (() => {
      const dataKeys = Object.keys(currentData)

      // 检查顶层是否包含组件需要的基本字段
      const hasDirectFields = dataKeys.some(key =>
        ['value', 'unit', 'metricsName', 'data', 'title', 'amount', 'description', 'timestamp'].includes(key)
      )

      if (hasDirectFields) return true

      // 🔥 关键修复：检查是否是数据源嵌套结构（如 { main: { data: {...} }, secondary: {...} }）
      const hasNestedData = dataKeys.some(key => {
        const value = currentData[key]
        return value && typeof value === 'object' && ('data' in value || 'type' in value)
      })

      return hasNestedData
    })()'''

content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE)

# Write the modified content back
with open('src/card2.1/hooks/useCard2Props.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("修复完成")
