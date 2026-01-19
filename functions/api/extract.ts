export const onRequest: PagesFunction = async (context) => {
    let requestUrl = context.request.url;
    // 确保URL有协议前缀
    if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
        requestUrl = 'https://' + requestUrl;
    }
    const { searchParams } = new URL(requestUrl);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        console.log('[Extract] Fetching content from:', targetUrl);

        const response = await fetch(targetUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const finalUrl = response.url || targetUrl;
        console.log('[Extract] HTML length:', html.length);

        // Extract metadata
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
        let title = titleMatch ? titleMatch[1].replace(/&[^;]+;/g, ' ').replace(/<[^>]+>/g, '').trim() : 'Article';

        // Try og:title as fallback
        if (!title || title === 'Article' || title.length < 3) {
            const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
            if (ogTitleMatch) title = ogTitleMatch[1];
        }

        const descMatch = html.match(/<meta[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["'](?:description|og:description)["']/i);
        const excerpt = descMatch ? descMatch[1] : '';

        const authorMatch = html.match(/<meta[^>]*(?:name|property)=["'](?:author|article:author)["'][^>]*content=["']([^"']+)["']/i);
        const byline = authorMatch ? authorMatch[1] : '';

        // Extract main content
        let content = '';

        // Try to find article content using common patterns
        const articlePatterns = [
            /<article[^>]*class=["'][^"']*(?:article|content|post|entry|story)[^"']*["'][^>]*>([\s\S]*?)<\/article>/i,
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<div[^>]*class=["'][^"']*(?:article-body|article-content|story-body|story-content|post-content|entry-content|content-body|article__body|c-entry-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
            /<main[^>]*class=["'][^"']*(?:article|content|post)[^"']*["'][^>]*>([\s\S]*?)<\/main>/i,
            /<main[^>]*>([\s\S]*?)<\/main>/i,
        ];

        for (const pattern of articlePatterns) {
            const match = html.match(pattern);
            if (match && match[1] && match[1].length > 500) {
                content = match[1];
                console.log('[Extract] Found content using pattern, length:', content.length);
                break;
            }
        }

        // Fallback: extract body content
        if (!content || content.length < 500) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            content = bodyMatch ? bodyMatch[1] : html;
            console.log('[Extract] Using body content, length:', content.length);
        }

        // Clean up content
        content = content
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
            // Remove common non-content elements
            .replace(/<div[^>]*class=["'][^"']*(?:ad-|advertisement|banner|promo|subscribe|newsletter|sidebar|share|social|comment|related)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

        // Extract site name from URL
        let siteName = 'unknown';
        try {
            // 确保URL有协议前缀
            let urlToParse = finalUrl;
            if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
                urlToParse = 'https://' + urlToParse;
            }
            siteName = new URL(urlToParse).hostname.replace(/^www\./, '');
        } catch (error) {
            // 尝试从URL中提取域名
            const domainMatch = finalUrl.match(/https?:\/\/([^\/]+)/);
            if (domainMatch) {
                siteName = domainMatch[1].replace(/^www\./, '');
            } else {
                // 尝试从URL中提取基本域名
                const simpleDomainMatch = finalUrl.match(/(?:https?:\/\/)?([^\/]+)/);
                if (simpleDomainMatch) {
                    siteName = simpleDomainMatch[1].replace(/^www\./, '');
                }
            }
        }

        console.log('[Extract] Extraction complete:', {
            title: title.substring(0, 50),
            siteName,
            contentLength: content.length,
        });

        return new Response(
            JSON.stringify({
                title: title,
                content: content.length > 100 ? content : '<p>Unable to extract article content. Please click "Original" to view the full article.</p>',
                textContent: content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 500),
                excerpt: excerpt,
                byline: byline,
                siteName: siteName,
                url: finalUrl,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    } catch (error: any) {
        console.error('[Extract] Error:', error);

        return new Response(
            JSON.stringify({
                error: error.message,
                title: 'Error Loading Article',
                content: `<p>Failed to load article: ${error.message}</p><p>Please click "Original" to view the article directly.</p>`,
                siteName: (() => {
                    try {
                        // 确保URL有协议前缀
                        let urlToParse = targetUrl;
                        if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
                            urlToParse = 'https://' + urlToParse;
                        }
                        return new URL(urlToParse).hostname.replace(/^www\./, '');
                    } catch (error) {
                        // 尝试从URL中提取域名
                        const domainMatch = targetUrl.match(/https?:\/\/([^\/]+)/);
                        if (domainMatch) {
                            return domainMatch[1].replace(/^www\./, '');
                        }
                        // 尝试从URL中提取基本域名
                        const simpleDomainMatch = targetUrl.match(/(?:https?:\/\/)?([^\/]+)/);
                        if (simpleDomainMatch) {
                            return simpleDomainMatch[1].replace(/^www\./, '');
                        }
                        return 'unknown';
                    }
                })(),
                url: targetUrl,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
            }
        );
    }
};
