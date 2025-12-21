/**
 * SyllabusImporter Component
 * 
 * Allows admin to import syllabus data from FLM HTML export.
 * 
 * Usage:
 * 1. Save FLM syllabus page as HTML (Ctrl+S -> Webpage, Complete)
 * 2. Click "Import from HTML" button
 * 3. Select the HTML file
 * 4. Review parsed data
 * 5. Click "Apply" to update subject
 */

import { useState, useRef } from 'react';
import { Upload, FileText, Check, X, Loader, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
interface ParsedSyllabusData {
    subjectCode: string;
    syllabusName: string;
    noCredit: number;
    description: string;
    preRequisite: string;
    degreeLevel: string;
    timeAllocation: string;
    tools: string;
    scoringScale: string;
    studentTasks: string;
    assessments: AssessmentItem[];
    sessions: SessionItem[];
    learningOutcomes: CLOItem[];
    materials: MaterialItem[];
}

interface AssessmentItem {
    type: string;
    category: string;
    weight: number;
    duration: string;
    clo: string;
    questionType?: string;
}

interface SessionItem {
    session: number;
    topic: string;
    type: string;
    lo: string;
    materials: string;
}

interface CLOItem {
    number: string;
    name: string;
    details: string;
}

interface MaterialItem {
    description: string;
    author: string;
    url?: string;
}

interface SyllabusImporterProps {
    subjectId: number;
    subjectCode: string;
    onImportSuccess?: () => void;
}

export default function SyllabusImporter({
    subjectId,
    subjectCode,
    onImportSuccess
}: SyllabusImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedSyllabusData | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            toast.error('Please select an HTML file (.html or .htm)');
            return;
        }

        try {
            setParsing(true);
            setError(null);

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Call Python API to parse HTML
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/v1/syllabus/parse', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to parse HTML file');
            }

            const result = await response.json();

            if (result.success) {
                setParsedData(result.data);
                setShowPreview(true);
                toast.success(`Parsed syllabus: ${result.subject_code}`);
            } else {
                throw new Error(result.message || 'Parse failed');
            }
        } catch (err: any) {
            console.error('Error parsing syllabus:', err);
            setError(err.message || 'Failed to parse HTML file');
            toast.error(err.message || 'Failed to parse HTML file');
        } finally {
            setParsing(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleApply = async () => {
        if (!parsedData) return;

        try {
            setSaving(true);

            // Format learningOutcomes: include details for richer context
            // Format: "CLO1: Name - Details" or "CLO1: Name" if no details
            const formattedLOs = (parsedData.learningOutcomes || []).map(clo => {
                const base = `${clo.number}: ${clo.name}`;
                return clo.details && clo.details !== clo.name
                    ? `${base} - ${clo.details}`
                    : base;
            });

            console.log('📚 Syllabus Import - Learning Outcomes:', {
                raw: parsedData.learningOutcomes,
                formatted: formattedLOs,
                count: formattedLOs.length
            });

            // Call .NET API to update subject with syllabus data
            const token = localStorage.getItem('access_token');
            const requestBody = {
                description: parsedData.description,
                credits: parsedData.noCredit,
                prerequisites: parsedData.preRequisite ? [parsedData.preRequisite] : [],
                learningOutcomes: formattedLOs,
                degreeLevel: parsedData.degreeLevel,
                timeAllocation: parsedData.timeAllocation,
                tools: parsedData.tools,
                scoringScale: parsedData.scoringScale,
                studentTasks: parsedData.studentTasks,
                assessments: JSON.stringify(parsedData.assessments || []),
                sessions: JSON.stringify(parsedData.sessions || []),
                syllabusMaterials: JSON.stringify(parsedData.materials || []),
            };

            console.log('📤 Sending to API:', requestBody);

            const response = await fetch(`/api/subjects/${subjectId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error('Failed to update subject');
            }

            toast.success('Syllabus data imported successfully!');
            setShowPreview(false);
            setParsedData(null);
            setIsOpen(false);
            onImportSuccess?.();
        } catch (err: any) {
            console.error('Error saving syllabus:', err);
            toast.error(err.message || 'Failed to save syllabus data');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setParsedData(null);
        setShowPreview(false);
        setError(null);
        setIsOpen(false);
    };

    return (
        <>
            {/* Import Button */}
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#8b5cf6')}
            >
                <Upload size={16} />
                Import Syllabus
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCancel();
                    }}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            width: '100%',
                            maxWidth: showPreview ? '900px' : '500px',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                                {showPreview ? 'Preview Syllabus Data' : 'Import Syllabus from HTML'}
                            </h3>
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: '0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '1.5rem', overflow: 'auto', flex: 1 }}>
                            {!showPreview ? (
                                /* Upload Section */
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '12px',
                                        padding: '3rem 2rem',
                                        backgroundColor: '#f9fafb',
                                        marginBottom: '1rem',
                                    }}>
                                        <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                                            Upload FLM Syllabus HTML
                                        </h4>
                                        <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                            Save the FLM syllabus page as HTML (Ctrl+S → Webpage, Complete)
                                        </p>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".html,.htm"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                            id="syllabus-file-input"
                                        />
                                        <label
                                            htmlFor="syllabus-file-input"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                cursor: parsing ? 'wait' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                opacity: parsing ? 0.7 : 1,
                                            }}
                                        >
                                            {parsing ? (
                                                <>
                                                    <Loader size={18} className="animate-spin" />
                                                    Parsing...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={18} />
                                                    Choose HTML File
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    {error && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#fef2f2',
                                            color: '#dc2626',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                        }}>
                                            <AlertCircle size={18} />
                                            {error}
                                        </div>
                                    )}

                                    <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                        Subject: <strong>{subjectCode}</strong>
                                    </p>
                                </div>
                            ) : (
                                /* Preview Section */
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem',
                                        marginBottom: '1.5rem',
                                    }}>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Subject Code</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                                                {parsedData?.subjectCode}
                                            </p>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Credits</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                                                {parsedData?.noCredit}
                                            </p>
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#1e293b' }}>
                                        Syllabus Name
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0', color: '#475569' }}>
                                        {parsedData?.syllabusName}
                                    </p>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '1rem',
                                        marginBottom: '1rem',
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#eff6ff',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#1d4ed8' }}>
                                                {parsedData?.assessments?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#1d4ed8' }}>
                                                Assessments
                                            </p>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#fdf4ff',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#a21caf' }}>
                                                {parsedData?.sessions?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#a21caf' }}>
                                                Sessions
                                            </p>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#f0fdf4',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#15803d' }}>
                                                {parsedData?.learningOutcomes?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#15803d' }}>
                                                CLOs
                                            </p>
                                        </div>
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#fef3c7',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                        }}>
                                            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#b45309' }}>
                                                {parsedData?.materials?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#b45309' }}>
                                                Materials
                                            </p>
                                        </div>
                                    </div>

                                    {/* Assessments Preview */}
                                    {parsedData?.assessments && parsedData.assessments.length > 0 && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>Assessments</h4>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {parsedData.assessments.map((a, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            backgroundColor: a.type.includes('Exam') ? '#fee2e2' : '#e0e7ff',
                                                            color: a.type.includes('Exam') ? '#dc2626' : '#4338ca',
                                                            borderRadius: '999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {a.type}: {a.weight}%
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {showPreview && (
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                backgroundColor: '#f9fafb',
                            }}>
                                <button
                                    onClick={handleCancel}
                                    style={{
                                        padding: '0.625rem 1.25rem',
                                        backgroundColor: 'transparent',
                                        color: '#4b5563',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={saving}
                                    style={{
                                        padding: '0.625rem 1.25rem',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: saving ? 'wait' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: saving ? 0.7 : 1,
                                    }}
                                >
                                    {saving ? (
                                        <>
                                            <Loader size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Apply to Subject
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
