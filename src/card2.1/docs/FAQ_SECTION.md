## ❓ 常见问题解答

### Q1: 组件不显示在 Visual Editor 中？
**解决方案→** 按以下顺序检查：
1. **检查组件定义**：`definition.ts` 中 `isRegistered` 是否为 `true`
2. **检查权限**：组件的 `permission` 是否符合当前用户权限
3. **检查初始化**：运行 `await initializeCard2System()`
4. **检查文件结构**：确认组件目录在 `src/card2.1/components/` 下

### Q2: 组件图标不显示？
**解决方案→** 检查图标格式：
```typescript
// ✅ 正确格式
icon: `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
</svg>`

// ❌ 错误格式
icon: 'icon-name'          // 不支持
icon: require('./icon.svg') // 不支持
```

### Q3: 如何快速创建组件？
**解决方案→** 使用快速脚手架：
```bash
# 创建组件目录
mkdir src/card2.1/components/my-widget

# 复制 simple-display 组件作为模板
cp -r src/card2.1/components/simple-display/* src/card2.1/components/my-widget/

# 修改 definition.ts 中的组件信息
```

### Q4: 如何调试数据绑定问题？
**解决方案→** 使用控制台调试：
```typescript
// 在浏览器控制台中运行
import { getAllComponents, getComponentTree } from '@/card2.1'
console.log('所有组件:', getAllComponents())
console.log('组件树:', getComponentTree())
```

### Q5: 权限等级设置规则？
**解决方案→** 按需要设置权限：
- `'不限'` - 所有用户可见（默认）
- `'TENANT_USER'` - 租户用户及以上
- `'TENANT_ADMIN'` - 租户管理员及以上
- `'SYS_ADMIN'` - 仅系统管理员

### Q6: 代码示例不能正常运行？
**解决方案→** 验证步骤：
```bash
# 1. 检查 TypeScript 类型
pnpm typecheck

# 2. 检查 ESLint 规范
pnpm lint

# 3. 完整质量检查
pnpm quality-check

# 4. 在测试页面中验证
http://localhost:5002/test/editor-integration
```

---