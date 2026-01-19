# Newsflow 项目修复执行书

## 项目概述
Newsflow 是一个 AI 资讯聚合应用，部署在 Cloudflare Pages。

## 当前状态
- ✅ RSS 源已从 Google News 更换为直接的科技媒体 RSS（Ars Technica, The Verge, TechCrunch, Wired, VentureBeat, MIT Tech Review）
- ✅ 基础架构正常运行
- ⚠️ 部分功能存在问题需要修复

---

## 需要修复的问题

### 问题 1: Collection 页面静态数据丢失
**文件**: `components/CollectionTab.tsx`

**问题描述**: Collection 页面原本应该有一些预设的精选 AI 文章，但现在被删除了，只显示从 API 获取的数据（API 当前返回 500 错误）。

**修复方案**: 恢复 Collection 页面的静态精选数据，同时保留从 `/api/library` 动态加载的功能。

**参考静态数据结构**:
```typescript
const STATIC_COLLECTION = [
  {
    id: 1,
    title: "OpenAI's Approach to AI Safety",
    url: "https://openai.com/safety",
    tag: "AI Safety",
    source: "OpenAI",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: "Anthropic's Constitutional AI",
    url: "https://www.anthropic.com/research",
    tag: "Research",
    source: "Anthropic",
    timestamp: new Date().toISOString()
  },
  // ... 更多精选文章
];
```

---

### 问题 2: 设置功能入口不明显
**文件**: `components/NewsTab.tsx`

**问题描述**: 暗黑模式和字体大小调节功能存在于 `SettingsModal` 组件中，但用户可能找不到设置按钮的入口。

**修复方案**: 确保 NewsTab 页面右上角有明显的设置按钮，点击后打开 `SettingsModal`。

**检查点**:
1. `NewsTab.tsx` 中应该有 `onOpenSettings` prop
2. 设置按钮应该在页面头部右侧
3. 点击按钮应该调用 `onOpenSettings()`

---

### 问题 3: API 端点返回 500 错误
**文件**: `functions/api/library.ts`, `functions/api/push.ts`

**问题描述**: 
- `/api/library` 返回 500 错误
- `/api/push` 返回 500 错误

**原因**: D1 数据库可能未正确初始化或绑定配置有误。

**修复方案**:
1. 确保 `wrangler.toml` 中正确配置了 D1 绑定
2. 确保本地 D1 数据库已初始化
3. 如果 API 暂时无法使用，Collection 页面应该回退到显示静态数据

**命令**:
```bash
npx wrangler d1 execute ai-news-flow-db --local --file=./schema.sql
```

---

### 问题 4: 类型定义缺失
**文件**: `functions/api/*.ts`

**问题描述**: `PagesFunction` 和 `D1Database` 类型未定义。

**修复方案**: 安装 Cloudflare Workers 类型定义：
```bash
npm install -D @cloudflare/workers-types
```

并在 `tsconfig.json` 中添加类型引用。

---

## 功能验证清单

完成修复后，请验证以下功能：

### 1. News 页面
- [ ] 能够加载 RSS 新闻列表
- [ ] 能够点击文章进入阅读器模式
- [ ] 能够看到设置按钮（右上角齿轮图标）
- [ ] 下拉刷新功能正常

### 2. Collection 页面
- [ ] 显示精选文章列表（静态数据或 API 数据）
- [ ] 能够点击文章进入阅读器模式
- [ ] 显示文章分类标签

### 3. Bookmark 页面
- [ ] 能够显示已保存的书签
- [ ] 能够删除书签
- [ ] 能够点击书签进入阅读器

### 4. 设置功能
- [ ] 点击设置按钮打开设置弹窗
- [ ] 暗黑模式切换正常工作
- [ ] 字体大小调节正常工作（14px - 22px）
- [ ] 设置保存到 localStorage 并在刷新后保持

### 5. 阅读器模式
- [ ] 能够正确加载文章内容
- [ ] 能够显示文章标题和来源
- [ ] "Back" 按钮能够返回列表
- [ ] "Original" 按钮能够跳转到原文
- [ ] 点词翻译功能正常（点击英文单词显示释义）
- [ ] 字体大小设置在阅读器中生效

---

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1
- **部署**: Cloudflare Pages

---

## 运行命令

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 本地完整测试（包含 Cloudflare Functions）
npx wrangler pages dev dist --d1 DB=ai-news-flow-db --compatibility-flag nodejs_compat

# 初始化数据库
npx wrangler d1 execute ai-news-flow-db --local --file=./schema.sql
```

---

## 关键文件列表

| 文件 | 用途 |
|------|------|
| `App.tsx` | 主应用组件，管理全局状态 |
| `components/NewsTab.tsx` | 新闻列表页面 |
| `components/CollectionTab.tsx` | 精选收藏页面 |
| `components/BookmarkTab.tsx` | 书签页面 |
| `components/ReaderView.tsx` | 阅读器组件 |
| `components/SettingsModal.tsx` | 设置弹窗 |
| `services/geminiService.ts` | RSS 订阅服务 |
| `functions/api/extract.ts` | 文章内容提取 API |
| `functions/api/library.ts` | 精选库 API |
| `functions/api/push.ts` | 手动推送 API |
| `schema.sql` | 数据库结构 |
| `wrangler.toml` | Cloudflare 配置 |

---

## 注意事项

1. **不要修改 RSS 源配置** - 当前的 RSS 源（Ars Technica, The Verge 等）已经可以正常工作
2. **保持暗黑模式和字体设置** - 这些功能的核心代码已存在于 App.tsx 和 SettingsModal.tsx
3. **Collection 页面需要静态数据作为后备** - 即使 API 不可用，也应该能显示一些内容
4. **测试阅读器功能** - 确保点击文章能够正确打开阅读器并显示内容

---

**执行优先级**:
1. 首先修复 Collection 页面的静态数据
2. 验证设置按钮和设置功能
3. 修复 API 错误（可选，不影响主要功能）
4. 完整测试所有功能

---

**最后更新**: 2026-01-18
**执行者**: Cline
