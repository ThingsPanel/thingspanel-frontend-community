import fs from 'fs';
import path from 'path';

// 已有的键值映射
const keyValueMapContent = fs.readFileSync('key-value-map.json', 'utf8');
const existingKeys = new Set(Object.keys(JSON.parse(keyValueMapContent)));

console.log(`📋 已有键值对: ${existingKeys.size} 个`);

// 收集所有未映射的键
const unmappedKeys = new Set();

// 递归查找所有 $t() 调用
function findAllTranslationKeys(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        findAllTranslationKeys(filePath);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      if (!filePath.includes('locales/') && !file.includes('.d.ts')) {
        extractKeysFromFile(filePath);
      }
    }
  });
}

function extractKeysFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 匹配所有 $t() 调用
    const patterns = [
      /\$t\(['"`]([^'"`]+)['"`]\)/g,
      /\bt\(['"`]([^'"`]+)['"`]\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        if (!existingKeys.has(key)) {
          unmappedKeys.add(key);
        }
      }
    });
  } catch (error) {
    console.error(`处理文件出错 ${filePath}:`, error.message);
  }
}

// 尝试从其他文件中查找键值对
function findMissingKeysInLocales() {
  console.log('\n🔍 尝试从其他语言包文件中查找未映射的键...\n');
  
  const additionalKeys = {};
  
  // 检查更多语言包文件
  const additionalLocaleFiles = [
    'src/locales/langs/zh-cn/common.ts',
    'src/locales/langs/zh-cn/page.ts'
  ];
  
  // 递归检查 page 目录下的所有文件
  const pageDir = 'src/locales/langs/zh-cn/page';
  if (fs.existsSync(pageDir)) {
    const pageFiles = fs.readdirSync(pageDir, { recursive: true });
    pageFiles.forEach(file => {
      if (typeof file === 'string' && file.endsWith('.ts')) {
        additionalLocaleFiles.push(path.join(pageDir, file));
      }
    });
  }
  
  additionalLocaleFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`📄 检查文件: ${file}`);
      const keys = processLocaleFile(file);
      Object.assign(additionalKeys, keys);
    }
  });
  
  return additionalKeys;
}

// 处理语言包文件
function processLocaleFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 移除 import 语句
    content = content.replace(/import.*?from.*?;?\n?/g, '');
    content = content.replace(/export\s+(default\s+)?/g, '');
    
    // 简单处理
    content = content.replace(/const\s+\w+:\s*\w+\.\w+\.\w+\s*=\s*{/, '{');
    
    const obj = eval(`(${content})`);
    return flattenObject(obj);
  } catch (error) {
    console.log(`⚠️  无法处理文件 ${filePath}: ${error.message}`);
    return {};
  }
}

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

// 主函数
function main() {
  console.log('🔍 收集所有未映射的翻译键...\n');
  
  // 查找所有翻译键
  findAllTranslationKeys('./src');
  
  console.log(`\n📊 发现 ${unmappedKeys.size} 个未映射的键\n`);
  
  // 尝试从其他语言包中找到这些键
  const additionalKeys = findMissingKeysInLocales();
  
  console.log(`\n📊 从其他语言包中找到 ${Object.keys(additionalKeys).length} 个额外键值对`);
  
  // 检查有多少未映射的键可以在额外的键中找到
  let foundCount = 0;
  const foundKeys = {};
  
  Array.from(unmappedKeys).forEach(key => {
    if (additionalKeys[key]) {
      foundKeys[key] = additionalKeys[key];
      foundCount++;
    }
  });
  
  console.log(`\n✅ 在额外语言包中找到 ${foundCount} 个未映射键的值`);
  
  // 保存所有未映射的键到文件
  fs.writeFileSync('unmapped-keys.json', JSON.stringify(Array.from(unmappedKeys), null, 2), 'utf8');
  console.log('📁 所有未映射的键已保存到 unmapped-keys.json');
  
  // 保存找到的键值对
  if (Object.keys(foundKeys).length > 0) {
    fs.writeFileSync('found-additional-keys.json', JSON.stringify(foundKeys, null, 2), 'utf8');
    console.log('📁 找到的额外键值对已保存到 found-additional-keys.json');
  }
  
  // 显示一些示例未映射键
  console.log('\n📝 示例未映射键:');
  Array.from(unmappedKeys).slice(0, 20).forEach(key => {
    console.log(`  - ${key}`);
  });
  
  if (unmappedKeys.size > 20) {
    console.log(`  ... 还有 ${unmappedKeys.size - 20} 个未显示`);
  }
}

main(); 