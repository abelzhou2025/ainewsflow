
import { SuggestedLink, NewsCluster } from "../types";

// RSS 源列表 - 只保留确实可访问、能抓取全文的权威源
const RSS_FEEDS = [
    // 主要科技媒体 - 经过测试可访问
    { url: 'https://www.wired.com/feed/tag/ai/latest/rss', source: 'Wired', weight: 1.4 },
    { url: 'https://www.wired.com/feed/rss', source: 'Wired (All)', weight: 1.3 },

    // 官方博客和权威源
    { url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review', weight: 1.4 },
    { url: 'https://blogs.nvidia.com/feed/', source: 'NVIDIA Blog', weight: 1.1 },

    // 可靠的科技媒体源
    { url: 'https://fortune.com/feed/', source: 'Fortune', weight: 1.3 },
    { url: 'https://www.cnet.com/rss/news/', source: 'CNET', weight: 1.3 },
    { url: 'https://www.engadget.com/rss.xml', source: 'Engadget', weight: 1.2 },

    // AI 专注媒体
    { url: 'https://www.technologyreview.com/topnews.rss', source: 'MIT Tech Review (Top)', weight: 1.3 },

    // 新增源 - 根据用户收藏习惯添加
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', weight: 1.4 },
    { url: 'https://venturebeat.com/feed/', source: 'VentureBeat', weight: 1.2 },
    { url: 'https://www.zdnet.com/news/rss.xml', source: 'ZDNet', weight: 1.2 },
];

// 使用多个CORS代理作为备选
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
];

// 类别关键词
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'cluster-1': ['microsoft', 'google', 'apple', 'nvidia', 'meta', 'amazon', 'openai', 'anthropic', 'samsung', 'deepmind'],
    'cluster-2': ['breakthrough', 'research', 'sora', 'agi', 'model', 'future of', 'frontier', 'scientific', 'gpt-5', 'gemini'],
    'cluster-3': ['chatgpt', 'copilot', 'tool', 'app', 'software', 'image generator', 'application', 'product', 'launch'],
    'cluster-4': ['school', 'university', 'jobs', 'election', 'ethics', 'society', 'education', 'government', 'risk', 'regulation'],
};

const CLUSTERS_METADATA = [
    { id: 'cluster-1', topicEnglish: 'Tech Company Dynamics', topicChinese: '科技公司动态' },
    { id: 'cluster-2', topicEnglish: 'Innovation & Frontiers', topicChinese: '创新与前沿' },
    { id: 'cluster-3', topicEnglish: 'Tools & Applications', topicChinese: '工具与应用' },
    { id: 'cluster-4', topicEnglish: 'Society & Education', topicChinese: '社会与教育' },
    { id: 'cluster-5', topicEnglish: 'General AI News', topicChinese: '综合新闻' }
];

// 优先级关键词评分
const KEYWORD_SCORES: Record<string, number> = {
    'gpt-5': 2.0, 'sora': 1.8, 'agent': 1.5, 'agi': 1.5, 'breakthrough': 1.4,
    'anthropic': 1.3, 'openai': 1.2, 'gemini': 1.2, 'claude': 1.3,
    'chip': 1.0, 'gpu': 1.0, 'hardware': 1.1,
    'launch': 1.1, 'release': 1.0, 'update': 0.9
};

// Simple in-memory cache
let articleCache: SuggestedLink[] | null = null;
let lastFetchTime: number = 0;

interface SuggestedLinkWithScore extends SuggestedLink {
    publishedDate?: Date;
    score: number;
}

