# Newsflow 项目实施总结与待办事项

## 项目概述
Newsflow 是一个 AI 资讯聚合系统，已部署在 Cloudflare Pages (https://ainewsflow.pages.dev/)

## ✅ 已完成的功能

### 1. 基础架构
- ✅ React + Vite 前端框架
- ✅ Cloudflare Pages + D1 数据库
- ✅ 本地开发环境配置
- ✅ Wrangler 边缘函数支持

### 2. UI 组件
- ✅ 移动端适配的 iOS 风格界面
- ✅ 三个主要标签页：News、Collection、Bookmark
- ✅ 暗黑模式支持
- ✅ 字号调节功能 (14-22px)
- ✅ 设置持久化到 localStorage

### 3. RSS 聚合
- ✅ Google News RSS 订阅
- ✅ 文章分类系统（Tech Company、Innovation、Tools、Society）
- ✅ 下拉刷新功能
- ✅ 文章列表展示

### 4. 阅读器模式
- ✅ 点击文章在应用内打开阅读器
- ✅ Back 和 Original 按钮导航
- ✅ 点词翻译功能（使用 Dictionary API）

### 5. 数据管理
- ✅ D1 数据库 Schema 设计
- ✅ Library 表创建
- ✅ 手动推送 URL 的前端界面
- ✅ Bookmark 功能

## ⚠️ 当前存在的问题

### 问题 1: Google News URL 解码失败
**现象**: 
- 控制台显示原始 URL 和解码后 URL 完全相同
- 阅读器显示 "Google News" 而非真实网站名称
- 无法提取文章正文

**原因**:
- `decodeGoogleNewsUrl` 函数的 Base64 解码逻辑可能不正确
- Google News 的编码格式可能有变化

**解决方案**:
需要实现一个更可靠的解码方法：

```typescript
// 方案 A: 使用服务端重定向跟踪
export async function decodeGoogleNewsUrl(encodedUrl: string): Promise<string> {
  if (!encodedUrl.includes('news.google.com')) {
    return encodedUrl;
  }
  
  try {
    // 让服务器跟随重定向
    const response = await fetch(encodedUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0...' }
    });
    
    const location = response.headers.get('Location');
    if (location) {
      return location;
    }
  } catch (e) {
    console.error('Redirect follow failed:', e);
  }
  
  return encodedUrl;
}

// 方案 B: 在边缘函数中处理
// 在 functions/api/extract.ts 中添加重定向跟踪逻辑
```

### 问题 2: 文章内容提取不完整
**现象**:
- 显示 "Unable to extract article content"
- 即使 URL 正确，内容提取也可能失败

**原因**:
- 简单的正则表达式无法处理复杂的现代网页结构
- 缺少 @mozilla/readability 的完整实现

**解决方案**:
```typescript
// 在 functions/api/extract.ts 中
// 需要正确集成 linkedom 和 @mozilla/readability

import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

export const onRequest: PagesFunction = async (context) => {
  const targetUrl = searchParams.get('url');
  
  // 1. 如果是 Google News URL，先解码
  let realUrl = targetUrl;
  if (targetUrl.includes('news.google.com/rss/articles/')) {
    const response = await fetch(targetUrl, { redirect: 'manual' });
    realUrl = response.headers.get('Location') || targetUrl;
  }
  
  // 2. 获取真实内容
  const htmlResponse = await fetch(realUrl);
  const html = await htmlResponse.text();
  
  // 3. 使用 Readability 解析
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();
  
  return Response.json(article);
};
```

### 问题 3: DeepSeek API 集成未完成
**现象**:
- 手动推送的文章没有自动分类
- `/api/push` 返回 500 错误

**原因**:
- DEEPSEEK_API_KEY 环境变量未配置
- API 调用逻辑可能有误

**解决方案**:
1. 在 `.env.local` 添加：
```
DEEPSEEK_API_KEY=your_api_key_here
```

2. 在 Cloudflare Pages 设置中添加环境变量

3. 测试 `/api/push` 端点

## 🎯 下一步行动计划

### 优先级 1: 修复 URL 解码（关键）
1. 在 `functions/api/extract.ts` 中实现服务端重定向跟踪
2. 移除前端的 URL 解码逻辑，改为在服务端处理
3. 测试确保能获取真实 URL

### 优先级 2: 完善内容提取
1. 确保 `@mozilla/readability` 和 `linkedom` 正确安装
2. 在边缘函数中正确初始化 DOM 解析器
3. 添加错误处理和降级方案

### 优先级 3: 完成 DeepSeek 集成
1. 配置 API 密钥
2. 测试自动分类功能
3. 在 News 页面显示 Featured 内容

### 优先级 4: 优化用户体验
1. 添加加载状态指示器
2. 改进错误提示
3. 优化阅读器样式

## 📝 技术债务

1. **类型定义**: 需要为 Cloudflare Pages Functions 添加类型定义
2. **错误处理**: 需要统一的错误处理机制
3. **测试**: 缺少单元测试和集成测试
4. **性能**: 需要添加缓存机制
5. **安全**: 需要添加 CORS 和 CSP 配置

## 🚀 部署清单

部署到生产环境前需要：
- [ ] 配置 Cloudflare D1 数据库
- [ ] 设置环境变量（DEEPSEEK_API_KEY）
- [ ] 运行数据库迁移（schema.sql）
- [ ] 测试所有功能
- [ ] 配置自定义域名（可选）

## 📚 相关文件

### 核心文件
- `functions/api/extract.ts` - 内容提取 API
- `functions/api/push.ts` - 手动推送 API
- `functions/api/library.ts` - 图书馆数据 API
- `services/googleNewsDecoder.ts` - URL 解码工具
- `components/ReaderView.tsx` - 阅读器组件

### 配置文件
- `wrangler.toml` - Cloudflare 配置
- `schema.sql` - 数据库结构
- `.env.local` - 本地环境变量

## 🔧 调试技巧

### 查看控制台日志
```bash
# 在浏览器中打开 http://localhost:8788
# 按 F12 打开开发者工具
# 查看 Console 标签页中的 [Decoder] 和 [ReaderView] 日志
```

### 测试 API 端点
```bash
# 测试内容提取
curl "http://localhost:8788/api/extract?url=https://example.com"

# 测试手动推送
curl -X POST http://localhost:8788/api/push \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# 测试图书馆数据
curl http://localhost:8788/api/library
```

## 💡 建议

1. **短期**: 先实现一个简单但可靠的版本，使用服务端重定向跟踪来解决 Google News URL 问题
2. **中期**: 逐步完善内容提取和自动分类功能
3. **长期**: 考虑添加更多数据源、用户账户系统等高级功能

---

**最后更新**: 2026-01-18
**状态**: 开发中
**下一个里程碑**: 修复 URL 解码和内容提取
