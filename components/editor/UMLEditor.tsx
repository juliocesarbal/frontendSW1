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
import UMLSidebar from './UMLSidebar';
import UMLRelationshipEdge from './UMLRelationshipEdge';
import AIChatInterface from '../chat/AIChatInterface';
import { UMLClass, UMLRelation, Diagram } from '@/types/uml';
import { useSocket } from '@/hooks/useSocket';

const nodeTypes = {
  umlClass: UMLClassNode,
};

const edgeTypes = {
  umlRelationship: UMLRelationshipEdge,
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
  const [isChatOpen, setIsChatOpen] = useState(true);

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
        type: 'umlRelationship',
        data: {
          label: relation.name,
          type: relation.type as any,
          multiplicity: relation.multiplicity ? {
            source: relation.multiplicity.split(':')[0],
            target: relation.multiplicity.split(':')[1]
          } : undefined
        }
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
        type: 'umlRelationship',
        data: {
          label: 'association',
          type: 'ASSOCIATION',
        }
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

  // Handle adding elements from sidebar
  const handleAddElement = useCallback((element: any) => {
    if (element.type === 'umlClass') {
      const newNode = {
        id: element.data.id,
        type: 'umlClass',
        position: reactFlowInstance?.project({
          x: window.innerWidth / 2 - 200,
          y: window.innerHeight / 2 - 100
        }) || { x: 200, y: 200 },
        data: element.data,
      };

      setNodes((nds) => [...nds, newNode]);

      // Emit to collaborators
      if (socket && isConnected) {
        emit('diagram_change', {
          diagramId: diagram.id,
          userId,
          changes: {
            type: 'nodes',
            nodes: [...nodes, newNode],
          },
        });
      }
    }
  }, [reactFlowInstance, setNodes, socket, isConnected, emit, diagram.id, userId, nodes]);

  // Handle drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const elementData = event.dataTransfer.getData('application/json');

      if (!elementData) {
        return;
      }

      if (reactFlowInstance) {
        const position = reactFlowInstance.project({
          x: event.clientX - 320, // Account for sidebar width
          y: event.clientY,
        });

        const element = JSON.parse(elementData);
        const newElement = {
          ...element,
          data: {
            ...element.data,
            id: `${element.data.id}_${Date.now()}` // Make unique
          }
        };
        handleAddElement(newElement);
      }
    },
    [reactFlowInstance, handleAddElement]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle UML generation from AI
  const handleUMLGenerated = useCallback((umlModel: any) => {
    if (umlModel.classes) {
      const newNodes = umlModel.classes.map((umlClass: any) => ({
        id: umlClass.id,
        type: 'umlClass',
        position: umlClass.position,
        data: umlClass,
      }));

      const newEdges = umlModel.relations?.map((relation: any) => ({
        id: relation.id,
        source: relation.sourceClassId,
        target: relation.targetClassId,
        type: 'umlRelationship',
        data: {
          label: relation.name,
          type: relation.type,
        }
      })) || [];

      setNodes(newNodes);
      setEdges(newEdges);

      // Save the changes
      handleSave();
    }
  }, [setNodes, setEdges, handleSave]);

  return (
    <div className="h-full w-full flex">
      {/* Sidebar Izquierdo - Elementos UML */}
      <UMLSidebar onAddElement={handleAddElement} />

      {/* Área Principal del Editor */}
      <div className="flex-1 flex flex-col">
        {/* Barra de Herramientas */}
        <UMLToolbar
          onAddClass={() => onAddClass({ x: 100, y: 100 })}
          onSave={handleSave}
          onEditClass={() => selectedNode && setIsEditingClass(true)}
          hasSelectedNode={!!selectedNode}
          isConnected={isConnected}
        />

        {/* Área del Canvas */}
        <div className="flex-1 relative">
          <div
            ref={reactFlowWrapper}
            className="h-full w-full"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDoubleClick={onPaneDoubleClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="bg-gray-50"
              connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 2 }}
              snapToGrid={true}
              snapGrid={[20, 20]}
            >
              <Controls
                position="bottom-left"
                className="bg-white shadow-lg rounded border border-gray-300"
              />
              <MiniMap
                nodeColor="#6b7280"
                nodeStrokeWidth={2}
                className="bg-white shadow-lg rounded border border-gray-300"
                position="bottom-right"
              />
              <Background
                color="#d1d5db"
                gap={20}
                size={1}
                className="opacity-30"
              />
            </ReactFlow>
          </div>

          {/* Estado de Conexión */}
          <div className="absolute top-4 right-4 z-10">
            <div
              className={`px-3 py-1 rounded text-sm font-medium ${
                isConnected
                  ? 'bg-gray-100 text-gray-800 border border-gray-300'
                  : 'bg-gray-200 text-gray-700 border border-gray-400'
              }`}
            >
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </div>
          </div>

          {/* Modal Editor de Clase */}
          {isEditingClass && selectedNode && (
            <ClassEditor
              umlClass={selectedNode.data as UMLClass}
              onSave={onUpdateClass}
              onCancel={() => setIsEditingClass(false)}
            />
          )}
        </div>
      </div>

      {/* Lado Derecho - Chat IA */}
      {isChatOpen && (
        <div className="w-96 border-l border-gray-300 bg-white">
          <AIChatInterface
            diagramId={diagram.id}
            onUMLGenerated={handleUMLGenerated}
            onClose={() => setIsChatOpen(false)}
            isOpen={isChatOpen}
          />
        </div>
      )}

      {/* Botón Flotante Chat */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded shadow-lg transition-all duration-200 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}