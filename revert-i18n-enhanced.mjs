import fs from 'fs';
import path from 'path';

// 导入最完整的键值映射表
const keyValueMapContent = fs.readFileSync('complete-key-value-map-v2.json', 'utf8');
const keyValueMap = JSON.parse(keyValueMapContent);

console.log(`📋 载入了 ${Object.keys(keyValueMap).length} 个翻译键值对`);

// 手动添加一些常见的 common 键值对
const commonKeys = {
  'common.error': '错误',
  'common.actions': '操作',
  'common.high': '高',
  'common.middle': '中',
  'common.low': '低',
  'common.custom': '自定义',
  'common.last_15m': '最近15分钟',
  'common.last_30m': '最近30分钟',
  'common.lastHours1': '最近1小时',
  'common.lastHours3': '最近3小时',
  'common.lastHours6': '最近6小时',
  'common.lastHours12': '最近12小时',
  'common.lastHours24': '最近24小时',
  'common.lastDays3': '最近3天',
  'common.lastDays7': '最近7天',
  'common.today': '今天',
  'common.yesterday': '昨天',
  'common.thisWeek': '本周',
  'common.lastWeek': '上周',
  'common.thisMonth': '本月',
  'common.lastMonth': '上月',
  'common.deleteSuccess': '删除成功',
  'common.updateSuccess': '更新成功',
  'common.operationSuccess': '操作成功',
  'common.creationTime': '创建时间',
  'common.total': '总计',
  'common.confirm': '确认',
  'common.cancel': '取消',
  'time.justNow': '刚刚'
};

// 合并键值映射
const completeKeyValueMap = { ...keyValueMap, ...commonKeys };

