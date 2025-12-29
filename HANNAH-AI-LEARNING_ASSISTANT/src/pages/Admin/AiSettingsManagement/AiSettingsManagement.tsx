/**
 * AI Settings Management - Modern Light Theme with Horizontal Tabs
 * No sidebar - uses horizontal tabs for category navigation
 * Phase 12: Redesign for Admin Layout Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../../../service/adminService';
import type { SystemSetting } from '../../../service/adminService';
import toast from 'react-hot-toast';
import {
    Save,
    RefreshCw,
    MessageSquare,
    User,
    Quote,
    Filter,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Undo2,
    Info,
    Copy,
    Youtube,
    Sparkles,
    Search,
    Settings,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { formatDateTimeVN } from '../../../utils/dateUtils';
import AdminPageWrapper from '../components/AdminPageWrapper';
import './AiSettingsManagement.css';

// ============================================================================
// TYPES
// ============================================================================
interface SettingCardProps {
    setting: SystemSetting;
    onSave: (key: string, value: string) => Promise<void>;
    saving: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

interface CategoryConfig {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    keywords: string[];
}

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================
const CATEGORIES: CategoryConfig[] = [
    {
        id: 'main',
        name: 'Prompt Chính',
        icon: <MessageSquare size={18} />,
        description: 'System prompt và guidelines',
        keywords: ['system_prompt', 'response_guidelines'],
    },
    {
        id: 'studio',
        name: 'Studio',
        icon: <Sparkles size={18} />,
        description: 'Quiz, Mindmap, Flashcard',
        keywords: ['_generation_prompt'],
    },
    {
        id: 'student',
        name: 'Profile SV',
        icon: <User size={18} />,
        description: 'Thông tin sinh viên',
        keywords: ['student_context'],
    },
    {
        id: 'citation',
        name: 'Trích Dẫn',
        icon: <Quote size={18} />,
        description: 'Format nguồn tài liệu',
        keywords: ['citation'],
    },
    {
        id: 'rag',
        name: 'RAG & Filter',
        icon: <Filter size={18} />,
        description: 'Tìm kiếm & lọc tài liệu',
        keywords: ['rag', 'specialization', 'slide'],
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: <Youtube size={18} />,
        description: 'Video đề xuất',
        keywords: ['youtube'],
    },
];

// ============================================================================
// PLACEHOLDERS
// ============================================================================
const AVAILABLE_PLACEHOLDERS: Record<string, { placeholder: string; description: string }[]> = {
    'ai_student_context_template': [
        { placeholder: '{semester}', description: 'Kỳ học hiện tại' },
        { placeholder: '{specialization}', description: 'Mã chuyên ngành' },
        { placeholder: '{specialty_name}', description: 'Tên chuyên ngành' },
    ],
    'ai_citation_format': [
        { placeholder: '{content}', description: 'Nội dung trích dẫn' },
        { placeholder: '{source}', description: 'Tên file nguồn' },
        { placeholder: '{page}', description: 'Số trang' },
    ],
    'ai_quiz_generation_prompt': [
        { placeholder: '{{difficulty}}', description: 'Độ khó' },
        { placeholder: '{{count}}', description: 'Số câu hỏi' },
        { placeholder: '{{topics}}', description: 'Chủ đề' },
        { placeholder: '{{context}}', description: 'Nội dung tài liệu' },
    ],
    'ai_flashcard_generation_prompt': [
        { placeholder: '{{count}}', description: 'Số flashcard' },
        { placeholder: '{{topic}}', description: 'Chủ đề' },
        { placeholder: '{{context}}', description: 'Nội dung' },
    ],
    'ai_specialization_prompt_template': [
        { placeholder: '{specialization_name}', description: 'Tên chuyên ngành' },
        { placeholder: '{specialization_code}', description: 'Mã chuyên ngành' },
        { placeholder: '{required_subjects}', description: 'Môn bắt buộc' },
    ],
};

// ============================================================================
// PLACEHOLDER HELPER COMPONENT
// ============================================================================
const PlaceholderHelper: React.FC<{ settingKey: string; onInsert: (placeholder: string) => void }> = ({ settingKey, onInsert }) => {
    const placeholders = AVAILABLE_PLACEHOLDERS[settingKey];
    if (!placeholders) return null;

    return (
        <div className="ais-placeholder-helper">
            <div className="ais-placeholder-header">
                <Info size={14} />
                <span>Placeholders có sẵn:</span>
            </div>
            <div className="ais-placeholder-list">
                {placeholders.map(({ placeholder, description }) => (
                    <button
                        key={placeholder}
                        className="ais-placeholder-chip"
                        onClick={() => onInsert(placeholder)}
                        title={description}
                    >
                        <code>{placeholder}</code>
                        <Copy size={12} />
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// TEXT SETTING CARD
// ============================================================================
const TextSettingCard: React.FC<SettingCardProps> = ({ setting, onSave, saving, isExpanded = true, onToggleExpand }) => {
    const [value, setValue] = useState(setting.settingValue);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setValue(setting.settingValue);
        setHasChanges(false);
    }, [setting]);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        setHasChanges(newValue !== setting.settingValue);
    };

    const handleSave = async () => {
        await onSave(setting.settingKey, value);
        setHasChanges(false);
    };

    const handleUndo = () => {
        setValue(setting.settingValue);
        setHasChanges(false);
    };

    const insertPlaceholder = (placeholder: string) => {
        setValue(prev => prev + placeholder);
        setHasChanges(true);
        toast.success(`Đã thêm ${placeholder}`);
    };

    // Smart type detection
    const isLongText = setting.settingKey.includes('prompt') || setting.settingKey.includes('template') || setting.settingKey.includes('guidelines');

    // Determine input type
    const inputType = (() => {
        if (setting.settingKey.includes('threshold') ||
            setting.settingKey.includes('top_k') ||
            setting.settingKey.includes('max_') ||
            setting.settingKey.includes('_words') ||
            setting.settingKey.includes('_depth') ||
            setting.settingKey.includes('_nodes') ||
            setting.settingKey.includes('_results') ||
            setting.settingKey.includes('semester')) {
            return 'number';
        }
        if (setting.settingKey.includes('keywords') || setting.settingKey.includes('format')) {
            return 'short';
        }
        if (isLongText) {
            return 'long';
        }
        return 'medium';
    })();

    return (
        <div className={`ais-card ${hasChanges ? 'has-changes' : ''} ais-card-${inputType}`}>
            <div className="ais-card-header" onClick={onToggleExpand}>
                <div className="ais-card-info">
                    <h4 className="ais-card-title">{getSettingLabel(setting.settingKey)}</h4>
                    {!isExpanded && <p className="ais-card-preview">{value.substring(0, 80)}...</p>}
                </div>
                <div className="ais-card-actions">
                    {hasChanges && (
                        <>
                            <button className="ais-btn ais-btn-ghost" onClick={(e) => { e.stopPropagation(); handleUndo(); }} title="Hoàn tác">
                                <Undo2 size={16} />
                            </button>
                            <button className="ais-btn ais-btn-primary" onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={saving}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu
                            </button>
                        </>
                    )}
                    {onToggleExpand && (
                        <button className="ais-btn ais-btn-ghost ais-expand-btn" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="ais-card-body">
                    <p className="ais-card-description">{setting.description}</p>

                    {AVAILABLE_PLACEHOLDERS[setting.settingKey] && (
                        <PlaceholderHelper settingKey={setting.settingKey} onInsert={insertPlaceholder} />
                    )}

                    {inputType === 'number' ? (
                        <div className="ais-input-row">
                            <input
                                type="number"
                                className="ais-input ais-input-number"
                                value={value}
                                onChange={(e) => handleChange(e.target.value)}
                                step="0.1"
                            />
                            <span className="ais-input-unit">
                                {setting.settingKey.includes('threshold') ? '(0-1)' : ''}
                                {setting.settingKey.includes('top_k') ? 'chunks' : ''}
                                {setting.settingKey.includes('words') ? 'từ' : ''}
                                {setting.settingKey.includes('depth') ? 'levels' : ''}
                                {setting.settingKey.includes('nodes') ? 'nodes' : ''}
                                {setting.settingKey.includes('results') ? 'videos' : ''}
                            </span>
                        </div>
                    ) : inputType === 'short' ? (
                        <input
                            type="text"
                            className="ais-input ais-input-short"
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            placeholder="Nhập giá trị..."
                        />
                    ) : (
                        <textarea
                            className="ais-textarea"
                            value={value}
                            onChange={(e) => handleChange(e.target.value)}
                            rows={inputType === 'long' ? 10 : 4}
                            placeholder="Nhập giá trị..."
                        />
                    )}

                    <div className="ais-card-meta">
                        <span className="ais-card-key">{setting.settingKey}</span>
                        {inputType !== 'number' && <span className="ais-card-chars">{value.length} ký tự</span>}
                        {setting.updatedAt && (
                            <span className="ais-card-updated">
                                Cập nhật: {formatDateTimeVN(setting.updatedAt)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// TOGGLE SETTING CARD
// ============================================================================
const ToggleSettingCard: React.FC<SettingCardProps> = ({ setting, onSave, saving }) => {
    const isEnabled = setting.settingValue.toLowerCase() === 'true';

    const handleToggle = async () => {
        await onSave(setting.settingKey, (!isEnabled).toString());
    };

    return (
        <div className="ais-card ais-card-toggle">
            <div className="ais-toggle-content">
                <div className="ais-card-info">
                    <h4 className="ais-card-title">{getSettingLabel(setting.settingKey)}</h4>
                    <p className="ais-card-description">{setting.description}</p>
                </div>
                <button
                    className={`ais-toggle-switch ${isEnabled ? 'enabled' : ''}`}
                    onClick={handleToggle}
                    disabled={saving}
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                </button>
            </div>
            <div className="ais-card-meta">
                <span className="ais-card-key">{setting.settingKey}</span>
                <span className={`ais-toggle-status ${isEnabled ? 'enabled' : 'disabled'}`}>
                    {isEnabled ? <><CheckCircle size={14} /> Bật</> : <><AlertTriangle size={14} /> Tắt</>}
                </span>
            </div>
        </div>
    );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getSettingLabel(key: string): string {
    const labels: Record<string, string> = {
        'ai_system_prompt': 'System Prompt',
        'ai_response_guidelines': 'Response Guidelines',
        'ai_student_context_template': 'Template Thông Tin SV',
        'ai_student_context_enabled': 'Hiển Thị Info SV',
        'ai_citation_format': 'Format Trích Dẫn',
        'ai_citation_enabled': 'Bật Trích Dẫn',
        'ai_citation_instruction': 'Hướng Dẫn Trích Dẫn',
        'ai_rag_semester_filter_enabled': 'Lọc Theo Kỳ',
        'ai_rag_specialization_filter_enabled': 'Lọc Chuyên Ngành',
        'ai_specialization_start_semester': 'Kỳ Bắt Đầu',
        'ai_rag_hybrid_fallback_enabled': 'Hybrid Fallback',
        'ai_rag_out_of_semester_note': 'Note Ngoài Kỳ',
        'ai_rag_similarity_threshold': 'Similarity Threshold',
        'ai_youtube_enabled': 'YouTube Videos',
        'ai_youtube_max_results': 'Max Videos',
        'ai_youtube_keywords': 'Search Keywords',
        'ai_youtube_exclude_keywords': 'Exclude Keywords',
        'ai_slide_source_format': 'Slide Source Format',
        'ai_quiz_generation_prompt': 'Quiz Generation Prompt',
        'ai_mindmap_generation_prompt': 'Mindmap Generation Prompt',
        'ai_flashcard_generation_prompt': 'Flashcard Generation Prompt',
        'ai_report_generation_prompt': 'Report Generation Prompt',
        'ai_rag_diversity_enabled': 'Diversity Ranking',
        'ai_rag_top_k': 'Top K Chunks',
        'ai_rag_max_chunks_per_doc': 'Max Chunks/Doc',
        'ai_specialization_context_enabled': 'Specialization Context',
        'ai_specialization_prompt_template': 'Specialization Template',
    };
    return labels[key] || key.replace('ai_', '').replace(/_/g, ' ');
}

function categorizeSettings(settings: SystemSetting[]): Map<string, SystemSetting[]> {
    const categorized = new Map<string, SystemSetting[]>();

    CATEGORIES.forEach(cat => {
        categorized.set(cat.id, []);
    });

    settings.forEach(setting => {
        let assigned = false;
        for (const cat of CATEGORIES) {
            if (cat.keywords.some(kw => setting.settingKey.includes(kw))) {
                categorized.get(cat.id)!.push(setting);
                assigned = true;
                break;
            }
        }
        if (!assigned) {
            categorized.get('rag')!.push(setting);
        }
    });

    return categorized;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AiSettingsManagement() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('main');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getAiSettings();
            setSettings(data);
            // Auto-expand first 2 cards
            if (data.length > 0) {
                setExpandedCards(new Set(data.slice(0, 2).map(s => s.settingKey)));
            }
        } catch (error) {
            console.error('Failed to load AI settings:', error);
            toast.error('Không thể tải cài đặt AI');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Add class to body to prevent outer scroll
    useEffect(() => {
        document.body.classList.add('ai-settings-page');
        return () => {
            document.body.classList.remove('ai-settings-page');
        };
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async (key: string, value: string) => {
        setSavingKey(key);
        try {
            const updated = await adminService.updateSetting(key, value);
            setSettings(prev => prev.map(s => s.settingKey === key ? { ...s, settingValue: value, updatedAt: updated.updatedAt } : s));
            toast.success('Đã lưu thay đổi');
        } catch (error) {
            console.error('Failed to save setting:', error);
            toast.error('Lưu thất bại');
        } finally {
            setSavingKey(null);
        }
    };

    const toggleCardExpand = (key: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Filter and categorize
    const filteredSettings = searchQuery
        ? settings.filter(s =>
            s.settingKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.settingValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : settings;

    const categorizedSettings = categorizeSettings(filteredSettings);
    const currentCategorySettings = categorizedSettings.get(activeCategory) || [];

    // Separate toggles from text settings for grid layout
    const toggleSettings = currentCategorySettings.filter(s => s.settingType === 'boolean');
    const textSettings = currentCategorySettings.filter(s => s.settingType !== 'boolean');

    if (isLoading) {
        return (
            <AdminPageWrapper title="AI Settings">
                <div className="ais-loading">
                    <Loader2 size={40} />
                    <p>Đang tải cài đặt AI...</p>
                </div>
            </AdminPageWrapper>
        );
    }

    return (
        <AdminPageWrapper title="AI Settings">
            <div className="ais-container">
                {/* Tabs + Toolbar Row */}
                <div className="ais-tabs-row">
                    <nav className="ais-tabs">
                        {CATEGORIES.map(cat => {
                            const count = categorizedSettings.get(cat.id)?.length || 0;
                            return (
                                <button
                                    key={cat.id}
                                    className={`ais-tab ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    {cat.icon}
                                    <span className="ais-tab-name">{cat.name}</span>
                                    {count > 0 && <span className="ais-tab-badge">{count}</span>}
                                </button>
                            );
                        })}
                    </nav>
                    <div className="ais-toolbar">
                        <div className="ais-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm settings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="ais-btn ais-btn-secondary" onClick={loadSettings}>
                            <RefreshCw size={18} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* Content */}
                <main className="ais-content">
                    {settings.length === 0 ? (
                        <div className="ais-empty">
                            <AlertTriangle size={48} />
                            <h3>Chưa có cài đặt AI</h3>
                            <p>Vui lòng chạy seed script để tạo settings mặc định</p>
                        </div>
                    ) : currentCategorySettings.length === 0 ? (
                        <div className="ais-empty">
                            <Settings size={48} />
                            <h3>Không có settings trong mục này</h3>
                            <p>Thử tìm kiếm hoặc chọn category khác</p>
                        </div>
                    ) : (
                        <>
                            {/* Toggle Settings Grid */}
                            {toggleSettings.length > 0 && (
                                <div className="ais-section">
                                    <h3 className="ais-section-title">Bật/Tắt tính năng</h3>
                                    <div className="ais-toggles-grid">
                                        {toggleSettings.map(setting => (
                                            <ToggleSettingCard
                                                key={setting.settingKey}
                                                setting={setting}
                                                onSave={handleSave}
                                                saving={savingKey === setting.settingKey}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Text Settings */}
                            {textSettings.length > 0 && (
                                <div className="ais-section">
                                    {toggleSettings.length > 0 && <h3 className="ais-section-title">Cấu hình chi tiết</h3>}
                                    <div className="ais-cards-list">
                                        {textSettings.map(setting => (
                                            <TextSettingCard
                                                key={setting.settingKey}
                                                setting={setting}
                                                onSave={handleSave}
                                                saving={savingKey === setting.settingKey}
                                                isExpanded={expandedCards.has(setting.settingKey)}
                                                onToggleExpand={() => toggleCardExpand(setting.settingKey)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </AdminPageWrapper>
    );
}

