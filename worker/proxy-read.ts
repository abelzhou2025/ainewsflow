/**
 * Phase 2: 瞬时阅读器代理 (Transient Reader Proxy)
 * 
 * ⚠️ 合规要求：
 * - 不存储文章正文到数据库
 * - 实时抓取，阅后即焚
 * - 显著展示"查看原网页"按钮
 * - 底部版权声明
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import createDOMPurify from 'dompurify';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors());

// DOMPurify configuration (安全清洗)
const dompurify = createDOMPurify();
dompurify.addHook('uponSanitizeAttribute', (node, data, attrName) => {
  // 移除所有 iframe 和 script 相关属性
  if (
    attrName.startsWith('on') ||
    attrName === 'src' ||
    attrName === 'srcset' ||
    attrName === 'href'
  ) {
    // 保留相对链接和 https 链接
    if (attrName === 'href' || attrName === 'src') {
      if (data && typeof data === 'string') {
        if (data.startsWith('#') || data.startsWith('/')) {
          return data;
        }
        // 移除可能的外部脚本
        return null;
      }
    }
  }
});

/**
 * 跟随重定向获取真实 URL
 * 专门处理 Google RSS 的重定向链接
 */
async function getRealURL(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      redirect: 'manual', // 手动处理重定向
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const finalUrl = response.url || url;
    
    // 检查是否是重定向
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('Location');
      if (location) {
        console.log(`[Proxy] Redirect: ${url} -> ${location}`);
        return await getRealURL(location); // 递归跟随
      }
    }

    return finalUrl;
  } catch (error) {
    console.error(`[Proxy] Error fetching URL: ${url}`, error);
    return url; // 返回原始 URL
  }
}

/**
 * 提取文章内容
 * 使用 Readability 算法 + 网站特定处理
 */
async function extractArticleContent(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // 使用 Readability 提取文章主体
  const article = new Readability(doc);

  let content = '';
  let title = doc.title || 'Article';
  let byline = null;
  let excerpt = null;

  if (article.isProbablyReaderable) {
    console.log('[Proxy] Using Readability algorithm');
    const articleContent = article.articleContent;
    title = articleContent.title || doc.title;
    excerpt = articleContent.excerpt || null;

    const authorMeta = doc.querySelector('meta[name="author"]');
    if (authorMeta) {
      byline = authorMeta.getAttribute('content') || null;
    }

    // 清洗 HTML
    content = dompurify.sanitize(articleContent.innerHTML, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'code', 'pre', 'a', 'img', 'br', 'hr', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'data-*'],
      ALLOW_DATA_URI: true,
    });
  } else {
    // Readability 失败，使用后备方案
    console.log('[Proxy] Content not readable, using fallback extraction');

    // 针对 Fast Company 等网站的特殊处理
    if (url.includes('fastcompany.com')) {
      console.log('[Proxy] Using Fast Company specific patterns');

      const fcPatterns = [
        /<article[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<main[^>]*>([\s\S]*?)<\/main>/i,
      ];

      for (const pattern of fcPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 300) {
          content = match[1];
          console.log('[Proxy] Fast Company: Extracted', content.length, 'chars');
          break;
        }
      }

      // 如果模式匹配失败，提取所有段落
      if (!content || content.length < 300) {
        const allParagraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
        if (allParagraphs && allParagraphs.length > 3) {
          content = allParagraphs.join('\n\n');
          console.log('[Proxy] Fast Company: Extracted', allParagraphs.length, 'paragraphs');
        }
      }
    }

    // 通用后备方案：提取所有段落和标题
    if (!content) {
      const elements = html.match(/<(p|h1|h2|h3|h4|blockquote)[^>]*>[\s\S]*?<\/(p|h1|h2|h3|h4|blockquote)>/gi);
      if (elements) {
        content = elements.join('\n\n');
      }
    }

    // 清洗 HTML
    content = dompurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'strong', 'em', 'code', 'pre', 'a', 'img', 'br', 'hr', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'data-*'],
      ALLOW_DATA_URI: true,
    });
  }

  return {
    title: title.trim(),
    content: content || '<p>Unable to extract article content. Please click "Original" to view the full article.</p>',
    byline,
    excerpt,
  };
}

/**
 * 主代理端点：/api/proxy-read
 */
app.get('/api/proxy-read', async (c) => {
  const targetUrl = c.req.query('url');
  
  if (!targetUrl) {
    return c.json({ 
      success: false, 
      error: 'Missing required parameter: url' 
    }, 400);
  }

  try {
    console.log(`[Proxy] Fetching: ${targetUrl}`);
    
    // Step 1: 跟随重定向获取真实 URL
    const realUrl = await getRealURL(targetUrl);
    
    // Step 2: 获取网页 HTML
    const response = await fetch(realUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Step 3: 提取文章内容
    const articleData = await extractArticleContent(html, realUrl);

    // Step 4: 构建响应
    const result = {
      success: true,
      data: {
        title: articleData.title,
        content: articleData.content,
        byline: articleData.byline,
        excerpt: articleData.excerpt,
        original_url: realUrl,
        copyright_notice: '本文由阅读模式实时转码生成，内容版权归原作者所有。',
      },
      meta: {
        fetched_at: new Date().toISOString(),
        content_length: articleData.content.length,
      },
    };

    console.log(`[Proxy] Successfully extracted: ${articleData.title} (${articleData.content.length} chars)`);

    return c.json(result);
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to extract article content',
      details: error.message 
    }, 500);
  }
});

export default app;
