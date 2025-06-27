import fs from 'fs';
import path from 'path';

// 导入完整的键值映射表
const keyValueMapContent = fs.readFileSync('key-value-map.json', 'utf8');
const keyValueMap = JSON.parse(keyValueMapContent);

console.log(`📋 载入了 ${Object.keys(keyValueMap).length} 个翻译键值对`);

// 递归处理目录
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`目录不存在: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过特定目录
      if (!['node_modules', 'locales', '.git', 'dist', 'build', 'public'].includes(file)) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      // 排除一些不需要处理的文件
      if (!file.includes('node_modules') && !file.includes('.d.ts') && !filePath.includes('locales/')) {
        processFile(filePath);
      }
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let replacements = 0;
    let unmappedKeys = new Set();
    let originalContent = content;
    
    // 增强的正则表达式，匹配更多 $t() 调用模式
    const patterns = [
      // 标准格式：$t('key')
      /\$t\(['"`]([^'"`]+)['"`]\)/g,
      // 在表达式中：message: $t('key')
      /:\s*\$t\(['"`]([^'"`]+)['"`]\)/g,
      // 在模板中：{{ $t('key') }}
      /\{\{\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\}\}/g,
      // 在函数调用中：func($t('key'))
      /\(\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\)/g,
      // 在数组中：[$t('key')]
      /\[\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\]/g,
      // 简单的 t() 调用
      /(?<![\w$])\bt\(['"`]([^'"`]+)['"`]\)/g
    ];
    
    // 对每种模式进行替换
    patterns.forEach((pattern, index) => {
      let matches = [...content.matchAll(pattern)];
      
      matches.forEach(match => {
        const fullMatch = match[0];
        const key = match[1];
        
        if (keyValueMap[key]) {
          hasChanges = true;
          replacements++;
          console.log(`  ✅ ${fullMatch} → "${keyValueMap[key]}"`);
          
          // 不同模式需要不同的替换策略
          if (index === 0) { // 标准 $t() 调用
            content = content.replace(fullMatch, `"${keyValueMap[key]}"`);
          } else if (index === 1) { // 在表达式中
            content = content.replace(fullMatch, `: "${keyValueMap[key]}"`);
          } else if (index === 2) { // 在模板中
            content = content.replace(fullMatch, `{{ "${keyValueMap[key]}" }}`);
          } else if (index === 3) { // 在函数调用中
            content = content.replace(fullMatch, `("${keyValueMap[key]}")`);
          } else if (index === 4) { // 在数组中
            content = content.replace(fullMatch, `["${keyValueMap[key]}"]`);
          } else if (index === 5) { // 简单的 t() 调用
            content = content.replace(fullMatch, `"${keyValueMap[key]}"`);
          }
        } else {
          unmappedKeys.add(key);
        }
      });
    });
    
    // 如果内容有变化，写回文件
    if (hasChanges && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`\n📄 ${filePath} - 替换了 ${replacements} 个翻译`);
    }
    
    // 报告未映射的键
    if (unmappedKeys.size > 0) {
      console.log(`⚠️  ${filePath} 中有 ${unmappedKeys.size} 个未映射的键:`);
      Array.from(unmappedKeys).slice(0, 10).forEach(key => console.log(`    - ${key}`));
      if (unmappedKeys.size > 10) {
        console.log(`    ... 还有 ${unmappedKeys.size - 10} 个未显示`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 特殊处理函数 - 处理动态 $t() 调用
function handleDynamicTranslations(filePath, content) {
  let modifiedContent = content;
  
  // 处理一些常见的动态调用模式
  const dynamicPatterns = [
    // 处理 $t(variable) 这种情况，尝试替换为注释提示
    {
      pattern: /\$t\(([a-zA-Z_$][a-zA-Z0-9_$.]*)\)/g,
      replacement: '/* TODO: 动态翻译需要手动处理 */ $t($1)'
    }
  ];
  
  dynamicPatterns.forEach(({ pattern, replacement }) => {
    modifiedContent = modifiedContent.replace(pattern, replacement);
  });
  
  return modifiedContent;
}

// 生成报告函数
function generateReport() {
  console.log('\n📊 处理报告:');
  console.log(`✅ 使用了 ${Object.keys(keyValueMap).length} 个键值映射`);
  console.log('📝 建议下一步操作:');
  console.log('  1. 检查所有"未映射的键"');
  console.log('  2. 手动处理动态 $t() 调用');
  console.log('  3. 检查替换结果是否正确');
  console.log('  4. 清理不需要的国际化相关代码');
}

// 主函数
function main() {
  console.log('🚀 开始完整的逆向国际化重构...');
  console.log('📝 将会把 $t() 调用替换为中文原文\n');
  
  // 备份提醒
  console.log('⚠️  重要提醒: 请确保您已经备份了代码!\n');
  
  // 处理源码目录
  processDirectory('./src');
  
  // 生成报告
  generateReport();
  
  console.log('\n✅ 逆向国际化重构完成！');
}

// 运行主函数
main(); 