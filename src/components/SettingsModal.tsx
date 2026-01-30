
import React from 'react';

interface SettingsModalProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (val: number) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isDarkMode,
  setIsDarkMode,
  fontSizeMultiplier,
  setFontSizeMultiplier,
  onClose
}) => {
  return (
    <div className="absolute inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={`relative w-full ${isDarkMode ? 'bg-[#1C1C1E] text-white' : 'bg-[#F2F2F7] text-black'} rounded-t-[30px] p-6 pb-12 shadow-2xl animate-slide-up`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Display Settings</h2>
          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} font-bold`}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-white'} shadow-sm transition-colors duration-300`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-100 text-indigo-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              </div>
              <span className="font-semibold">Dark Mode</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Font Size Slider */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-white'} shadow-sm transition-colors duration-300`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500' : 'bg-blue-100 text-blue-600'}`}>
                <span className="font-bold text-lg leading-none">A</span>
              </div>
              <span className="font-semibold">Font Size</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-xs opacity-50">A</span>
              <input 
                type="range" 
                min="0.8" 
                max="1.5" 
                step="0.1" 
                value={fontSizeMultiplier}
                onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
              <span className="text-lg opacity-50">A</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default SettingsModal;
