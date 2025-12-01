import React, { useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Share2, Flag, Book, List, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import type { Message, YoutubeResource } from '../../types';
import { MessageImages } from '../MessageImages';
import { parseInteractiveList } from '../../utils/messageHelpers';
import { YouTubeModal } from '../YouTubeModal/YouTubeModal';
import '../YouTubeModal/youtube-modal.css';

interface MessageDisplayProps {
    message: Message;
    messageIndex: number;
    expandedSources: { [key: string]: boolean };
    onToggleSource: (key: string) => void;
    onInteractiveItemClick: (term: string) => void;
    onFlagMessage: (messageId: number) => void;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
    message,
    messageIndex,
    expandedSources,
    onToggleSource,
    onInteractiveItemClick,
    onFlagMessage
}) => {
    const [showYouTubeModal, setShowYouTubeModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<YoutubeResource | null>(null);
    const [isInteractiveListExpanded, setIsInteractiveListExpanded] = useState(true);

    const renderInteractiveList = (items: any[]) => {
        return (
            <div className="interactive-list-container">
                <div
                    className="interactive-list-header"
                    onClick={() => setIsInteractiveListExpanded(!isInteractiveListExpanded)}
                    style={{ cursor: 'pointer' }}
                >
                    <List size={20} className="interactive-list-icon" />
                    <span className="interactive-list-title">Interactive List</span>
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
                        {content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    {renderInteractiveList(message.interactiveList)}
                    {message.images && message.images.length > 0 && (
                        <MessageImages images={message.images} />
                    )}
                    {message.youtubeResources && message.youtubeResources.length > 0 && (
                        <div className="youtube-resources-section">
                            <h3 className="youtube-resources-title">📺 Video liên quan</h3>
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

        // Legacy rendering for parts
        return (
            <>
                {parts.map((part, partIndex) => {
                    if (part.type === 'text') {
                        return (
                            <div key={`part-${partIndex}`} className="message-text">
                                {part.content.split('\n').map((line: string, i: number) => {
                                    // Handle bold text
                                    if (line.includes('**')) {
                                        const lineParts = line.split('**');
                                        return (
                                            <p key={i}>
                                                {lineParts.map((linePart: string, j: number) =>
                                                    j % 2 === 1 ? <strong key={j}>{linePart}</strong> : linePart
                                                )}
                                            </p>
                                        );
                                    }
                                    // Handle headings
                                    if (line.startsWith('### ')) {
                                        return <h3 key={i}>{line.replace('### ', '')}</h3>;
                                    }
                                    if (line.startsWith('#### ')) {
                                        return <h4 key={i}>{line.replace('#### ', '')}</h4>;
                                    }
                                    // Handle list items
                                    if (line.startsWith('- ')) {
                                        return <li key={i}>{line.replace('- ', '')}</li>;
                                    }
                                    // Regular paragraph
                                    if (line.trim()) {
                                        return <p key={i}>{line}</p>;
                                    }
                                    return null;
                                })}
                            </div>
                        );
                    }
                    return null;
                })}
                {message.images && message.images.length > 0 && (
                    <MessageImages images={message.images} />
                )}
                {message.youtubeResources && message.youtubeResources.length > 0 && (
                    <div className="youtube-resources-section">
                        <h3 className="youtube-resources-title">📺 Video liên quan</h3>
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
                {message.type === 'assistant' && !message.isStreaming && (
                    <>
                        <div className="message-actions-container">
                            <div className="message-suggestions">
                                <button className="suggestion-btn">
                                    <span className="suggestion-icon">≡</span>
                                    <span>Đơn giản hóa</span>
                                </button>
                                <button className="suggestion-btn">
                                    <span className="suggestion-icon">≡</span>
                                    <span>Tìm hiểu sâu hơn</span>
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
                        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                            <div className="follow-up-questions">
                                {message.suggestedQuestions.map((question, qIndex) => (
                                    <button
                                        key={qIndex}
                                        className="follow-up-btn"
                                        onClick={() => onInteractiveItemClick(question)}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
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
