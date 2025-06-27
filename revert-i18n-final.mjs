import fs from 'fs';
import path from 'path';

// 导入完整的键值映射表
const keyValueMapContent = fs.readFileSync('complete-key-value-map.json', 'utf8');
const keyValueMap = JSON.parse(keyValueMapContent);

console.log(`📋 载入了 ${Object.keys(keyValueMap).length} 个翻译键值对`);

let totalReplacements = 0;
let processedFiles = 0;
let totalUnmappedKeys = new Set();

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
    
    // 更精确的正则表达式，匹配各种 $t() 调用模式
    const patterns = [
      // 标准格式：$t('key') 或 $t("key")
      {
        pattern: /\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, value) => `"${value}"`
      },
      // 在对象字面量中：title: $t('key')
      {
        pattern: /(\w+):\s*\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, prop, key, value) => `${prop}: "${value}"`
      },
      // 在模板中：{{ $t('key') }}
      {
        pattern: /\{\{\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\}\}/g,
        replace: (match, key, value) => `{{ "${value}" }}`
      },
      // 在数组中：[$t('key')]
      {
        pattern: /\[\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\]/g,
        replace: (match, key, value) => `["${value}"]`
      },
      // 在函数参数中：func($t('key'))
      {
        pattern: /\(\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\)/g,
        replace: (match, key, value) => `("${value}")`
      },
      // 简单的 t() 调用（不带$）
      {
        pattern: /(?<![\w$])\bt\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, value) => `"${value}"`
      }
    ];
    
    // 对每种模式进行替换
    patterns.forEach(({ pattern, replace }) => {
      content = content.replace(pattern, (match, ...args) => {
        // 提取键名（通常是第一个或第二个参数）
        let key;
        if (args.length >= 2 && typeof args[1] === 'string') {
          key = args[1]; // 对象字面量的情况
        } else {
          key = args[0]; // 其他情况
        }
        
        if (keyValueMap[key]) {
          hasChanges = true;
          replacements++;
          console.log(`  ✅ ${match} → "${keyValueMap[key]}"`);
          
          // 调用替换函数
          if (args.length >= 2 && typeof args[1] === 'string') {
            return replace(match, args[0], key, keyValueMap[key]);
          } else {
            return replace(match, key, keyValueMap[key]);
          }
        } else {
          unmappedKeys.add(key);
          return match; // 保持原样
        }
      });
    });
    
    // 处理一些特殊的模板字符串情况
    // 如: `${$t('key')}`
    content = content.replace(/\$\{([^}]*)\$t\(['"`]([^'"`]+)['"`]\)([^}]*)\}/g, (match, before, key, after) => {
      if (keyValueMap[key]) {
        hasChanges = true;
        replacements++;
        console.log(`  ✅ ${match} → \`${before}"${keyValueMap[key]}"${after}\``);
        return `\`${before}"${keyValueMap[key]}"${after}\``;
      } else {
        unmappedKeys.add(key);
        return match;
      }
    });
    
    // 如果内容有变化，写回文件
    if (hasChanges && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      processedFiles++;
      totalReplacements += replacements;
      console.log(`\n📄 ${filePath} - 替换了 ${replacements} 个翻译`);
    }
    
    // 收集未映射的键
    unmappedKeys.forEach(key => totalUnmappedKeys.add(key));
    
    // 只在有未映射键时显示警告
    if (unmappedKeys.size > 0) {
      console.log(`⚠️  ${filePath} 中有 ${unmappedKeys.size} 个未映射的键`);
      if (unmappedKeys.size <= 5) {
        Array.from(unmappedKeys).forEach(key => console.log(`    - ${key}`));
      } else {
        Array.from(unmappedKeys).slice(0, 5).forEach(key => console.log(`    - ${key}`));
        console.log(`    ... 还有 ${unmappedKeys.size - 5} 个未显示`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 生成报告函数
function generateReport() {
  console.log('\n📊 === 逆向国际化完成报告 ===');
  console.log(`✅ 处理了 ${processedFiles} 个文件`);
  console.log(`✅ 总共替换了 ${totalReplacements} 个翻译调用`);
  console.log(`✅ 使用了 ${Object.keys(keyValueMap).length} 个键值映射`);
  console.log(`⚠️  发现 ${totalUnmappedKeys.size} 个未映射的键`);
  
  if (totalUnmappedKeys.size > 0) {
    // 保存未映射的键到文件
    fs.writeFileSync('final-unmapped-keys.json', JSON.stringify(Array.from(totalUnmappedKeys), null, 2), 'utf8');
    console.log('📁 未映射的键已保存到 final-unmapped-keys.json');
    
    console.log('\n📝 未映射键示例:');
    Array.from(totalUnmappedKeys).slice(0, 10).forEach(key => {
      console.log(`  - ${key}`);
    });
    if (totalUnmappedKeys.size > 10) {
      console.log(`  ... 还有 ${totalUnmappedKeys.size - 10} 个未显示`);
    }
  }
  
  console.log('\n📝 建议下一步操作:');
  console.log('  1. 检查所有文件的替换结果是否正确');
  console.log('  2. 手动处理动态 $t() 调用（如：$t(variable)）');
  console.log('  3. 处理未映射的键（可能需要手动添加翻译）');
  console.log('  4. 清理不需要的国际化相关代码和导入');
  console.log('  5. 删除 i18n 相关的依赖和配置');
}

// 主函数
function main() {
  console.log('🚀 开始最终的逆向国际化重构...');
  console.log('📝 将会把所有 $t() 调用替换为中文原文\n');
  
  // 备份提醒
  console.log('⚠️  重要提醒: 请确保您已经备份了代码!\n');
  
  // 处理源码目录
  processDirectory('./src');
  
  // 生成报告
  generateReport();
  
  console.log('\n🎉 逆向国际化重构完成！');
  console.log('🔍 请检查修改的文件确保替换正确');
}

// 运行主函数
main(); 