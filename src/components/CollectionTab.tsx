
import React, { useState, useEffect, useMemo } from 'react';
import { SuggestedLink, BookmarkItem } from '../types';
import SwipableListItem from './SwipableListItem';

interface LibraryItem extends SuggestedLink {
  id: number;
  tags: string[];
  categories: string[]; // 新增：主要类别
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
    tags: ["OpenAI"],
    categories: ["Tech Giants"],
    source: "OpenAI",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    title: "Anthropic's Constitutional AI Research",
    url: "https://www.anthropic.com/research",
    tags: ["Anthropic"],
    categories: ["Tech Giants", "AI Research"],
    source: "Anthropic",
    timestamp: new Date().toISOString()
  },
  {
    id: 3,
    title: "Google's Gemini: A New Era of AI Models",
    url: "https://blog.google/technology/ai/google-gemini-ai/",
    tags: ["Google", "LLMs"],
    categories: ["Tech Giants", "AI Research"],
    source: "Google",
    timestamp: new Date().toISOString()
  },
  {
    id: 4,
    title: "Microsoft's Copilot Ecosystem",
    url: "https://blogs.microsoft.com/ai/",
    tags: ["Microsoft", "Copilot"],
    categories: ["Tech Giants", "Tools & Apps"],
    source: "Microsoft",
    timestamp: new Date().toISOString()
  },
  {
    id: 5,
    title: "Meta's Llama 3: Open Source AI Model",
    url: "https://ai.meta.com/blog/meta-llama-3/",
    tags: ["Meta", "LLMs"],
    categories: ["Tech Giants", "AI Research"],
    source: "Meta",
    timestamp: new Date().toISOString()
  },
  {
    id: 6,
    title: "NVIDIA's AI Computing Platform",
    url: "https://www.nvidia.com/en-us/ai/",
    tags: ["NVIDIA"],
    categories: ["Tech Giants", "Business"],
    source: "NVIDIA",
    timestamp: new Date().toISOString()
  }
];

// 两级标签分类系统
const TAG_HIERARCHY = {
  'Tech Giants': {
    keywords: ['google', 'microsoft', 'openai', 'anthropic', 'meta', 'apple', 'amazon', 'nvidia', 'deepmind'],
    subtags: ['Google', 'Microsoft', 'OpenAI', 'Anthropic', 'Meta', 'Apple', 'Amazon', 'NVIDIA', 'DeepMind']
  },
  'AI Research': {
    keywords: ['research', 'paper', 'breakthrough', 'model', 'llm', 'gpt', 'gemini', 'training', 'scientific', 'study'],
    subtags: ['LLMs', 'Transformers', 'Diffusion', 'Reinforcement Learning', 'Neural Networks', 'Benchmark', 'Dataset']
  },
  'Tools & Apps': {
    keywords: ['tool', 'app', 'software', 'platform', 'api', 'chatgpt', 'copilot', 'product', 'launch', 'service'],
    subtags: ['ChatGPT', 'Copilot', 'Claude', 'Image Gen', 'Video Gen', 'Audio', 'Code Assistant', 'Browser']
  },
  'Business': {
    keywords: ['business', 'investment', 'startup', 'fund', 'acquisition', 'merger', 'revenue', 'market', 'stock'],
    subtags: ['Investment', 'Startup', 'IPO', 'Acquisition', 'Partnership', 'Revenue', 'Market Share']
  },
  'Society': {
    keywords: ['education', 'ethics', 'policy', 'government', 'law', 'regulation', 'social', 'healthcare', 'job'],
    subtags: ['Education', 'Ethics', 'Policy', 'Regulation', 'Healthcare', 'Jobs', 'Privacy', 'Safety']
  },
};

// 自动生成标签和类别
const generateTagsAndCategories = (title: string, url: string): { categories: string[], tags: string[] } => {
  const titleLower = title.toLowerCase();
  const urlLower = url.toLowerCase();
  const categories: string[] = [];
  const tags: string[] = [];

  // 检查每个分类
  for (const [category, data] of Object.entries(TAG_HIERARCHY)) {
    // 检查是否属于这个类别
    const categoryMatch = data.keywords.some(keyword =>
      titleLower.includes(keyword) || urlLower.includes(keyword)
    );

    if (categoryMatch) {
      categories.push(category);

      // 检查具体的细分标签
      for (const subtag of data.subtags) {
        const subtagLower = subtag.toLowerCase();
        if (titleLower.includes(subtagLower) || urlLower.includes(subtagLower)) {
          tags.push(subtag);
        }
      }
    }
  }

  // 如果没有匹配，使用默认
  if (categories.length === 0) {
    categories.push('AI News');
  }

  return { categories, tags: tags.slice(0, 3) }; // 最多3个具体标签
};

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

