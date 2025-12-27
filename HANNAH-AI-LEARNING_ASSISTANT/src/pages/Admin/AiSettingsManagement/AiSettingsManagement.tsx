/**
 * AI Settings Management - Premium Dark Theme Redesign
 * Modern admin interface with sidebar navigation
 * Phase 11: Complete UI Redesign
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminService from '../../../service/adminService';
import type { SystemSetting } from '../../../service/adminService';
import toast from 'react-hot-toast';
import {
    Bot,
    Save,
    RefreshCw,
    MessageSquare,
    User,
    Quote,
    Filter,
    ToggleLeft,
    ToggleRight,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Undo2,
    Info,
    Copy,
    RotateCcw,
    Youtube,
    Sparkles,
    Search,
    Settings,
} from 'lucide-react';
import { formatDateTimeVN } from '../../../utils/dateUtils';
import './AiSettingsManagement.css';

// ============================================================================
// TYPES
// ============================================================================
interface SettingCardProps {
    setting: SystemSetting;
    onSave: (key: string, value: string) => Promise<void>;
    saving: boolean;
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
        icon: <MessageSquare size={20} />,
        description: 'System prompt và guidelines',
        keywords: ['system_prompt', 'response_guidelines'],
    },
    {
        id: 'studio',
        name: 'Studio Prompts',
        icon: <Sparkles size={20} />,
        description: 'Quiz, Mindmap, Flashcard',
        keywords: ['_generation_prompt'],
    },
    {
        id: 'student',
        name: 'Profile SV',
        icon: <User size={20} />,
        description: 'Thông tin sinh viên',
        keywords: ['student_context'],
    },
    {
        id: 'citation',
        name: 'Trích Dẫn',
        icon: <Quote size={20} />,
        description: 'Format nguồn tài liệu',
        keywords: ['citation'],
    },
    {
        id: 'rag',
        name: 'RAG & Filter',
        icon: <Filter size={20} />,
        description: 'Tìm kiếm & lọc tài liệu',
        keywords: ['rag', 'specialization', 'slide'],
    },
    {
        id: 'youtube',
        name: 'YouTube',
        icon: <Youtube size={20} />,
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
        <div className="ai-placeholder-helper">
            <div className="ai-placeholder-header">
                <Info size={14} />
                <span>Placeholders:</span>
            </div>
            <div className="ai-placeholder-list">
                {placeholders.map(({ placeholder, description }) => (
                    <button
                        key={placeholder}
                        className="ai-placeholder-chip"
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
// TEXT SETTING CARD - Smart Input Detection
// ============================================================================
const TextSettingCard: React.FC<SettingCardProps> = ({ setting, onSave, saving }) => {
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
    const isNumber = /^\d+(\.\d+)?$/.test(setting.settingValue.trim());
    const isShortText = setting.settingValue.length < 100 && !setting.settingKey.includes('prompt') && !setting.settingKey.includes('template');
    const isLongText = setting.settingKey.includes('prompt') || setting.settingKey.includes('template') || setting.settingKey.includes('guidelines');

    // Determine input type based on key patterns
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
        if (isNumber) {
            return 'number';
        }
        if (isShortText) {
            return 'short';
        }
        return 'medium';
    })();

    return (
        <div className={`ai-setting-card ${hasChanges ? 'has-changes' : ''} ai-card-${inputType}`}>
            <div className="ai-setting-header">
                <div className="ai-setting-info">
                    <h4 className="ai-setting-title">{getSettingLabel(setting.settingKey)}</h4>
                    <p className="ai-setting-description">{setting.description}</p>
                </div>
                <div className="ai-setting-actions">
                    {hasChanges && (
                        <>
                            <button className="ai-btn ai-btn-secondary" onClick={handleUndo} title="Hoàn tác">
                                <Undo2 size={16} />
                            </button>
                            <button className="ai-btn ai-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu
                            </button>
                        </>
                    )}
                    {!hasChanges && (
                        <button className="ai-btn ai-btn-ghost" onClick={handleUndo} title="Reset">
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>

            {AVAILABLE_PLACEHOLDERS[setting.settingKey] && (
                <PlaceholderHelper settingKey={setting.settingKey} onInsert={insertPlaceholder} />
            )}

            {/* Render appropriate input based on type */}
            {inputType === 'number' ? (
                <div className="ai-input-row">
                    <input
                        type="number"
                        className="ai-setting-input ai-input-number"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        step="0.1"
                    />
                    <span className="ai-input-unit">
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
                    className="ai-setting-input ai-input-short"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="Nhập giá trị..."
                />
            ) : (
                <textarea
                    className="ai-setting-textarea"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    rows={inputType === 'long' ? 8 : 3}
                    placeholder="Nhập giá trị..."
                />
            )}

            <div className="ai-setting-meta">
                <span className="ai-setting-key">{setting.settingKey}</span>
                {inputType !== 'number' && <span className="ai-setting-char-count">{value.length} chars</span>}
                {setting.updatedAt && (
                    <span className="ai-setting-updated">
                        Cập nhật: {formatDateTimeVN(setting.updatedAt)}
                    </span>
                )}
            </div>
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
        <div className="ai-setting-card ai-setting-toggle-card">
            <div className="ai-setting-toggle-content">
                <div className="ai-setting-info">
                    <h4 className="ai-setting-title">{getSettingLabel(setting.settingKey)}</h4>
                    <p className="ai-setting-description">{setting.description}</p>
                </div>
                <button
                    className={`ai-toggle-switch ${isEnabled ? 'enabled' : ''}`}
                    onClick={handleToggle}
                    disabled={saving}
                >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                </button>
            </div>
            <div className="ai-setting-meta">
                <span className="ai-setting-key">{setting.settingKey}</span>
                <span className={`ai-toggle-status ${isEnabled ? 'enabled' : 'disabled'}`}>
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
        'ai_student_context_template': 'Template SV',
        'ai_student_context_enabled': 'Hiển thị Info SV',
        'ai_citation_format': 'Format trích dẫn',
        'ai_citation_enabled': 'Bật trích dẫn',
        'ai_citation_instruction': 'Hướng dẫn trích dẫn',
        'ai_rag_semester_filter_enabled': 'Lọc theo kỳ',
        'ai_rag_specialization_filter_enabled': 'Lọc chuyên ngành',
        'ai_specialization_start_semester': 'Kỳ bắt đầu',
        'ai_rag_hybrid_fallback_enabled': 'Hybrid fallback',
        'ai_rag_out_of_semester_note': 'Note ngoài kỳ',
        'ai_rag_similarity_threshold': 'Similarity threshold',
        'ai_youtube_enabled': 'YouTube videos',
        'ai_youtube_max_results': 'Max videos',
        'ai_youtube_keywords': 'Search keywords',
        'ai_youtube_exclude_keywords': 'Exclude keywords',
        'ai_slide_source_format': 'Slide source format',
        'ai_quiz_generation_prompt': 'Quiz Prompt',
        'ai_mindmap_generation_prompt': 'Mindmap Prompt',
        'ai_flashcard_generation_prompt': 'Flashcard Prompt',
        'ai_report_generation_prompt': 'Report Prompt',
        'ai_rag_diversity_enabled': 'Diversity ranking',
        'ai_rag_top_k': 'Top K chunks',
        'ai_rag_max_chunks_per_doc': 'Max chunks/doc',
        'ai_specialization_context_enabled': 'Specialization context',
        'ai_specialization_prompt_template': 'Specialization template',
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
            // Put in RAG category as default
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

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const loadSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getAiSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load AI settings:', error);
            toast.error('Không thể tải cài đặt AI');
        } finally {
            setIsLoading(false);
        }
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

    const scrollToSection = (categoryId: string) => {
        setActiveCategory(categoryId);
        const section = sectionRefs.current[categoryId];
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

    if (isLoading) {
        return (
            <div className="ai-settings-page">
                <div className="ai-loading" style={{ flex: 1 }}>
                    <Loader2 size={48} />
                    <p>Đang tải cài đặt AI...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-settings-page">
            {/* Sidebar */}
            <aside className="ai-settings-sidebar">
                <div className="ai-sidebar-header">
                    <div className="ai-sidebar-logo">
                        <Bot />
                        <h1>AI Settings</h1>
                    </div>
                    <p className="ai-sidebar-subtitle">Quản lý AI prompts</p>
                </div>

                <nav className="ai-sidebar-nav">
                    {CATEGORIES.map(cat => {
                        const count = categorizedSettings.get(cat.id)?.length || 0;
                        return (
                            <button
                                key={cat.id}
                                className={`ai-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => scrollToSection(cat.id)}
                            >
                                {cat.icon}
                                <div className="ai-nav-item-text">
                                    <div className="ai-nav-item-label">{cat.name}</div>
                                    <div className="ai-nav-item-count">{cat.description}</div>
                                </div>
                                {count > 0 && <span className="ai-nav-item-badge">{count}</span>}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ai-settings-content">
                <header className="ai-content-header">
                    <h1 className="ai-content-title">Cấu hình AI Settings</h1>
                    <div className="ai-header-actions">
                        <div className="ai-search-box">
                            <Search />
                            <input
                                type="text"
                                placeholder="Tìm kiếm settings..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="ai-refresh-btn" onClick={loadSettings}>
                            <RefreshCw size={18} />
                            Làm mới
                        </button>
                    </div>
                </header>

                {settings.length === 0 ? (
                    <div className="ai-empty-state">
                        <AlertTriangle size={48} />
                        <h3>Chưa có cài đặt AI</h3>
                        <p>Vui lòng chạy seed script</p>
                    </div>
                ) : (
                    <>
                        {CATEGORIES.map(cat => {
                            const items = categorizedSettings.get(cat.id) || [];
                            if (items.length === 0 && searchQuery) return null;

                            return (
                                <section
                                    key={cat.id}
                                    className="ai-settings-section"
                                    ref={(el) => { sectionRefs.current[cat.id] = el; }}
                                >
                                    <div className="ai-section-header">
                                        <div className="ai-section-icon">{cat.icon}</div>
                                        <h2 className="ai-section-title">{cat.name}</h2>
                                        <span className="ai-section-count">{items.length} settings</span>
                                    </div>

                                    <div className="ai-settings-grid">
                                        {items.map(setting => {
                                            const CardComponent = setting.settingType === 'boolean'
                                                ? ToggleSettingCard
                                                : TextSettingCard;
                                            return (
                                                <CardComponent
                                                    key={setting.settingKey}
                                                    setting={setting}
                                                    onSave={handleSave}
                                                    saving={savingKey === setting.settingKey}
                                                />
                                            );
                                        })}
                                        {items.length === 0 && (
                                            <div className="ai-empty-state" style={{ height: 150 }}>
                                                <Settings size={32} />
                                                <p>Chưa có settings trong mục này</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </>
                )}
            </main>
        </div>
    );
}
