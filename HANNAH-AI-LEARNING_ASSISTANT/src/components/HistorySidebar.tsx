import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import conversationService from '../service/conversationService';
import './HistorySidebar.css';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onItemClick?: (topic: string) => void; // Optional now as we handle navigation internally
    currentConversationId?: number | null; // Pass current conversation ID to handle delete
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, currentConversationId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const INITIAL_DISPLAY_COUNT = 6;

    useEffect(() => {
        if (isOpen && user) {
            fetchConversations();
        }
    }, [isOpen, user]);

    const fetchConversations = async () => {
        if (!user?.userId) return;
        setIsLoadingConversations(true);
        try {
            const data = await conversationService.listConversations({
                user_id: user.userId,
                sort_by: "updated_at",
                sort_order: "desc",
                limit: 50
            });

            // Handle different response structures
            let convs = [];
            if (Array.isArray(data)) {
                convs = data;
            } else if (data && Array.isArray(data.conversations)) {
                convs = data.conversations;
            } else if (data && Array.isArray(data.data)) {
                convs = data.data;
            }
            setConversations(convs);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    const handleConversationClick = (conversationId: number) => {
        navigate("/chat", { state: { conversationId } });
        onClose();
    };

    const handleNewChat = () => {
        // Navigate to empty chat state - conversation will be created lazily when user sends first message
        // This saves database resources by not creating empty conversations
        navigate("/chat", {
            replace: true,
            state: {
                conversationId: null,
                query: null,
                timestamp: Date.now() // Force re-render
            }
        });
        onClose();
    };

    const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent conversation click when clicking delete

        if (!user?.userId) {
            console.error('User not logged in');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
            return;
        }

        try {
            await conversationService.deleteConversation(conversationId, user.userId);

            // Clear cache for deleted conversation
            localStorage.removeItem(`conversation_${conversationId}_cache`);

            // ✅ Update local state immediately (Optimistic update)
            setConversations(prev => prev.filter(c =>
                (c.conversation_id && c.conversation_id !== conversationId) ||
                (c.conversationId && c.conversationId !== conversationId)
            ));

            // If deleting the currently active conversation, force page reload to clear all state
            // This ensures no stale data from the deleted conversation remains
            if (conversationId === currentConversationId) {
                window.location.href = '/chat';
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
        }
    };

    const groupConversationsByDate = (conversations: any[]) => {
        const groups: { [key: string]: any[] } = {
            "Hôm nay": [],
            "Hôm qua": [],
            "7 ngày trước": [],
            "Cũ hơn": []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);

        conversations.forEach(conv => {
            const dateStr = conv.updated_at || conv.created_at || conv.createdAt;
            if (!dateStr) return;

            const date = new Date(dateStr);
            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (dateOnly.getTime() === today.getTime()) {
                groups["Hôm nay"].push(conv);
            } else if (dateOnly.getTime() === yesterday.getTime()) {
                groups["Hôm qua"].push(conv);
            } else if (dateOnly > last7Days) {
                groups["7 ngày trước"].push(conv);
            } else {
                groups["Cũ hơn"].push(conv);
            }
        });

        return groups;
    };

    // Get conversations to display based on showAll state
    const displayedConversations = showAll
        ? conversations
        : conversations.slice(0, INITIAL_DISPLAY_COUNT);

    const groupedConversations = groupConversationsByDate(displayedConversations);
    const hasMoreConversations = conversations.length > INITIAL_DISPLAY_COUNT;

    if (!isOpen) return null;

    return (
        <>
            <div className="history-sidebar-overlay" onClick={onClose} />
            <aside className="history-sidebar">
                {/* Header - transparent to show main header logo and allow clicks to pass through */}
                <div className="sidebar-header">
                    {/* Empty space - logo and menu button from main header will show through here */}
                    <div className="header-logo-space"></div>
                </div>

                {/* Main Sidebar Content Wrapper with Background */}
                <div className="sidebar-main">
                    {/* New Chat Button */}
                    <button className="sidebar-new-chat-button" onClick={handleNewChat}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="12" y1="8" x2="12" y2="16"></line>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <span>New chat</span>
                    </button>

                    {/* History Section */}
                    <div className="sidebar-content">
                        {isLoadingConversations ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="animate-spin text-gray-400" size={24} />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Chưa có cuộc trò chuyện nào
                            </div>
                        ) : (
                            <>
                                {Object.entries(groupedConversations).map(([groupName, groupConvs]) => (
                                    groupConvs.length > 0 && (
                                        <div key={groupName} className="sidebar-section">
                                            <h3 className="section-title">{groupName}</h3>
                                            <div className="conversation-list">
                                                {groupConvs.map((conv) => (
                                                    <button
                                                        key={conv.conversation_id || conv.conversationId}
                                                        className="conversation-item"
                                                        onClick={() => handleConversationClick(conv.conversation_id || conv.conversationId)}
                                                    >
                                                        <div className="conversation-item-content">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="conversation-icon">
                                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                            </svg>
                                                            <span className="conversation-text">
                                                                {conv.title || "Cuộc trò chuyện mới"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="delete-conversation-btn"
                                                            onClick={(e) => handleDeleteConversation(conv.conversation_id || conv.conversationId, e)}
                                                            title="Xóa cuộc trò chuyện"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}

                                {/* View All / Show Less Button */}
                                {hasMoreConversations && (
                                    <button
                                        className="view-all-button"
                                        onClick={() => setShowAll(!showAll)}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{ transform: showAll ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                        <span>{showAll ? `Thu gọn` : `Xem tất cả (${conversations.length})`}</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="sidebar-footer-info">
                        <p className="info-text">
                            Your conversations are being saved to your Hannah Account.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
};
