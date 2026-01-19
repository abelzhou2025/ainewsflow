
import React, { useState, useEffect, useMemo } from 'react';
import { SuggestedLink, BookmarkItem } from '../types';
import SwipableListItem from './SwipableListItem';

interface LibraryItem extends SuggestedLink {
  id: number;
  tags: string[];
  timestamp: string;
}

interface CollectionTabProps {
  isDarkMode: boolean;
  toggleBookmark: (item: SuggestedLink) => void;
  bookmarks: BookmarkItem[];
  onSelectArticle: (url: string) => void;
}

// 静态精选数据作为API不可用时的后备
const STATIC_COLLECTION: LibraryItem[] = [
  {
    id: 1,
    title: "OpenAI's Approach to AI Safety",
    url: "https://openai.com/safety",
    tags: ["OpenAI", "AI Safety"],
    source: "OpenAI",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: "Anthropic's Constitutional AI",
    url: "https://www.anthropic.com/research",
    tags: ["Anthropic", "AI Safety"],
    source: "Anthropic",
    timestamp: new Date().toISOString()
  },
  {
    id: 3,
    title: "Google's Gemini: A New Era of AI",
    url: "https://blog.google/technology/ai/google-gemini-ai/",
    tags: ["Google", "AI Models"],
    source: "Google",
    timestamp: new Date().toISOString()
  },
  {
    id: 4,
    title: "Microsoft's Copilot Ecosystem",
    url: "https://blogs.microsoft.com/ai/",
    tags: ["Microsoft", "AI Tools"],
    source: "Microsoft",
    timestamp: new Date().toISOString()
  },
  {
    id: 5,
    title: "Meta's Llama 3: Open Source AI",
    url: "https://ai.meta.com/blog/meta-llama-3/",
    tags: ["Meta", "Open Source"],
    source: "Meta",
    timestamp: new Date().toISOString()
  },
  {
    id: 6,
    title: "NVIDIA's AI Computing Platform",
    url: "https://www.nvidia.com/en-us/ai/",
    tags: ["NVIDIA", "Hardware"],
    source: "NVIDIA",
    timestamp: new Date().toISOString()
  }
];

// 公司标签映射
const COMPANY_TAGS = [
  'Google', 'OpenAI', 'Anthropic', 'Microsoft', 'Amazon', 'Apple', 'NVIDIA', 'Nvidia', 'Meta',
  'Tesla', 'IBM', 'Intel', 'AMD', 'Qualcomm', 'Broadcom', 'Oracle', 'Salesforce', 'Adobe',
  'Shopify', 'Uber', 'Lyft', 'Airbnb', 'Netflix', 'Spotify', 'Twitter', 'Facebook', 'Instagram',
  'TikTok', 'ByteDance', 'Tencent', 'Alibaba', 'Baidu', 'Huawei', 'Samsung', 'LG', 'Sony'
];

// 行业标签映射
const INDUSTRY_TAGS = [
  'Social', 'Medical', 'Education', 'Finance', 'Retail', 'Entertainment', 'Technology',
  'Healthcare', 'Automotive', 'Energy', 'Manufacturing', 'Agriculture', 'Transportation',
  'Real Estate', 'Insurance', 'Legal', 'Government', 'Military', 'Space', 'Robotics',
  'Climate', 'Environment', 'Science', 'Research', 'Art', 'Music', 'Film', 'Gaming',
  'Sports', 'Food', 'Travel', 'Fashion', 'Beauty', 'Luxury', 'Consumer', 'Business'
];

// 解析Markdown文件并提取链接
const parseMarkdownLinks = (markdownContent: string): { title: string, url: string }[] => {
  const links: { title: string, url: string }[] = [];
  const lines = markdownContent.split('\n');

  for (const line of lines) {
    // 匹配Markdown链接格式: [标题](URL)
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const title = linkMatch[1].trim();
      const url = linkMatch[2].trim();
      if (url.startsWith('http')) {
        links.push({ title, url });
      }
    }
  }

  return links;
};

