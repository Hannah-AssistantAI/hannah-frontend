import React, { useState, useRef, useEffect } from 'react'
import { Share2, ChevronDown, Link as LinkIcon } from 'lucide-react'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const [shareEmail, setShareEmail] = useState('')
    const [generalAccess, setGeneralAccess] = useState<'restricted' | 'anyone'>('restricted')
    const [showAccessDropdown, setShowAccessDropdown] = useState(false)
    const accessDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accessDropdownRef.current && !accessDropdownRef.current.contains(event.target as Node)) {
                setShowAccessDropdown(false)
            }
        }

        if (showAccessDropdown) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [showAccessDropdown])

    if (!isOpen) return null

    const handleCopyLink = () => {
        const link = window.location.href
        navigator.clipboard.writeText(link)
        alert('Đã sao chép đường liên kết!')
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="share-modal-header">
                    <div className="share-modal-title-section">
                        <Share2 size={20} color="#5f6368" />
                        <h3 className="share-modal-title">Chia sẻ cuộc trò chuyện</h3>
                    </div>
                    <button
                        className="share-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                <div className="share-modal-body">
                    {/* Add people input */}
                    <div className="share-input-section">
                        <input
                            type="email"
                            className="share-email-input"
                            placeholder="Thêm người dùng và nhóm*"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                        />
                    </div>

                    {/* People with access */}
                    <div className="share-access-section">
                        <h4 className="share-section-title">Người có quyền truy cập</h4>
                        <div className="share-user-item">
                            <div className="share-user-avatar">
                                <img
                                    src="https://ui-avatars.com/api/?name=Ha+Nguyen&background=4285F4&color=fff&size=40"
                                    alt="Hà Nguyễn"
                                />
                            </div>
                            <div className="share-user-info">
                                <div className="share-user-name">Ha Nguyen</div>
                                <div className="share-user-email">khanhhanguyen1123@gmail...</div>
                            </div>
                            <div className="share-user-role">
                                <select className="share-role-select" disabled>
                                    <option value="owner">Chủ sở hữu</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* General access */}
                    <div className="share-general-section">
                        <h4 className="share-section-title">Quyền truy cập chung</h4>
                        <div className="share-access-control" ref={accessDropdownRef}>
                            <div className="share-access-icon">
                                {generalAccess === 'restricted' ? '🔒' : '🌐'}
                            </div>
                            <div className="share-access-info">
                                <div className="share-access-title">
                                    {generalAccess === 'restricted' ? 'Bị hạn chế' : 'Bất kỳ ai có đường liên kết'}
                                </div>
                                <div className="share-access-description">
                                    {generalAccess === 'restricted'
                                        ? 'Chỉ những người có quyền truy cập mới có thể mở bằng đường liên kết này'
                                        : 'Bất kỳ ai có đường liên kết đều có thể xem'
                                    }
                                </div>
                            </div>
                            <button
                                className="share-access-dropdown"
                                onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                            >
                                <ChevronDown size={20} />
                            </button>

                            {/* Access Dropdown Menu */}
                            {showAccessDropdown && (
                                <div className="share-access-dropdown-menu">
                                    <button
                                        className={`share-access-option ${generalAccess === 'restricted' ? 'active' : ''}`}
                                        onClick={() => {
                                            setGeneralAccess('restricted')
                                            setShowAccessDropdown(false)
                                        }}
                                    >
                                        <div className="share-access-option-icon">🔒</div>
                                        <div className="share-access-option-info">
                                            <div className="share-access-option-title">Bị hạn chế</div>
                                            <div className="share-access-option-desc">
                                                Chỉ những người được thêm mới có quyền truy cập
                                            </div>
                                        </div>
                                        {generalAccess === 'restricted' && (
                                            <div className="share-access-option-check">✓</div>
                                        )}
                                    </button>
                                    <button
                                        className={`share-access-option ${generalAccess === 'anyone' ? 'active' : ''}`}
                                        onClick={() => {
                                            setGeneralAccess('anyone')
                                            setShowAccessDropdown(false)
                                        }}
                                    >
                                        <div className="share-access-option-icon">🌐</div>
                                        <div className="share-access-option-info">
                                            <div className="share-access-option-title">Bất kỳ ai có đường liên kết</div>
                                            <div className="share-access-option-desc">
                                                Bất kỳ ai có đường liên kết đều có thể xem
                                            </div>
                                        </div>
                                        {generalAccess === 'anyone' && (
                                            <div className="share-access-option-check">✓</div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="share-modal-footer">
                    <button className="share-copy-link-btn" onClick={handleCopyLink}>
                        <LinkIcon size={18} />
                        Sao chép đường liên kết
                    </button>
                    <button
                        className="share-done-btn"
                        onClick={onClose}
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    )
}