console.log(`📋 现在总共有 ${Object.keys(completeKeyValueMap).length} 个键值对`);

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
    
    // 增强的正则表达式模式
    const patterns = [
      // 带默认值的 $t() 调用：$t('key', 'default')
      {
        pattern: /\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, defaultValue, mappedValue) => {
          // 优先使用映射值，否则使用默认值
          return `"${mappedValue || defaultValue}"`;
        }
      },
      
      // 在模板中带默认值：{{ $t('key', 'default') }}
      {
        pattern: /\{\{\s*\$t\(['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\)\s*\}\}/g,
        replace: (match, key, defaultValue, mappedValue) => {
          return `{{ "${mappedValue || defaultValue}" }}`;
        }
      },
      
      // 函数返回值：() => $t('key')
      {
        pattern: /\(\s*\)\s*=>\s*\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, mappedValue) => `() => "${mappedValue}"`
      },
      
      // return $t('key')
      {
        pattern: /return\s+\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, mappedValue) => `return "${mappedValue}"`
      },
      
      // 标准格式：$t('key') 或 $t("key")
      {
        pattern: /\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, mappedValue) => `"${mappedValue}"`
      },
      
      // 在对象字面量中：title: $t('key')
      {
        pattern: /(\w+):\s*\$t\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, prop, key, mappedValue) => `${prop}: "${mappedValue}"`
      },
      
      // 在模板中：{{ $t('key') }}
      {
        pattern: /\{\{\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\}\}/g,
        replace: (match, key, mappedValue) => `{{ "${mappedValue}" }}`
      },
      
      // 在数组中：[$t('key')]
      {
        pattern: /\[\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\]/g,
        replace: (match, key, mappedValue) => `["${mappedValue}"]`
      },
      
      // 在函数参数中：func($t('key'))
      {
        pattern: /\(\s*\$t\(['"`]([^'"`]+)['"`]\)\s*\)/g,
        replace: (match, key, mappedValue) => `("${mappedValue}")`
      },
      
      // 简单的 t() 调用（不带$）
      {
        pattern: /(?<![\w$])\bt\(['"`]([^'"`]+)['"`]\)/g,
        replace: (match, key, mappedValue) => `"${mappedValue}"`
      }
    ];
    
    // 对每种模式进行替换
    patterns.forEach(({ pattern, replace }) => {
      content = content.replace(pattern, (match, ...args) => {
        // 提取键名和其他参数
        let key, defaultValue, prop;
        
        if (args.length >= 3 && typeof args[1] === 'string' && typeof args[2] === 'string') {
          // 带默认值的情况：$t('key', 'default')
          key = args[0];
          defaultValue = args[1];
        } else if (args.length >= 2 && typeof args[1] === 'string') {
          // 对象字面量的情况：prop: $t('key')
          prop = args[0];
          key = args[1];
        } else {
          // 其他情况
          key = args[0];
        }
        
        if (completeKeyValueMap[key]) {
          hasChanges = true;
          replacements++;
          
          // 只在前几个替换时显示日志
          if (replacements <= 3) {
            console.log(`  ✅ ${match} → "${completeKeyValueMap[key]}"`);
          }
          
          // 调用替换函数
          if (defaultValue !== undefined) {
            return replace(match, key, defaultValue, completeKeyValueMap[key]);
          } else if (prop !== undefined) {
            return replace(match, prop, key, completeKeyValueMap[key]);
          } else {
            return replace(match, key, completeKeyValueMap[key]);
          }
        } else {
          // 如果有默认值，直接使用默认值替换
          if (defaultValue !== undefined) {
            hasChanges = true;
            replacements++;
            if (replacements <= 3) {
              console.log(`  🔄 ${match} → "${defaultValue}" (使用默认值)`);
            }
            if (match.includes('{{')) {
              return `{{ "${defaultValue}" }}`;
            } else {
              return `"${defaultValue}"`;
            }
          } else {
            unmappedKeys.add(key);
            return match; // 保持原样
          }
        }
      });
    });
    
    // 处理一些特殊的模板字符串情况
    // 如: `${$t('key')}`
    content = content.replace(/\$\{([^}]*)\$t\(['"`]([^'"`]+)['"`]\)([^}]*)\}/g, (match, before, key, after) => {
      if (completeKeyValueMap[key]) {
        hasChanges = true;
        replacements++;
        return `\`${before}"${completeKeyValueMap[key]}"${after}\``;
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
      console.log(`📄 ${filePath} - 替换了 ${replacements} 个翻译`);
    }
    
    // 收集未映射的键
    unmappedKeys.forEach(key => totalUnmappedKeys.add(key));
    
    // 只在有未映射键时显示警告
    if (unmappedKeys.size > 0) {
      console.log(`⚠️  ${filePath} 中有 ${unmappedKeys.size} 个未映射的键`);
      if (unmappedKeys.size <= 3) {
        Array.from(unmappedKeys).forEach(key => console.log(`    - ${key}`));
      } else {
        Array.from(unmappedKeys).slice(0, 3).forEach(key => console.log(`    - ${key}`));
        console.log(`    ... 还有 ${unmappedKeys.size - 3} 个未显示`);
      }
    }
    
  } catch (error) {
    console.error(`❌ 处理文件出错 ${filePath}:`, error.message);
  }
}

// 生成报告函数
function generateReport() {
  console.log('\n📊 === 增强版逆向国际化完成报告 ===');
  console.log(`✅ 处理了 ${processedFiles} 个文件`);
  console.log(`✅ 总共替换了 ${totalReplacements} 个翻译调用`);
  console.log(`✅ 使用了 ${Object.keys(completeKeyValueMap).length} 个键值映射`);
  console.log(`⚠️  剩余 ${totalUnmappedKeys.size} 个未映射的键`);
  
  if (totalUnmappedKeys.size > 0) {
    // 保存未映射的键到文件
    fs.writeFileSync('enhanced-unmapped-keys.json', JSON.stringify(Array.from(totalUnmappedKeys), null, 2), 'utf8');
    console.log('📁 未映射的键已保存到 enhanced-unmapped-keys.json');
    
    console.log('\n📝 剩余未映射键示例:');
    Array.from(totalUnmappedKeys).slice(0, 15).forEach(key => {
      console.log(`  - ${key}`);
    });
    if (totalUnmappedKeys.size > 15) {
      console.log(`  ... 还有 ${totalUnmappedKeys.size - 15} 个未显示`);
    }
    
    // 分析未映射键的前缀分布
    const unmappedPrefixes = {};
    Array.from(totalUnmappedKeys).forEach(key => {
      const prefix = key.split('.')[0];
      unmappedPrefixes[prefix] = (unmappedPrefixes[prefix] || 0) + 1;
    });
    
    console.log('\n📊 未映射键前缀分布:');
    Object.entries(unmappedPrefixes).sort((a, b) => b[1] - a[1]).forEach(([prefix, count]) => {
      console.log(`  ${prefix}: ${count} 个键`);
    });
  }
  
  console.log('\n📝 建议下一步操作:');
  console.log('  1. 检查所有文件的替换结果是否正确');
  console.log('  2. 手动处理动态 $t() 调用（如：$t(variable)）');
  console.log('  3. 处理剩余未映射的键');
  console.log('  4. 清理不需要的国际化相关代码和导入');
  console.log('  5. 删除 i18n 相关的依赖和配置');
  
  // 计算成功率
  const totalAttempted = totalReplacements + totalUnmappedKeys.size;
  const successRate = totalAttempted > 0 ? (totalReplacements / totalAttempted * 100).toFixed(1) : 0;
  console.log(`\n🎯 替换成功率: ${successRate}% (${totalReplacements}/${totalAttempted})`);
}

// 主函数
function main() {
  console.log('🚀 开始增强版逆向国际化重构...');
  console.log('📝 支持带默认值的 $t() 调用和更多复杂模式\n');
  
  // 备份提醒
  console.log('⚠️  重要提醒: 请确保您已经备份了代码!\n');
  
  // 处理源码目录
  processDirectory('./src');
  
  // 生成报告
  generateReport();
  
  console.log('\n🎉 增强版逆向国际化重构完成！');
  console.log('🔍 请检查修改的文件确保替换正确');
}

// 运行主函数
main(); 