// 自动生成标签 - 最多3个标签
const generateTags = (title: string, url: string): string[] => {
  const tags = new Set<string>();
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();

  // 检查公司标签
  for (const company of COMPANY_TAGS) {
    const companyLower = company.toLowerCase();
    if (titleLower.includes(companyLower) || urlLower.includes(companyLower)) {
      tags.add(company);
      if (tags.size >= 3) break;
    }
  }

  // 检查行业标签
  for (const industry of INDUSTRY_TAGS) {
    const industryLower = industry.toLowerCase();
    if (titleLower.includes(industryLower)) {
      tags.add(industry);
      if (tags.size >= 3) break;
    }
  }

  // 特殊关键词检测
  if (tags.size < 3) {
    if (titleLower.includes('health') || titleLower.includes('medical') || titleLower.includes('doctor') || titleLower.includes('hospital')) {
      tags.add('Medical');
    }
    if (tags.size < 3 && (titleLower.includes('education') || titleLower.includes('school') || titleLower.includes('university') || titleLower.includes('student'))) {
      tags.add('Education');
    }
    if (tags.size < 3 && (titleLower.includes('finance') || titleLower.includes('bank') || titleLower.includes('investment') || titleLower.includes('money'))) {
      tags.add('Finance');
    }
    if (tags.size < 3 && (titleLower.includes('retail') || titleLower.includes('shop') || titleLower.includes('store') || titleLower.includes('ecommerce'))) {
      tags.add('Retail');
    }
    if (tags.size < 3 && (titleLower.includes('social') || titleLower.includes('media') || titleLower.includes('facebook') || titleLower.includes('twitter'))) {
      tags.add('Social');
    }
    if (tags.size < 3 && (titleLower.includes('entertainment') || titleLower.includes('movie') || titleLower.includes('music') || titleLower.includes('game'))) {
      tags.add('Entertainment');
    }
  }

  // 如果没有找到标签，使用默认标签
  if (tags.size === 0) {
    tags.add('AI');
  }

  // 限制最多3个标签
  return Array.from(tags).slice(0, 3);
};

