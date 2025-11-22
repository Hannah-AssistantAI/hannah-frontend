import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Send, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import "./Learn.css";
import { Header } from "../../components/Header";
import { messageService } from "../../service/messageService";
import conversationService from "../../service/conversationService";
import { useAuth } from "../../contexts/AuthContext";

export default function Learn() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);
    const [isCreatingMessage, setIsCreatingMessage] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        if (isCreatingMessage) return;
        if (!user) {
            toast.error("Vui lòng đăng nhập để tiếp tục");
            return;
        }

        setIsCreatingMessage(true);
        try {
            // Step 1: Create conversation first
            const conversationResponse = await conversationService.createConversation(
                {
                    title: "Cuộc trò chuyện mới",
                    subjectId: 0,
                }
            );

            const conversationId = conversationResponse.conversationId;

            // Step 2: Create message with the conversationId
            await messageService.createMessage({
                userId: user.userId,
                conversationId: conversationId,
                role: "student",
                content: searchQuery,
                subjectId: null,
            });

            // Navigate to chat with the conversationId
            navigate("/chat", {
                state: {
                    conversationId: conversationId,
                    query: searchQuery,
                },
            });
        } catch (error: any) {
            console.error("Failed to create conversation/message:", error);
            toast.error(
                error.message || "Không thể tạo cuộc trò chuyện. Vui lòng thử lại."
            );
        } finally {
            setIsCreatingMessage(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isCreatingMessage) {
            handleSearch();
        }
    };

    const handleBookClick = async (bookTitle: string) => {
        if (isCreatingMessage) return;
        if (!user) {
            toast.error("Vui lòng đăng nhập để tiếp tục");
            return;
        }

        setIsCreatingMessage(true);
        try {
            // Step 1: Create conversation first
            const conversationResponse = await conversationService.createConversation(
                {
                    title: "Cuộc trò chuyện mới",
                    subjectId: 0,
                }
            );

            const conversationId = conversationResponse.conversationId;

            // Step 2: Create message with the conversationId
            await messageService.createMessage({
                userId: user.userId,
                conversationId: conversationId,
                role: "student",
                content: bookTitle,
                subjectId: null,
            });

            // Navigate to chat with the conversationId
            navigate("/chat", {
                state: {
                    conversationId: conversationId,
                    query: bookTitle,
                },
            });
        } catch (error: any) {
            console.error("Failed to create conversation/message:", error);
            toast.error(
                error.message || "Không thể tạo cuộc trò chuyện. Vui lòng thử lại."
            );
        } finally {
            setIsCreatingMessage(false);
        }
    };

    return (
        <div className="learn-container">
            {/* Header */}
            <Header
                onToggleHistory={() => setShowHistorySidebar(!showHistorySidebar)}
            />

            {/* History Sidebar */}
            {showHistorySidebar && (
                <>
                    <div
                        className="history-sidebar-overlay"
                        onClick={() => setShowHistorySidebar(false)}
                    />
                    <aside className="history-sidebar">
                        <div className="history-sidebar-header">
                            <h2 className="history-sidebar-title">Lịch sử cuộc trò chuyện</h2>
                            <button
                                className="history-sidebar-close"
                                onClick={() => setShowHistorySidebar(false)}
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="history-sidebar-content">
                            {/* Today */}
                            <div className="history-section">
                                <h3 className="history-section-title">Hôm nay</h3>
                                <div className="history-items">
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            handleBookClick("Lập trình Hướng đối tượng (OOP)")
                                        }
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Lập trình Hướng đối tượng (OOP)
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            handleBookClick("Data Structures và Algorithms")
                                        }
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Data Structures và Algorithms
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            handleBookClick("React Hooks và State Management")
                                        }
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            React Hooks và State Management
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Yesterday */}
                            <div className="history-section">
                                <h3 className="history-section-title">Hôm qua</h3>
                                <div className="history-items">
                                    <button
                                        className="history-item"
                                        onClick={() => handleBookClick("Database Design và SQL")}
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Database Design và SQL
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() => handleBookClick("Machine Learning cơ bản")}
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Machine Learning cơ bản
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Last 7 days */}
                            <div className="history-section">
                                <h3 className="history-section-title">7 ngày trước</h3>
                                <div className="history-items">
                                    <button
                                        className="history-item"
                                        onClick={() => handleBookClick("RESTful API Design")}
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            RESTful API Design
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() => handleBookClick("Git và Version Control")}
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Git và Version Control
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            handleBookClick("Docker và Containerization")
                                        }
                                        disabled={isCreatingMessage}
                                        style={{
                                            cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                            opacity: isCreatingMessage ? 0.6 : 1,
                                        }}
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Docker và Containerization
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="learn-main">
                <div className="learn-content">
                    <h1 className="learn-title">Bạn muốn học về điều gì?</h1>

                    {/* Search Box */}
                    <div className="learn-search-container">
                        <div className="learn-search-box">
                            <input
                                type="text"
                                placeholder="Hỏi về chủ đề bạn muốn học"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="learn-search-input"
                            />
                            <button
                                className={`upload-btn ${searchQuery.trim() ? "has-content" : ""
                                    }`}
                                aria-label={searchQuery.trim() ? "Gửi" : "Tải lên"}
                                onClick={searchQuery.trim() ? handleSearch : undefined}
                                disabled={isCreatingMessage}
                            >
                                {isCreatingMessage ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : searchQuery.trim() ? (
                                    <Send size={24} />
                                ) : (
                                    <Upload size={24} />
                                )}
                            </button>
                        </div>

                        {/* Dashed Border Wrapper */}
                        <div className="dashed-border-wrapper">
                            {/* PDF Reading Companion Card */}
                            <div className="pdf-companion-card">
                                <div className="pdf-companion-icon">
                                    <svg viewBox="0 0 100 100" className="illustration">
                                        <defs>
                                            <linearGradient
                                                id="bookGradient"
                                                x1="0%"
                                                y1="0%"
                                                x2="100%"
                                                y2="100%"
                                            >
                                                <stop
                                                    offset="0%"
                                                    style={{ stopColor: "#F59E0B", stopOpacity: 0.3 }}
                                                />
                                                <stop
                                                    offset="100%"
                                                    style={{ stopColor: "#FBBF24", stopOpacity: 0.6 }}
                                                />
                                            </linearGradient>
                                        </defs>
                                        {/* Book */}
                                        <rect
                                            x="30"
                                            y="20"
                                            width="40"
                                            height="55"
                                            fill="url(#bookGradient)"
                                            rx="2"
                                        />
                                        <rect
                                            x="30"
                                            y="20"
                                            width="5"
                                            height="55"
                                            fill="#F59E0B"
                                            opacity="0.5"
                                        />
                                        <line
                                            x1="45"
                                            y1="35"
                                            x2="60"
                                            y2="35"
                                            stroke="#F59E0B"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1="45"
                                            y1="45"
                                            x2="60"
                                            y2="45"
                                            stroke="#F59E0B"
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1="45"
                                            y1="55"
                                            x2="55"
                                            y2="55"
                                            stroke="#F59E0B"
                                            strokeWidth="2"
                                        />
                                        {/* Person */}
                                        <circle cx="50" cy="65" r="8" fill="#FBBF24" />
                                        <path
                                            d="M 42 73 Q 50 78, 58 73 L 58 85 L 42 85 Z"
                                            fill="#F59E0B"
                                        />
                                    </svg>
                                </div>
                                <div className="pdf-companion-content">
                                    <h3 className="pdf-companion-title">Trợ lý Đọc Tài Liệu</h3>
                                    <p className="pdf-companion-description">
                                        Tải lên tài liệu để sử dụng công cụ đọc mới giúp phân tích
                                        và hướng dẫn bạn qua các câu hỏi và khái niệm.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className="learn-footer">
                <div className="reading-nook-section">
                    <h2 className="reading-nook-title">Chủ Đề Được Quan Tâm</h2>
                    <p className="reading-nook-subtitle">Một số chủ đề để khám phá</p>

                    {/* Bookshelf with 3D Books */}
                    <div className="bookshelf-scene">
                        <div className="bookshelf-books">
                            {/* Book 1 - Data Structures */}
                            <div
                                className="book-3d book-green-dark"
                                onClick={() =>
                                    handleBookClick("Học về Data Structures và Algorithms")
                                }
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        {/* <span className="book-main-title">CẤU TRÚC</span> */}
                                        <span className="book-main-title">
                                            DATA
                                            <br />
                                            STRUCTURES
                                        </span>
                                        <span className="book-small-text">& ALGORITHMS</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 2 - Web Development */}
                            <div
                                className="book-3d book-red"
                                onClick={() =>
                                    handleBookClick("Học Web Development Frontend và Backend")
                                }
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">
                                            WEB
                                            <br />
                                            DEVELOPMENT
                                        </span>
                                        <span className="book-author">Frontend & Backend</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 3 - Database Design */}
                            <div
                                className="book-3d book-orange"
                                onClick={() => handleBookClick("Học Database Design và SQL")}
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">
                                            DATABASE
                                            <br />
                                            DESIGN
                                        </span>
                                        <span className="book-author">SQL & NoSQL</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 4 - System Design */}
                            <div
                                className="book-3d book-beige"
                                onClick={() =>
                                    handleBookClick("Học System Design và Architecture")
                                }
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">
                                            SYSTEM
                                            <br />
                                            DESIGN
                                        </span>
                                        <span className="book-author">Architecture Patterns</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 5 - Cloud Computing */}
                            <div
                                className="book-3d book-blue"
                                onClick={() =>
                                    handleBookClick("Học Cloud Computing AWS Azure GCP")
                                }
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">
                                            CLOUD
                                            <br />
                                            COMPUTING
                                        </span>
                                        <span className="book-author-small">AWS • AZURE • GCP</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 6 - DevOps */}
                            <div
                                className="book-3d book-green"
                                onClick={() =>
                                    handleBookClick("Học DevOps CI/CD Docker Kubernetes")
                                }
                                style={{
                                    cursor: isCreatingMessage ? "not-allowed" : "pointer",
                                    opacity: isCreatingMessage ? 0.6 : 1,
                                }}
                            >
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">DEVOPS</span>
                                        <span className="book-author">CI/CD & Containers</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>
                        </div>

                        {/* Shelf */}
                        <div className="bookshelf-shelf">
                            <div className="shelf-top"></div>
                            <div className="shelf-front"></div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
