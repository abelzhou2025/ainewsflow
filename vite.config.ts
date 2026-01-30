import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy API requests to handle them during development
          '/api/extract': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            // In dev mode, we'll handle this with a custom middleware
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('Sending request to the target:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('Received response from the target:', proxyRes.statusCode, req.url);
              });
            },
            bypass: async (req, res, proxyOptions) => {
              // Handle /api/extract in development mode
              if (req.url?.startsWith('/api/extract')) {
                const url = new URL(req.url, 'http://localhost');
                const targetUrl = url.searchParams.get('url');

                if (!targetUrl) {
                  res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                  res.end(JSON.stringify({ error: 'Missing url parameter' }));
                  return false;
                }

                // Decode HTML entities function
                const decodeHTMLEntities = (text: string): string => {
                  const entityMap: Record<string, string> = {
                    '&amp;': '&',
                    '&lt;': '<',
                    '&gt;': '>',
                    '&quot;': '"',
                    '&#39;': "'",
                    '&apos;': "'",
                    '&nbsp;': ' ',
                    '&mdash;': '—',
                    '&ndash;': '–',
                    '&hellip;': '…',
                    '&copy;': '©',
                    '&reg;': '®',
                    '&trade;': '™',
                    '&euro;': '€',
                    '&pound;': '£',
                    '&cent;': '¢',
                    '&yen;': '¥',
                    '&sect;': '§',
                    '&para;': '¶',
                    // Quotes (commonly used in Ars Technica)
                    '&lsquo;': '\u2018',
                    '&rsquo;': '\u2019',
                    '&ldquo;': '\u201C',
                    '&rdquo;': '\u201D',
                    '&sbquo;': '\u201A',
                    '&bdquo;': '\u201E',
                    // Common symbols
                    '&bull;': '•',
                    '&prime;': '′',
                    '&Prime;': '″',
                    '&times;': '×',
                    '&divide;': '÷',
                    '&plusmn;': '±',
                    '&micro;': 'µ',
                    '&middot;': '·',
                    // Arrows
                    '&rarr;': '→',
                    '&larr;': '←',
                    '&uarr;': '↑',
                    '&darr;': '↓',
                    '&harr;': '↔',
                    // Math
                    '&le;': '≤',
                    '&ge;': '≥',
                    '&ne;': '≠',
                    '&approx;': '≈',
                    // Spacing
                    '&ensp;': ' ',
                    '&emsp;': ' ',
                    '&thinsp;': ' ',
                  };

                  let result = text;
                  for (const [entity, char] of Object.entries(entityMap)) {
                    result = result.split(entity).join(char);
                  }
                  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
                  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                  return result;
                };

                try {
                  console.log('[Dev API] Fetching:', targetUrl);
                  const response = await fetch(targetUrl, {
                    redirect: 'follow',
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    },
                  });

                  const html = await response.text();
                  const finalUrl = response.url || targetUrl;

                  // Extract title
                  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
                  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Article';

                  // Try og:title as fallback
                  if (!title || title === 'Article' || title.length < 3) {
                    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
                    if (ogTitleMatch) title = ogTitleMatch[1];
                  }

                  // Extract description
                  const descMatch = html.match(/<meta[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["']/i);
                  const excerpt = descMatch ? descMatch[1] : '';

                  // Extract author
                  const authorMatch = html.match(/<meta[^>]*(?:name|property)=["'](?:author|article:author)["'][^>]*content=["']([^"']+)["']/i);
                  const byline = authorMatch ? authorMatch[1] : '';

                  // Extract main content
                  let content = '';
                  let isTechCrunch = finalUrl.includes('techcrunch.com');
                  let isArsTechnica = finalUrl.includes('arstechnica.com');

                  // Special handling for Ars Technica
                  if (isArsTechnica) {
                    const arsPatterns = [
                      /<article[^>]*id=["']thrice["'][^>]*>([\s\S]*?)<\/article>/i,
                      /<div[^>]*class=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                      /<div[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                    ];
                    for (const pattern of arsPatterns) {
                      const match = html.match(pattern);
                      if (match && match[1] && match[1].length > 500) {
                        content = match[1];
                        console.log('[Dev API] Found Ars Technica content, length:', content.length);

                        // Remove Ars Technica font settings UI
                        content = content
                          // Remove font settings containers
                          .replace(/<div[^>]*class=["'][^"']*text-settings-dropdown[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                          .replace(/<div[^>]*class=["'][^"']*text-settings-menu[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                          .replace(/<div[^>]*class=["'][^"']*font-settings[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                          .replace(/<div[^>]*class=["'][^"']*typeface-selector[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                          .replace(/<button[^>]*class=["'][^"']*text-settings[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, '')
                          .replace(/<div[^>]*id=["'][^"']*text-settings[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                          // Remove individual UI text paragraphs
                          .replace(/<p[^>]*>\s*Size\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Standard\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Width\s*\*\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Width\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Links\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*\*\s*Subscribers only\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Subscribers only\s*<\/p>/gi, '')
                          .replace(/<p[^>]*>\s*Learn more\s*<\/p>/gi, '')
                          .replace(/<div[^>]*>\s*Size\s*<\/div>/gi, '')
                          .replace(/<div[^>]*>\s*Standard\s*<\/div>/gi, '')
                          .replace(/<div[^>]*>\s*Width\s*\*\s*<\/div>/gi, '')
                          .replace(/<div[^>]*>\s*Links\s*<\/div>/gi, '')
                          .replace(/<div[^>]*>\s*\*\s*Subscribers only\s*<\/div>/gi, '')
                          .replace(/<div[^>]*>\s*Learn more\s*<\/div>/gi, '');

                        console.log('[Dev API] Removed Ars Technica font settings UI');
                        break;
                      }
                    }
                  }

                  // Special handling for Fast Company
                  if (finalUrl.includes('fastcompany.com')) {
                    console.log('[Dev API] Processing Fast Company article...');

                    // Try multiple patterns - more aggressive
                    const fcPatterns = [
                      { pattern: /<article[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i, name: 'article.article' },
                      { pattern: /<article[^>]*>([\s\S]*?)<\/article>/i, name: 'article (any class)' },
                      { pattern: /<div[^>]*class=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, name: 'div.article-body' },
                      { pattern: /<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, name: 'div.post-content' },
                      { pattern: /<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, name: 'div.entry-content' },
                      { pattern: /<div[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i, name: 'div.article-content' },
                      { pattern: /<main[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/main>/i, name: 'main.article' },
                      { pattern: /<main[^>]*>([\s\S]*?)<\/main>/i, name: 'main (any)' },
                    ];

                    for (const { pattern, name } of fcPatterns) {
                      const match = html.match(pattern);
                      if (match && match[1]) {
                        console.log('[Dev API] Fast Company: Found content using pattern:', name, 'length:', match[1].length);
                        if (match[1].length > 300) {  // Reduced from 500 to 300
                          content = match[1];
                          console.log('[Dev API] Fast Company: Using content from', name);
                          break;
                        } else {
                          console.log('[Dev API] Fast Company: Content too short from', name, 'length:', match[1].length);
                        }
                      }
                    }

                    // If no content found, try extracting all paragraphs
                    if (!content || content.length < 300) {  // Reduced from 500 to 300
                      console.log('[Dev API] Fast Company: No content found, extracting all paragraphs...');
                      const allParagraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
                      if (allParagraphs && allParagraphs.length > 3) {  // Reduced from 5 to 3
                        content = allParagraphs.join('\n\n');
                        console.log('[Dev API] Fast Company: Extracted', allParagraphs.length, 'paragraphs, total length:', content.length);
                      }
                    }
                  }

                  // Special handling for TechCrunch - use very aggressive extraction
                  if (isTechCrunch) {
                    console.log('[Dev API] ===== Processing TechCrunch article =====');

                    // Find the article content area first
                    let articleHTML = html;

                    // Try to isolate the main article content
                    const mainContentMatch = html.match(/<article[^>]*id=["']thrice["'][^>]*>([\s\S]*?)<\/article>/i) ||
                                             html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                                             html.match(/<div[^>]*class=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)(?:<div[^>]*class=["'][^"']*share|<footer|<aside)/i);

                    if (mainContentMatch) {
                      articleHTML = mainContentMatch[1] || mainContentMatch[0];
                      console.log('[Dev API] TechCrunch: Isolated article content, length:', articleHTML.length);
                    } else {
                      console.log('[Dev API] TechCrunch: Could not isolate article, using full HTML');
                    }

                    // Extract ALL text content using multiple strategies
                    const extractedContent: string[] = [];

                    // Strategy 1: All paragraph tags
                    const paragraphs = articleHTML.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
                    if (paragraphs) {
                      console.log('[Dev API] TechCrunch: Found', paragraphs.length, 'paragraphs');
                      extractedContent.push(...paragraphs);
                    }

                    // Strategy 2: All headings
                    const headings = articleHTML.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi);
                    if (headings) {
                      console.log('[Dev API] TechCrunch: Found', headings.length, 'headings');
                      extractedContent.push(...headings);
                    }

                    // Strategy 3: Blockquotes (often used in TechCrunch)
                    const blockquotes = articleHTML.match(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi);
                    if (blockquotes) {
                      console.log('[Dev API] TechCrunch: Found', blockquotes.length, 'blockquotes');
                      extractedContent.push(...blockquotes);
                    }

                    // Strategy 4: List items (but be selective)
                    const lists = articleHTML.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi);
                    if (lists && lists.length < 10) {
                      console.log('[Dev API] TechCrunch: Found', lists.length, 'lists');
                      extractedContent.push(...lists);
                    }

                    console.log('[Dev API] TechCrunch: Total content blocks extracted:', extractedContent.length);

                    if (extractedContent.length > 0) {
                      content = extractedContent.join('\n\n');

                      // Very minimal cleanup - preserve everything
                      content = content
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                        .replace(/<svg[\s\S]*?<\/svg>/gi, '')
                        .replace(/<!--[\s\S]*?-->/g, '')
                        // Only remove obvious ad containers
                        .replace(/<div[^>]*class="[^"]*tc-ad-[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                        .replace(/<div[^>]*class="[^"]*advertisement[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
                        .trim();

                      console.log('[Dev API] TechCrunch: Final content length:', content.length);
                      console.log('[Dev API] TechCrunch: First 200 chars:', content.substring(0, 200));
                    } else {
                      console.log('[Dev API] TechCrunch: No content extracted, using raw article HTML');
                      content = articleHTML;
                    }

                    console.log('[Dev API] ===== TechCrunch processing complete =====');
                  }

                  const articlePatterns = [
                    /<article[^>]*class=["'][^"']*(?:article|content|post|entry|story)[^"']*["'][^>]*>([\s\S]*?)<\/article>/i,
                    /<article[^>]*>([\s\S]*?)<\/article>/i,
                    /<div[^>]*class=["'][^"']*(?:article-body|article-content|story-body|story-content|post-content|entry-content|content-body|article__body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
                    /<main[^>]*class=["'][^"']*(?:article|content|post)[^"']*["'][^>]*>([\s\S]*?)<\/main>/i,
                    /<main[^>]*>([\s\S]*?)<\/main>/i,
                  ];

                  for (const pattern of articlePatterns) {
                    const match = html.match(pattern);
                    if (match && match[1] && match[1].length > 500) {
                      content = match[1];
                      break;
                    }
                  }

                  // Fallback: extract body content
                  if (!content || content.length < 500) {
                    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    content = bodyMatch ? bodyMatch[1] : html;
                  }

                  // Clean up content - use conservative cleanup for all sites
                  if (!isTechCrunch) {
                    content = content
                      // Only remove obvious non-content elements
                      .replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                      .replace(/<header[\s\S]*?<\/header>/gi, '')
                      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
                      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
                      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
                      .replace(/<form[\s\S]*?<\/form>/gi, '')
                      .replace(/<button[\s\S]*?<\/button>/gi, '')
                      .replace(/<!--[\s\S]*?-->/g, '')
                      // Only remove obvious ads
                      .replace(/<div[^>]*class=["'][^"']*advertisement[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                      .replace(/<div[^>]*class=["'][^"']*ad-unit[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
                      .replace(/<ins[^>]*class=["'][^"']*adsby[^"']*["'][^>]*>[\s\S]*?<\/ins>/gi, '')
                      .trim();

                    console.log('[Dev API] Content after conservative cleanup, length:', content.length);
                  }

                  // Extract site name
                  let siteName = 'unknown';
                  try {
                    siteName = new URL(finalUrl).hostname.replace(/^www\./, '');
                  } catch {
                    const domainMatch = finalUrl.match(/https?:\/\/([^\/]+)/);
                    if (domainMatch) {
                      siteName = domainMatch[1].replace(/^www\./, '');
                    }
                  }

                  // Decode HTML entities in all text fields
                  title = decodeHTMLEntities(title);
                  const decodedExcerpt = excerpt ? decodeHTMLEntities(excerpt) : '';
                  const decodedByline = byline ? decodeHTMLEntities(byline) : '';
                  let decodedContent = decodeHTMLEntities(content);

                  // Post-process: Remove UI text patterns that pollute article content
                  const cleanUIText = (html: string): string => {
                    // Remove common UI text patterns wrapped in tags
                    html = html.replace(/<(?:p|div|span|h1|h2|h3|h4|h5|h6)[^>]*>\s*(?:STORY TEXT|SIZE|WIDTH|HEIGHT|LINKS|AUTHOR|PUBLISHED|UPDATED|SOURCE|TOPICS|SUBSCRIBERS? ONLY|LEARN MORE|READ MORE|SHARE|COMMENT|SIGN UP|SUBSCRIBE|ADVERTISEMENT|SPONSORED|PAID POST|PROMOTED CONTENT)\s*(?:<\/(?:p|div|span|h1|h2|h3|h4|h5|h6)>|<br\s*\/?>)/gi, '');

                    // Remove lines containing only UI text (case-insensitive, whole words)
                    const lines = html.split('\n');
                    const uiTextPatterns = [
                      /^<(?:p|div|span|li|h\d)[^>]*>\s*(STORY TEXT|SIZE|WIDTH|HEIGHT|LINKS|AUTHOR|PUBLISHED|UPDATED|SOURCE|TOPICS)\s*<\/(?:p|div|span|li|h\d)>$/gmi,
                      /^<(?:p|div|span|li|h\d)[^>]*>\s*\*\s*(?:STORY TEXT|SIZE|WIDTH|HEIGHT)\s*\*\s*<\/(?:p|div|span|li|h\d)>$/gmi,
                      /^<(?:p|div|span|button)[^>]*>\s*(SUBSCRIBERS? ONLY|LEARN MORE|READ MORE|SHARE|COMMENT|SIGN UP|SUBSCRIBE)\s*<\/(?:p|div|span|button)>$/gmi,
                      /^<(?:p|div|span|em|i|strong|b)[^>]*>\s*(ADVERTISEMENT|SPONSORED|PAID POST|PROMOTED)\s*<\/(?:p|div|span|em|i|strong|b)>$/gmi,
                    ];

                    return lines.filter(line => {
                      const trimmed = line.trim();
                      // Skip empty lines after removing tags
                      if (!trimmed) return false;
                      // Skip lines that match UI text patterns
                      return !uiTextPatterns.some(pattern => pattern.test(trimmed));
                    }).join('\n');
                  };

                  decodedContent = cleanUIText(decodedContent);

                  const result = {
                    title,
                    content: decodedContent.length > 100 ? decodedContent : '<p>Unable to extract article content. Please click "Original" to view the full article.</p>',
                    textContent: decodedContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 500),
                    excerpt: decodedExcerpt,
                    byline: decodedByline,
                    siteName,
                    url: finalUrl,
                  };

                  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                  res.end(JSON.stringify(result));
                  return false;
                } catch (error: any) {
                  console.log('[Dev API] Error:', error.message);
                  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                  res.end(JSON.stringify({
                    error: error.message,
                    title: 'Error Loading Article',
                    content: `<p>Failed to load article in development mode. This API endpoint will work when deployed to Cloudflare Pages.</p><p>Error: ${error.message}</p>`,
                    siteName: 'localhost',
                    url: targetUrl,
                  }));
                  return false;
                }
              }
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
