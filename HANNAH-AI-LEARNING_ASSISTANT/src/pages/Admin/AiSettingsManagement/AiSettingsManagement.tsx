/**
 * AI Settings Management - Enhanced Edition
 * Admin interface for managing AI prompt settings and behavior
 * Phase 5: Admin Prompt Management
 * 
 * Features:
 * - Collapsible groups
 * - Undo changes
 * - Character count
 * - Placeholder helper
 * - Reset to default
 */

import React, { useState, useEffect, useCallback } from 'react';
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
    FileText,
    ToggleLeft,
    ToggleRight,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Undo2,
    Info,
    Copy,
    RotateCcw,
    Youtube,
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
    defaultValue?: string;
}

// ============================================================================
// PLACEHOLDERS - Available template variables
// ============================================================================
const AVAILABLE_PLACEHOLDERS: Record<string, { placeholder: string; description: string }[]> = {
    'ai_student_context_template': [
        { placeholder: '{semester}', description: 'Kỳ học hiện tại (1-9)' },
        { placeholder: '{specialization}', description: 'Mã chuyên ngành (SE, AI, IS...)' },
        { placeholder: '{specialty_name}', description: 'Tên chuyên ngành đầy đủ' },
    ],
    'ai_citation_format': [
        { placeholder: '{content}', description: 'Nội dung trích dẫn' },
        { placeholder: '{source}', description: 'Tên file nguồn' },
        { placeholder: '{page}', description: 'Số trang' },
    ],
};

// ============================================================================
// DEFAULT VALUES - For reset functionality
// ============================================================================
const DEFAULT_VALUES: Record<string, string> = {
    'ai_system_prompt': `Bạn là Hannah AI, trợ lý học tập thông minh của trường FPT University.

**Nhiệm vụ của bạn:**
1. Trả lời câu hỏi về môn học dựa trên tài liệu đã upload
2. Hướng dẫn lộ trình học tập phù hợp với từng sinh viên
3. Giải thích khái niệm rõ ràng, có ví dụ cụ thể
4. Tạo quiz, mindmap, flashcard khi được yêu cầu

**Nguyên tắc:**
- Luôn trích dẫn nguồn khi trả lời từ tài liệu
- Không đưa ra thông tin không có trong tài liệu
- Sử dụng ngôn ngữ phù hợp với sinh viên Việt Nam
- Trả lời bằng ngôn ngữ mà sinh viên sử dụng (Việt/Anh)`,
    'ai_student_context_template': `**Thông tin sinh viên:**
- Kỳ học hiện tại: HK{semester}
- Chuyên ngành: {specialization}
- Chuyên ngành hẹp: {specialty_name}`,
    'ai_citation_format': '> "{content}" - [{source}, trang {page}]',
    'ai_rag_out_of_semester_note': '⚠️ **Lưu ý:** Nội dung này thuộc kỳ học cao hơn kỳ hiện tại của bạn. Bạn sẽ được học chi tiết khi lên kỳ đó.',
    'ai_rag_similarity_threshold': '0.5',
    'ai_specialization_start_semester': '5',
};

