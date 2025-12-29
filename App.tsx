
import React, { useState, useCallback, useEffect } from 'react';
import TabBar from './components/TabBar';
import NewsTab from './components/NewsTab';
import BookmarkTab from './components/BookmarkTab';
import SettingsModal from './components/SettingsModal';
import CollectionTab from './components/CollectionTab';
import { Tab, BookmarkItem, SuggestedLink } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.News);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [externalUrlTrigger, setExternalUrlTrigger] = useState<string | null>(null);

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

  const handleSelectBookmarkItem = useCallback((url: string) => {
    // This functionality is disabled in the new "no-AI" version
    // but we keep the function for potential future use.
    window.open(url, '_blank');
  }, []);

  const handleUrlHandled = useCallback(() => {
    setExternalUrlTrigger(null);
  }, []);

  return (
    <div className={`w-screen h-screen ${isDarkMode ? 'bg-[#000000]' : 'bg-[#1C1C1E]'} flex justify-center items-center font-sans overflow-hidden transition-colors duration-300`}>
      <div className={`w-full h-full sm:w-[393px] sm:h-[852px] ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-white text-black'} sm:rounded-[55px] shadow-2xl overflow-hidden relative flex flex-col sm:ring-[12px] sm:ring-black transition-colors duration-300`}>
        
        <div className={`h-11 ${isDarkMode ? 'bg-[#121212]' : 'bg-white'} shrink-0 flex items-end justify-between px-8 pb-1 z-50 select-none transition-colors duration-300`}>
           <span className="text-[15px] font-bold tracking-tight">9:41</span>
           <div className="flex items-center space-x-1.5">
             <div className={`w-5 h-5 rounded-full border-[1.5px] ${isDarkMode ? 'border-white/20' : 'border-black/20'} flex items-center justify-center`}>
               <div className={`w-2.5 h-2.5 ${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}></div>
             </div>
           </div>
        </div>

        <main className="flex-1 relative overflow-hidden">
          <div className={`h-full ${activeTab === Tab.News ? 'block' : 'hidden'}`}>
            <NewsTab 
              externalUrl={externalUrlTrigger} 
              onUrlHandled={handleUrlHandled}
              isDarkMode={isDarkMode}
              onOpenSettings={() => setIsSettingsOpen(true)}
              addBookmark={addBookmark}
            />
          </div>

          <div className={`h-full ${activeTab === Tab.Collection ? 'block' : 'hidden'}`}>
            <CollectionTab isDarkMode={isDarkMode} addBookmark={addBookmark} />
          </div>

          <div className={`h-full ${activeTab === Tab.Bookmark ? 'block' : 'hidden'}`}>
            <BookmarkTab 
              bookmarks={bookmarks}
              onSelectItem={handleSelectBookmarkItem} 
              onDeleteItem={removeBookmark}
              isDarkMode={isDarkMode} 
            />
          </div>
        </main>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 ${isDarkMode ? 'bg-white/20' : 'bg-black/20'} rounded-full z-50`}></div>

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
