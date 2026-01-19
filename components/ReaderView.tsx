
import React, { useState, useEffect } from 'react';

interface ReaderViewProps {
    url: string;
    isDarkMode: boolean;
    fontSizeMultiplier: number;
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

const ReaderView: React.FC<ReaderViewProps> = ({ url, isDarkMode, fontSizeMultiplier, onBack }) => {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [translation, setTranslation] = useState<Translation | null>(null);

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
                setArticle(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [url]);

    const handleContentClick = (e: React.MouseEvent) => {
        if (translation) {
            setTranslation(null);
            return;
        }

        const selection = window.getSelection();
        const text = selection?.toString().trim();

        // Simple word extraction: if click on a word (or select it)
        if (text && /^[a-zA-Z-]+$/.test(text) && text.length < 30) {
            setTranslation({
                word: text,
                result: `翻译中...`,
                x: e.clientX,
                y: e.clientY
            });

            // 使用简单的翻译API - 这里使用一个免费的翻译服务
            // 注意：在实际应用中，您可能需要使用自己的翻译API密钥
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`)
                .then(res => res.json())
                .then((data: TranslationResponse) => {
                    const translatedText = data.responseData?.translatedText || "翻译未找到";
                    // 只取简洁的翻译结果，去除多余信息
                    const cleanTranslation = translatedText.split(/[.,;!?]/)[0].trim();
                    setTranslation(prev => prev ? { ...prev, result: cleanTranslation } : null);
                })
                .catch(() => {
                    // 如果API失败，使用简单的本地映射或显示错误
                    const simpleTranslations: Record<string, string> = {
                        'the': '这',
                        'and': '和',
                        'is': '是',
                        'in': '在',
                        'to': '到',
                        'of': '的',
                        'a': '一个',
                        'for': '为了',
                        'on': '在...上',
                        'with': '和',
                        'by': '通过',
                        'at': '在',
                        'from': '从',
                        'as': '作为',
                        'but': '但是',
                        'or': '或者',
                        'not': '不',
                        'be': '是',
                        'are': '是',
                        'was': '是',
                        'were': '是',
                        'have': '有',
                        'has': '有',
                        'had': '有',
                        'do': '做',
                        'does': '做',
                        'did': '做',
                        'will': '将',
                        'would': '将',
                        'can': '能',
                        'could': '能',
                        'should': '应该',
                        'may': '可能',
                        'might': '可能',
                        'must': '必须'
                    };

                    const simpleTranslation = simpleTranslations[text.toLowerCase()] || "点击其他位置关闭";
                    setTranslation(prev => prev ? { ...prev, result: simpleTranslation } : null);
                });
        }
    };

    const baseFontSize = 18; // Default base size for reader
    const currentFontSize = baseFontSize * fontSizeMultiplier;

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'bg-[#121212] text-[#E0E0E0]' : 'bg-white text-[#1A1A1A]'} overflow-hidden transition-colors duration-300`}>
            {/* Header */}
            <header className={`h-14 flex items-center justify-between px-4 border-b ${isDarkMode ? 'border-white/10 bg-[#1C1C1E]/90' : 'border-gray-200 bg-white/90'} backdrop-blur-md sticky top-0 z-30`}>
                <button onClick={onBack} className="text-blue-500 flex items-center font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Back
                </button>
                <span className="text-sm font-bold truncate max-w-[150px] opacity-60">
                    {article?.siteName || 'Reader Mode'}
                </span>
                <button
                    onClick={() => window.location.href = url}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                    Original
                </button>
            </header>

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
                    <article className="max-w-2xl mx-auto">
                        <h1 className="text-3xl font-extrabold mb-4 leading-tight">
                            {article?.title}
                        </h1>
                        {article?.byline && (
                            <p className="text-sm opacity-60 mb-8">{article.byline}</p>
                        )}

                        <div
                            className="reader-content select-text"
                            style={{ fontSize: `${currentFontSize}px`, lineHeight: 1.6 }}
                            onClick={handleContentClick}
                            dangerouslySetInnerHTML={{ __html: article?.content || '' }}
                        />

                        <style>{`
                            .reader-content {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
                                margin-left: 0;
                                margin-right: 0;
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

                        <div className="mt-20 pt-10 border-t border-gray-100 dark:border-white/5 text-center pb-20">
                            <p className="text-xs opacity-40 mb-4">End of article</p>
                            <button
                                onClick={() => window.open(url, '_blank')}
                                className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                            >
                                View full original page
                            </button>
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
};

export default ReaderView;
