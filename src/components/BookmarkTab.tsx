
import React from 'react';
import { BookmarkItem } from '../types';
import SwipableListItem from './SwipableListItem';

interface BookmarkTabProps {
  bookmarks: BookmarkItem[];
  onSelectItem: (url: string) => void;
  onDeleteItem: (id: string) => void;
  isDarkMode: boolean;
}

const BookmarkTab: React.FC<BookmarkTabProps> = ({ bookmarks, onSelectItem, onDeleteItem, isDarkMode }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212]' : 'bg-[#F2F2F7]'} transition-colors duration-300`}>
      <div className={`${isDarkMode ? 'bg-[#121212]/90 border-white/10' : 'bg-white/90 border-gray-200'} backdrop-blur-md border-b px-6 py-6 sticky top-0 z-10 transition-colors duration-300`}>
        <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bookmarks</h1>
        <p className="text-gray-500 text-sm mt-1">Click to read, swipe right to delete</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 no-scrollbar">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            <p className="text-sm font-medium">No bookmarks yet</p>
          </div>
        ) : (
          bookmarks.map((item) => {
            const deleteContent = (
              <div className="w-full h-full flex items-center justify-start pl-6 bg-red-500 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
            );

            return (
              <SwipableListItem
                key={item.id}
                onSwipe={() => onDeleteItem(item.id)}
                swipeContent={deleteContent}
              >
                <button
                  onClick={() => onSelectItem(item.url)}
                  className={`w-full p-4 rounded-2xl ${isDarkMode ? 'bg-[#1C1C1E] border-white/10' : 'bg-white border-gray-100'} text-left shadow-sm border transition-all active:scale-[0.98] cursor-pointer`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1">
                      {formatDate(item.timestamp)}
                    </div>
                    <div className={`text-base font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} truncate mb-0.5`}>
                      {item.title || "No Title"}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium truncate opacity-70`}>
                      {item.url}
                    </div>
                  </div>
                </button>
              </SwipableListItem>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BookmarkTab;
