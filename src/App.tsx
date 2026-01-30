
import React, { useState, useCallback, useEffect } from 'react';
import TabBar from './components/TabBar';
import NewsTab from './components/NewsTab';
import BookmarkTab from './components/BookmarkTab';
import SettingsModal from './components/SettingsModal';
import CollectionTab from './components/CollectionTab';
import ReaderView from './components/ReaderView';
import { Tab, BookmarkItem, SuggestedLink } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.News);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('news_dark_mode') === 'true');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => Number(localStorage.getItem('news_font_size')) || 1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [externalUrlTrigger, setExternalUrlTrigger] = useState<string | null>(null);
  const [readerUrl, setReaderUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('news_bookmarks');
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('news_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('news_font_size', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);

  const addBookmark = useCallback((item: SuggestedLink) => {
    setBookmarks(prev => {
      const isDuplicate = prev.some(b => b.url === item.url);
      if (isDuplicate) return prev;

      const newItem: BookmarkItem = {
        id: Math.random().toString(36).substr(2, 9),
        url: item.url,
        title: item.title,
        timestamp: Date.now()
      };
      const newBookmarks = [newItem, ...prev].slice(0, 100);
      localStorage.setItem('news_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => {
      const newBookmarks = prev.filter(item => item.id !== id);
      localStorage.setItem('news_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  // 根据 URL 移除收藏
  const removeBookmarkByUrl = useCallback((url: string) => {
    setBookmarks(prev => {
      const newBookmarks = prev.filter(item => item.url !== url);
      localStorage.setItem('news_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  // 切换收藏状态（如果已收藏则取消，否则添加）
  const toggleBookmark = useCallback((item: SuggestedLink) => {
    const existing = bookmarks.find(b => b.url === item.url);
    if (existing) {
      removeBookmarkByUrl(item.url);
    } else {
      addBookmark(item);
    }
  }, [bookmarks, addBookmark, removeBookmarkByUrl]);

  const handleSelectBookmarkItem = useCallback((url: string) => {
    // This functionality is disabled in the new "no-AI" version
    // but we keep the function for potential future use.
    window.open(url, '_blank');
  }, []);

  const handleUrlHandled = useCallback(() => {
    setExternalUrlTrigger(null);
  }, []);

  return (
    <div className={`w-screen h-screen ${isDarkMode ? 'bg-[#000000]' : 'bg-[#F2F2F7]'} flex justify-center items-start md:items-center font-sans overflow-hidden selection:bg-blue-100 selection:text-blue-900`}>
      <div className={`w-full h-full max-w-[768px] ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'} md:rounded-[32px] md:h-[90vh] md:my-auto shadow-2xl overflow-hidden relative flex flex-col md:ring-[4px] md:ring-black/10 transition-colors duration-300`}>

        <main className="flex-1 relative overflow-hidden">
          <div className={`h-full ${activeTab === Tab.News ? 'block' : 'hidden'}`}>
            <NewsTab
              externalUrl={externalUrlTrigger}
              onUrlHandled={handleUrlHandled}
              isDarkMode={isDarkMode}
              onOpenSettings={() => setIsSettingsOpen(true)}
              toggleBookmark={toggleBookmark}
              bookmarks={bookmarks}
              onSelectArticle={setReaderUrl}
            />
          </div>

          <div className={`h-full ${activeTab === Tab.Collection ? 'block' : 'hidden'}`}>
            <CollectionTab isDarkMode={isDarkMode} toggleBookmark={toggleBookmark} bookmarks={bookmarks} onSelectArticle={setReaderUrl} />
          </div>

          <div className={`h-full ${activeTab === Tab.Bookmark ? 'block' : 'hidden'}`}>
            <BookmarkTab
              bookmarks={bookmarks}
              onSelectItem={setReaderUrl}
              onDeleteItem={removeBookmark}
              isDarkMode={isDarkMode}
            />
          </div>

          {readerUrl && (
            <div className="absolute inset-0 z-[60]">
              <ReaderView
                url={readerUrl}
                isDarkMode={isDarkMode}
                fontSizeMultiplier={fontSizeMultiplier}
                onDarkModeChange={setIsDarkMode}
                onBack={() => setReaderUrl(null)}
              />
            </div>
          )}
        </main>

        <TabBar key={`tabbar-${isDarkMode}`} activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} disabled={!!readerUrl} />

        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-full z-50 pointer-events-none`}></div>

        {/* 底部免责声明 - 只在 News 页面显示 */}
        {activeTab === Tab.News && !readerUrl && (
          <div className={`absolute bottom-24 left-0 right-0 px-4 text-center pointer-events-none`}>
            <p className={`text-[10px] ${isDarkMode ? 'text-white/30' : 'text-black/20'}`}>
              RSS 聚合工具 • 内容版权归原作者所有 •
              <a
                href="/terms.md"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${isDarkMode ? 'hover:text-white/50' : 'hover:text-black/50'} pointer-events-auto`}
              >
                使用条款
              </a>
            </p>
          </div>
        )}

        {isSettingsOpen && (
          <SettingsModal
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            fontSizeMultiplier={fontSizeMultiplier}
            setFontSizeMultiplier={setFontSizeMultiplier}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
