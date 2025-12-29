
import { SuggestedLink, NewsCluster } from "../types";

const RSS_FEED_URL = 'https://news.google.com/rss/search?q=AI&hl=en-US&gl=US&ceid=US:en';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cluster-1': ['microsoft', 'google', 'apple', 'nvidia', 'meta', 'amazon', 'openai', 'anthropic', 'samsung'],
  'cluster-2': ['breakthrough', 'research', 'sora', 'agi', 'model', 'future of', 'frontier', 'scientific'],
  'cluster-3': ['chatgpt', 'copilot', 'tool', 'app', 'software', 'image generator', 'application', 'galaxy'],
  'cluster-4': ['school', 'university', 'jobs', 'election', 'ethics', 'society', 'education', 'government', 'risk'],
};

const CLUSTERS_METADATA = [
    { id: 'cluster-1', topicEnglish: 'Tech Company Dynamics', topicChinese: '科技公司动态' },
    { id: 'cluster-2', topicEnglish: 'Innovation & Frontiers', topicChinese: '创新与前沿' },
    { id: 'cluster-3', topicEnglish: 'Tools & Applications', topicChinese: '工具与应用' },
    { id: 'cluster-4', topicEnglish: 'Society & Education', topicChinese: '社会与教育' },
    { id: 'cluster-5', topicEnglish: 'General AI News', topicChinese: '综合新闻' } // Fallback category
];

// Simple in-memory cache to avoid re-fetching on every tab switch
let articleCache: SuggestedLink[] | null = null;
let lastFetchTime: number = 0;

const parseRssFeed = (rssText: string): SuggestedLink[] => {
    const items: SuggestedLink[] = [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, "text/xml");
    const itemNodes = xmlDoc.getElementsByTagName("item");

    for (let i = 0; i < itemNodes.length; i++) {
        const itemNode = itemNodes[i];
        const titleNode = itemNode.getElementsByTagName("title")[0];
        const linkNode = itemNode.getElementsByTagName("link")[0];
        const sourceNode = itemNode.getElementsByTagName("source")[0];
        
        if (titleNode && linkNode) {
            items.push({
                title: titleNode.textContent || '',
                url: linkNode.textContent || '',
                source: sourceNode ? sourceNode.textContent || undefined : undefined
            });
        }
    }
    // Remove duplicates based on title, as URLs can sometimes differ slightly
    const uniqueItems = items.filter((item, index, self) => 
      index === self.findIndex((t) => (
        t.title === item.title
      ))
    )
    return uniqueItems;
};

const categorizeArticle = (article: SuggestedLink): string => {
    const titleLower = article.title.toLowerCase();
    for (const clusterId in CATEGORY_KEYWORDS) {
        if (CATEGORY_KEYWORDS[clusterId].some(keyword => titleLower.includes(keyword))) {
            return clusterId;
        }
    }
    return 'cluster-5'; // Fallback category id
};

const fetchAndProcessNews = async (): Promise<SuggestedLink[]> => {
    try {
        // Use a more reliable CORS proxy with timestamp to bypass cache
        const timestamp = Date.now();
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(RSS_FEED_URL)}&t=${timestamp}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rssText = await response.text();
        const articles = parseRssFeed(rssText);
        articleCache = articles;
        lastFetchTime = Date.now();
        return articles;
    } catch (error) {
        console.error("Failed to fetch or parse RSS feed:", error);
        return []; // Return empty on error
    }
};

export const fetchNewsClusters = async (forceRefresh: boolean = false): Promise<NewsCluster[]> => {
    const now = Date.now();
    // Use cache if it's not stale (e.g., less than 5 minutes old) and not a forced refresh
    if (!forceRefresh && articleCache && (now - lastFetchTime < 300000)) {
        // Use cached articles
    } else {
        // Always fetch fresh data when forceRefresh is true or cache is stale
        await fetchAndProcessNews();
    }

    const articles = articleCache || [];
    const categorizedArticles: Record<string, SuggestedLink[]> = {};

    CLUSTERS_METADATA.forEach(c => {
        categorizedArticles[c.id] = [];
    });

    articles.forEach(article => {
        const clusterId = categorizeArticle(article);
        categorizedArticles[clusterId].push(article);
    });

    const newsClusters = CLUSTERS_METADATA.map(clusterInfo => ({
        ...clusterInfo,
        articles: (categorizedArticles[clusterInfo.id] || []).slice(0, 8)
    })).filter(cluster => cluster.articles.length > 0); // Only show clusters with articles

    return newsClusters;
};

// This function is no longer used for pull-to-refresh, but kept for potential future 'load more' features.
export const fetchMoreArticlesForTopic_noAI = async (seenUrls: string[]): Promise<SuggestedLink[]> => {
    const allArticles = await fetchAndProcessNews();
    const newArticles = allArticles.filter(article => !seenUrls.includes(article.url));
    
    // For this demo, we just return all new articles of any category.
    // A more advanced version could filter by the topic's keywords again.
    return newArticles.slice(0, 5); // Return up to 5 new articles
};