const parseRssFeed = (rssText: string, defaultSource: string, sourceWeight: number): SuggestedLinkWithScore[] => {
    const items: SuggestedLinkWithScore[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");
    const itemNodes = xmlDoc.getElementsByTagName("item");

    for (let i = 0; i < itemNodes.length; i++) {
        const item = itemNodes[i];
        const titleNode = item.getElementsByTagName("title")[0];
        const linkNode = item.getElementsByTagName("link")[0];
        const sourceNode = item.getElementsByTagName("source")[0];
        const pubDateNode = item.getElementsByTagName("pubDate")[0];

        if (titleNode && linkNode) {
            const url = linkNode.textContent || '';

            // Skip if it's still a Google News URL somehow
            if (url.includes('news.google.com')) {
                continue;
            }

            const title = titleNode.textContent || '';
            const source = sourceNode ? sourceNode.textContent || defaultSource : defaultSource;

            // Parse publication date
            let publishedDate: Date | undefined;
            if (pubDateNode && pubDateNode.textContent) {
                try {
                    publishedDate = new Date(pubDateNode.textContent);
                } catch {
                    // Invalid date, leave as undefined
                }
            }

            items.push({
                title,
                url,
                source,
                publishedDate,
                score: 0 // Will be calculated later
            });
        }
    }

    return items;
};

const fetchSingleFeed = async (feed: { url: string; source: string; weight: number }): Promise<SuggestedLinkWithScore[]> => {
    const isBrowser = typeof window !== 'undefined';

    // In browser, try multiple CORS proxies; in Node.js, fetch directly
    const urlsToTry = isBrowser
        ? CORS_PROXIES.map(proxy => proxy + encodeURIComponent(feed.url))
        : [feed.url];

    for (const urlToFetch of urlsToTry) {
        try {
            const response = await fetch(urlToFetch, {
                headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
            });

            if (!response.ok) {
                continue; // Try next proxy
            }

            const rssText = await response.text();
            const items = parseRssFeed(rssText, feed.source, feed.weight);
            console.log(`[RSS] Fetched ${items.length} items from ${feed.source}`);
            return items;
        } catch (error) {
            console.log(`[RSS] Trying next proxy for ${feed.source}...`);
            continue; // Try next proxy
        }
    }

    console.error(`[RSS] All proxies failed for ${feed.source}`);
    return [];
};

const calculateScore = (article: SuggestedLinkWithScore, sourceWeight: number): number => {
    let score = 0;
    const title = article.title.toLowerCase();

    // Source weight
    score += sourceWeight * 2;

    // Keyword scoring
    for (const [keyword, kwScore] of Object.entries(KEYWORD_SCORES)) {
        if (title.includes(keyword)) {
            score += kwScore;
        }
    }

    // Time freshness scoring
    if (article.publishedDate) {
        const now = new Date();
        const daysDiff = (now.getTime() - article.publishedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff < 1) {
            score += 3.0; // Published today
        } else if (daysDiff < 2) {
            score += 2.5; // Published yesterday
        } else if (daysDiff < 3) {
            score += 2.0; // Published 2 days ago
        } else if (daysDiff < 5) {
            score += 1.0; // Published 3-4 days ago
        }
    }

    // Base score
    score += 1.0;

    return Math.round(score * 100) / 100;
};

const fetchAllFeeds = async (): Promise<SuggestedLinkWithScore[]> => {
    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchSingleFeed(feed));
    const results = await Promise.all(feedPromises);

    // Flatten all results
    let allItems = results.flat();

    // Remove duplicates based on title (similar titles often mean same news)
    const seenTitles = new Set<string>();
    allItems = allItems.filter(item => {
        const normalizedTitle = item.title.toLowerCase().substring(0, 50);
        if (seenTitles.has(normalizedTitle)) {
            return false;
        }
        seenTitles.add(normalizedTitle);
        return true;
    });

    // Calculate scores for all articles
    allItems = allItems.map(item => ({
        ...item,
        score: calculateScore(item, RSS_FEEDS.find(f => f.source === item.source)?.weight || 1.0)
    }));

    console.log(`[RSS] Total unique items: ${allItems.length}`);
    return allItems;
};

const categorizeArticles = (articles: SuggestedLinkWithScore[], maxArticlesPerCluster: number = 3): NewsCluster[] => {
    // Time filter: only keep articles from the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentArticles = articles.filter(article => {
        if (!article.publishedDate) {
            return true; // Keep articles without date
        }
        return article.publishedDate > threeDaysAgo;
    });

    console.log(`[RSS] After time filter (3 days): ${recentArticles.length} articles`);

    const clusters: NewsCluster[] = CLUSTERS_METADATA.map(meta => ({
        ...meta,
        articles: [],
    }));

    const generalCluster = clusters.find(c => c.id === 'cluster-5')!;

    for (const article of recentArticles) {
        const lowerTitle = article.title.toLowerCase();
        let assigned = false;

        for (const cluster of clusters) {
            if (cluster.id === 'cluster-5') continue;

            const keywords = CATEGORY_KEYWORDS[cluster.id];
            if (keywords && keywords.some(kw => lowerTitle.includes(kw))) {
                cluster.articles.push(article);
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            generalCluster.articles.push(article);
        }
    }

    // For each cluster:
    // 1. Sort by score (desc) and date (desc)
    // 2. Take top 10 high-scoring articles
    // 3. Randomly select maxArticlesPerCluster from the top 10
    clusters.forEach(cluster => {
        if (cluster.articles.length === 0) return;

        // Sort by score (desc) and then by date (desc for newer articles)
        cluster.articles.sort((a, b) => {
            const scoreDiff = (b as SuggestedLinkWithScore).score - (a as SuggestedLinkWithScore).score;
            if (scoreDiff !== 0) return scoreDiff;

            const dateA = (a as SuggestedLinkWithScore).publishedDate ? (a as SuggestedLinkWithScore).publishedDate!.getTime() : 0;
            const dateB = (b as SuggestedLinkWithScore).publishedDate ? (b as SuggestedLinkWithScore).publishedDate!.getTime() : 0;
            return dateB - dateA;
        });

        // Take top 10 articles (or fewer if not enough)
        const topCandidates = cluster.articles.slice(0, Math.min(10, cluster.articles.length));

        // Randomly select maxArticlesPerCluster from top candidates
        const selectedIndices = new Set<number>();
        while (selectedIndices.size < Math.min(maxArticlesPerCluster, topCandidates.length)) {
            const randomIndex = Math.floor(Math.random() * topCandidates.length);
            selectedIndices.add(randomIndex);
        }

        cluster.articles = Array.from(selectedIndices).map(index => topCandidates[index]);
    });

    console.log(`[RSS] Final clusters: ${clusters.filter(c => c.articles.length > 0).length} with articles`);

    return clusters.filter(c => c.articles.length > 0);
};

