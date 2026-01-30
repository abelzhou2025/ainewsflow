
import React from 'react';
import { Tab } from '../types';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isDarkMode: boolean;
  disabled?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, isDarkMode, disabled = false }) => {
  const getTabClass = (tab: Tab) =>
    `flex flex-col items-center justify-center w-full transition-all duration-200 ${
      activeTab === tab ? 'text-[#007AFF]' : isDarkMode ? 'text-[#8E8E93]' : 'text-[#8E8E93]'
    } ${disabled ? 'pointer-events-none opacity-50' : ''}`;

  return (
    <nav className={`flex-none h-[88px] ${isDarkMode ? 'bg-[#121212]/80 border-white/10' : 'bg-white/80 border-gray-200'} backdrop-blur-2xl border-t flex justify-around items-start pt-3 pb-8 px-2 select-none transition-colors duration-300 ${disabled ? 'pointer-events-none' : ''}`}>
      <button onClick={() => !disabled && onTabChange(Tab.News)} className={getTabClass(Tab.News)} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c1.05 0 2.04.19 2.95.539a.75.75 0 0 0 1-.707V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
        </svg>
        <span className="text-[10px] font-medium tracking-tight">News</span>
      </button>

      <button onClick={() => !disabled && onTabChange(Tab.Collection)} className={getTabClass(Tab.Collection)} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
          <path fillRule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5v16.5a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 0-1.5H5.25v-16.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M8.25 2.25a.75.75 0 0 0 0 1.5v16.5a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 0-1.5H9v-16.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 0 0 1.5v16.5a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 0-1.5h-5.25v-16.5a.75.75 0 0 0-.75-.75Z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-medium tracking-tight">Collection</span>
      </button>

      <button onClick={() => !disabled && onTabChange(Tab.Bookmark)} className={getTabClass(Tab.Bookmark)} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mb-1">
          <path fillRule="evenodd" d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6Zm1.5 1.5a.75.75 0 0 0-.75.75V16.5a.75.75 0 0 0 1.085.67L12 15.089l4.165 2.083a.75.75 0 0 0 1.085-.671V5.25a.75.75 0 0 0-.75-.75h-9Z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-medium tracking-tight">Bookmark</span>
      </button>
    </nav>
  );
};

export default TabBar;
