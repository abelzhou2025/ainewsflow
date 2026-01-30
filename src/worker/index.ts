/**
 * Cloudflare Worker 主入口
 * 整合 API 路由和代理功能
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// 导入路由
import apiRoutes from '../../worker/index';
import proxyRoutes from '../../worker/proxy-read';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors());

// 健康检查
app.get('/', (c) => c.json({ 
  status: 'ok', 
  service: 'newsflow-worker-v2',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

// 挂载路由
app.route('/', apiRoutes);
app.route('/', proxyRoutes);

// 404 处理
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    path: c.req.path,
    available_paths: ['/api/links', '/api/proxy-read']
  }, 404);
});

export default app;