export const fetchAndCategorizeNews = async (ignoreCache: boolean = false): Promise<{
    clusters: NewsCluster[];
    featuredArticles: SuggestedLink[];
}> => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Return cached data if available and fresh (unless ignoreCache is true)
    if (!ignoreCache && articleCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('[RSS] Using cached articles');
        const clusters = categorizeArticles(articleCache as SuggestedLinkWithScore[], 3);
        const featured = getFeaturedArticles(articleCache as SuggestedLinkWithScore[], 3);
        return { clusters, featured };
    }

    try {
        console.log('[RSS] Fetching fresh articles...');
        const articles = await fetchAllFeeds();

        if (articles.length > 0) {
            articleCache = articles;
            lastFetchTime = now;
        }

        const clusters = categorizeArticles(articles, 3);
        const featured = getFeaturedArticles(articles, 3);
        return { clusters, featured };
    } catch (error) {
        console.error('[RSS] Error fetching news:', error);

        // Return cached data if available, even if stale
        if (articleCache) {
            const clusters = categorizeArticles(articleCache as SuggestedLinkWithScore[], 3);
            const featured = getFeaturedArticles(articleCache as SuggestedLinkWithScore[], 3);
            return { clusters, featured };
        }

        return { clusters: [], featured: [] };
    }
};

const getFeaturedArticles = (articles: SuggestedLinkWithScore[], count: number): SuggestedLink[] => {
    // Sort by score (desc) and date (desc)
    const sorted = [...articles].sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        const dateA = a.publishedDate ? a.publishedDate.getTime() : 0;
        const dateB = b.publishedDate ? b.publishedDate.getTime() : 0;
        return dateB - dateA;
    });

    // Return top N articles as SuggestedLink (without score/publishedDate)
    return sorted.slice(0, count).map(({ title, url, source }) => ({ title, url, source }));
};

export const updateFeaturedNews = async (): Promise<SuggestedLink[]> => {
    try {
        console.log('[RSS] Updating featured news...');
        const articles = await fetchAllFeeds();
        const featured = getFeaturedArticles(articles, 3);

        // Save to localStorage with timestamp
        const featuredData = {
            articles: featured,
            timestamp: Date.now()
        };
        localStorage.setItem('featured_news', JSON.stringify(featuredData));
        localStorage.setItem('featured_news_timestamp', Date.now().toString());

        console.log('[RSS] Featured news updated');
        return featured;
    } catch (error) {
        console.error('[RSS] Error updating featured news:', error);
        return [];
    }
};

export const getStoredFeaturedNews = (): SuggestedLink[] | null => {
    try {
        const saved = localStorage.getItem('featured_news');
        if (saved) {
            const data = JSON.parse(saved);
            const articles = data.articles || [];

            // Filter out articles from removed sources (TechCrunch, Ars Technica, VentureBeat, TechMeme, arXiv)
            const removedSources = ['Ars Technica', 'TechCrunch', 'VentureBeat', 'TechMeme', 'arXiv', 'arstechnica.com', 'techmeme.com', 'venturebeat.com', 'arxiv.org', 'techcrunch.com'];
            const filteredArticles = articles.filter((article: SuggestedLink) => {
                const source = article.source || '';
                const url = article.url || '';

                // Check if source or URL contains removed sources
                const isFromRemovedSource = removedSources.some(removed =>
                    source.toLowerCase().includes(removed.toLowerCase()) ||
                    url.toLowerCase().includes(removed.toLowerCase())
                );

                return !isFromRemovedSource;
            });

            // If articles were filtered out, update the stored data
            if (filteredArticles.length < articles.length) {
                console.log(`[RSS] Filtered out ${articles.length - filteredArticles.length} articles from removed sources (including Ars Technica)`);
                const updatedData = {
                    articles: filteredArticles,
                    timestamp: data.timestamp
                };
                localStorage.setItem('featured_news', JSON.stringify(updatedData));
                return filteredArticles;
            }

            return articles;
        }
    } catch (error) {
        console.error('[RSS] Error loading stored featured news:', error);
    }
    return null;
};

export const shouldUpdateFeaturedNews = (): boolean => {
    const timestamp = localStorage.getItem('featured_news_timestamp');
    if (!timestamp) return true;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const lastUpdate = parseInt(timestamp);

    return (now - lastUpdate) > ONE_DAY;
};
