import React, { useState, useEffect } from 'react'
import { ClipboardCheck, FileText, Loader2 } from 'lucide-react'
import type { Subject } from '../../../../service/subjectService'
import documentService, { type Document } from '../../../../service/documentService'

interface CustomizeFeatureModalProps {
    isOpen: boolean
    onClose: () => void
    featureType: 'mindmap' | 'notecard' | 'quiz' | 'roadmap' | null
    onSubmit: (data: any) => void
    subjects: Subject[]
}

export const CustomizeFeatureModal: React.FC<CustomizeFeatureModalProps> = ({
    isOpen,
    onClose,
    featureType,
    onSubmit,
    subjects
}) => {
    const [customizeTab, setCustomizeTab] = useState<'conversation' | 'course'>('conversation')
    const [cardQuantity, setCardQuantity] = useState<number>(6)
    const [cardTopic, setCardTopic] = useState('')
    const [selectedCourseCode, setSelectedCourseCode] = useState('')
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
    const [courseSearchQuery, setCourseSearchQuery] = useState('')
    const [showCourseDropdown, setShowCourseDropdown] = useState(false)

    // 🆕 Document picker state
    const [subjectDocuments, setSubjectDocuments] = useState<Document[]>([])
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([])
    const [loadingDocs, setLoadingDocs] = useState(false)

    // 🆕 Fetch documents when subject is selected
    useEffect(() => {
        if (selectedSubjectIds.length > 0) {
            const fetchDocs = async () => {
                setLoadingDocs(true)
                try {
                    const docs = await documentService.getDocumentsBySubject(String(selectedSubjectIds[0]))
                    // Only show approved/processed documents
                    const readyDocs = docs.filter(d => d.processingStatus === 'Completed' || d.isProcessed)
                    setSubjectDocuments(readyDocs)
                } catch (error) {
                    console.error('Failed to fetch documents:', error)
                    setSubjectDocuments([])
                } finally {
                    setLoadingDocs(false)
                }
            }
            fetchDocs()
        } else {
            setSubjectDocuments([])
            setSelectedDocumentIds([])
        }
    }, [selectedSubjectIds])

    if (!isOpen) return null

    // Get feature title based on type
    const getFeatureTitle = () => {
        switch (featureType) {
            case 'mindmap':
                return 'Bản đồ tư duy'
            case 'notecard':
                return 'Thẻ ghi nhớ'
            case 'quiz':
                return 'Bài kiểm tra'
            case 'roadmap':
                return 'Tư vấn lộ trình'
            default:
                return 'Tính năng'
        }
    }

    const handleSubmit = () => {
        onSubmit({
            customizeTab,
            cardQuantity,
            cardTopic,
            selectedCourseCode,
            selectedSubjectIds,
            selectedDocumentIds  // 🆕 Include selected documents
        })
        // Reset form
        setCustomizeTab('conversation')
        setCardQuantity(6)
        setCardTopic('')
        setSelectedCourseCode('')
        setSelectedSubjectIds([])
        setSelectedDocumentIds([])  // 🆕 Reset document selection
        setSubjectDocuments([])
        setCourseSearchQuery('')
        setShowCourseDropdown(false)
    }

    // 🆕 Toggle document selection
    const toggleDocument = (docId: number) => {
        setSelectedDocumentIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        )
    }

    // 🆕 Select/deselect all documents
    const toggleAllDocuments = () => {
        if (selectedDocumentIds.length === subjectDocuments.length) {
            setSelectedDocumentIds([])
        } else {
            setSelectedDocumentIds(subjectDocuments.map(d => d.documentId))
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="customize-modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
                <div className="customize-modal-header">
                    <div className="customize-modal-title-wrapper">
                        <ClipboardCheck size={24} color="#5f6368" />
                        <h3 className="customize-modal-title">Tùy chỉnh {getFeatureTitle()}</h3>
                    </div>
                    <button
                        className="customize-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="customize-tabs">
                    <button
                        className={`customize-tab ${customizeTab === 'conversation' ? 'active' : ''}`}
                        onClick={() => setCustomizeTab('conversation')}
                    >
                        Theo nội dung cuộc trò chuyện
                    </button>
                    <button
                        className={`customize-tab ${customizeTab === 'course' ? 'active' : ''}`}
                        onClick={() => setCustomizeTab('course')}
                    >
                        Theo mã môn học
                    </button>
                </div>

                <div className="customize-modal-body">
                    {customizeTab === 'conversation' ? (
                        <>
                            {/* Số lượng thẻ */}
                            <div className="customize-section">
                                <h4 className="customize-section-title">Số lượng thẻ</h4>
                                <div className="customize-options" style={{ maxWidth: '50%' }}>
                                    <button
                                        className={`customize-option-btn ${cardQuantity === 3 ? 'selected' : ''}`}
                                        onClick={() => setCardQuantity(3)}
                                    >
                                        Ít hơn
                                    </button>
                                    <button
                                        className={`customize-option-btn ${cardQuantity === 6 ? 'selected' : ''}`}
                                        onClick={() => setCardQuantity(6)}
                                    >
                                        Tiêu chuẩn
                                    </button>
                                    <button
                                        className={`customize-option-btn ${cardQuantity === 9 ? 'selected' : ''}`}
                                        onClick={() => setCardQuantity(9)}
                                    >
                                        Nhiều hơn
                                    </button>
                                </div>
                            </div>

                            {/* Chủ đề nên là gì */}
                            <div className="customize-section">
                                <h4 className="customize-section-title">Mô tả</h4>
                                <textarea
                                    className="customize-textarea"
                                    style={{ maxWidth: '98%' }}
                                    placeholder="Mô tả ngắn gọn về chủ đề"
                                    value={cardTopic}
                                    onChange={(e) => setCardTopic(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Số lượng thẻ và Mã môn học trên cùng một hàng */}
                            <div className="customize-row">
                                {/* Số lượng thẻ */}
                                <div className="customize-section">
                                    <h4 className="customize-section-title">Số lượng thẻ</h4>
                                    <div className="customize-options">
                                        <button
                                            className={`customize-option-btn ${cardQuantity === 3 ? 'selected' : ''}`}
                                            onClick={() => setCardQuantity(3)}
                                        >
                                            Ít hơn
                                        </button>
                                        <button
                                            className={`customize-option-btn ${cardQuantity === 6 ? 'selected' : ''}`}
                                            onClick={() => setCardQuantity(6)}
                                        >
                                            Tiêu chuẩn
                                        </button>
                                        <button
                                            className={`customize-option-btn ${cardQuantity === 9 ? 'selected' : ''}`}
                                            onClick={() => setCardQuantity(9)}
                                        >
                                            Nhiều hơn
                                        </button>
                                    </div>
                                </div>


                                {/* Môn học */}
                                <div className="customize-section">
                                    <h4 className="customize-section-title">Chọn môn học</h4>
                                    <div className="course-code-dropdown">
                                        <input
                                            type="text"
                                            className="course-code-search"
                                            placeholder="Tìm kiếm môn học (VD: SUB101, PRO...)"
                                            value={courseSearchQuery}
                                            onChange={(e) => {
                                                setCourseSearchQuery(e.target.value)
                                                setShowCourseDropdown(true)
                                            }}
                                            onFocus={() => setShowCourseDropdown(true)}
                                        />
                                        {courseSearchQuery && showCourseDropdown && (
                                            <div className="course-code-options">
                                                {subjects
                                                    .filter((subject: Subject) =>
                                                        subject.code?.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                                                        subject.name?.toLowerCase().includes(courseSearchQuery.toLowerCase())
                                                    )
                                                    .map((subject: Subject) => (
                                                        <button
                                                            key={subject.subjectId}
                                                            className="course-code-option"
                                                            onClick={() => {
                                                                setSelectedSubjectIds([subject.subjectId])
                                                                setSelectedCourseCode(subject.code)
                                                                setCourseSearchQuery(`${subject.code} - ${subject.name}`)
                                                                setShowCourseDropdown(false)
                                                            }}
                                                        >
                                                            <span className="course-code">{subject.code}</span>
                                                            <span className="course-name">{subject.name}</span>
                                                        </button>
                                                    ))
                                                }
                                                {subjects.filter((subject: Subject) =>
                                                    subject.code?.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                                                    subject.name?.toLowerCase().includes(courseSearchQuery.toLowerCase())
                                                ).length === 0 && (
                                                        <div className="course-code-no-results">
                                                            Không tìm thấy môn học
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 🆕 Document Picker - appears when subject is selected */}
                            {selectedSubjectIds.length > 0 && (
                                <div className="customize-section document-picker">
                                    <div className="document-picker-header">
                                        <h4 className="customize-section-title">
                                            Chọn tài liệu
                                            {subjectDocuments.length > 0 && (
                                                <span className="doc-count">({subjectDocuments.length} files)</span>
                                            )}
                                        </h4>
                                        {subjectDocuments.length > 0 && (
                                            <button
                                                type="button"
                                                className="select-all-btn"
                                                onClick={toggleAllDocuments}
                                            >
                                                {selectedDocumentIds.length === subjectDocuments.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="document-picker-hint">
                                        Bỏ trống để sử dụng toàn bộ tài liệu của môn học
                                    </p>

                                    {loadingDocs ? (
                                        <div className="document-loading">
                                            <Loader2 size={20} className="spinning" />
                                            <span>Đang tải tài liệu...</span>
                                        </div>
                                    ) : subjectDocuments.length === 0 ? (
                                        <div className="document-empty">
                                            Chưa có tài liệu nào cho môn học này
                                        </div>
                                    ) : (
                                        <div className="document-list">
                                            {subjectDocuments.map(doc => (
                                                <label
                                                    key={doc.documentId}
                                                    className={`document-item ${selectedDocumentIds.includes(doc.documentId) ? 'selected' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDocumentIds.includes(doc.documentId)}
                                                        onChange={() => toggleDocument(doc.documentId)}
                                                    />
                                                    <FileText size={16} color="#5f6368" />
                                                    <span className="document-title">{doc.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mô tả */}
                            <div className="customize-section">
                                <h4 className="customize-section-title">Mô tả</h4>
                                <textarea
                                    className="customize-textarea"
                                    style={{ maxWidth: '98%' }}
                                    placeholder="Mô tả ngắn gọn về chủ đề"
                                    value={cardTopic}
                                    onChange={(e) => setCardTopic(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="customize-modal-footer">
                    <button
                        className="customize-create-btn"
                        onClick={handleSubmit}
                    >
                        Tạo
                    </button>
                </div>
            </div>
        </div>
    )
}
