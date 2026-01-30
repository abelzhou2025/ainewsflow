
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAndCategorizeNews } from '../services/geminiService';
import { SuggestedLink, NewsCluster, BookmarkItem } from '../types';
import SwipableListItem from './SwipableListItem';

interface NewsTabProps {
  externalUrl?: string | null;
  onUrlHandled?: () => void;
  isDarkMode: boolean;
  onOpenSettings: () => void;
  toggleBookmark: (item: SuggestedLink) => void;
  bookmarks: BookmarkItem[];
  onSelectArticle: (url: string) => void;
}

const NewsTab: React.FC<NewsTabProps> = ({
  isDarkMode,
  onOpenSettings,
  toggleBookmark,
  bookmarks,
  onSelectArticle
}) => {
  const [view, setView] = useState<'list' | 'topicDetail'>('list');
  const [clusters, setClusters] = useState<NewsCluster[]>([]);
  const [activeCluster, setActiveCluster] = useState<NewsCluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullPosition, setPullPosition] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ y: number; x: number; atTop: boolean; isVertical: boolean | null }>({
    y: 0,
    x: 0,
    atTop: false,
    isVertical: null
  });


  const loadInitialClusters = useCallback(async () => {
    setLoading(true);
    try {
      // Check if we should update featured news (every 1 day)
      const { fetchAndCategorizeNews, shouldUpdateFeaturedNews, updateFeaturedNews, getStoredFeaturedNews } = await import('../services/geminiService');

      let featuredData;
      const storedFeatured = getStoredFeaturedNews();
      const needsUpdate = shouldUpdateFeaturedNews();

      if (needsUpdate || !storedFeatured || storedFeatured.length === 0) {
        // Fetch new data including featured articles
        const result = await fetchAndCategorizeNews(false);
        setClusters(result.clusters);

        // Update featured news if needed
        if (needsUpdate || !storedFeatured || storedFeatured.length === 0) {
          console.log('[NewsTab] Updating featured news...');
          featuredData = await updateFeaturedNews();
        } else {
          featuredData = result.featured;
        }
      } else {
        console.log('[NewsTab] Using stored featured news');
        featuredData = storedFeatured;

        // Fetch clusters only (featured is already loaded)
        const result = await fetchAndCategorizeNews(false);
        setClusters(result.clusters);
      }

      setFeaturedItems(featuredData || []);
    } catch (e) {
      console.error("Failed to fetch news data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialClusters();
  }, [loadInitialClusters]);

  const handleOpenCluster = (cluster: NewsCluster) => {
    setActiveCluster(cluster);
    setView('topicDetail');
  };

  const handleBackToList = () => {
    setView('list');
    setActiveCluster(null);
  };

  const toggleCluster = (clusterId: string) => {
    setExpandedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullPosition(60);

    try {
      // Force refresh by ignoring cache and limiting to 3 articles per cluster
      const { fetchAndCategorizeNews } = await import('../services/geminiService');
      const result = await fetchAndCategorizeNews(true);
      setClusters(result.clusters);
      setFeaturedItems(result.featured);
    } catch (e) {
      console.error("Failed to refresh news", e);
    } finally {
      setIsRefreshing(false);
      setPullPosition(0);
    }
  }, []);

  // Use native event listeners for better control
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let currentPullPosition = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      const touch = e.touches[0];
      if (container.scrollTop === 0) {
        touchStartRef.current = {
          y: touch.clientY,
          x: touch.clientX,
          atTop: true,
          isVertical: null
        };
        setIsPulling(true);
        currentPullPosition = 0;
      } else {
        touchStartRef.current = { y: 0, x: 0, atTop: false, isVertical: null };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current.atTop || isRefreshing) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = touch.clientX - touchStartRef.current.x;

      // Determine scroll direction on first significant movement
      if (touchStartRef.current.isVertical === null) {
        const absDeltaY = Math.abs(deltaY);
        const absDeltaX = Math.abs(deltaX);
        if (absDeltaY > 5 || absDeltaX > 5) {
          touchStartRef.current.isVertical = absDeltaY > absDeltaX;
        }
      }

      // Only handle vertical pull-down gestures
      if (touchStartRef.current.isVertical === true && deltaY >= 0) {
        e.preventDefault();
        const resistedPull = Math.pow(deltaY, 0.85);
        currentPullPosition = resistedPull;
        setPullPosition(resistedPull);
      } else if (touchStartRef.current.isVertical === false) {
        // Horizontal swipe detected, reset pull state
        touchStartRef.current.atTop = false;
        setIsPulling(false);
        setPullPosition(0);
        currentPullPosition = 0;
      }
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current.atTop || isRefreshing) return;

      setIsPulling(false);
      const wasVertical = touchStartRef.current.isVertical === true;
      const finalPullPosition = currentPullPosition;
      touchStartRef.current = { y: 0, x: 0, atTop: false, isVertical: null };

      if (wasVertical && finalPullPosition > 80) { // Refresh threshold
        handleRefresh();
      } else {
        setPullPosition(0); // Snap back
        currentPullPosition = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, handleRefresh, view]);


  const pullToRefreshWrapper = (content: React.ReactNode) => (
    <div
      ref={scrollContainerRef}
      style={{ touchAction: 'pan-y' }}
      className="flex-1 overflow-y-auto no-scrollbar"
    >
      <div
        style={{
          transform: `translateY(${pullPosition}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
        className="relative"
      >
        <div className="absolute bottom-full left-0 right-0 flex justify-center items-center h-[60px] pointer-events-none">
          <div className={`w-6 h-6 border-2 ${isDarkMode ? 'border-white/20' : 'border-black/10'} border-t-blue-500 rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ opacity: Math.min(pullPosition / 60, 1) }}
          ></div>
        </div>
        {content}
      </div>
    </div>
  );


  if (view === 'list') {
    return (
      <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212]' : 'bg-[#F2F2F7]'} transition-colors duration-300`}>
        <div className={`${isDarkMode ? 'bg-[#121212]/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} sticky top-0 z-10`}>
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ai News Flow</h1>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                RSS Aggregator from 11 Tech Media Sources
              </p>
            </div>
            <button onClick={onOpenSettings} className={`p-1 rounded-full ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12H13.5" />
              </svg>
            </button>
          </div>
        </div>
        {pullToRefreshWrapper(
          <div className="p-4 space-y-3 pb-24">
            {/* RSS 聚合免责声明 */}
            <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
              <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                内容来自公开 RSS 源，版权归原作者所有 • 点击文章标题可阅读完整内容
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-full pt-24">
                <div className={`w-8 h-8 border-2 ${isDarkMode ? 'border-white/20' : 'border-black/10'} border-t-blue-500 rounded-full animate-spin`}></div>
              </div>
            ) : (
              <>
                {/* Featured Section */}
                {featuredItems.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-3 px-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                      <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Featured News</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {featuredItems.map(item => (
                        <button
                          key={item.id || item.url}
                          onClick={() => onSelectArticle(item.url)}
                          className={`p-4 rounded-[20px] ${isDarkMode ? 'bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] text-white' : 'bg-gradient-to-br from-white to-gray-50 text-black shadow-lg shadow-black/5'
                            } text-left relative overflow-hidden group active:scale-[0.97] transition-all`}
                        >
                          <div className="relative z-10">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-lg ${isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'} mb-2 inline-block`}>
                              {item.tag || 'FEATURED'}
                            </span>
                            <h3 className="font-bold text-sm leading-tight line-clamp-3 mb-2">{item.title}</h3>
                            <div className="flex items-center text-[9px] opacity-40 font-medium">
                              <span className="truncate">{(() => {
                                try {
                                  // 确保URL有协议前缀
                                  let urlToParse = item.url;
                                  if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
                                    urlToParse = 'https://' + urlToParse;
                                  }
                                  return new URL(urlToParse).hostname;
                                } catch (error) {
                                  // 尝试从URL中提取域名
                                  const domainMatch = item.url.match(/https?:\/\/([^\/]+)/);
                                  if (domainMatch) {
                                    return domainMatch[1];
                                  }
                                  // 尝试从URL中提取基本域名
                                  const simpleDomainMatch = item.url.match(/(?:https?:\/\/)?([^\/]+)/);
                                  if (simpleDomainMatch) {
                                    return simpleDomainMatch[1];
                                  }
                                  return 'unknown';
                                }
                              })()}</span>
                            </div>
                          </div>
                          <div className="absolute right-[-5px] bottom-[-5px] opacity-5 group-hover:scale-110 transition-transform">
                            <svg width="60" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.45l7.91 14.1H4.09L12 5.45z" /></svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* RSS Feed Section - 折叠式展示 */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Global Feed</h2>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-1.5 rounded-full transition-all ${isDarkMode
                      ? 'hover:bg-white/10 active:bg-white/20'
                      : 'hover:bg-black/5 active:bg-black/10'
                      } ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh feeds"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>

                {/* 折叠式类别列表 */}
                <div className="space-y-3">
                  {clusters.map(cluster => {
                    const isExpanded = expandedClusters.has(cluster.id);
                    return (
                      <div
                        key={cluster.id}
                        className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'} shadow-sm ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-black/5'}`}
                      >
                        {/* 类别标题栏 - 可点击展开/收起 */}
                        <button
                          onClick={() => toggleCluster(cluster.id)}
                          className={`w-full p-4 text-left transition-all ${isDarkMode ? 'hover:bg-[#2C2C2E]' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`font-bold text-base ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{cluster.topicEnglish}</p>
                              <p className="text-sm text-gray-400 mt-0.5">{cluster.topicChinese}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                {cluster.articles.length}
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>
                        </button>

                        {/* 展开的文章列表 */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 dark:border-white/10 divide-y divide-gray-200 dark:divide-white/5">
                            {cluster.articles.map(article => {
                              const isBookmarked = bookmarks.some(b => b.url === article.url);
                              return (
                                <SwipableListItem
                                  key={article.url}
                                  onSwipe={() => toggleBookmark(article)}
                                  isBookmarked={isBookmarked}
                                  swipeContent={
                                    <div className="w-full h-full flex items-center justify-start pl-6 bg-blue-500 rounded-2xl text-white">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  }
                                  unbookmarkContent={
                                    <div className="w-full h-full flex items-center justify-start pl-6 bg-red-500 rounded-2xl text-white">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                                        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  }
                                >
                                  <button
                                    onClick={() => onSelectArticle(article.url)}
                                    className={`w-full text-left block p-4 ${isDarkMode ? 'hover:bg-[#2C2C2E]' : 'hover:bg-gray-50'} transition-colors`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <p className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} truncate flex-1`}>{article.title}</p>
                                      {isBookmarked && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500 flex-shrink-0">
                                          <path fillRule="evenodd" d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 0 0 1.075.676L10 15.082l5.925 2.844A.75.75 0 0 0 17 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0 0 10 2Z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    {article.source && (
                                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>{article.source}</p>
                                    )}
                                  </button>
                                </SwipableListItem>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default NewsTab;
