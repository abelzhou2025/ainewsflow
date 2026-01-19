
import { SuggestedLink, NewsCluster } from "../types";

// Multiple RSS feeds from different sources for better coverage
// These are direct RSS feeds that don't use Google News redirects
const RSS_FEEDS = [
    // Tech news with AI coverage - Major tech outlets
    { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'Ars Technica' },
    { url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', source: 'The Verge' },
    { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch' },
    { url: 'https://www.wired.com/feed/tag/ai/latest/rss', source: 'Wired' },
    // AI-focused sources
    { url: 'https://venturebeat.com/category/ai/feed/', source: 'VentureBeat' },
    { url: 'https://www.technologyreview.com/feed/', source: 'MIT Tech Review' },
    // Additional major news sources
    { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'New York Times' },
    { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC Tech' },
    { url: 'https://www.theguardian.com/technology/rss', source: 'The Guardian' },
    { url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', source: 'ZDNet' },
    // Business and finance AI coverage
    { url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html', source: 'CNBC Tech' },
    { url: 'https://feeds.reuters.com/reuters/technologyNews', source: 'Reuters' },
    // Research and academic sources
    { url: 'https://deepmind.google/blog/rss.xml', source: 'DeepMind Blog' },
    { url: 'https://openai.com/blog/rss/', source: 'OpenAI Blog' },
];

// Fallback to a CORS proxy if direct fetch fails
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

// Simple in-memory cache to avoid re-fetching on every tab switch
let articleCache: SuggestedLink[] | null = null;
let lastFetchTime: number = 0;

const parseRssFeed = (rssText: string, defaultSource: string): SuggestedLink[] => {
    const items: SuggestedLink[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");
    const itemNodes = xmlDoc.getElementsByTagName("item");

    for (let i = 0; i < itemNodes.length; i++) {
        const item = itemNodes[i];
        const titleNode = item.getElementsByTagName("title")[0];
        const linkNode = item.getElementsByTagName("link")[0];
        const sourceNode = item.getElementsByTagName("source")[0];

        if (titleNode && linkNode) {
            const url = linkNode.textContent || '';
            // Skip if it's still a Google News URL somehow
            if (url.includes('news.google.com')) {
                continue;
            }

            items.push({
                title: titleNode.textContent || '',
                url: url,
                source: sourceNode ? sourceNode.textContent || defaultSource : defaultSource
            });
        }
    }

    return items;
};

const fetchSingleFeed = async (feedUrl: string, source: string): Promise<SuggestedLink[]> => {
    try {
        // Try direct fetch first
        let response = await fetch(feedUrl, {
            headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' }
        });

        // If CORS fails, try with proxy
        if (!response.ok) {
            console.log(`[RSS] Direct fetch failed for ${source}, trying proxy...`);
            response = await fetch(CORS_PROXY + encodeURIComponent(feedUrl));
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch ${source}: ${response.statusText}`);
        }

        const rssText = await response.text();
        const items = parseRssFeed(rssText, source);
        console.log(`[RSS] Fetched ${items.length} items from ${source}`);
        return items;
    } catch (error) {
        console.error(`[RSS] Error fetching ${source}:`, error);
        return [];
    }
};

const fetchAllFeeds = async (): Promise<SuggestedLink[]> => {
    // Fetch all feeds in parallel
    const feedPromises = RSS_FEEDS.map(feed => fetchSingleFeed(feed.url, feed.source));
    const results = await Promise.all(feedPromises);

    // Flatten all results
    const allItems = results.flat();

    // Remove duplicates based on title (similar titles often mean same news)
    const seenTitles = new Set<string>();
    const uniqueItems = allItems.filter(item => {
        const normalizedTitle = item.title.toLowerCase().substring(0, 50);
        if (seenTitles.has(normalizedTitle)) {
            return false;
        }
        seenTitles.add(normalizedTitle);
        return true;
    });

    console.log(`[RSS] Total unique items: ${uniqueItems.length}`);
    return uniqueItems;
};

const categorizeArticles = (articles: SuggestedLink[]): NewsCluster[] => {
    const clusters: NewsCluster[] = CLUSTERS_METADATA.map(meta => ({
        ...meta,
        articles: [],
    }));

    const generalCluster = clusters.find(c => c.id === 'cluster-5')!;

    for (const article of articles) {
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

    return clusters.filter(c => c.articles.length > 0);
};

export const fetchAndCategorizeNews = async (): Promise<NewsCluster[]> => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Return cached data if available and fresh
    if (articleCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('[RSS] Using cached articles');
        return categorizeArticles(articleCache);
    }

    try {
        const articles = await fetchAllFeeds();

        if (articles.length > 0) {
            articleCache = articles;
            lastFetchTime = now;
        }

        return categorizeArticles(articles);
    } catch (error) {
        console.error('[RSS] Error fetching news:', error);

        // Return cached data if available, even if stale
        if (articleCache) {
            return categorizeArticles(articleCache);
        }

        return [];
    }
};