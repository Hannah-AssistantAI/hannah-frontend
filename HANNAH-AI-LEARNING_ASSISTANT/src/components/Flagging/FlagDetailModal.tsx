import React, { useState, useEffect } from 'react';
import { conversationService } from '../../service/conversationService';
import { flaggingApiService } from '../../service/flaggingApi';
import { documentService } from '../../service/documentService';
import type { FlaggedItem } from '../../service/flaggingApi';
import type { Message } from '../../service/conversationService';

interface FlagDetailModalProps {
    isOpen: boolean;
    item: FlaggedItem;
    onClose: () => void;
    onSuccess: () => void;
}

const FlagDetailModal: React.FC<FlagDetailModalProps> = ({
    isOpen,
    item,
    onClose,
    onSuccess
}) => {
    const [message, setMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');
    const [studentNotification, setStudentNotification] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && item.conversationId && item.messageId) {
            loadMessageContent();
            loadDocuments();
        }
    }, [isOpen, item]);

    const loadDocuments = async () => {
        try {
            const allDocs = await documentService.getAllDocuments({ status: 'completed' });
            // Filter for approved documents only
            const approvedDocs = allDocs.items.filter(doc => doc.approvalStatus === 'approved');
            setDocuments(approvedDocs);
        } catch (err) {
            console.error('Error loading documents:', err);
        }
    };

    const loadMessageContent = async () => {
        setLoading(true);
        try {
            // Fetch conversation to get the message
            // Use conversationOwnerId if available, otherwise fallback to flaggedByUserId (if we had it as ID) or current user (which might fail)
            // But we added conversationOwnerId to DTO.
            if (!item.conversationOwnerId) {
                setError('Cannot load conversation: Owner ID missing.');
                setLoading(false);
                return;
            }
            const conversation = await conversationService.getConversation(item.conversationId!, item.conversationOwnerId);

            // Find the specific message
            // The messageId in item is the Mongo ID (string or int depending on backend, but DTO says int?)
            // Wait, DTO says int? MessageId. But Mongo IDs are usually strings.
            // Let's check the type. In DTO it is int?. But Mongo ID is string.
            // ReviewService parses it: int.TryParse(payload.MessageIdMongo, out var mongoId)
            // So it is stored as int in SQL Server? 
            // If Mongo uses ObjectId, it cannot be parsed to int.
            // Unless Python backend uses int IDs for messages.
            // Let's assume we match by ID.

            const foundMessage = conversation.messages.find((m: any) =>
                m.messageId === item.messageId || m.messageId?.toString() === item.messageId?.toString()
            );

            if (foundMessage) {
                setMessage(foundMessage);
            } else {
                setError('Message not found in conversation.');
            }
        } catch (err) {
            console.error('Error loading message content:', err);
            setError('Failed to load message content. You may not have permission to view this conversation.');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!resolutionNote.trim()) {
            setError('Please provide a resolution note.');
            return;
        }

        setActionLoading(true);
        try {
            await flaggingApiService.resolveFlag(item.id, {
                knowledgeGapFix: resolutionNote,
                studentNotification: studentNotification,
                supplementaryDocumentId: selectedDocumentId,
                attachments: []
            });
            alert('Flag resolved successfully!');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error resolving flag:', err);
            setError(err.message || 'Failed to resolve flag');
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Flag Details</h3>
                    <button
                        onClick={onClose}
                        disabled={actionLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Flag Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Flagged By:</span>
                            <span className="ml-2 font-medium text-gray-900">{item.flaggedByName}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-2 font-medium text-gray-900">{new Date(item.flaggedAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Reason:</span>
                            <span className="ml-2 font-medium text-gray-900">{item.reason}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Priority:</span>
                            <span className={`ml-2 font-medium px-2 py-0.5 rounded text-xs ${item.priority === 'High' ? 'bg-red-100 text-red-700' :
                                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {item.priority}
                            </span>
                        </div>
                    </div>

                    {/* Message Content */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Flagged Content</h4>
                        {loading ? (
                            <div className="text-sm text-gray-500">Loading content...</div>
                        ) : message ? (
                            <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-wrap text-gray-800">{message.content}</p>
                            </div>
                        ) : (
                            <div className="text-sm text-red-500">{error || 'Content not available'}</div>
                        )}
                    </div>

                    {/* Resolution Form */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 border-t pt-4">Resolution</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resolution Note <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="Explain how you resolved this issue..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notification to Student (Optional)
                            </label>
                            <textarea
                                value={studentNotification}
                                onChange={(e) => setStudentNotification(e.target.value)}
                                placeholder="Message to send to the student..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attach Document (Optional)
                            </label>
                            <select
                                value={selectedDocumentId || ''}
                                onChange={(e) => setSelectedDocumentId(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Select a document --</option>
                                {documents.map(doc => (
                                    <option key={doc.documentId} value={doc.documentId}>
                                        {doc.title} {doc.subjectName ? `(${doc.subjectName})` : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Select a supplementary document to help the student understand
                            </p>
                        </div>
                    </div>

                    {error && !loading && !message && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleResolve}
                        disabled={actionLoading || !resolutionNote.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {actionLoading ? 'Resolving...' : 'Resolve Flag'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlagDetailModal;
