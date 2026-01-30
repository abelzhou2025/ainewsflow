/**
 * Phase 1: 基础设施与数据库 API
 * 提供 D1 数据库的 CRUD 操作
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors());

// Health check
app.get('/', (c) => c.json({ 
  status: 'ok', 
  service: 'newsflow-api-v2',
  version: '1.0.0'
}));

// Get all links with filtering
app.get('/api/links', async (c) => {
  const db = c.env.DB;
  
  const { source, is_featured, limit = '100' } = c.req.query();
  
  let query = 'SELECT * FROM links_library';
  const conditions = [];
  const params: any[] = [];
  
  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }
  
  if (is_featured !== undefined) {
    conditions.push('is_featured = ?');
    params.push(is_featured === 'true' ? 1 : 0);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit as string));
  
  try {
    const result = await db.prepare(query).bind(...params).all();
    return c.json({ 
      success: true,
      data: result,
      count: result.length 
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch links',
      details: error.message 
    }, 500);
  }
});

// Add new link (手动推送)
app.post('/api/add-link', async (c) => {
  const db = c.env.DB;
  const { url, title, source, tags = '[]', user_notes = '', is_featured = false } = await c.req.json();
  
  // Validation
  if (!url || !title || !source) {
    return c.json({ 
      success: false, 
      error: 'Missing required fields: url, title, source' 
    }, 400);
  }
  
  try {
    const result = await db.prepare(\`
      INSERT INTO links_library (url, title, source, tags, user_notes, is_featured)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        source = excluded.source,
        tags = excluded.tags,
        user_notes = excluded.user_notes,
        updated_at = CURRENT_TIMESTAMP
    \`).bind(url, title, source, JSON.stringify(tags), user_notes, is_featured ? 1 : 0).run();
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Link added successfully'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to add link',
      details: error.message 
    }, 500);
  }
});

// Get single link by ID
app.get('/api/links/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  try {
    const result = await db.prepare('SELECT * FROM links_library WHERE id = ?').bind(id).first();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Link not found' 
      }, 404);
    }
    
    return c.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch link',
      details: error.message 
    }, 500);
  }
});

// Update link
app.put('/api/links/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { title, tags, user_notes, is_featured } = await c.req.json();
  
  try {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags));
    }
    
    if (user_notes !== undefined) {
      updates.push('user_notes = ?');
      params.push(user_notes);
    }
    
    if (is_featured !== undefined) {
      updates.push('is_featured = ?');
      params.push(is_featured ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No fields to update' 
      }, 400);
    }
    
    params.push(id);
    
    await db.prepare(\`UPDATE links_library SET \${updates.join(', ')} WHERE id = ?\`).bind(...params).run();
    
    return c.json({ 
      success: true, 
      message: 'Link updated successfully'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to update link',
      details: error.message 
    }, 500);
  }
});

// Delete link
app.delete('/api/links/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  try {
    await db.prepare('DELETE FROM links_library WHERE id = ?').bind(id).run();
    
    return c.json({ 
      success: true, 
      message: 'Link deleted successfully'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to delete link',
      details: error.message 
    }, 500);
  }
});

export default app;
