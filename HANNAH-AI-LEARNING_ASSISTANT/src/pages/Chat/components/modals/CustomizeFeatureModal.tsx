import React, { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import type { Subject } from '../../../../service/subjectService'

interface CustomizeFeatureModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    subjects: Subject[]
}

export const CustomizeFeatureModal: React.FC<CustomizeFeatureModalProps> = ({
    isOpen,
    onClose,
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

    if (!isOpen) return null

    const handleSubmit = () => {
        onSubmit({
            customizeTab,
            cardQuantity,
            cardTopic,
            selectedCourseCode,
            selectedSubjectIds
        })
        // Reset form
        setCustomizeTab('conversation')
        setCardQuantity(6)
        setCardTopic('')
        setSelectedCourseCode('')
        setSelectedSubjectIds([])
        setCourseSearchQuery('')
        setShowCourseDropdown(false)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="customize-modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
                <div className="customize-modal-header">
                    <div className="customize-modal-title-wrapper">
                        <ClipboardCheck size={24} color="#5f6368" />
                        <h3 className="customize-modal-title">Tùy chỉnh thẻ thông tin</h3>
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
