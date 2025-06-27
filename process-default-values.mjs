import fs from 'fs';
import path from 'path';

console.log('🚀 开始处理带默认值的 $t() 调用...');

let totalReplacements = 0;
let processedFiles = 0;
let processedCalls = [];

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
    let originalContent = content;
    
    // 处理带默认值的 $t() 调用的各种模式
    const patterns = [
      // 1. 模板中的调用：{{ $t('key', 'default') }}
      {
        pattern: /\{\{\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)\s*\}\}/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → {{ "${defaultValue}" }}`);
          return `{{ "${defaultValue}" }}`;
        }
      },
      
      // 2. 属性绑定中的调用：:title="$t('key', 'default')"
      {
        pattern: /:(\w+)=['"`]\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)['"`]/g,
        replace: (match, attr, key, defaultValue) => {
          console.log(`  ✅ ${match} → :${attr}="${defaultValue}"`);
          return `:${attr}="${defaultValue}"`;
        }
      },
      
      // 3. 普通属性中的调用：title="$t('key', 'default')"
      {
        pattern: /(\w+)=['"`]\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)['"`]/g,
        replace: (match, attr, key, defaultValue) => {
          console.log(`  ✅ ${match} → ${attr}="${defaultValue}"`);
          return `${attr}="${defaultValue}"`;
        }
      },
      
      // 4. 对象字面量中的调用：label: $t('key', 'default')
      {
        pattern: /(\w+):\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, prop, key, defaultValue) => {
          console.log(`  ✅ ${match} → ${prop}: "${defaultValue}"`);
          return `${prop}: "${defaultValue}"`;
        }
      },
      
      // 5. 数组中的调用：[$t('key', 'default')]
      {
        pattern: /\[\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)\s*\]/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → ["${defaultValue}"]`);
          return `["${defaultValue}"]`;
        }
      },
      
      // 6. 函数参数中的调用：func($t('key', 'default'))
      {
        pattern: /\(\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)\s*\)/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → ("${defaultValue}")`);
          return `("${defaultValue}")`;
        }
      },
      
      // 7. 赋值语句中的调用：variable = $t('key', 'default')
      {
        pattern: /=\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → = "${defaultValue}"`);
          return `= "${defaultValue}"`;
        }
      },
      
      // 8. return 语句中的调用：return $t('key', 'default')
      {
        pattern: /return\s+\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → return "${defaultValue}"`);
          return `return "${defaultValue}"`;
        }
      },
      
      // 9. 箭头函数中的调用：() => $t('key', 'default')
      {
        pattern: /\(\s*\)\s*=>\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → () => "${defaultValue}"`);
          return `() => "${defaultValue}"`;
        }
      },
      
      // 10. 一般的带默认值调用：$t('key', 'default')
      {
        pattern: /\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, defaultValue) => {
          console.log(`  ✅ ${match} → "${defaultValue}"`);
          return `"${defaultValue}"`;
        }
      }
    ];
    
    // 对每种模式进行替换
    patterns.forEach(({ pattern, replace }) => {
      content = content.replace(pattern, (match, ...args) => {
        hasChanges = true;
        replacements++;
        
                 // 记录处理的调用 - 需要根据模式确定key和defaultValue的位置
         let key, defaultValue;
         if (match.includes(':') && match.includes('=')) {
           // 属性绑定模式：:attr="$t('key', 'default')"
           key = args[1]; // key
           defaultValue = args[2]; // defaultValue
         } else if (match.includes(':') && !match.includes('=')) {
           // 对象字面量模式：prop: $t('key', 'default')
           key = args[1]; // key
           defaultValue = args[2]; // defaultValue
         } else if (match.includes('=') && !match.includes(':')) {
           // 赋值模式：= $t('key', 'default')
           key = args[0]; // key
           defaultValue = args[1]; // defaultValue
         } else {
           // 一般模式：$t('key', 'default')
           key = args[0]; // key
           defaultValue = args[1]; // defaultValue
         }
         
         processedCalls.push({
           file: filePath,
           original: match,
           key: key,
           defaultValue: defaultValue
         });
        
        return replace(match, ...args);
      });
    });
    
    // 如果内容有变化，写回文件
    if (hasChanges && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      processedFiles++;
      totalReplacements += replacements;
      console.log(`📄 ${filePath} - 替换了 ${replacements} 个带默认值的翻译调用`);
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 生成报告函数
function generateReport() {
  console.log('\n📊 === 带默认值 $t() 调用处理报告 ===');
  console.log(`✅ 处理了 ${processedFiles} 个文件`);
  console.log(`✅ 总共替换了 ${totalReplacements} 个带默认值的翻译调用`);
  
  if (processedCalls.length > 0) {
    // 按默认值分组统计
    const valueStats = {};
    processedCalls.forEach(call => {
      if (!valueStats[call.defaultValue]) {
        valueStats[call.defaultValue] = 0;
      }
      valueStats[call.defaultValue]++;
    });
    
    console.log('\n📝 处理的默认值统计:');
    Object.entries(valueStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([value, count]) => {
        console.log(`  "${value}": ${count} 次`);
      });
    
    if (Object.keys(valueStats).length > 15) {
      console.log(`  ... 还有 ${Object.keys(valueStats).length - 15} 个其他默认值`);
    }
    
    // 保存详细记录
    fs.writeFileSync('processed-default-values.json', JSON.stringify(processedCalls, null, 2), 'utf8');
    console.log('\n📁 详细处理记录已保存到 processed-default-values.json');
  }
  
  console.log('\n📝 建议下一步操作:');
  console.log('  1. 检查替换结果是否正确');
  console.log('  2. 继续处理剩余的无默认值 $t() 调用');
  console.log('  3. 清理国际化相关的导入和配置');
}

// 主函数
function main() {
  console.log('🎯 专门处理带默认值的 $t() 调用');
  console.log('📝 格式：$t(\'key\', \'default\') → "default"\n');
  
  // 备份提醒
  console.log('⚠️  重要提醒: 请确保您已经备份了代码!\n');
  
  // 处理源码目录
  processDirectory('./src');
  
  // 生成报告
  generateReport();
  
  console.log('\n🎉 带默认值的 $t() 调用处理完成！');
  console.log('🔍 请检查修改的文件确保替换正确');
}

// 运行主函数
main(); 