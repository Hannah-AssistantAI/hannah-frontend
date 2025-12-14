/**
 * SyllabusImportButton Component
 * 
 * A button that allows importing syllabus data from FLM HTML file.
 * Can be used in both Create and Edit course forms to auto-fill fields.
 * 
 * Usage:
 * <SyllabusImportButton onImport={(data) => setFormData(data)} />
 */

import { useState, useRef } from 'react';
import { Upload, FileText, Loader, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types for parsed syllabus data
export interface ParsedSyllabusData {
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
    minAvgMarkToPass: number;
    decisionNo: string;
    assessments: any[];
    sessions: any[];
    learningOutcomes: any[];
    materials: any[];
}

interface SyllabusImportButtonProps {
    onImport: (data: {
        code: string;
        name: string;
        credits: number;
        description: string;
        prerequisites: string[];
        learningOutcomes?: string; // JSON string with full CLO data
        degreeLevel: string;
        timeAllocation: string;
        tools: string;
        scoringScale: string;
        decisionNo: string;
        minAvgMarkToPass: number;
        // Syllabus JSON fields
        assessments?: string;
        sessions?: string;
        syllabusMaterials?: string;
        studentTasks?: string;
    }) => void;
    disabled?: boolean;
}

// Import summary to track which fields were successfully filled
interface ImportSummary {
    filled: string[];
    needsManualInput: string[];
}

export default function SyllabusImportButton({ onImport, disabled }: SyllabusImportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedSyllabusData | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
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
            setShowSummary(false);
            setImportSummary(null);

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

    const handleApply = () => {
        if (!parsedData) return;

        // Track which fields were filled from HTML parsing
        const filled: string[] = [];
        const needsManualInput: string[] = [];

        // Check each field and categorize
        if (parsedData.subjectCode) filled.push('Subject Code');
        else needsManualInput.push('Subject Code');

        if (parsedData.syllabusName) filled.push('Course Name');
        else needsManualInput.push('Course Name');

        if (parsedData.noCredit) filled.push('Credits');
        else needsManualInput.push('Credits');

        if (parsedData.description) filled.push('Description');
        else needsManualInput.push('Description');

        if (parsedData.preRequisite) filled.push('Prerequisites');

        if (parsedData.learningOutcomes?.length) filled.push(`Learning Outcomes (${parsedData.learningOutcomes.length})`);

        if (parsedData.degreeLevel) filled.push('Degree Level');

        if (parsedData.timeAllocation) filled.push('Time Allocation');

        if (parsedData.tools) filled.push('Tools');

        if (parsedData.scoringScale) filled.push('Scoring Scale');

        if (parsedData.decisionNo) filled.push('Decision No.');

        if (parsedData.minAvgMarkToPass) filled.push('Min. Mark to Pass');

        if (parsedData.assessments?.length) filled.push(`Assessments (${parsedData.assessments.length})`);

        if (parsedData.sessions?.length) filled.push(`Sessions (${parsedData.sessions.length})`);

        if (parsedData.materials?.length) filled.push(`Materials (${parsedData.materials.length})`);

        if (parsedData.studentTasks) filled.push('Student Tasks');

        // Note: Semester is already selected by admin, not parsed from HTML

        // Create import summary
        const summary: ImportSummary = {
            filled,
            needsManualInput,
        };
        setImportSummary(summary);

        // Map parsed data to form fields (excluding semester - admin already selected it)
        const formFields = {
            code: parsedData.subjectCode || '',
            name: parsedData.syllabusName || '',
            credits: parsedData.noCredit || 3,
            description: parsedData.description || '',
            prerequisites: parsedData.preRequisite ? parsedData.preRequisite.split(',').map(s => s.trim()).filter(Boolean) : [],
            learningOutcomes: parsedData.learningOutcomes ? JSON.stringify(parsedData.learningOutcomes) : undefined,
            degreeLevel: parsedData.degreeLevel || 'Undergraduate',
            timeAllocation: parsedData.timeAllocation || '',
            tools: parsedData.tools || '',
            scoringScale: parsedData.scoringScale ? `${parsedData.scoringScale}-point Scale` : '10-point Scale',
            decisionNo: parsedData.decisionNo || '',
            minAvgMarkToPass: parsedData.minAvgMarkToPass || 5.0,
            // JSON serialized fields
            assessments: parsedData.assessments ? JSON.stringify(parsedData.assessments) : undefined,
            sessions: parsedData.sessions ? JSON.stringify(parsedData.sessions) : undefined,
            syllabusMaterials: parsedData.materials ? JSON.stringify(parsedData.materials) : undefined,
            studentTasks: parsedData.studentTasks || undefined,
        };

        console.log('📊 Import Summary:', summary);
        console.log('📥 Form fields to apply:', formFields);

        onImport(formFields);

        // Show summary view
        setShowPreview(false);
        setShowSummary(true);
    };

    const handleClose = () => {
        setParsedData(null);
        setShowPreview(false);
        setShowSummary(false);
        setImportSummary(null);
        setError(null);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setParsedData(null);
        setShowPreview(false);
        setShowSummary(false);
        setImportSummary(null);
        setError(null);
        setIsOpen(false);
    };

    return (
        <>
            {/* Import Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.6 : 1,
                }}
                onMouseOver={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#7c3aed')}
                onMouseOut={(e) => !disabled && (e.currentTarget.style.backgroundColor = '#8b5cf6')}
                title="Import from FLM HTML file"
            >
                <Upload size={16} />
                Import from HTML
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
                            maxWidth: showPreview || showSummary ? '800px' : '500px',
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
                                {showSummary ? '✅ Import Complete' : showPreview ? 'Preview & Auto-Fill Form' : 'Import Syllabus from HTML'}
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
                            {showSummary && importSummary ? (
                                /* Import Summary Section */
                                <div>
                                    {/* Success Header */}
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: '#f0fdf4',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        border: '1px solid #86efac',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Check size={20} style={{ color: '#16a34a' }} />
                                            <span style={{ fontWeight: 600, color: '#166534', fontSize: '1rem' }}>
                                                Syllabus Data Imported Successfully!
                                            </span>
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#475569' }}>
                                            The form has been auto-filled with data from the HTML file. Please review the fields before saving.
                                        </p>
                                    </div>

                                    {/* Fields Summary */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        {/* Successfully Filled Fields */}
                                        <div>
                                            <h4 style={{
                                                margin: '0 0 0.75rem 0',
                                                fontSize: '0.875rem',
                                                color: '#16a34a',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                            }}>
                                                <Check size={16} />
                                                Imported Fields ({importSummary.filled.length})
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                            }}>
                                                {importSummary.filled.map((field, idx) => (
                                                    <span key={idx} style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: '#dcfce7',
                                                        color: '#166534',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                    }}>
                                                        ✓ {field}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fields Needing Manual Input */}
                                        <div>
                                            <h4 style={{
                                                margin: '0 0 0.75rem 0',
                                                fontSize: '0.875rem',
                                                color: importSummary.needsManualInput.length > 0 ? '#d97706' : '#16a34a',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                            }}>
                                                {importSummary.needsManualInput.length > 0 ? (
                                                    <AlertCircle size={16} />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                                {importSummary.needsManualInput.length > 0
                                                    ? `Missing Fields (${importSummary.needsManualInput.length})`
                                                    : 'All Fields Imported!'
                                                }
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem',
                                            }}>
                                                {importSummary.needsManualInput.length > 0 ? (
                                                    importSummary.needsManualInput.map((field, idx) => (
                                                        <span key={idx} style={{
                                                            padding: '0.25rem 0.75rem',
                                                            backgroundColor: '#fef3c7',
                                                            color: '#92400e',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500,
                                                        }}>
                                                            ⚠ {field}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                        🎉 All fields from the syllabus have been imported!
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tip */}
                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#eff6ff',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        color: '#1e40af',
                                    }}>
                                        💡 <strong>Tip:</strong> Review the form fields and make any necessary adjustments before saving the course.
                                    </div>
                                </div>
                            ) : showPreview ? (
                                /* Preview Section */
                                <div>
                                    {/* Subject Info Cards */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: '1rem',
                                        marginBottom: '1.5rem',
                                    }}>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Subject Code</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: '#15803d' }}>
                                                {parsedData?.subjectCode}
                                            </p>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Credits</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: '#1d4ed8' }}>
                                                {parsedData?.noCredit}
                                            </p>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#fdf4ff', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Degree Level</p>
                                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: '#a21caf' }}>
                                                {parsedData?.degreeLevel}
                                            </p>
                                        </div>
                                    </div>

                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#1e293b' }}>
                                        Course Name
                                    </h4>
                                    <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.875rem' }}>
                                        {parsedData?.syllabusName}
                                    </p>

                                    {/* Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                    }}>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                                                {parsedData?.assessments?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Assessments</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#a855f7' }}>
                                                {parsedData?.sessions?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Sessions</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>
                                                {parsedData?.learningOutcomes?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>CLOs</p>
                                        </div>
                                        <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                                                {parsedData?.materials?.length || 0}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>Materials</p>
                                        </div>
                                    </div>

                                    {/* Prerequisites */}
                                    {parsedData?.preRequisite && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
                                                Prerequisites
                                            </p>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: '#fef3c7',
                                                color: '#92400e',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                            }}>
                                                {parsedData.preRequisite}
                                            </span>
                                        </div>
                                    )}

                                    {/* Description Preview */}
                                    {parsedData?.description && (
                                        <div>
                                            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
                                                Description (truncated)
                                            </p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                color: '#475569',
                                                maxHeight: '3rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {parsedData.description.substring(0, 200)}...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Upload Section */
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '12px',
                                        padding: '2.5rem 2rem',
                                        backgroundColor: '#f9fafb',
                                        marginBottom: '1rem',
                                    }}>
                                        <FileText size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                                            Upload FLM Syllabus HTML
                                        </h4>
                                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                            Save the FLM syllabus page as HTML (Ctrl+S → Webpage, Complete)
                                        </p>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".html,.htm"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                            id="syllabus-import-input"
                                        />
                                        <label
                                            htmlFor="syllabus-import-input"
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
                                        The form fields will be auto-filled with syllabus data
                                    </p>
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
                                    style={{
                                        padding: '0.625rem 1.25rem',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <Check size={16} />
                                    Fill Form with Data
                                </button>
                            </div>
                        )}
                        {showSummary && (
                            <div style={{
                                padding: '1rem 1.5rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                backgroundColor: '#f9fafb',
                            }}>
                                <button
                                    onClick={handleClose}
                                    style={{
                                        padding: '0.625rem 1.5rem',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <Check size={16} />
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