// ============================================================================
// PLACEHOLDER HELPER COMPONENT
// ============================================================================
const PlaceholderHelper: React.FC<{ settingKey: string; onInsert: (placeholder: string) => void }> = ({ settingKey, onInsert }) => {
    const placeholders = AVAILABLE_PLACEHOLDERS[settingKey];
    if (!placeholders) return null;

    return (
        <div className="placeholder-helper">
            <div className="placeholder-helper-header">
                <Info size={14} />
                <span>Placeholders có sẵn:</span>
            </div>
            <div className="placeholder-list">
                {placeholders.map(({ placeholder, description }) => (
                    <button
                        key={placeholder}
                        className="placeholder-chip"
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
// TEXT SETTING CARD - Enhanced
// ============================================================================
const TextSettingCard: React.FC<SettingCardProps> = ({ setting, onSave, saving }) => {
    const [value, setValue] = useState(setting.settingValue);
    const [hasChanges, setHasChanges] = useState(false);
    const [showPlaceholders, setShowPlaceholders] = useState(false);

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

    const handleReset = () => {
        const defaultVal = DEFAULT_VALUES[setting.settingKey];
        if (defaultVal) {
            setValue(defaultVal);
            setHasChanges(defaultVal !== setting.settingValue);
            toast.success('Đã khôi phục về mặc định');
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        setValue(prev => prev + placeholder);
        setHasChanges(true);
        toast.success(`Đã thêm ${placeholder}`);
    };

    const isLongText = setting.settingKey === 'ai_system_prompt' ||
        setting.settingKey === 'ai_response_guidelines';

    return (
        <div className={`ai-setting-card ${hasChanges ? 'has-changes' : ''}`}>
            <div className="ai-setting-header">
                <div className="ai-setting-info">
                    <h4 className="ai-setting-title">{getSettingLabel(setting.settingKey)}</h4>
                    <p className="ai-setting-description">{setting.description}</p>
                </div>
                <div className="ai-setting-actions">
                    {hasChanges && (
                        <>
                            <button
                                className="ai-setting-btn secondary"
                                onClick={handleUndo}
                                title="Hoàn tác"
                            >
                                <Undo2 size={16} />
                            </button>
                            <button
                                className="ai-setting-btn primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu
                            </button>
                        </>
                    )}
                    {DEFAULT_VALUES[setting.settingKey] && !hasChanges && (
                        <button
                            className="ai-setting-btn ghost"
                            onClick={handleReset}
                            title="Khôi phục mặc định"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Placeholder Helper */}
            {AVAILABLE_PLACEHOLDERS[setting.settingKey] && (
                <PlaceholderHelper
                    settingKey={setting.settingKey}
                    onInsert={insertPlaceholder}
                />
            )}

            <textarea
                className="ai-setting-textarea"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                rows={isLongText ? 12 : 6}
                placeholder="Nhập giá trị..."
            />

            <div className="ai-setting-meta">
                <span className="ai-setting-key">{setting.settingKey}</span>
                <span className="ai-setting-char-count">
                    {value.length} ký tự
                </span>
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
                    className={`ai-setting-toggle ${isEnabled ? 'enabled' : ''}`}
                    onClick={handleToggle}
                    disabled={saving}
                >
                    {saving ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : isEnabled ? (
                        <ToggleRight size={32} />
                    ) : (
                        <ToggleLeft size={32} />
                    )}
                </button>
            </div>
            <div className="ai-setting-meta">
                <span className="ai-setting-key">{setting.settingKey}</span>
                <span className={`ai-setting-status ${isEnabled ? 'enabled' : 'disabled'}`}>
                    {isEnabled ? <><CheckCircle size={14} /> Đang bật</> : <><AlertTriangle size={14} /> Đang tắt</>}
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
        'ai_system_prompt': 'System Prompt (Prompt chính)',
        'ai_student_context_template': 'Template thông tin sinh viên',
        'ai_student_context_enabled': 'Hiển thị thông tin sinh viên',
        'ai_citation_format': 'Format trích dẫn nguồn',
        'ai_citation_enabled': 'Bật trích dẫn nguồn',
        'ai_citation_instruction': 'Hướng dẫn trích dẫn',
        'ai_rag_semester_filter_enabled': 'Lọc theo kỳ học sinh viên',
        'ai_rag_specialization_filter_enabled': 'Lọc theo chuyên ngành',
        'ai_specialization_start_semester': 'Kỳ bắt đầu phân nhánh',
        'ai_response_guidelines': 'Hướng dẫn format response',
        'ai_rag_hybrid_fallback_enabled': 'Bật tìm mở rộng (Hybrid)',
        'ai_rag_out_of_semester_note': 'Thông báo nội dung ngoài kỳ học',
        'ai_rag_similarity_threshold': 'Ngưỡng similarity tối thiểu',
        // YouTube Settings
        'ai_youtube_enabled': 'Bật/tắt YouTube videos',
        'ai_youtube_max_results': 'Số video tối đa hiển thị',
        'ai_youtube_keywords': 'Keywords thêm vào tìm kiếm',
        'ai_youtube_exclude_keywords': 'Keywords loại bỏ video',
    };
    return labels[key] || key;
}

function groupSettings(settings: SystemSetting[]): Record<string, SystemSetting[]> {
    const groups: Record<string, SystemSetting[]> = {
        'Prompt chính': [],
        'Thông tin sinh viên': [],
        'Trích dẫn nguồn': [],
        'RAG Filtering': [],
        'YouTube Settings': [],
    };

    settings.forEach(setting => {
        if (setting.settingKey.includes('system_prompt') || setting.settingKey.includes('response_guidelines')) {
            groups['Prompt chính'].push(setting);
        } else if (setting.settingKey.includes('student_context')) {
            groups['Thông tin sinh viên'].push(setting);
        } else if (setting.settingKey.includes('citation')) {
            groups['Trích dẫn nguồn'].push(setting);
        } else if (setting.settingKey.includes('youtube')) {
            groups['YouTube Settings'].push(setting);
        } else if (setting.settingKey.includes('rag') || setting.settingKey.includes('specialization')) {
            groups['RAG Filtering'].push(setting);
        }
    });

    return groups;
}

function getGroupIcon(group: string) {
    const icons: Record<string, React.ReactNode> = {
        'Prompt chính': <MessageSquare size={20} />,
        'Thông tin sinh viên': <User size={20} />,
        'Trích dẫn nguồn': <Quote size={20} />,
        'RAG Filtering': <Filter size={20} />,
        'YouTube Settings': <Youtube size={20} />,
    };
    return icons[group] || <FileText size={20} />;
}

function getGroupDescription(group: string): string {
    const descriptions: Record<string, string> = {
        'Prompt chính': 'Cấu hình personality và behavior chính của AI',
        'Thông tin sinh viên': 'Hiển thị thông tin cá nhân hóa cho sinh viên',
        'Trích dẫn nguồn': 'Cách AI trích dẫn tài liệu trong câu trả lời',
        'RAG Filtering': 'Lọc tài liệu dựa trên profile sinh viên',
        'YouTube Settings': 'Cấu hình tìm kiếm và hiển thị video YouTube liên quan',
    };
    return descriptions[group] || '';
}

// ============================================================================
// COLLAPSIBLE GROUP COMPONENT
// ============================================================================
const SettingsGroup: React.FC<{
    group: string;
    items: SystemSetting[];
    onSave: (key: string, value: string) => Promise<void>;
    savingKey: string | null;
    defaultExpanded?: boolean;
}> = ({ group, items, onSave, savingKey, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    if (items.length === 0) return null;

    return (
        <div className={`ai-settings-group ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <button
                className="ai-settings-group-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="group-header-left">
                    {getGroupIcon(group)}
                    <div className="group-header-text">
                        <h2>{group}</h2>
                        <span className="group-description">{getGroupDescription(group)}</span>
                    </div>
                </div>
                <div className="group-header-right">
                    <span className="group-count">{items.length} settings</span>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </button>

            {isExpanded && (
                <div className="ai-settings-group-content">
                    {items.map(setting => {
                        const CardComponent = setting.settingType === 'boolean'
                            ? ToggleSettingCard
                            : TextSettingCard;
                        return (
                            <CardComponent
                                key={setting.settingKey}
                                setting={setting}
                                onSave={onSave}
                                saving={savingKey === setting.settingKey}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AiSettingsManagement() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

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

    const groupedSettings = groupSettings(settings);

    if (isLoading) {
        return (
            <div className="ai-settings-loading">
                <Loader2 size={48} className="animate-spin" />
                <p>Đang tải cài đặt AI...</p>
            </div>
        );
    }

    return (
        <div className="ai-settings-container">
            <div className="ai-settings-header">
                <div className="ai-settings-title-section">
                    <Bot size={32} />
                    <div>
                        <h1>Quản lý AI Prompt</h1>
                        <p>Cấu hình behavior và response của AI mà không cần sửa code</p>
                    </div>
                </div>
                <button className="ai-settings-refresh-btn" onClick={loadSettings}>
                    <RefreshCw size={18} />
                    Làm mới
                </button>
            </div>

            {settings.length === 0 ? (
                <div className="ai-settings-empty">
                    <AlertTriangle size={48} />
                    <h3>Chưa có cài đặt AI</h3>
                    <p>Vui lòng chạy migration script để seed default settings</p>
                    <code>20241213_SeedAiPromptSettings.sql</code>
                </div>
            ) : (
                <div className="ai-settings-groups">
                    {Object.entries(groupedSettings).map(([group, items]) => (
                        <SettingsGroup
                            key={group}
                            group={group}
                            items={items}
                            onSave={handleSave}
                            savingKey={savingKey}
                            defaultExpanded={group === 'Prompt chính'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
