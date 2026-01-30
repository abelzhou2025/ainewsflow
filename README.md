# Newsflow v2 - Cloudflare Pages 版

> AI 资讯系统重构版，采用 Cloudflare Pages + Hono + D1 架构

## 🏗️ 架构设计

```
newsflow-v2/
├── worker/              # Cloudflare Worker API
│   └── index.ts        # Hono API (D1 CRUD)
├── src/                # 前端代码
│   ├── components/     # React 组件
│   ├── pages/          # 页面
│   ├── lib/            # 工具函数
│   └── worker/        # 前端 Worker (如果需要)
├── public/             # 静态资源
├── schema.sql          # D1 数据库结构
├── wrangler.toml       # Cloudflare 配置
└── package.json
```

## 🎯 核心特性

### 1. 合规优先设计 ⚖️
- ✅ **瞬时转码**：文章正文实时抓取，**绝不存储**在数据库
- ✅ **版权声明**：每篇文章底部附加版权声明
- ✅ **原网页链接**：显著展示"查看原网页"按钮

### 2. 技术栈
- **前端**: React + Vite + TypeScript + Tailwind CSS
- **后端**: Hono + Cloudflare Workers
- **数据库**: Cloudflare D1
- **部署**: Cloudflare Pages

### 3. 核心功能
- 📚 链接库 (links_library D1 表)
- 📖 瞬时阅读器代理 (/api/proxy-read)
- 🌐 点词翻译 (DeepSeek API)
- 🏷️ 自动分类 (AI 驱动)

## 🚀 快速开始

### 开发环境
\`\`\`bash
# 安装依赖
npm install

# 本地开发 (使用 Wrangler)
npm run dev
\`\`\`

### 部署到 Cloudflare Pages
\`\`\`bash
# 构建
npm run build

# 部署
npm run deploy
\`\`\`

## 📊 D1 数据库 Schema

\`\`\sql
CREATE TABLE links_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,      -- 文章 URL
    title TEXT NOT NULL,            -- 文章标题
    source TEXT NOT NULL,           -- 来源 (手动/rss)
    tags TEXT DEFAULT '[]',         -- 标签 JSON: ["AI", "Tech"]
    user_notes TEXT,              -- 用户备注
    is_featured BOOLEAN DEFAULT 0,  -- 是否精选
    created_at DATETIME,           -- 创建时间
    updated_at DATETIME            -- 更新时间
);
\`\`\`

## 🔒 合规检查清单

- [x] 数据库不存储文章正文
- [x] 实时抓取，阅后即焚
- [x] 显著展示"查看原网页"按钮
- [x] 底部版权声明
- [x] XSS 防护 (dompurify)
- [x] CORS 处理

## 📝 API 端点

### GET /api/links
获取所有链接，支持筛选：
- `?source=manual` - 只选手动推送
- `?is_featured=true` - 只显示精选
- `?limit=50` - 限制数量

### POST /api/add-link
手动添加链接：
\`\`\`json
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "source": "manual",
  "tags": ["AI", "Tech"],
  "user_notes": "Interesting article",
  "is_featured": true
}
\`\`\`

### GET /api/links/:id
获取单个链接详情

### DELETE /api/links/:id
删除链接

## 🔄 开发进度

- [x] Phase 1: 基础设施与数据库 (D1)
- [ ] Phase 2: 瞬时阅读器代理 (Worker)
- [ ] Phase 3: 前端阅读器 UI
- [ ] Phase 4: 交互式点词翻译
- [ ] Phase 5: 自动化与分类

## 📄 License

MIT
