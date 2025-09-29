'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import UMLClassNode from './UMLClassNode';
import UMLToolbar from './UMLToolbar';
import ClassEditor from './ClassEditor';
import { UMLClass, UMLRelation, Diagram } from '@/types/uml';
import { useSocket } from '@/hooks/useSocket';

const nodeTypes = {
  umlClass: UMLClassNode,
};

interface UMLEditorProps {
  diagram: Diagram;
  workspaceId: string;
  userId: string;
  userName: string;
  onSave: (data: any) => void;
}

export default function UMLEditor({ diagram, workspaceId, userId, userName, onSave }: UMLEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time collaboration
  const { socket, isConnected, emit } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

  // Initialize diagram data
  useEffect(() => {
    if (diagram.data.classes) {
      const initialNodes: Node[] = diagram.data.classes.map((umlClass) => ({
        id: umlClass.id,
        type: 'umlClass',
        position: umlClass.position,
        data: umlClass,
      }));
      setNodes(initialNodes);
    }

    if (diagram.data.relations) {
      const initialEdges: Edge[] = diagram.data.relations.map((relation) => ({
        id: relation.id,
        source: relation.sourceClassId,
        target: relation.targetClassId,
        type: 'smoothstep',
        label: relation.name || relation.type,
        style: { stroke: '#374151', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          color: '#374151',
        },
      }));
      setEdges(initialEdges);
    }
  }, [diagram, setNodes, setEdges]);

  // Join collaboration room when component mounts
  useEffect(() => {
    if (socket && isConnected) {
      emit('join_diagram', {
        diagramId: diagram.id,
        userId,
        userName,
      });

      // Listen for diagram changes from other users
      socket.on('diagram_change', (data) => {
        console.log('Received diagram change:', data);
        // Apply changes from other users
        if (data.userId !== userId) {
          if (data.changes.type === 'nodes') {
            setNodes(data.changes.nodes);
          } else if (data.changes.type === 'edges') {
            setEdges(data.changes.edges);
          }
        }
      });

      socket.on('user_joined', (data) => {
        console.log('User joined:', data.userName);
      });

      socket.on('user_left', (data) => {
        console.log('User left:', data.userId);
      });
    }

    return () => {
      if (socket) {
        emit('leave_diagram', { diagramId: diagram.id, userId });
        socket.off('diagram_change');
        socket.off('user_joined');
        socket.off('user_left');
      }
    };
  }, [socket, isConnected, diagram.id, userId, userName, emit, setNodes, setEdges]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        style: { stroke: '#374151', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          color: '#374151',
        },
      };

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);

        // Broadcast change to other users
        if (socket && isConnected) {
          emit('diagram_change', {
            diagramId: diagram.id,
            userId,
            changes: {
              type: 'edges',
              edges: updatedEdges,
            },
          });
        }

        return updatedEdges;
      });
    },
    [setEdges, socket, isConnected, emit, diagram.id, userId]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle adding new class
  const onAddClass = useCallback((position: { x: number; y: number }) => {
    const newClass: UMLClass = {
      id: `class-${Date.now()}`,
      name: 'NewClass',
      position,
      attributes: [
        {
          id: `attr-${Date.now()}`,
          name: 'id',
          type: 'Long',
          stereotype: 'id',
          nullable: false,
          unique: true,
        },
      ],
      methods: [],
    };

    const newNode: Node = {
      id: newClass.id,
      type: 'umlClass',
      position,
      data: newClass,
    };

    setNodes((nds) => {
      const updatedNodes = nds.concat(newNode);

      // Broadcast change to other users
      if (socket && isConnected) {
        emit('diagram_change', {
          diagramId: diagram.id,
          userId,
          changes: {
            type: 'nodes',
            nodes: updatedNodes,
          },
        });
      }

      return updatedNodes;
    });

    setSelectedNode(newNode);
    setIsEditingClass(true);
  }, [setNodes, socket, isConnected, emit, diagram.id, userId]);

  // Handle canvas double-click to add class
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (reactFlowInstance && reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
        onAddClass(position);
      }
    },
    [reactFlowInstance, onAddClass]
  );

  // Handle class update
  const onUpdateClass = useCallback((updatedClass: UMLClass) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === updatedClass.id) {
          return {
            ...node,
            data: updatedClass,
          };
        }
        return node;
      });

      // Broadcast change to other users
      if (socket && isConnected) {
        emit('diagram_change', {
          diagramId: diagram.id,
          userId,
          changes: {
            type: 'nodes',
            nodes: updatedNodes,
          },
        });
      }

      return updatedNodes;
    });
    setIsEditingClass(false);
    setSelectedNode(null);
  }, [setNodes, socket, isConnected, emit, diagram.id, userId]);

  // Handle save
  const handleSave = useCallback(() => {
    const diagramData = {
      classes: nodes.map((node) => node.data as UMLClass),
      relations: edges.map((edge) => ({
        id: edge.id,
        sourceClassId: edge.source,
        targetClassId: edge.target,
        type: 'ASSOCIATION',
        name: edge.label as string,
      } as UMLRelation)),
      metadata: {
        lastModified: new Date().toISOString(),
        modifiedBy: userId,
      },
    };

    onSave(diagramData);
  }, [nodes, edges, onSave, userId]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <UMLToolbar
        onAddClass={() => onAddClass({ x: 100, y: 100 })}
        onSave={handleSave}
        onEditClass={() => selectedNode && setIsEditingClass(true)}
        hasSelectedNode={!!selectedNode}
        isConnected={isConnected}
      />

      {/* Main Editor */}
      <div className="flex-1 relative">
        <div ref={reactFlowWrapper} className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneDoubleClick={onPaneDoubleClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </div>

      {/* Class Editor Modal */}
      {isEditingClass && selectedNode && (
        <ClassEditor
          umlClass={selectedNode.data as UMLClass}
          onSave={onUpdateClass}
          onCancel={() => setIsEditingClass(false)}
        />
      )}
    </div>
  );
}