import React, { useMemo, useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration Constants ---
const NODE_WIDTH = 180;
const NODE_HEIGHT = 48;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 20;
const PADDING = 40;
const TOGGLE_BUTTON_RADIUS = 12;

// --- Types ---
interface MindmapNodeData {
    id: string;
    label: string;
    description?: string;
    type?: string;
}

interface MindmapEdge {
    from?: string;
    from_node?: string;
    source?: string;
    to?: string;
    to_node?: string;
    target?: string;
}

interface MindMapNode {
    id: string;
    name: string;
    label?: string;
    description?: string;
    children: MindMapNode[];
    subtreeHeight?: number;
}

interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Link {
    id: string;
    source: { x: number; y: number };
    target: { x: number; y: number };
}

interface MindmapViewerProps {
    data: {
        nodes: MindmapNodeData[];
        edges: MindmapEdge[];
    };
    onNodeClick?: (nodeData: any) => void;
}

// --- Helper: Convert flat nodes/edges to tree structure ---
const buildTreeFromFlat = (nodes: MindmapNodeData[], edges: MindmapEdge[]): MindMapNode | null => {
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();

    edges.forEach(edge => {
        const source = edge.from || edge.from_node || edge.source || '';
        const target = edge.to || edge.to_node || edge.target || '';
        parentMap.set(target, source);
        if (!childrenMap.has(source)) {
            childrenMap.set(source, []);
        }
        childrenMap.get(source)!.push(target);
    });

    const rootNode = nodes.find(n => !parentMap.has(n.id));
    if (!rootNode) return null;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const buildSubtree = (nodeId: string): MindMapNode | null => {
        const node = nodeMap.get(nodeId);
        if (!node) return null;

        const childIds = childrenMap.get(nodeId) || [];
        const children = childIds
            .map(childId => buildSubtree(childId))
            .filter((n): n is MindMapNode => n !== null);

        return {
            id: node.id,
            name: node.label,
            label: node.label,
            description: node.description,
            children,
        };
    };

    return buildSubtree(rootNode.id);
};

// --- Helper function to generate curved path ---
const generateCurvePath = (source: { x: number; y: number }, target: { x: number; y: number }): string => {
    const mx = source.x + (target.x - source.x) / 2;
    return `M${source.x},${source.y} C${mx},${source.y} ${mx},${target.y} ${target.x},${target.y}`;
};

// --- Node Component with Framer Motion ---
const MindMapNodeComponent: React.FC<{
    node: PositionedNode;
    isExpanded: boolean;
    onToggle: (nodeId: string) => void;
    onNodeClick?: (nodeData: any) => void;
}> = ({ node, isExpanded, onToggle, onNodeClick }) => {
    const hasChildren = node.children && node.children.length > 0;

    const handleClick = () => {
        if (onNodeClick) {
            onNodeClick({
                label: node.name,
                description: node.description,
            });
        }
    };

    return (
        <motion.g
            initial={{ x: node.x, y: node.y, opacity: 0 }}
            animate={{ x: node.x, y: node.y, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            <rect
                width={node.width}
                height={node.height}
                rx={12}
                ry={12}
                fill="#374151"
                stroke="#4B5563"
                className="cursor-pointer"
                onClick={handleClick}
            />
            <foreignObject
                width={node.width}
                height={node.height}
                className="pointer-events-none"
            >
                <div className="flex items-center justify-center h-full p-2 text-center text-gray-200 text-sm leading-tight break-words select-none">
                    {node.name}
                </div>
            </foreignObject>

            {hasChildren && (
                <g
                    className="toggle-btn cursor-pointer"
                    transform={`translate(${node.width}, ${node.height / 2})`}
                    onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                >
                    <circle r={TOGGLE_BUTTON_RADIUS} fill="#4B5563" />
                    <motion.path
                        key={isExpanded ? 'minus' : 'plus'}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        d={isExpanded ? "M-6 0 H6" : "M-6 0 H6 M0 -6 V6"}
                        stroke="#E5E7EB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        transform="translate(0.5, 0.5)"
                    />
                </g>
            )}
        </motion.g>
    );
};

// --- Main Component ---
export interface MindmapViewerHandle {
    getSvgElement: () => SVGSVGElement | null;
}

const MindmapViewer = forwardRef<MindmapViewerHandle, MindmapViewerProps>(({ data, onNodeClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const transformRef = useRef<SVGGElement>(null);

    const panRef = useRef({ x: 50, y: 50 });
    const zoomRef = useRef(1);
    const isPanningRef = useRef(false);
    const startRef = useRef({ x: 0, y: 0 });

    const [expandedNodes, setExpandedNodes] = useState<{ [key: string]: boolean }>({});
    const [isPanning, setIsPanning] = useState(false);

    // Expose getSvgElement to parent
    useImperativeHandle(ref, () => ({
        getSvgElement: () => svgRef.current
    }));

    const treeData = useMemo(() => {
        if (!data?.nodes?.length || !data?.edges?.length) return null;
        return buildTreeFromFlat(data.nodes, data.edges);
    }, [data]);

    useEffect(() => {
        if (!treeData) return;
        const initialExpanded: { [key: string]: boolean } = {};
        const traverseAndExpand = (node: MindMapNode) => {
            if (node.children && node.children.length > 0) {
                initialExpanded[node.id] = true;
                node.children.forEach(traverseAndExpand);
            }
        };
        traverseAndExpand(treeData);
        setExpandedNodes(initialExpanded);
    }, [treeData]);

    const handleToggleNode = useCallback((nodeId: string) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    }, []);

    const { nodes, links } = useMemo(() => {
        if (!treeData) return { nodes: [], links: [] };

        const positionedNodes: PositionedNode[] = [];
        const generatedLinks: Link[] = [];

        const calculateSubtreeHeights = (node: MindMapNode): number => {
            let childrenHeight = 0;
            const isNodeExpanded = expandedNodes[node.id];

            if (node.children && node.children.length > 0 && isNodeExpanded) {
                childrenHeight = node.children
                    .map(calculateSubtreeHeights)
                    .reduce((sum, h) => sum + h, 0);
                childrenHeight += (node.children.length - 1) * VERTICAL_SPACING;
            }
            node.subtreeHeight = Math.max(NODE_HEIGHT, childrenHeight);
            return node.subtreeHeight;
        };

        calculateSubtreeHeights(treeData);

        const assignCoordinates = (node: MindMapNode, depth: number, yOffset: number) => {
            const x = PADDING + depth * (NODE_WIDTH + HORIZONTAL_SPACING);
            const y = yOffset + ((node.subtreeHeight || NODE_HEIGHT) / 2) - (NODE_HEIGHT / 2);

            positionedNodes.push({
                ...node,
                x,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
            });

            const isNodeExpanded = expandedNodes[node.id];
            if (node.children && node.children.length > 0 && isNodeExpanded) {
                let currentYOffset = yOffset;
                node.children.forEach(child => {
                    const childSubtreeHeight = child.subtreeHeight || NODE_HEIGHT;
                    assignCoordinates(child, depth + 1, currentYOffset);

                    generatedLinks.push({
                        id: `${node.id}-${child.id}`,
                        source: { x: x + NODE_WIDTH + TOGGLE_BUTTON_RADIUS, y: y + NODE_HEIGHT / 2 },
                        target: { x: x + NODE_WIDTH + HORIZONTAL_SPACING, y: currentYOffset + childSubtreeHeight / 2 },
                    });

                    currentYOffset += childSubtreeHeight + VERTICAL_SPACING;
                });
            }
        };

        assignCoordinates(treeData, 0, PADDING);

        return { nodes: positionedNodes, links: generatedLinks };
    }, [treeData, expandedNodes]);

    const updateTransform = useCallback(() => {
        if (transformRef.current) {
            transformRef.current.setAttribute(
                'transform',
                `translate(${panRef.current.x}, ${panRef.current.y}) scale(${zoomRef.current})`
            );
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as Element;
            if (target.closest('.toggle-btn')) return;

            isPanningRef.current = true;
            setIsPanning(true);
            startRef.current = {
                x: e.clientX - panRef.current.x,
                y: e.clientY - panRef.current.y
            };
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;

            panRef.current = {
                x: e.clientX - startRef.current.x,
                y: e.clientY - startRef.current.y
            };

            requestAnimationFrame(updateTransform);
        };

        const onMouseUp = () => {
            isPanningRef.current = false;
            setIsPanning(false);
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            zoomRef.current = Math.min(Math.max(zoomRef.current * factor, 0.2), 3);
            requestAnimationFrame(updateTransform);
        };

        container.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            container.removeEventListener('wheel', onWheel);
        };
    }, [updateTransform]);

    if (!treeData) {
        return (
            <div
                ref={containerRef}
                className="w-full h-full bg-[#2A2A2A] rounded-lg overflow-hidden flex items-center justify-center"
            >
                <span className="text-gray-400 text-base">Không có dữ liệu mindmap</span>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full h-full bg-[#2A2A2A] rounded-lg overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <svg ref={svgRef} width="100%" height="100%">
                <g ref={transformRef} transform="translate(50, 50) scale(1)">
                    {/* Links with Animation */}
                    <g>
                        <AnimatePresence>
                            {links.map((link) => (
                                <motion.path
                                    key={link.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, d: generateCurvePath(link.source, link.target) }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    fill="none"
                                    stroke="#6B7280"
                                    strokeWidth={1.5}
                                />
                            ))}
                        </AnimatePresence>
                    </g>

                    {/* Nodes with Animation */}
                    <g>
                        <AnimatePresence>
                            {nodes.map(node => (
                                <MindMapNodeComponent
                                    key={node.id}
                                    node={node}
                                    isExpanded={!!expandedNodes[node.id]}
                                    onToggle={handleToggleNode}
                                    onNodeClick={onNodeClick}
                                />
                            ))}
                        </AnimatePresence>
                    </g>
                </g>
            </svg>
        </div>
    );
});

export default MindmapViewer;
