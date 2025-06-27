import fs from 'fs';
import path from 'path';

// 递归提取对象的所有键值对，支持前缀
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

// 处理单个语言包文件
function processLocaleFile(filePath, filePrefix = '') {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 移除 import 语句和 export 语句
    content = content.replace(/import.*?from.*?;?\n?/g, '');
    content = content.replace(/export\s+(default\s+)?/g, '');
    
    // 简单的文本处理
    content = content.replace(/const\s+\w+:\s*\w+\.\w+\.\w+\s*=\s*{/, '{');
    
    // 尝试解析为对象
    const obj = eval(`(${content})`);
    
    // 如果有文件前缀，则添加到所有键上
    if (filePrefix) {
      return flattenObject(obj, filePrefix);
    } else {
      return flattenObject(obj);
    }
  } catch (error) {
    console.log(`⚠️  无法处理文件 ${filePath}: ${error.message}`);
    return {};
  }
}

// 递归处理语言包目录
function processLocaleDirectory(dirPath, prefix = '') {
  let allKeys = {};
  
  if (!fs.existsSync(dirPath)) {
    return allKeys;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      const subPrefix = prefix ? `${prefix}.${file}` : file;
      const subKeys = processLocaleDirectory(filePath, subPrefix);
      Object.assign(allKeys, subKeys);
    } else if (file.endsWith('.ts') && file !== 'index.ts') {
      // 处理 TypeScript 文件
      const fileName = path.basename(file, '.ts');
      const filePrefix = prefix ? `${prefix}.${fileName}` : fileName;
      
      console.log(`📄 处理文件: ${filePath} (前缀: ${filePrefix})`);
      const keys = processLocaleFile(filePath, filePrefix);
      Object.assign(allKeys, keys);
    } else if (file === 'index.ts') {
      // 处理入口文件（通常是直接导出，不添加文件名前缀）
      console.log(`📄 处理索引文件: ${filePath}`);
      const keys = processLocaleFile(filePath);
      Object.assign(allKeys, keys);
    }
  });
  
  return allKeys;
}

// 主函数
function main() {
  console.log('🔍 完整提取所有语言包键值対（含前缀）...\n');
  
  const allKeys = {};
  
  // 处理中文语言包根目录
  const zhCnPath = 'src/locales/langs/zh-cn';
  
  // 直接处理根目录下的文件
  const rootFiles = [
    'card.ts',
    'generate.ts', 
    'custom.ts',
    'device_template.ts',
    'dashboard_panel.ts',
    'form.ts',
    'dropdown.ts',
    'icon.ts',
    'theme.ts',
    'common.ts',
    'page.ts'
  ];
  
  rootFiles.forEach(file => {
    const filePath = path.join(zhCnPath, file);
    if (fs.existsSync(filePath)) {
      const fileName = path.basename(file, '.ts');
      console.log(`📄 处理根文件: ${filePath} (前缀: ${fileName})`);
      const keys = processLocaleFile(filePath, fileName);
      Object.assign(allKeys, keys);
    }
  });
  
  // 处理 page 子目录
  const pageDir = path.join(zhCnPath, 'page');
  if (fs.existsSync(pageDir)) {
    console.log('\n📁 处理 page 子目录...');
    const pageKeys = processLocaleDirectory(pageDir, 'page');
    Object.assign(allKeys, pageKeys);
  }
  
  console.log(`\n📊 总共提取了 ${Object.keys(allKeys).length} 个键值对`);
  
  // 保存完整的键值映射
  fs.writeFileSync('complete-key-value-map.json', JSON.stringify(allKeys, null, 2), 'utf8');
  console.log('✅ 完整键值映射已保存到 complete-key-value-map.json');
  
  // 生成 JavaScript 格式的映射对象
  let output = 'const completeKeyValueMap = {\n';
  
  Object.entries(allKeys).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // 转义特殊字符
      const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      output += `  '${key}': '${escapedValue}',\n`;
    }
  });
  
  output += '};\n\nexport default completeKeyValueMap;';
  
  fs.writeFileSync('complete-key-value-map.mjs', output, 'utf8');
  console.log('✅ JavaScript 格式的映射已保存到 complete-key-value-map.mjs');
  
  // 显示一些示例
  console.log('\n📝 示例键值对:');
  Object.entries(allKeys).slice(0, 20).forEach(([key, value]) => {
    console.log(`  ${key} → ${value}`);
  });
  
  if (Object.keys(allKeys).length > 20) {
    console.log(`  ... 还有 ${Object.keys(allKeys).length - 20} 个未显示`);
  }
}

main(); 