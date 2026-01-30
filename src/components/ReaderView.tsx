
import React, { useState, useEffect } from 'react';

interface ReaderViewProps {
    url: string;
    isDarkMode: boolean;
    fontSizeMultiplier: number;
    onDarkModeChange: (isDarkMode: boolean) => void;
    onBack: () => void;
}

interface Article {
    title: string;
    content: string;
    siteName?: string;
    byline?: string;
}

interface Translation {
    word: string;
    result: string;
    x: number;
    y: number;
}

interface TranslationResponse {
    responseData: {
        translatedText: string;
    };
}

type EnglishFont = 'system' | 'georgia' | 'palatino' | 'times' | 'garamond' | 'verdana';

const FONTS: Record<EnglishFont, { name: string; family: string }> = {
    'system': { name: 'System', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    'georgia': { name: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
    'palatino': { name: 'Palatino', family: 'Palatino, "Palatino Linotype", serif' },
    'times': { name: 'Times', family: '"Times New Roman", Times, serif' },
    'garamond': { name: 'Garamond', family: 'Garamond, "Adobe Garamond Pro", serif' },
    'verdana': { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
};

const ReaderView: React.FC<ReaderViewProps> = ({ url, isDarkMode, fontSizeMultiplier: initialFontSize, onDarkModeChange, onBack }) => {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [translation, setTranslation] = useState<Translation | null>(null);

    // Local settings state - initialize from localStorage
    const [localFontSize, setLocalFontSize] = useState<number>(() => {
        const saved = localStorage.getItem('reader_fontSize');
        return saved ? parseFloat(saved) : initialFontSize;
    });
    const [selectedFont, setSelectedFont] = useState<EnglishFont>(() => {
        const saved = localStorage.getItem('reader_font');
        return (saved as EnglishFont) || 'system';
    });
    const [showSettings, setShowSettings] = useState(false);
    const settingsPanelRef = React.useRef<HTMLDivElement>(null);

    // Ensure settings panel is closed when URL changes
    useEffect(() => {
        setShowSettings(false);
    }, [url]);

    // Save font size preference
    useEffect(() => {
        localStorage.setItem('reader_fontSize', localFontSize.toString());
    }, [localFontSize]);

    // Save font preference
    useEffect(() => {
        localStorage.setItem('reader_font', selectedFont);
    }, [selectedFont]);

    // Handle click outside to close settings panel
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        };

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showSettings]);

    // Handle back button to close settings instead of exiting reader
    const handleBack = (e: React.MouseEvent) => {
        if (showSettings) {
            e.stopPropagation();
            setShowSettings(false);
        } else {
            onBack();
        }
    };

    // Clean content more aggressively
    const cleanContent = (html: string): string => {
        let cleaned = html;

        // Special handling for Ars Technica - remove font settings UI
        if (cleaned.includes('text-settings') || cleaned.includes('Size') || cleaned.includes('Width')) {
            // Remove font settings containers
            cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*text-settings[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
            cleaned = cleaned.replace(/<div[^>]*id=["'][^"']*text-settings[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
            cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*font-settings[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
            cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*typeface-selector[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

            // Remove individual UI text lines that appear as paragraphs
            const uiLinesToRemove = [
                // Exact matches for Ars Technica font settings UI
                /<p[^>]*>\s*Size\s*<\/p>/gi,
                /<p[^>]*>\s*Standard\s*<\/p>/gi,
                /<p[^>]*>\s*Width\s*\*\s*<\/p>/gi,
                /<p[^>]*>\s*Width\s*<\/p>/gi,
                /<p[^>]*>\s*Links\s*<\/p>/gi,
                /<p[^>]*>\s*\*\s*Subscribers only\s*<\/p>/gi,
                /<p[^>]*>\s*Subscribers only\s*<\/p>/gi,
                /<p[^>]*>\s*Learn more\s*<\/p>/gi,
                /<p[^>]*>\s*\*\s*(?:Size|Width|Links)\s*\*\s*<\/p>/gi,
                // Also handle div-wrapped versions
                /<div[^>]*>\s*Size\s*<\/div>/gi,
                /<div[^>]*>\s*Standard\s*<\/div>/gi,
                /<div[^>]*>\s*Width\s*\*\s*<\/div>/gi,
                /<div[^>]*>\s*Links\s*<\/div>/gi,
                /<div[^>]*>\s*\*\s*Subscribers only\s*<\/div>/gi,
                /<div[^>]*>\s*Learn more\s*<\/div>/gi,
            ];

            uiLinesToRemove.forEach(pattern => {
                cleaned = cleaned.replace(pattern, '');
            });

            // Remove consecutive empty lines that might result from removal
            cleaned = cleaned.replace(/(<\/p>\s*){3,}/g, '</p><p>');
            cleaned = cleaned.replace(/(<\/div>\s*){3,}/g, '</div>');

            console.log('[ReaderView] Removed Ars Technica font settings UI text');
        }

        // Remove common non-content elements
        const patternsToRemove = [
            /<div[^>]*class=["'][^"']*(?:advertisement|ad-|promo|sponsored|newsletter|subscribe|related|recommended|more-from|trending|popular|sidebar)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
            /<aside[^>]*>[\s\S]*?<\/aside>/gi,
            /<iframe[\s\S]*?<\/iframe>/gi,
            /<script[\s\S]*?<\/script>/gi,
            /<style[\s\S]*?<\/style>/gi,
            /<!--[\s\S]*?-->/g,
            /<div[^>]*class=["'][^"']*(?:social|share|follow|comments)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
            /<nav[^>]*>[\s\S]*?<\/nav>/gi,
        ];

        patternsToRemove.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });

        // Remove UI text patterns that pollute article content
        const uiTextPatterns = [
            /^<(?:p|div|span|h1|h2|h3|h4|h5|h6)[^>]*>\s*(?:STORY TEXT|SIZE|WIDTH|HEIGHT|LINKS|AUTHOR|PUBLISHED|UPDATED|SOURCE|TOPICS|SUBSCRIBERS? ONLY|LEARN MORE|READ MORE|SHARE|COMMENT|SIGN UP|SUBSCRIBE|STANDARD)\s*<\/(?:p|div|span|h1|h2|h3|h4|h5|h6)>$/gmi,
            /^<(?:p|div|span|li|h\d)[^>]*>\s*\*\s*(?:STORY TEXT|SIZE|WIDTH|HEIGHT)\s*\*\s*<\/(?:p|div|span|li|h\d)>$/gmi,
            /^<(?:p|div|span|button)[^>]*>\s*(SUBSCRIBERS? ONLY|LEARN MORE|READ MORE|ADVERTISEMENT|SPONSORED)\s*<\/(?:p|div|span|button)>$/gmi,
        ];

        const lines = cleaned.split('\n');
        cleaned = lines.filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            return !uiTextPatterns.some(pattern => pattern.test(trimmed));
        }).join('\n');

        return cleaned;
    };

    useEffect(() => {
        const fetchArticle = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('[ReaderView] Fetching article from:', url);
                const response = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
                if (!response.ok) {
                    throw new Error('Failed to load article content');
                }
                const data = await response.json();
                // Clean the content
                data.content = cleanContent(data.content);
                setArticle(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [url]);

    const handleContentClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (translation) {
            setTranslation(null);
            return;
        }

        // 获取点击/触摸位置
        let clientX: number, clientY: number;
        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('changedTouches' in e && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            return;
        }

        // 延迟一下让选择生效
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            // Simple word extraction: if click on a word (or select it)
            if (text && /^[a-zA-Z-]+$/.test(text) && text.length < 30) {
                setTranslation({
                    word: text,
                    result: `翻译中...`,
                    x: clientX,
                    y: clientY
                });

                // 使用简单的翻译API
                fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`)
                    .then(res => res.json())
                    .then((data: TranslationResponse) => {
                        const translatedText = data.responseData?.translatedText || "翻译未找到";
                        const cleanTranslation = translatedText.split(/[.,;!?]/)[0].trim();
                        setTranslation(prev => prev ? { ...prev, result: cleanTranslation } : null);
                    })
                    .catch(() => {
                        const simpleTranslations: Record<string, string> = {
                            'the': '这', 'and': '和', 'is': '是', 'in': '在', 'to': '到',
                            'of': '的', 'a': '一个', 'for': '为了', 'on': '在...上',
                        };
                        const simpleTranslation = simpleTranslations[text.toLowerCase()] || "点击其他位置关闭";
                        setTranslation(prev => prev ? { ...prev, result: simpleTranslation } : null);
                    });
            }
        }, 50);
    };

    const baseFontSize = 18;
    const currentFontSize = baseFontSize * localFontSize;
    const currentFontFamily = FONTS[selectedFont].family;

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212] text-[#E0E0E0]' : 'bg-white text-[#1A1A1A]'} overflow-hidden transition-colors duration-300`}>
            {/* Header */}
            <header className={`h-14 flex items-center justify-between px-4 border-b ${isDarkMode ? 'border-white/10 bg-[#1C1C1E]/90' : 'border-gray-200 bg-white/90'} backdrop-blur-md sticky top-0 z-30`}>
                <div className="flex items-center space-x-3">
                    <button onClick={handleBack} className="text-blue-500 flex items-center font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        {showSettings ? 'Close' : 'Back'}
                    </button>
                    <span className="text-sm font-bold truncate max-w-[150px] opacity-60">
                        {article?.siteName || 'Reader Mode'}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'} transition-colors`}
                        title="Reading settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                    </button>
                    <button
                        onClick={() => window.open(url, '_blank')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Original
                    </button>
                </div>
            </header>

            {/* Settings Panel */}
            {showSettings && (
                <div
                    ref={settingsPanelRef}
                    className={`border-b ${isDarkMode ? 'bg-[#1C1C1E] border-white/10' : 'bg-gray-50 border-gray-200'} px-6 py-4 space-y-4`}
                >
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Dark Mode</span>
                        <button
                            onClick={() => onDarkModeChange(!isDarkMode)}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Font Size</span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Math.round(localFontSize * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.8"
                            max="1.5"
                            step="0.05"
                            value={localFontSize}
                            onChange={(e) => setLocalFontSize(parseFloat(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: isDarkMode
                                    ? 'linear-gradient(to right, #3B82F6 0%, #3B82F6 ' + ((localFontSize - 0.8) / 0.7 * 100) + '%, #374151 ' + ((localFontSize - 0.8) / 0.7 * 100) + '%, #374151 100%)'
                                    : 'linear-gradient(to right, #3B82F6 0%, #3B82F6 ' + ((localFontSize - 0.8) / 0.7 * 100) + '%, #D1D5DB ' + ((localFontSize - 0.8) / 0.7 * 100) + '%, #D1D5DB 100%)'
                            }}
                        />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Font Family</span>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.entries(FONTS) as [EnglishFont, { name: string; family: string }][]).map(([key, { name, family }]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedFont(key)}
                                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                        selectedFont === key
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : isDarkMode
                                                ? 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                    style={{ fontFamily: family }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar scroll-smooth">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-4">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm opacity-50">Fetching content...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-10">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => window.open(url, '_blank')}
                            className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold"
                        >
                            Open in Browser
                        </button>
                    </div>
                ) : (
                    <article className="max-w-2xl mx-auto pb-20">
                        <h1 className="text-3xl font-extrabold mb-4 leading-tight">
                            {article?.title}
                        </h1>
                        {article?.byline && (
                            <p className="text-sm opacity-60 mb-8">{article.byline}</p>
                        )}

                        <div
                            className="reader-content select-text"
                            style={{
                                fontSize: `${currentFontSize}px`,
                                fontFamily: currentFontFamily,
                                lineHeight: 1.7,
                                letterSpacing: '0.01em'
                            }}
                            onClick={handleContentClick}
                            onTouchEnd={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: article?.content || '' }}
                        />

                        {/* 版权声明 */}
                        <footer className="mt-12 pt-8 pb-6 border-t border-gray-200 dark:border-white/10">
                            <div className="text-center space-y-3">
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    本文由阅读模式实时转码生成，内容版权归原作者所有。
                                </p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center text-xs font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                                >
                                    查看原网页
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </a>
                            </div>
                        </footer>

                        <style>{`
                            .reader-content {
                                font-size: ${currentFontSize}px !important;
                                line-height: 1.7;
                                letter-spacing: 0.01em;
                            }
                            .reader-content * {
                                font-size: inherit !important;
                            }
                            .reader-content p {
                                margin-bottom: 1.5em;
                                text-align: justify;
                                hyphens: auto;
                            }
                            .reader-content h1, .reader-content h2, .reader-content h3, .reader-content h4 {
                                margin-top: 1.8em;
                                margin-bottom: 0.8em;
                                font-weight: 700;
                                line-height: 1.3;
                            }
                            .reader-content h1 {
                                font-size: 1.8em;
                            }
                            .reader-content h2 {
                                font-size: 1.5em;
                            }
                            .reader-content h3 {
                                font-size: 1.3em;
                            }
                            .reader-content ul, .reader-content ol {
                                margin-left: 1.5em;
                                margin-bottom: 1.5em;
                            }
                            .reader-content li {
                                margin-bottom: 0.5em;
                            }
                            .reader-content blockquote {
                                border-left: 3px solid ${isDarkMode ? '#4a90e2' : '#007AFF'};
                                padding-left: 1em;
                                margin: 1.5em 0;
                                font-style: italic;
                                opacity: 0.9;
                            }
                            .reader-content a {
                                color: ${isDarkMode ? '#4a90e2' : '#007AFF'};
                                text-decoration: underline;
                                text-underline-offset: 2px;
                            }
                            .reader-content img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                margin: 1.5em 0;
                            }
                            .reader-content pre, .reader-content code {
                                font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                                background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
                                padding: 0.2em 0.4em;
                                border-radius: 3px;
                                font-size: 0.9em;
                            }
                            .reader-content pre {
                                padding: 1em;
                                overflow-x: auto;
                                margin: 1.5em 0;
                            }
                        `}</style>

                        {translation && (
                            <div
                                className={`fixed z-50 p-2 rounded-lg shadow-2xl max-w-[180px] text-sm border animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#2C2C2E] border-white/20 text-white' : 'bg-white border-gray-200 text-black'
                                    }`}
                                style={{
                                    left: Math.min(translation.x, window.innerWidth - 200),
                                    top: Math.min(translation.y + 10, window.innerHeight - 100)
                                }}
                            >
                                <div className="flex flex-col">
                                    <div className="font-bold text-center mb-1 text-blue-400">{translation.word}</div>
                                    <div className="text-center text-base font-medium">{translation.result}</div>
                                </div>
                                <div
                                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-current"
                                    style={{ borderBottomColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }}
                                ></div>
                            </div>
                        )}
                    </article>
                )}
            </div>
        </div>
    );
};

export default ReaderView;
