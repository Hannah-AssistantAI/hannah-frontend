import React, { useState, useRef, useEffect } from 'react'
import { Share2, ChevronDown, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import conversationService from '../../../../service/conversationService'
import { useAuth } from '../../../../contexts/AuthContext'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    conversationId: number | null
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, conversationId }) => {
    const { user } = useAuth()
    const [generalAccess, setGeneralAccess] = useState<'restricted' | 'anyone'>('restricted')
    const [showAccessDropdown, setShowAccessDropdown] = useState(false)
    const [shareUrl, setShareUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
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

    // Generate share link when access is set to 'anyone'
    useEffect(() => {
        const generateShareLink = async () => {
            if (!conversationId || !user) return

            setIsLoading(true)
            try {
                const enable = generalAccess === 'anyone'
                const result = await conversationService.shareConversation(conversationId, user.userId, enable)

                if (enable && result.shareToken) {
                    setShareUrl(`${window.location.origin}/shared/${result.shareToken}`)
                } else {
                    setShareUrl(null)
                }
            } catch (error) {
                console.error('Failed to generate share link:', error)
                toast.error('Không thể tạo link chia sẻ. Vui lòng thử lại.')
            } finally {
                setIsLoading(false)
            }
        }

        if (generalAccess === 'anyone' && conversationId) {
            generateShareLink()
        } else {
            setShareUrl(null)
        }
    }, [generalAccess, conversationId, user])

    if (!isOpen) return null

    const handleCopyLink = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl)
            toast.success('Đã sao chép đường liên kết!')
        }
    }

    const handleAccessChange = (newAccess: 'restricted' | 'anyone') => {
        setGeneralAccess(newAccess)
        setShowAccessDropdown(false)
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
                                        ? 'Chỉ bạn có thể truy cập cuộc trò chuyện này'
                                        : 'Bất kỳ ai có đường liên kết đều có thể xem (chỉ đọc)'
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
                                        onClick={() => handleAccessChange('restricted')}
                                    >
                                        <div className="share-access-option-icon">🔒</div>
                                        <div className="share-access-option-info">
                                            <div className="share-access-option-title">Bị hạn chế</div>
                                            <div className="share-access-option-desc">
                                                Chỉ bạn có thể truy cập
                                            </div>
                                        </div>
                                        {generalAccess === 'restricted' && (
                                            <div className="share-access-option-check">✓</div>
                                        )}
                                    </button>
                                    <button
                                        className={`share-access-option ${generalAccess === 'anyone' ? 'active' : ''}`}
                                        onClick={() => handleAccessChange('anyone')}
                                    >
                                        <div className="share-access-option-icon">🌐</div>
                                        <div className="share-access-option-info">
                                            <div className="share-access-option-title">Bất kỳ ai có đường liên kết</div>
                                            <div className="share-access-option-desc">
                                                Bất kỳ ai có đường liên kết đều có thể xem (chỉ đọc)
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

                    {/* Display share URL when available */}
                    {isLoading && (
                        <div style={{ padding: '12px', textAlign: 'center', color: '#5f6368' }}>
                            Đang tạo link chia sẻ...
                        </div>
                    )}

                    {shareUrl && !isLoading && (
                        <div style={{ padding: '12px', background: '#f1f3f4', borderRadius: '8px', marginTop: '12px' }}>
                            <div style={{ fontSize: '13px', color: '#5f6368', marginBottom: '8px' }}>
                                Link chia sẻ:
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#1a73e8',
                                wordBreak: 'break-all',
                                fontFamily: 'monospace'
                            }}>
                                {shareUrl}
                            </div>
                        </div>
                    )}
                </div>

                <div className="share-modal-footer">
                    <button
                        className="share-copy-link-btn"
                        onClick={handleCopyLink}
                        disabled={!shareUrl || isLoading}
                    >
                        <LinkIcon size={18} />
                        Sao chép đường liên kết
                    </button>
                    <button
                        className="share-done-btn"
                        onClick={onClose}
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    )
}
