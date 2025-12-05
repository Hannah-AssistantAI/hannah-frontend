import React, { useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Share2, Flag, Book, List, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import type { Message, YoutubeResource } from '../../types';
import { MessageImages } from '../MessageImages';
import { parseInteractiveList } from '../../utils/messageHelpers';
import { YouTubeModal } from '../YouTubeModal/YouTubeModal';
import '../YouTubeModal/youtube-modal.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/vs2015.css';
import toast from 'react-hot-toast';
import { getLabels, type SupportedLanguage } from '../../../../utils/translations';

interface MessageDisplayProps {
    message: Message;
    messageIndex: number;
    messages: Message[];
    expandedSources: { [key: string]: boolean };
    onToggleSource: (key: string) => void;
    onInteractiveItemClick: (term: string) => void;
    onFlagMessage: (messageId: number) => void;
    isReadOnly?: boolean;
    language?: SupportedLanguage | string | null;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
    message,
    messageIndex,
    messages,
    expandedSources,
    onToggleSource,
    onInteractiveItemClick,
    onFlagMessage,
    isReadOnly = false,
    language = 'vi'
}) => {
    const [showYouTubeModal, setShowYouTubeModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<YoutubeResource | null>(null);
    const [isInteractiveListExpanded, setIsInteractiveListExpanded] = useState(true);

    // Get labels based on detected language
    const t = getLabels(language);

    // Helper function to strip instruction prefixes from a question
    const stripInstructionPrefix = (text: string): string => {
        const prefixes = [
            'Hãy giải thích đơn giản hơn: ',
            'Hãy giải thích chi tiết và sâu hơn: ',
            'Đơn giản hóa: ',
            'Tìm hiểu sâu hơn: ',
            'Giải thích thêm: '
        ];

        let result = text;
        // Keep stripping until no more prefixes found
        let changed = true;
        while (changed) {
            changed = false;
            for (const prefix of prefixes) {
                if (result.startsWith(prefix)) {
                    result = result.substring(prefix.length);
                    changed = true;
                    break;
                }
            }
        }
        return result;
    };
    // Debug logging
    console.log('🔍 MessageDisplay - message:', message);
    console.log('  - suggestedQuestions:', message.suggestedQuestions);
    console.log('  - youtubeResources:', message.youtubeResources);
    console.log('  - interactiveList:', message.interactiveList);
    console.log('  - isReadOnly:', isReadOnly);

    const renderInteractiveList = (items: any[]) => {
        return (
            <div className="interactive-list-container">
                <div
                    className="interactive-list-header"
                    onClick={() => setIsInteractiveListExpanded(!isInteractiveListExpanded)}
                    style={{ cursor: 'pointer' }}
                >
                    <List size={20} className="interactive-list-icon" />
                    <span className="interactive-list-title">{t.interactiveList}</span>
                    <div className="interactive-list-toggle" style={{ marginLeft: 'auto' }}>
                        {isInteractiveListExpanded ? (
                            <ChevronUp size={20} />
                        ) : (
                            <ChevronDown size={20} />
                        )}
                    </div>
                </div>
                <div
                    className={`interactive-list-items ${isInteractiveListExpanded ? 'expanded' : 'collapsed'}`}
                    style={{
                        maxHeight: isInteractiveListExpanded ? '1000px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                        opacity: isInteractiveListExpanded ? 1 : 0
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="interactive-item-card"
                            onClick={() => onInteractiveItemClick(item.term)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="interactive-item-icon-wrapper">
                                {item.icon ? (
                                    <span className="interactive-item-emoji">{item.icon}</span>
                                ) : (
                                    <div className="interactive-item-placeholder">
                                        <Book size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="interactive-item-content">
                                <h4 className="interactive-item-term">{item.term}</h4>
                                <p className="interactive-item-definition">{item.definition}</p>
                            </div>
                            <div className="interactive-item-action">
                                <button className="interactive-item-link-btn" aria-label="Link" onClick={(e) => e.stopPropagation()}>
                                    <LinkIcon size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMessageContent = (content: string) => {
        const parts = parseInteractiveList(content);

        // If we have a structured interactive list in the message object, render it
        if (message?.interactiveList && message.interactiveList.length > 0) {
            return (
                <>
                    <div className="message-text">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';

                                    const handleCopy = () => {
                                        const codeText = String(children).replace(/\n$/, '');
                                        navigator.clipboard.writeText(codeText);
                                        toast.success('Copied to clipboard', {
                                            position: 'bottom-left',
                                            duration: 2000,
                                        });
                                    };

                                    return !inline && match ? (
                                        <div className="code-block-wrapper">
                                            <div className="code-block-header">
                                                <span className="code-language">{language}</span>
                                                <button
                                                    className="code-copy-btn"
                                                    onClick={handleCopy}
                                                    aria-label="Copy code"
                                                    title="Copy code"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <pre className="code-block">
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    ) : (
                                        <code className="inline-code" {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                    {renderInteractiveList(message.interactiveList)}
                    {message.images && message.images.length > 0 && (
                        <MessageImages images={message.images} language={language} />
                    )}
                    {message.youtubeResources && message.youtubeResources.length > 0 && (
                        <div className="youtube-resources-section">
                            <h3 className="youtube-resources-title">📺 {t.relatedVideos}</h3>
                            <div className="youtube-resources-grid">
                                {message.youtubeResources.map((video, index) => (
                                    <div
                                        key={index}
                                        className="youtube-card"
                                        onClick={() => {
                                            setSelectedVideo(video);
                                            setShowYouTubeModal(true);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="youtube-thumbnail">
                                            <img src={video.thumbnail} alt={video.title} />
                                            <div className="youtube-play-overlay">
                                                <div className="play-icon">▶</div>
                                            </div>
                                        </div>
                                        <div className="youtube-info">
                                            <h4 className="youtube-video-title">{video.title}</h4>
                                            {video.channel && (
                                                <p className="youtube-channel">{video.channel}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        }

        // Legacy rendering for parts - also use ReactMarkdown
        return (
            <>
                {parts.map((part, partIndex) => {
                    if (part.type === 'text') {
                        return (
                            <div key={`part-${partIndex}`} className="message-text">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const language = match ? match[1] : '';

                                            const handleCopy = () => {
                                                const codeText = String(children).replace(/\n$/, '');
                                                navigator.clipboard.writeText(codeText);
                                                toast.success('Copied to clipboard', {
                                                    position: 'bottom-left',
                                                    duration: 2000,
                                                });
                                            };

                                            return !inline && match ? (
                                                <div className="code-block-wrapper">
                                                    <div className="code-block-header">
                                                        <span className="code-language">{language}</span>
                                                        <button
                                                            className="code-copy-btn"
                                                            onClick={handleCopy}
                                                            aria-label="Copy code"
                                                            title="Copy code"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <pre className="code-block">
                                                        <code className={className} {...props}>
                                                            {String(children).replace(/\n$/, '')}
                                                        </code>
                                                    </pre>
                                                </div>
                                            ) : (
                                                <code className="inline-code" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {part.content}
                                </ReactMarkdown>
                            </div>
                        );
                    }
                    return null;
                })}

                {message.images && message.images.length > 0 && (
                    <MessageImages images={message.images} language={language} />
                )}

                {message.youtubeResources && message.youtubeResources.length > 0 && (
                    <div className="youtube-resources-section">
                        <h3 className="youtube-resources-title">📺 {t.relatedVideos}</h3>
                        <div className="youtube-resources-grid">
                            {message.youtubeResources.map((video, index) => (
                                <div
                                    key={index}
                                    className="youtube-card"
                                    onClick={() => {
                                        setSelectedVideo(video);
                                        setShowYouTubeModal(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="youtube-thumbnail">
                                        <img src={video.thumbnail} alt={video.title} />
                                        <div className="youtube-play-overlay">
                                            <div className="play-icon">▶</div>
                                        </div>
                                    </div>
                                    <div className="youtube-info">
                                        <h4 className="youtube-video-title">{video.title}</h4>
                                        {video.channel && (
                                            <p className="youtube-channel">{video.channel}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className={`message ${message.type}-message`}>
            {message.type === 'assistant' && (
                <div className="message-avatar">
                    <Sparkles size={20} color="#4285F4" />
                </div>
            )}
            <div className="message-content">
                {renderMessageContent(message.content)}
                {message.type === 'assistant' && !message.isStreaming && !isReadOnly && (
                    <>
                        <div className="message-actions-container">
                            <div className="message-suggestions">
                                <button
                                    className="suggestion-btn"
                                    onClick={() => {
                                        const previousUserMessage = messages
                                            .slice(0, messageIndex)
                                            .reverse()
                                            .find(m => m.type === 'user');
                                        const userQuestion = stripInstructionPrefix(previousUserMessage?.content || '');
                                        onInteractiveItemClick(`Hãy giải thích đơn giản hơn: ${userQuestion}`);
                                    }}
                                >
                                    <span className="suggestion-icon">≡</span>
                                    <span>{t.simplify}</span>
                                </button>
                                <button
                                    className="suggestion-btn"
                                    onClick={() => {
                                        const previousUserMessage = messages
                                            .slice(0, messageIndex)
                                            .reverse()
                                            .find(m => m.type === 'user');
                                        const userQuestion = stripInstructionPrefix(previousUserMessage?.content || '');
                                        onInteractiveItemClick(`Hãy giải thích chi tiết và sâu hơn: ${userQuestion}`);
                                    }}
                                >
                                    <span className="suggestion-icon">≡</span>
                                    <span>{t.deepDive}</span>
                                </button>
                            </div>
                            <div className="message-actions">
                                <button className="action-btn" aria-label="Phản hồi tốt">
                                    <ThumbsUp size={16} />
                                </button>
                                <button className="action-btn" aria-label="Phản hồi không tốt">
                                    <ThumbsDown size={16} />
                                </button>
                                <button className="action-btn" aria-label="Chia sẻ">
                                    <Share2 size={16} />
                                </button>
                                <button
                                    className={`action-btn ${message.isFlagged ? 'flagged' : ''}`}
                                    aria-label="Báo cáo"
                                    onClick={() => {
                                        if (!message.isFlagged && message.messageId) {
                                            onFlagMessage(message.messageId);
                                        }
                                    }}
                                    disabled={message.isFlagged || !message.messageId}
                                >
                                    <Flag size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="follow-up-questions">
                        {message.suggestedQuestions.map((question, qIndex) => (
                            <button
                                key={qIndex}
                                className="follow-up-btn"
                                onClick={() => !isReadOnly && onInteractiveItemClick(question)}
                                disabled={isReadOnly}
                                style={isReadOnly ? { cursor: 'default', opacity: 0.8 } : {}}
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* YouTube Modal */}
            <YouTubeModal
                isOpen={showYouTubeModal}
                onClose={() => {
                    setShowYouTubeModal(false);
                    setSelectedVideo(null);
                }}
                video={selectedVideo}
            />
        </div>
    );
};