const CollectionTab: React.FC<CollectionTabProps> = ({ isDarkMode, toggleBookmark, bookmarks, onSelectArticle }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const importFromMarkdown = async () => {
    try {
      // 读取Markdown文件
      const response = await fetch('/My%20Collection%20of%20Ai%20News.md');
      if (!response.ok) {
        throw new Error('Failed to load markdown file');
      }
      const markdownContent = await response.text();

      // 解析链接
      const links = parseMarkdownLinks(markdownContent);

      // 为每个链接生成标签并添加到库中
      const newItems: LibraryItem[] = links.map((link, index) => {
        const tags = generateTags(link.title, link.url);
        let source = 'unknown';

        try {
          // 确保URL有协议前缀
          let urlToParse = link.url;
          if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
            urlToParse = 'https://' + urlToParse;
          }
          source = new URL(urlToParse).hostname;
        } catch (error) {
          console.error('Invalid URL:', link.url, error);
          // 尝试从URL中提取域名
          const domainMatch = link.url.match(/https?:\/\/([^\/]+)/);
          if (domainMatch) {
            source = domainMatch[1];
          } else {
            // 尝试从URL中提取基本域名
            const simpleDomainMatch = link.url.match(/(?:https?:\/\/)?([^\/]+)/);
            if (simpleDomainMatch) {
              source = simpleDomainMatch[1];
            }
          }
        }

        return {
          id: Date.now() + index,
          title: link.title,
          url: link.url,
          tags: tags,
          source: source,
          timestamp: new Date().toISOString()
        };
      });

      return newItems;
    } catch (error) {
      console.error('Failed to import from markdown:', error);
      return [];
    }
  };

  const fetchLibrary = async () => {
    try {
      setLoading(true);

      // 优先从Markdown文件导入数据（这是主要数据源）
      const importedItems = await importFromMarkdown();

      if (importedItems.length > 0) {
        // Markdown 文件有数据，使用它
        setItems(importedItems);
        setApiError(false);
      } else {
        // Markdown 导入失败，尝试 API
        try {
          const res = await fetch('/api/library');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              // Transform API data to ensure tags is always an array
              const transformedData: LibraryItem[] = data.map((item: any) => ({
                id: item.id,
                title: item.title || 'Untitled',
                url: item.url || '',
                source: item.source || 'Unknown',
                timestamp: item.timestamp || new Date().toISOString(),
                // Handle both 'tag' (string) and 'tags' (array) from API
                tags: Array.isArray(item.tags)
                  ? item.tags
                  : (item.tag ? [item.tag] : generateTags(item.title || '', item.url || ''))
              }));
              setItems(transformedData);
              setApiError(false);
            } else {
              // API返回空数组，使用静态数据
              setItems(STATIC_COLLECTION);
              setApiError(false);
            }
          } else {
            // API错误，使用静态数据
            setItems(STATIC_COLLECTION);
            setApiError(true);
          }
        } catch {
          // API不可用，使用静态数据
          setItems(STATIC_COLLECTION);
          setApiError(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch library', e);
      // 所有方法都失败，使用静态数据
      setItems(STATIC_COLLECTION);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      // Defensive check: ensure tags exists and is an array
      const itemTags = Array.isArray(item.tags) ? item.tags : [];
      itemTags.forEach(tag => {
        if (tag) tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) {
      return items;
    }
    return items.filter(item => {
      const itemTags = Array.isArray(item.tags) ? item.tags : [];
      return selectedTags.every(tag => itemTags.includes(tag));
    });
  }, [items, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212]' : 'bg-[#F2F2F7]'} transition-colors duration-300`}>
      <header className={`${isDarkMode ? 'bg-[#121212]/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-10 transition-colors duration-300`}>
        <div className="px-6 pt-6 pb-4">
          <h1 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Library</h1>

          {/* 标签筛选器 - 2排高度，可左右滑动 */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filter by Tags</h3>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="relative">
                {/* 标签容器 - 固定2排高度，可水平滚动 */}
                <div className="overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="flex flex-col gap-1.5 min-w-max">
                    {/* 第一排标签 */}
                    <div className="flex gap-1.5">
                      {allTags.slice(0, Math.ceil(allTags.length / 2)).map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTags.includes(tag)
                            ? isDarkMode
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-600 text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {tag} {selectedTags.includes(tag) && '✓'}
                        </button>
                      ))}
                    </div>
                    {/* 第二排标签 */}
                    <div className="flex gap-1.5">
                      {allTags.slice(Math.ceil(allTags.length / 2)).map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedTags.includes(tag)
                            ? isDarkMode
                              ? 'bg-blue-500 text-white'
                              : 'bg-blue-600 text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                          {tag} {selectedTags.includes(tag) && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* 滚动提示 */}
                <div className={`absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l ${isDarkMode ? 'from-[#121212]/90' : 'from-white/90'} pointer-events-none`}></div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-3 pb-24">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className={`w-8 h-8 border-2 ${isDarkMode ? 'border-white/20' : 'border-black/10'} border-t-blue-500 rounded-full animate-spin`}></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              {selectedTags.length > 0 ? 'No items match the selected tags.' : 'No items in library yet.'}
            </div>
          ) : (
            <>
              {apiError && (
                <div className={`mb-4 p-3 rounded-xl ${isDarkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    ⚠️ Using static collection data. API is currently unavailable.
                  </p>
                </div>
              )}
              <div className="mb-2 text-xs opacity-60">
                Showing {filteredItems.length} of {items.length} items
                {selectedTags.length > 0 && ` (filtered by ${selectedTags.join(', ')})`}
              </div>
              {filteredItems.map(item => {
                const isBookmarked = bookmarks.some(b => b.url === item.url);
                return (
                  <SwipableListItem
                    key={item.id}
                    onSwipe={() => toggleBookmark(item)}
                    isBookmarked={isBookmarked}
                    swipeContent={
                      <div className="w-full h-full flex items-center justify-start pl-6 bg-blue-500 rounded-2xl text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                        </svg>
                        Save
                      </div>
                    }
                    unbookmarkContent={
                      <div className="w-full h-full flex items-center justify-start pl-6 bg-red-500 rounded-2xl text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2">
                          <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                        </svg>
                        Unsave
                      </div>
                    }
                  >
                    <button
                      onClick={() => onSelectArticle(item.url)}
                      className={`w-full text-left block p-4 rounded-2xl ${isDarkMode ? 'bg-[#1C1C1E] ring-white/10' : 'bg-white ring-black/5'} ring-1`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(Array.isArray(item.tags) ? item.tags : []).slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} line-clamp-2`}>{item.title}</p>
                          <p className={`text-[10px] mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {item.source} • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {isBookmarked && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1">
                            <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </SwipableListItem>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionTab;
