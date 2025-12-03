import { useState, useEffect, useRef } from 'react';
import Auth from '../../components/Auth/Auth';
import ProfileIcon from '../../components/ProfileIcon';
import LoginRequiredModal from '../../components/LoginRequiredModal';
import { useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import './Home.css'

export default function Home() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [isVisible, setIsVisible] = useState(false)

    // Scroll animation states
    const [footerTitleVisible, setFooterTitleVisible] = useState(false)
    const [topicCardsVisible, setTopicCardsVisible] = useState(false)
    const [descriptionVisible, setDescriptionVisible] = useState(false)
    const [helpSectionVisible, setHelpSectionVisible] = useState(false)
    const [webSectionVisible, setWebSectionVisible] = useState(false)
    const [finalCtaVisible, setFinalCtaVisible] = useState(false)

    // UI states
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authModalType, setAuthModalType] = useState<'login' | 'register'>('login')
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false)



    // Refs for scroll observation
    const footerTitleRef = useRef<HTMLDivElement>(null)
    const topicCardsRef = useRef<HTMLDivElement>(null)
    const descriptionRef = useRef<HTMLDivElement>(null)
    const helpSectionRef = useRef<HTMLDivElement>(null)
    const webSectionRef = useRef<HTMLDivElement>(null)
    const finalCtaRef = useRef<HTMLDivElement>(null)

    // Array of sample questions with corresponding backgrounds
    const sampleQuestions = [
        {
            text: "React Hook hoạt động như thế nào?",
            background: "url('/images/topics/topic_react_hooks_1764723105490.png')"
        },
        {
            text: "Sự khác biệt giữa SQL và NoSQL?",
            background: "url('/images/topics/topic_database_1764723120798.png')"
        },
        {
            text: "Cách tối ưu hiệu suất web application?",
            background: "url('/images/topics/topic_performance_1764723137954.png')"
        },
        {
            text: "Design Pattern nào phổ biến nhất?",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)"
        },
        {
            text: "Microservices vs Monolithic là gì?",
            background: "linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)"
        }
    ]

    const [currentIndex, setCurrentIndex] = useState(0)
    const [displayText, setDisplayText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        // Fade in animation on mount
        setIsVisible(true)

        // Start typing animation after a delay
        const typingDelay = setTimeout(() => {
            setIsTyping(true)
        }, 1500) // Start typing 1.5s after page loads

        return () => clearTimeout(typingDelay)
    }, [])

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.05 // Trigger when 10% of element is visible
        }

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target

                    if (target === footerTitleRef.current) {
                        setFooterTitleVisible(true)
                    } else if (target === topicCardsRef.current) {
                        setTopicCardsVisible(true)
                    } else if (target === descriptionRef.current) {
                        setDescriptionVisible(true)
                    } else if (target === helpSectionRef.current) {
                        setHelpSectionVisible(true)
                    } else if (target === webSectionRef.current) {
                        setWebSectionVisible(true)
                    } else if (target === finalCtaRef.current) {
                        setFinalCtaVisible(true)
                    }
                }
            })
        }

        const observer = new IntersectionObserver(observerCallback, observerOptions)

        // Observe all elements
        if (footerTitleRef.current) observer.observe(footerTitleRef.current)
        if (topicCardsRef.current) observer.observe(topicCardsRef.current)
        if (descriptionRef.current) observer.observe(descriptionRef.current)
        if (helpSectionRef.current) observer.observe(helpSectionRef.current)
        if (webSectionRef.current) observer.observe(webSectionRef.current)
        if (finalCtaRef.current) observer.observe(finalCtaRef.current)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        const fullText = sampleQuestions[currentIndex].text

        if (isTyping && !isDeleting && displayText.length < fullText.length) {
            // Typing forward
            const timeout = setTimeout(() => {
                setDisplayText(fullText.slice(0, displayText.length + 1))
            }, 80) // Speed of typing (80ms per character)

            return () => clearTimeout(timeout)
        } else if (isTyping && !isDeleting && displayText.length === fullText.length) {
            // Wait at full text before starting to delete
            const waitTimeout = setTimeout(() => {
                setIsDeleting(true)
            }, 2000) // Wait 2 seconds at full text

            return () => clearTimeout(waitTimeout)
        } else if (isDeleting && displayText.length > 0) {
            // Deleting backward
            const timeout = setTimeout(() => {
                setDisplayText(fullText.slice(0, displayText.length - 1))
            }, 50) // Faster deletion (50ms per character)

            return () => clearTimeout(timeout)
        } else if (isDeleting && displayText.length === 0) {
            // Move to next question and wait before starting to type again
            const waitTimeout = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % sampleQuestions.length)
                setIsDeleting(false)
            }, 500) // Wait 0.5 seconds before retyping

            return () => clearTimeout(waitTimeout)
        }
    }, [isTyping, isDeleting, displayText, currentIndex])

    // Dynamic background effect based on current question
    const getCurrentBackground = () => {
        const currentBg = sampleQuestions[currentIndex].background
        // If it's an image URL, create layered background with gradient overlay
        if (currentBg.startsWith('url')) {
            return `linear-gradient(rgba(34, 190, 238, 0.7), rgba(45, 212, 192, 0.7), rgba(6, 182, 212, 0.7)), ${currentBg}`
        }
        // If it's a gradient, layer it with ocean gradient
        return `linear-gradient(20deg, rgb(34, 190, 238), rgb(45, 212, 192), rgb(6, 182, 212), rgb(34, 211, 238)), ${currentBg}`
    }



    // Hàm kiểm tra yêu cầu đăng nhập
    const requireLogin = (callback: () => void) => {
        if (!isAuthenticated) {
            setShowLoginRequiredModal(true)
            return
        }
        callback()
    }

    // Handle login from modal
    const handleLoginFromModal = () => {
        setShowLoginRequiredModal(false)
        setAuthModalType('login')
        setShowAuthModal(true)
    }

    return (
        <div className="home-container">
            {/* Modal */}
            {/* {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Học cùng Hannah với Hannah với Hannah</h2>
                        <p className="modal-subtitle">Làm theo các bước dưới đây để tham gia danh sách chờ để dùng thử trải nghiệm Hannah.</p>

                        <div className="modal-form">
                            <div className="form-row">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Tên"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                                <input
                                    type="text"
                                    name="gmail"
                                    placeholder="Gmail"
                                    value={formData.gmail}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-section">
                                <p className="form-label">Bạn là loại người học nào?</p>
                                <div className="learner-type-buttons">
                                    <button
                                        className={`learner-button ${formData.learnerType === 'academic' ? 'active' : ''}`}
                                        onClick={() => handleLearnerTypeSelect('academic')}
                                    >
                                        <svg className="learner-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                                        </svg>
                                        <span>Học thuật</span>
                                    </button>
                                    <button
                                        className={`learner-button ${formData.learnerType === 'professional' ? 'active' : ''}`}
                                        onClick={() => handleLearnerTypeSelect('professional')}
                                    >
                                        <svg className="learner-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                                        </svg>
                                        <span>Chuyên nghiệp</span>
                                    </button>
                                    <button
                                        className={`learner-button ${formData.learnerType === 'curiosity' ? 'active' : ''}`}
                                        onClick={() => handleLearnerTypeSelect('curiosity')}
                                    >
                                        <svg className="learner-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                        </svg>
                                        <span>Tò mò</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-section">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="consent1"
                                        checked={formData.consent1}
                                        onChange={handleInputChange}
                                        className="form-checkbox"
                                    />
                                    <span>Tôi đồng ý với Google sử dụng thông tin này để liên hệ với tôi về Hannah và cho nghiên cứu thị trường.</span>
                                </label>
                            </div>

                            <div className="form-section">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="consent2"
                                        checked={formData.consent2}
                                        onChange={handleInputChange}
                                        className="form-checkbox"
                                    />
                                    <span>Tôi chấp nhận <a href="#" className="form-link">Điều khoản dịch vụ của Google</a> và xác nhận rằng thông tin của tôi sẽ được sử dụng phù hợp với <a href="#" className="form-link">Chính sách bảo mật của Google</a>.</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button className="modal-button close-button" onClick={handleCloseModal}>
                                    Đóng
                                </button>
                                <button
                                    className="modal-button submit-button"
                                    onClick={handleSubmit}
                                    disabled={!formData.name || !formData.learnerType || !formData.consent1 || !formData.consent2}
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Ocean Water Background with underwater light patterns */}
            <div className="ocean-background" style={{
                backgroundImage: getCurrentBackground(),
                backgroundSize: '400% 400%, cover',
                backgroundPosition: '0% 50%, center',
                backgroundBlendMode: 'overlay'
            }}>
                {/* Subtle water texture */}
                <div className="water-texture" style={{ display: 'none' }}></div>

                {/* Underwater light caustics - animated moving light patterns */}
                <div className="caustics-container" style={{ display: 'none' }}>
                    <div className="caustic-light-1"></div>
                    <div className="caustic-light-2"></div>
                    <div className="caustic-light-3"></div>
                    <div className="caustic-light-4"></div>
                </div>

                {/* Light overlay to brighten for better text readability */}
                <div className="light-overlay"></div>
            </div>

            {/* Top Bar - Header with fade in animation */}
            <header className={`relative header-fade-in ${isVisible ? 'visible' : 'hidden'}`}>
                {/* Left side - Logo */}
                <div className="header-logo">
                    <img src="/images/header/2021-FPTU-Logo.png" alt="FPT University Logo" className="header-logo-image" />
                    <h1 className="header-logo-text">Hannah</h1>
                    <span className="header-logo-tag">AI Assistant</span>
                </div>

                {/* Right side - Auth Buttons or Profile */}
                <div className="header-right-side">
                    {!isAuthenticated ? (
                        <div className="auth-buttons-container">
                            <button className="register-button" onClick={() => { setAuthModalType('register'); setShowAuthModal(true); }}>
                                Đăng ký
                            </button>
                            <button className="login-button" onClick={() => { setAuthModalType('login'); setShowAuthModal(true); }}>
                                Đăng nhập
                            </button>
                        </div>
                    ) : (
                        <div className="header-icons-container">
                            <ProfileIcon />
                        </div>
                    )}
                </div>
            </header >

            {/* Main Content - Vertically and Horizontally Centered */}
            <main className="relative flex items-center justify-center px-6 py-12" style={{ minHeight: 'calc(100vh - 180px)' }}>
                <div className="hero-content">

                    {/* Large Display Title with gradient text */}
                    <h2 className={`title-gradient ${isVisible ? 'visible' : ''}`}>
                        Hannah Assistant
                    </h2>

                    {/* Large Search Input Pill */}
                    <div className="search-container">
                        <div className={`search-input-wrapper ${isVisible ? 'visible' : ''}`} onClick={() => requireLogin(() => navigate('/learn'))} style={{ cursor: 'pointer' }}>
                            <div className="search-input-container">
                                <span className="search-input-text">{displayText}</span>
                                {displayText.length < sampleQuestions[currentIndex].text.length && isTyping && (
                                    <span className="cursor-blink typing">|</span>
                                )}
                            </div>

                            {/* Send Icon (not clickable - demo only) */}
                            <div className="send-icon" aria-label="Send">
                                <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Description with Chat Icon and Bold Text */}
                    <div className="description-container">
                        <p className={`description-text ${isVisible ? 'visible' : ''}`}>
                            Nắm vững kiến thức mới và nâng cao hiểu biết của bạn với{' '}
                            <span className="companion-badge">
                                <svg className="chat-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                trợ lý học tập thông minh
                            </span>{' '}
                            được thiết kế riêng cho sinh viên FPT.
                        </p>
                    </div>

                    {/* CTA Button - Join Waitlist */}
                    <div className="pt-6">
                        <button className={`cta-button ${isVisible ? 'visible' : ''}`} onClick={() => requireLogin(() => navigate('/learn'))}>
                            <span className="cta-button-text">Học cùng Hannah</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Wave Pattern Separator */}
            <div className="wave-pattern"></div>

            {/* Footer Section */}
            <footer className="footer-section">
                {/* Header Section */}
                <div className="footer-header" ref={footerTitleRef}>
                    <h3 className={`footer-title ${footerTitleVisible ? 'visible' : ''}`}>Bạn có thể học gì?</h3>
                </div>

                {/* Topic Cards Grid */}
                <div className={`topic-cards-grid ${topicCardsVisible ? 'visible' : ''}`} ref={topicCardsRef}>
                    {/* Card 1 - Web Development */}
                    <div className="topic-card card-yellow">
                        <div className="topic-card-header">
                            <svg className="topic-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                <path d="M8 15.5l1.5 1.5 3-3-3-3L8 12.5l1.5 1.5-1.5 1.5z" />
                            </svg>
                            <span className="topic-category">Web Development</span>
                        </div>
                        <h4 className="topic-question">React và NextJS khác nhau như thế nào?</h4>
                    </div>

                    {/* Card 2 - Database */}
                    <div className="topic-card card-pink">
                        <div className="topic-card-header">
                            <svg className="topic-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z" />
                            </svg>
                            <span className="topic-category">Database</span>
                        </div>
                        <h4 className="topic-question">Khi nào nên sử dụng MongoDB thay vì MySQL?</h4>
                        <div className="topic-image">
                            <svg viewBox="0 0 200 150" className="w-full h-full">
                                <rect width="200" height="150" fill="rgba(139, 92, 246, 0.2)" rx="8" />
                                <circle cx="50" cy="50" r="20" fill="rgba(139, 92, 246, 0.4)" />
                                <circle cx="100" cy="50" r="20" fill="rgba(139, 92, 246, 0.6)" />
                                <circle cx="150" cy="50" r="20" fill="rgba(139, 92, 246, 0.8)" />
                                <rect x="30" y="90" width="140" height="8" fill="rgba(139, 92, 246, 0.5)" rx="4" />
                                <rect x="40" y="110" width="120" height="8" fill="rgba(139, 92, 246, 0.5)" rx="4" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 3 - Cloud Computing */}
                    <div className="topic-card card-cyan">
                        <div className="topic-card-header">
                            <svg className="topic-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                            </svg>
                            <span className="topic-category">Cloud Computing</span>
                        </div>
                        <h4 className="topic-question">AWS và Azure: Nên chọn platform nào?</h4>
                        <div className="topic-image">
                            <svg viewBox="0 0 200 150" className="w-full h-full">
                                <defs>
                                    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: 'rgb(6, 182, 212)', stopOpacity: 0.6 }} />
                                        <stop offset="100%" style={{ stopColor: 'rgb(8, 145, 178)', stopOpacity: 0.8 }} />
                                    </linearGradient>
                                </defs>
                                <ellipse cx="100" cy="80" rx="60" ry="35" fill="url(#cloudGrad)" />
                                <ellipse cx="70" cy="70" rx="40" ry="25" fill="rgba(6, 182, 212, 0.4)" />
                                <ellipse cx="130" cy="70" rx="40" ry="25" fill="rgba(6, 182, 212, 0.4)" />
                            </svg>
                        </div>
                    </div>

                    {/* Card 4 - Mobile Development */}
                    <div className="topic-card card-yellow">
                        <div className="topic-card-header">
                            <svg className="topic-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                            </svg>
                            <span className="topic-category">Mobile Dev</span>
                        </div>
                        <h4 className="topic-question">Flutter có thực sự tốt hơn React Native?</h4>
                    </div>

                    {/* Card 5 - AI/ML */}
                    <div className="topic-card card-blue">
                        <div className="topic-card-header">
                            <svg className="topic-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="topic-category">AI & Machine Learning</span>
                        </div>
                        <h4 className="topic-question">Làm thế nào để bắt đầu học Machine Learning?</h4>
                        <div className="topic-image">
                            <svg viewBox="0 0 200 150" className="w-full h-full">
                                <rect width="200" height="150" fill="rgba(59, 130, 246, 0.1)" rx="8" />
                                <path d="M 30 120 Q 70 80, 100 100 T 170 60" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="3" fill="none" />
                                <circle cx="30" cy="120" r="5" fill="rgba(59, 130, 246, 1)" />
                                <circle cx="100" cy="100" r="5" fill="rgba(59, 130, 246, 1)" />
                                <circle cx="170" cy="60" r="5" fill="rgba(59, 130, 246, 1)" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Description Text */}
                <div className={`footer-description ${descriptionVisible ? 'visible' : ''}`} ref={descriptionRef}>
                    <p>Đặt câu hỏi lớn hoặc nhỏ, tải lên tài liệu hoặc khám phá các chủ đề được tuyển chọn.</p>
                </div>

                {/* How will this help section */}
                <div className="help-section" ref={helpSectionRef}>
                    <div className="help-header">
                        <h3 className={`help-title ${helpSectionVisible ? 'visible' : ''}`}>Điều này sẽ giúp bạn học và hiểu như thế nào?</h3>
                    </div>

                    <div className={`help-content ${helpSectionVisible ? 'visible' : ''}`}>
                        <div className="help-item">
                            <div className="help-icon-wrapper">
                                <svg className="help-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                            </div>
                            <div className="help-text">
                                <h4 className="help-item-title">Học tập cá nhân hóa</h4>
                                <p className="help-item-description">
                                    Hannah điều chỉnh phong cách giảng dạy theo tốc độ và cách học của bạn, giúp bạn tiếp thu kiến thức hiệu quả hơn.
                                </p>
                            </div>
                        </div>

                        <div className="help-item">
                            <div className="help-icon-wrapper">
                                <svg className="help-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                                </svg>
                            </div>
                            <div className="help-text">
                                <h4 className="help-item-title">Ôn tập thông minh</h4>
                                <p className="help-item-description">
                                    Hệ thống theo dõi tiến độ và đề xuất các chủ đề cần ôn tập, giúp bạn ghi nhớ lâu dài và không bỏ sót kiến thức quan trọng.
                                </p>
                            </div>
                        </div>

                        <div className="help-item">
                            <div className="help-icon-wrapper">
                                <svg className="help-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div className="help-text">
                                <h4 className="help-item-title">Giải thích chi tiết</h4>
                                <p className="help-item-description">
                                    Mọi khái niệm đều được giải thích rõ ràng với ví dụ thực tế, code mẫu và sơ đồ minh họa dễ hiểu.
                                </p>
                            </div>
                        </div>

                        <div className="help-item">
                            <div className="help-icon-wrapper">
                                <svg className="help-icon" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                </svg>
                            </div>
                            <div className="help-text">
                                <h4 className="help-item-title">Cộng đồng hỗ trợ</h4>
                                <p className="help-item-description">
                                    Kết nối với các bạn sinh viên FPT khác, chia sẻ kinh nghiệm và cùng nhau giải quyết các thử thách lập trình.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Best of the web section */}
                <div className="web-section" ref={webSectionRef}>
                    <div className="web-header">
                        <h3 className={`web-title ${webSectionVisible ? 'visible' : ''}`}>Tôi có vẫn nhận được những gì tốt nhất từ web?</h3>
                    </div>

                    <div className={`web-content ${webSectionVisible ? 'visible' : ''}`}>
                        <p className="web-description">
                            Có, Hannah kết hợp sức mạnh của AI với nguồn thông tin phong phú từ internet để mang đến cho bạn
                            những kiến thức chính xác và cập nhật nhất. Mỗi câu trả lời đều được xác thực từ các nguồn uy tín
                            trong ngành công nghệ.
                        </p>

                        <div className="web-features">
                            <div className="web-feature-item">
                                <div className="web-feature-icon">
                                    <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <span className="web-feature-text">Thông tin từ các nguồn đáng tin cậy</span>
                            </div>

                            <div className="web-feature-item">
                                <div className="web-feature-icon">
                                    <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <span className="web-feature-text">Cập nhật công nghệ mới nhất</span>
                            </div>

                            <div className="web-feature-item">
                                <div className="web-feature-icon">
                                    <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <span className="web-feature-text">Liên kết đến tài liệu gốc và bài viết tham khảo</span>
                            </div>

                            <div className="web-feature-item">
                                <div className="web-feature-icon">
                                    <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                </div>
                                <span className="web-feature-text">Kiến thức từ cộng đồng developer toàn cầu</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="final-cta-section" ref={finalCtaRef}>
                    <div className={`final-cta-description ${finalCtaVisible ? 'visible' : ''}`}>
                        <p>Đi xa theo sự tò mò của bạn. Khám phá rộng hoặc đào sâu vào chi tiết.</p>
                    </div>

                    <div className={`final-cta-button-wrapper ${finalCtaVisible ? 'visible' : ''}`}>
                        <button className="final-cta-button" onClick={() => requireLogin(() => navigate('/learn'))}>
                            <span className="final-cta-button-text">Học cùng Hannah</span>
                        </button>
                    </div>
                </div>

                {/* Footer Links */}
                <div className={`footer-links ${isVisible ? 'visible' : 'hidden'}`}>
                    <div className="footer-links-container">
                        <a href="/*" className="footer-link">Hannah</a>
                        <span className="footer-separator">•</span>
                        <a href="#" className="footer-link">Chính sách bảo mật</a>
                        <span className="footer-separator">•</span>
                        <a href="#" className="footer-link">Điều khoản dịch vụ</a>
                    </div>
                </div>
            </footer>

            {/* Login Required Modal */}
            <LoginRequiredModal
                isOpen={showLoginRequiredModal}
                onClose={() => setShowLoginRequiredModal(false)}
                onLogin={handleLoginFromModal}
            />

            {/* Auth Modal */}
            <Auth
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialTab={authModalType}
            />
        </div >
    )
}
