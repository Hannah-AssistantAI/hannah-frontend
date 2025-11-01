import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Upload,
    Send,
    X,
    Menu,
} from "lucide-react";
import "./Learn.css";
import ProfileIcon from "../../components/ProfileIcon";

export default function Learn() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [showHistorySidebar, setShowHistorySidebar] = useState(false);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate("/chat", { state: { query: searchQuery } });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };



    return (
        <div className="learn-container dark-theme">
            {/* Header */}
            <header className="learn-header">
                <div className="learn-header-left">
                    <button
                        className="history-toggle-btn"
                        onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                        aria-label="Lịch sử cuộc trò chuyện"
                        title="Lịch sử cuộc trò chuyện"
                    >
                        <Menu size={20} />
                    </button>
                    <button className="learn-logo" onClick={() => navigate("/learn")}>
                        <span className="learn-logo-text">Hannah Assistant</span>
                    </button>
                </div>
                <div className="learn-header-right">
                    <ProfileIcon />
                </div>
            </header>

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
                                            navigate("/chat", {
                                                state: { query: "Lập trình Hướng đối tượng (OOP)" },
                                            })
                                        }
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Lập trình Hướng đối tượng (OOP)
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "Data Structures và Algorithms" },
                                            })
                                        }
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Data Structures và Algorithms
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "React Hooks và State Management" },
                                            })
                                        }
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
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "Database Design và SQL" },
                                            })
                                        }
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Database Design và SQL
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "Machine Learning cơ bản" },
                                            })
                                        }
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
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "RESTful API Design" },
                                            })
                                        }
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            RESTful API Design
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "Git và Version Control" },
                                            })
                                        }
                                    >
                                        <span className="history-item-icon">💬</span>
                                        <span className="history-item-text">
                                            Git và Version Control
                                        </span>
                                    </button>
                                    <button
                                        className="history-item"
                                        onClick={() =>
                                            navigate("/chat", {
                                                state: { query: "Docker và Containerization" },
                                            })
                                        }
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
                            >
                                {searchQuery.trim() ? <Send size={24} /> : <Upload size={24} />}
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
                                    navigate("/chat", {
                                        state: { query: "Học về Data Structures và Algorithms" },
                                    })
                                }
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
                                    navigate("/chat", {
                                        state: { query: "Học Web Development Frontend và Backend" },
                                    })
                                }
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
                                onClick={() =>
                                    navigate("/chat", {
                                        state: { query: "Học Database Design và SQL" },
                                    })
                                }
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
                                    navigate("/chat", {
                                        state: { query: "Học System Design và Architecture" },
                                    })
                                }
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
                                    navigate("/chat", {
                                        state: { query: "Học Cloud Computing AWS Azure GCP" },
                                    })
                                }
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
                                    navigate("/chat", {
                                        state: { query: "Học DevOps CI/CD Docker Kubernetes" },
                                    })
                                }
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