const CollectionTab: React.FC<CollectionTabProps> = ({ isDarkMode, toggleBookmark, bookmarks, onSelectArticle }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubTags, setSelectedSubTags] = useState<string[]>([]);

  const importFromMarkdown = async () => {
    try {
      // 读取Markdown文件
      const response = await fetch('/collection.md');
      if (!response.ok) {
        throw new Error('Failed to load markdown file');
      }
      const markdownContent = await response.text();

      // 解析链接
      const links = parseMarkdownLinks(markdownContent);

      // 为每个链接生成标签并添加到库中
      const newItems: LibraryItem[] = links.map((link, index) => {
        const { categories, tags } = generateTagsAndCategories(link.title, link.url);
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
          categories: categories,
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
              const transformedData: LibraryItem[] = data.map((item: any) => {
                const { categories, tags } = generateTagsAndCategories(item.title || '', item.url || '');
                return {
                  id: item.id,
                  title: item.title || 'Untitled',
                  url: item.url || '',
                  source: item.source || 'Unknown',
                  timestamp: item.timestamp || new Date().toISOString(),
                  categories: categories,
                  tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : tags
                };
              });
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

  // 获取所有主要类别及其文章数量
  const allCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    items.forEach(item => {
      const itemCategories = Array.isArray(item.categories) ? item.categories : [];
      itemCategories.forEach(cat => {
        if (cat) {
          categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        }
      });
    });

    return Object.keys(TAG_HIERARCHY)
      .map(category => ({
        category,
        count: categoryCounts.get(category) || 0
      }))
      .filter(cat => cat.count > 0);
  }, [items]);

  // 获取选中类别下的细分标签
  const availableSubTags = useMemo(() => {
    if (selectedCategories.length === 0) return [];

    const subTagCounts = new Map<string, number>();
    items.forEach(item => {
      // 只统计选中类别下的文章
      const itemCategories = Array.isArray(item.categories) ? item.categories : [];
      const hasSelectedCategory = selectedCategories.some(cat => itemCategories.includes(cat));

      if (hasSelectedCategory) {
        const itemTags = Array.isArray(item.tags) ? item.tags : [];
        itemTags.forEach(tag => {
          if (tag) {
            subTagCounts.set(tag, (subTagCounts.get(tag) || 0) + 1);
          }
        });
      }
    });

    return Array.from(subTagCounts.entries())
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [items, selectedCategories]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemCategories = Array.isArray(item.categories) ? item.categories : [];
      const itemTags = Array.isArray(item.tags) ? item.tags : [];

      // 如果没有选择任何筛选，显示所有
      if (selectedCategories.length === 0 && selectedSubTags.length === 0) {
        return true;
      }

      // 必须匹配选中的类别
      const categoryMatch = selectedCategories.length === 0 ||
        selectedCategories.some(cat => itemCategories.includes(cat));

      // 必须匹配选中的细分标签
      const tagMatch = selectedSubTags.length === 0 ||
        selectedSubTags.every(tag => itemTags.includes(tag));

      return categoryMatch && tagMatch;
    });
  }, [items, selectedCategories, selectedSubTags]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories([]);
      setSelectedSubTags([]); // 清空细分标签
    } else {
      setSelectedCategories([category]); // 单选
      setSelectedSubTags([]); // 切换类别时清空细分标签
    }
  };

  const toggleSubTag = (tag: string) => {
    if (selectedSubTags.includes(tag)) {
      setSelectedSubTags(selectedSubTags.filter(t => t !== tag));
    } else {
      setSelectedSubTags([...selectedSubTags, tag]);
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubTags([]);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212]' : 'bg-[#F2F2F7]'} transition-colors duration-300`}>
      <header className={`${isDarkMode ? 'bg-[#121212]/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-10 transition-colors duration-300`}>
        <div className="px-6 pt-6 pb-4">
          <h1 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Library</h1>

          {/* 免责声明 */}
          <p className={`text-[10px] ${isDarkMode ? 'text-white/30' : 'text-black/20'}`}>
            内容来自公开网络 • 内容版权归原作者所有 • 请点击标题访问原网站
          </p>

          {/* 两级标签筛选器 */}
          {allCategories.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* 第一级：主要类别 */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</h3>
                  {(selectedCategories.length > 0 || selectedSubTags.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                  <div className="flex gap-2 min-w-max">
                    {allCategories.map(({ category, count }) => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          selectedCategories.includes(category)
                            ? isDarkMode
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : isDarkMode
                              ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          selectedCategories.includes(category)
                            ? 'bg-white/20'
                            : 'opacity-50'
                        }`}>
                          {count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 第二级：细分标签（当选中类别时显示） */}
              {selectedCategories.length > 0 && availableSubTags.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedCategories[0]} → Filter by
                    </h3>
                  </div>
                  <div className="overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
                    <div className="flex gap-2 min-w-max">
                      {availableSubTags.map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => toggleSubTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedSubTags.includes(tag)
                              ? isDarkMode
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-blue-100 text-blue-700 border border-blue-300'
                              : isDarkMode
                                ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {tag}
                          <span className={`ml-1.5 text-xs ${selectedSubTags.includes(tag) ? 'opacity-100' : 'opacity-50'}`}>
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
              {selectedCategories.length > 0 || selectedSubTags.length > 0 ? 'No items match the selected filters.' : 'No items in library yet.'}
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
                {(selectedCategories.length > 0 || selectedSubTags.length > 0) && ` (filtered)`}
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
                          <div className="flex items-center gap-2 mb-2">
                            {(Array.isArray(item.categories) ? item.categories : []).slice(0, 2).map((category, index) => (
                              <span
                                key={index}
                                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md ${
                                  isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {category}
                              </span>
                            ))}
                            {(Array.isArray(item.tags) ? item.tags : []).slice(0, 1).map((tag, index) => (
                              <span
                                key={`tag-${index}`}
                                className={`text-[10px] font-medium px-2 py-1 rounded-md ${
                                  isDarkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}
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
