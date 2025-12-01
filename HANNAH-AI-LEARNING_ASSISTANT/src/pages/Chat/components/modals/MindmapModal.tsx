import React, { useMemo, useState } from 'react'
import { GitBranch, Maximize2, Download, Share2 } from 'lucide-react'
import MindmapViewer from '../../../../components/MindmapViewer'
import studioService, { type GetMindMapNodeDetailsResponse } from '../../../../service/studioService'

interface MindmapModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

export const MindmapModal: React.FC<MindmapModalProps> = ({ isOpen, onClose, content }) => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodeDetails, setNodeDetails] = useState<GetMindMapNodeDetailsResponse | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const mindmapData = useMemo(() => {
        if (!content?.content?.nodes) return { nodes: [], edges: [] };

        return {
            nodes: content.content.nodes,
            edges: content.content.edges || []
        };
    }, [content]);

    const handleNodeClick = async (nodeData: any) => {
        const nodeLabel = nodeData.label;
        if (selectedNode === nodeLabel) return;

        setSelectedNode(nodeLabel);

        // Use pre-loaded description if available
        if (nodeData.description) {
            setNodeDetails({
                nodeLabel: nodeLabel,
                description: nodeData.description,
                resources: [] // Resources will be loaded separately if needed
            });
            setIsLoadingDetails(false); // Don't show full loading spinner if we have description
        } else {
            setNodeDetails(null);
            setIsLoadingDetails(true);
        }

        // Always fetch full details (resources) in background
        try {
            const response = await studioService.getMindMapNodeDetails({
                conversationId: content.conversationId || 0,
                nodeLabel: nodeLabel,
                mindmapContext: content.topic
            });

            if (response && response.data) {
                // The backend returns APIResponse wrapper, so the actual content is in response.data.data
                const responseData = (response.data as any).data || response.data;

                setNodeDetails({
                    ...responseData,
                    description: responseData.description || nodeData.description || "No description available."
                });
            }
        } catch (error) {
            console.error("Failed to fetch node details:", error);
            // If we failed and didn't have a description, show error state?
            // If we had a description, we just keep showing it (resources will be empty).
            if (!nodeData.description) {
                setIsLoadingDetails(false);
            }
        } finally {
            setIsLoadingDetails(false);
        }
    };

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="mindmap-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="mindmap-modal-header">
                    <div className="mindmap-modal-title-wrapper">
                        <GitBranch size={20} color="#5f6368" />
                        <h3 className="mindmap-modal-title">{content?.title || 'Bản đồ tư duy'}</h3>
                    </div>
                    <div className="mindmap-modal-actions">
                        <button className="mindmap-action-btn" title="Mở rộng">
                            <Maximize2 size={18} />
                        </button>
                        <button className="mindmap-action-btn" title="Tải xuống">
                            <Download size={18} />
                        </button>
                        <button className="mindmap-action-btn" title="Chia sẻ">
                            <Share2 size={18} />
                        </button>
                        <button
                            className="mindmap-modal-close"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="mindmap-modal-body" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {content ? (
                            <MindmapViewer
                                data={mindmapData}
                                onNodeClick={handleNodeClick}
                            />
                        ) : (
                            <div className="mindmap-loading">
                                <p>Đang tải bản đồ tư duy...</p>
                            </div>
                        )}
                    </div>

                    {/* Node Details Side Panel */}
                    {selectedNode && (
                        <div className="mindmap-details-panel" style={{
                            width: '350px',
                            borderLeft: '1px solid #e0e0e0',
                            backgroundColor: '#fff',
                            padding: '20px',
                            overflowY: 'auto',
                            boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#202124' }}>{selectedNode}</h3>
                                <button
                                    onClick={() => setSelectedNode(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5f6368' }}
                                >
                                    ×
                                </button>
                            </div>

                            {isLoadingDetails ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                    <div className="loading-spinner" style={{ width: '24px', height: '24px', border: '2px solid #f3f3f3', borderTop: '2px solid #4285f4', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                </div>
                            ) : nodeDetails ? (
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <p style={{ lineHeight: '1.6', color: '#3c4043', fontSize: '0.95rem' }}>
                                            {nodeDetails.description}
                                        </p>
                                    </div>

                                    {nodeDetails.resources && nodeDetails.resources.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '10px', color: '#202124' }}>
                                                Tài liệu tham khảo
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {nodeDetails.resources.map((resource, index) => (
                                                    <a
                                                        key={index}
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            backgroundColor: '#f8f9fa',
                                                            textDecoration: 'none',
                                                            color: '#3c4043',
                                                            border: '1px solid #dadce0',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                    >
                                                        <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#e8f0fe', color: '#1967d2', fontSize: '12px', fontWeight: 'bold' }}>
                                                            {resource.type === 'video' ? '▶' : resource.type === 'article' ? '📄' : '🔗'}
                                                        </div>
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {resource.title}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#5f6368', textTransform: 'capitalize' }}>
                                                                {resource.type}
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: '#5f6368', fontStyle: 'italic' }}>Không có thông tin chi tiết.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
