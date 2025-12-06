import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, BookOpen, Brain, Lightbulb } from "lucide-react";
import toast from "react-hot-toast";
import "./Learn.css";
import { Header } from "../../components/Header";
import { HistorySidebar } from "../../components/HistorySidebar";
import conversationService from "../../service/conversationService";
import { useAuth } from "../../contexts/AuthContext";
import FAQSection from "../home/FAQSection";

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
            const conversation = await conversationService.createConversation({
                userId: user.userId,
                title: searchQuery.length > 50 ? searchQuery.substring(0, 50) + '...' : searchQuery,
                subjectId: undefined,
            });

            navigate("/chat", {
                state: {
                    conversationId: conversation.conversationId,
                    query: searchQuery,
                },
            });
        } catch (error: any) {
            console.error("Failed to create conversation:", error);
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
            const conversation = await conversationService.createConversation({
                userId: user.userId,
                title: bookTitle.length > 50 ? bookTitle.substring(0, 50) + '...' : bookTitle,
                subjectId: undefined,
            });

            navigate("/chat", {
                state: {
                    conversationId: conversation.conversationId,
                    query: bookTitle,
                },
            });
        } catch (error: any) {
            console.error("Failed to create conversation:", error);
            toast.error(
                error.message || "Không thể tạo cuộc trò chuyện. Vui lòng thử lại."
            );
        } finally {
            setIsCreatingMessage(false);
        }
    };

    const quickTopics = [
        { icon: BookOpen, label: "Data Structures", query: "Giải thích về Data Structures cơ bản" },
        { icon: Brain, label: "Algorithms", query: "Hướng dẫn về thuật toán phổ biến" },
        { icon: Lightbulb, label: "Design Patterns", query: "Các Design Pattern quan trọng trong lập trình" },
    ];

    return (
        <div className="learn-container">
            {/* Header */}
            <Header
                onToggleHistory={() => setShowHistorySidebar(!showHistorySidebar)}
                showNotifications={true}
            />

            {/* History Sidebar */}
            <HistorySidebar
                isOpen={showHistorySidebar}
                onClose={() => setShowHistorySidebar(false)}
            />

            {/* Main Content - Hero Section */}
            <main className="learn-main">
                <div className="learn-content">
                    <p className="learn-greeting">Xin chào! Mình là Hannah 👋</p>
                    <h1 className="learn-title">Bạn muốn học về điều gì?</h1>
                    <p className="learn-subtitle">
                        Hannah AI sẽ giúp bạn hiểu rõ mọi khái niệm trong kĩ thuật phần mềm
                    </p>

                    {/* Search Box */}
                    <div className="learn-search-container">
                        <div className="learn-search-box">
                            <input
                                type="text"
                                placeholder="Ví dụ: Giải thích về REST API..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="learn-search-input"
                            />
                            <button
                                className={`search-btn ${searchQuery.trim() ? "has-content" : ""}`}
                                aria-label="Gửi"
                                onClick={handleSearch}
                                disabled={isCreatingMessage || !searchQuery.trim()}
                            >
                                {isCreatingMessage ? (
                                    <Loader2 size={22} className="animate-spin" />
                                ) : (
                                    <Send size={22} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quick Topics */}
                    <div className="quick-topics">
                        <p className="quick-topics-label">Gợi ý cho bạn:</p>
                        <div className="quick-topics-list">
                            {quickTopics.map((topic, index) => (
                                <button
                                    key={index}
                                    className="quick-topic-btn"
                                    onClick={() => handleBookClick(topic.query)}
                                    disabled={isCreatingMessage}
                                >
                                    <topic.icon size={16} />
                                    <span>{topic.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* FAQ Section */}
            <section className="faq-section-wrapper">
                <FAQSection />
            </section>

            {/* Footer Section - Books */}
            <footer className="learn-footer">
                <div className="reading-nook-section">
                    <h2 className="reading-nook-title">Chủ Đề Được Quan Tâm</h2>
                    <p className="reading-nook-subtitle">Một số chủ đề để khám phá</p>

                    <div className="bookshelf-scene">
                        <div className="bookshelf-books">
                            {/* Book 1 */}
                            <div className="book-3d book-green-dark" onClick={() => handleBookClick("Học về Data Structures và Algorithms")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">DATA<br />STRUCTURES</span>
                                        <span className="book-small-text">& ALGORITHMS</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 2 */}
                            <div className="book-3d book-red" onClick={() => handleBookClick("Học Web Development Frontend và Backend")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">WEB<br />DEVELOPMENT</span>
                                        <span className="book-author">Frontend & Backend</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 3 */}
                            <div className="book-3d book-orange" onClick={() => handleBookClick("Học Database Design và SQL")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">DATABASE<br />DESIGN</span>
                                        <span className="book-author">SQL & NoSQL</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 4 */}
                            <div className="book-3d book-beige" onClick={() => handleBookClick("Học System Design và Architecture")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">SYSTEM<br />DESIGN</span>
                                        <span className="book-author">Architecture Patterns</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 5 */}
                            <div className="book-3d book-blue" onClick={() => handleBookClick("Học Cloud Computing AWS Azure GCP")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">CLOUD<br />COMPUTING</span>
                                        <span className="book-author-small">AWS • AZURE • GCP</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>

                            {/* Book 6 */}
                            <div className="book-3d book-green" onClick={() => handleBookClick("Học DevOps CI/CD Docker Kubernetes")} style={{ cursor: isCreatingMessage ? "not-allowed" : "pointer", opacity: isCreatingMessage ? 0.6 : 1 }}>
                                <div className="book-cover">
                                    <div className="book-cover-content">
                                        <span className="book-main-title">DEVOPS</span>
                                        <span className="book-author">CI/CD & Containers</span>
                                    </div>
                                </div>
                                <div className="book-spine-3d"></div>
                            </div>
                        </div>

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
