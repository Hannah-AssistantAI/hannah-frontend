import { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Position,
    Handle,
    MarkerType,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

// Custom Node Component for better styling
const CustomNode = ({ data }: { data: { label: string, type?: string } }) => {
    const isRoot = data.type === 'root';
    return (
        <div style={{
            padding: '10px 20px',
            borderRadius: '8px',
            background: isRoot ? '#4285F4' : 'white',
            color: isRoot ? 'white' : '#333',
            border: isRoot ? 'none' : '1px solid #ddd',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            fontSize: isRoot ? '16px' : '14px',
            fontWeight: isRoot ? 'bold' : 'normal',
            textAlign: 'center',
            minWidth: '100px',
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            {data.label}
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </div>
    );
};

const nodeTypes = {
    default: CustomNode,
    root: CustomNode,
};

interface MindmapViewerProps {
    data: {
        nodes: any[];
        edges: any[];
    };
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - 75, // Center offset
                y: nodeWithPosition.y - 25,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

export default function MindmapViewer({ data }: MindmapViewerProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        console.log('MindmapViewer received data:', data);

        if (data && data.nodes && data.edges) {
            console.log('Processing nodes:', data.nodes);
            console.log('Processing edges:', data.edges);

            // Transform data to React Flow format
            const initialNodes: Node[] = data.nodes.map((n: any) => ({
                id: n.id,
                type: n.type === 'root' ? 'root' : 'default',
                data: { label: n.label, type: n.type },
                position: { x: 0, y: 0 }, // Layout will handle this
            }));

            const initialEdges: Edge[] = data.edges.map((e: any) => ({
                id: e.id || `e-${e.from || e.from_node || e.source}-${e.to || e.to_node || e.target}`,
                source: e.from || e.from_node || e.source, // Handle 'from', 'from_node', and 'source'
                target: e.to || e.to_node || e.target,     // Handle 'to', 'to_node', and 'target'
                type: 'smoothstep',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                },
                animated: true,
            }));

            console.log('Transformed nodes:', initialNodes);
            console.log('Transformed edges:', initialEdges);

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                initialNodes,
                initialEdges
            );

            console.log('Layouted nodes:', layoutedNodes);
            console.log('Layouted edges:', layoutedEdges);

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
        } else {
            console.warn('MindmapViewer: Missing data, nodes, or edges', { data });
        }
    }, [data, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <MiniMap />
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
}
