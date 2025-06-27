import fs from 'fs';
import path from 'path';

// 递归提取对象的所有键值对
function flattenObject(obj, prefix = '') {
  let result = {};
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  
  return result;
}

// 处理中文语言包文件
function processLocaleFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 移除 import 语句，只保留对象部分
    content = content.replace(/import.*?from.*?;?\n?/g, '');
    content = content.replace(/export\s+(default\s+)?/g, '');
    
    // 简单的文本处理，移除一些复杂的语法
    content = content.replace(/const\s+\w+:\s*\w+\.\w+\.\w+\s*=\s*{/, '{');
    
    // 尝试解析为对象
    const obj = eval(`(${content})`);
    return flattenObject(obj);
  } catch (error) {
    console.log(`⚠️  无法处理文件 ${filePath}: ${error.message}`);
    return {};
  }
}

// 主函数
function main() {
  console.log('🔍 提取所有语言包键值对...\n');
  
  const allKeys = {};
  
  // 处理主要的中文语言包文件
  const localeFiles = [
    'src/locales/langs/zh-cn.ts',
    'src/locales/langs/zh-cn/card.ts',
    'src/locales/langs/zh-cn/generate.ts',
    'src/locales/langs/zh-cn/custom.ts',
    'src/locales/langs/zh-cn/device_template.ts',
    'src/locales/langs/zh-cn/dashboard_panel.ts',
    'src/locales/langs/zh-cn/form.ts',
    'src/locales/langs/zh-cn/dropdown.ts',
    'src/locales/langs/zh-cn/icon.ts',
    'src/locales/langs/zh-cn/theme.ts',
    'src/locales/langs/zh-cn/page/product.ts'
  ];
  
  localeFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📄 处理文件: ${file}`);
      const keys = processLocaleFile(file);
      Object.assign(allKeys, keys);
    }
  });
  
  console.log(`\n📊 总共提取了 ${Object.keys(allKeys).length} 个键值对`);
  
  // 生成 JavaScript 格式的映射对象
  let output = 'const keyValueMap = {\n';
  
  Object.entries(allKeys).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // 转义特殊字符
      const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      output += `  '${key}': '${escapedValue}',\n`;
    }
  });
  
  output += '};\n\nexport default keyValueMap;';
  
  fs.writeFileSync('key-value-map.mjs', output, 'utf8');
  console.log('\n✅ 键值映射已保存到 key-value-map.mjs');
  
  // 同时生成 JSON 格式方便查看
  fs.writeFileSync('key-value-map.json', JSON.stringify(allKeys, null, 2), 'utf8');
  console.log('✅ 键值映射已保存到 key-value-map.json');
}

main(); 