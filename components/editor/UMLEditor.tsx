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
import RelationshipEditor from './RelationshipEditor';
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
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time collaboration
  const { socket, isConnected, emit } = useSocket(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');

  // Handle save - defined early to be used by other functions
  const handleSave = useCallback(() => {
    const diagramData = {
      classes: nodes.map((node) => ({
        ...node.data,
        position: node.position, // Include position
      } as UMLClass)),
      relations: edges.map((edge) => ({
        id: edge.id,
        sourceClassId: edge.source,
        targetClassId: edge.target,
        type: edge.data?.type || 'ASSOCIATION',
        name: edge.data?.label || '',
        multiplicity: edge.data?.multiplicity ?
          `${edge.data.multiplicity.source || ''}:${edge.data.multiplicity.target || ''}` :
          undefined,
        sourceHandle: edge.sourceHandle || undefined,
        targetHandle: edge.targetHandle || undefined,
      } as UMLRelation)),
      metadata: {
        lastModified: new Date().toISOString(),
        modifiedBy: userId,
      },
    };

    console.log('💾 Guardando diagrama con relaciones:', edges.map(e => ({
      id: e.id,
      label: e.data?.label,
      type: e.data?.type,
      multiplicity: e.data?.multiplicity
    })));

    onSave(diagramData);
  }, [nodes, edges, onSave, userId]);

  // Handle Delete key to remove selected nodes and edges
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Supr') {
        // Evitar eliminar si estamos editando en un modal
        if (isEditingClass || isEditingRelationship) return;

        // Eliminar edge seleccionado
        if (selectedEdge) {
          console.log('🗑️ Eliminando relación:', selectedEdge.id);
          setEdges((eds) => {
            const updatedEdges = eds.filter((e) => e.id !== selectedEdge.id);

            // Broadcast change
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

            // Save changes
            setTimeout(() => handleSave(), 100);

            return updatedEdges;
          });

          setSelectedEdge(null);
        }
        // Eliminar nodo seleccionado
        else if (selectedNode) {
          console.log('🗑️ Eliminando clase:', selectedNode.id);

          // Primero eliminar todas las relaciones conectadas al nodo
          setEdges((eds) => {
            const updatedEdges = eds.filter(
              (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
            );
            console.log(`🗑️ Eliminadas ${eds.length - updatedEdges.length} relaciones conectadas`);
            return updatedEdges;
          });

          // Luego eliminar el nodo
          setNodes((nds) => {
            const updatedNodes = nds.filter((n) => n.id !== selectedNode.id);

            // Broadcast change
            if (socket && isConnected) {
              emit('diagram_change', {
                diagramId: diagram.id,
                userId,
                changes: {
                  type: 'full_update',
                  nodes: updatedNodes,
                  edges: edges.filter(
                    (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
                  ),
                },
              });
            }

            // Save changes
            setTimeout(() => handleSave(), 100);

            return updatedNodes;
          });

          setSelectedNode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, isEditingClass, isEditingRelationship, setNodes, setEdges, socket, isConnected, emit, diagram.id, userId, handleSave, edges]);

  // Handle edge click to select
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Deselect node when selecting edge
  }, []);

  // Wrapper for onNodesChange to detect position changes and sync
  const onNodesChange = useCallback((changes: any) => {
    onNodesChangeBase(changes);

    // Check if any change is a position change
    const hasPositionChange = changes.some((change: any) =>
      change.type === 'position' && change.dragging === false
    );

    if (hasPositionChange) {
      console.log('📍 Posiciones actualizadas, guardando...');

      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save to avoid too many requests
      saveTimeoutRef.current = setTimeout(() => {
        // Get updated nodes after state change
        setNodes((currentNodes) => {
          // Broadcast position changes to collaborators
          if (socket && isConnected) {
            emit('diagram_change', {
              diagramId: diagram.id,
              userId,
              changes: {
                type: 'nodes',
                nodes: currentNodes,
              },
            });
            console.log('📡 Posiciones enviadas a colaboradores');
          }

          // Save to database
          handleSave();

          return currentNodes;
        });
      }, 1500); // Increased to 1.5 seconds to reduce server load
    }
  }, [onNodesChangeBase, socket, isConnected, emit, diagram.id, userId, setNodes, handleSave]);

  // Initialize diagram data ONLY ONCE on mount
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Solo inicializar una vez cuando el componente se monta
    if (!isInitialized && diagram.data) {
      console.log('🔄 Inicializando diagrama desde BD');

      if (diagram.data.classes) {
        const initialNodes: Node[] = diagram.data.classes.map((umlClass) => ({
          id: umlClass.id,
          type: 'umlClass',
          position: umlClass.position,
          data: umlClass,
        }));
        setNodes(initialNodes);
        console.log('✅ Cargados', initialNodes.length, 'nodos desde BD');
      }

      if (diagram.data.relations) {
        const initialEdges: Edge[] = diagram.data.relations.map((relation) => ({
          id: relation.id,
          source: relation.sourceClassId,
          target: relation.targetClassId,
          sourceHandle: relation.sourceHandle || null,
          targetHandle: relation.targetHandle || null,
          type: 'umlRelationship', // Usar edge type personalizado
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
        console.log('✅ Cargados', initialEdges.length, 'edges desde BD:', initialEdges.map(e => ({
          id: e.id,
          label: e.data?.label,
          type: e.data?.type,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        })));
      }

      setIsInitialized(true);
    }
  }, [diagram.id, isInitialized]); // Solo depende del ID del diagrama

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
        console.log('📥 Recibido cambio de diagrama:', data);
        // Apply changes from other users
        if (data.userId !== userId) {
          if (data.changes.type === 'nodes') {
            console.log('🔄 Actualizando solo nodos');
            setNodes(data.changes.nodes);
          } else if (data.changes.type === 'edges') {
            console.log('🔄 Actualizando solo edges');
            setEdges(data.changes.edges);
          } else if (data.changes.type === 'full_update') {
            console.log('🔄 Actualización completa de diagrama');
            setNodes(data.changes.nodes);
            setEdges(data.changes.edges);
          }
        } else {
          console.log('⏭️ Ignorando mi propio cambio');
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

  // Handle node double click to edit
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsEditingClass(true);
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

  // Handle edge double click to edit relationship
  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: any) => {
    setSelectedEdge(edge);
    setIsEditingRelationship(true);
  }, []);

  // Handle relationship update
  const onUpdateRelationship = useCallback((updatedRelationship: any) => {
    setEdges((eds) => {
      const updatedEdges = eds.map((edge) => {
        if (edge.id === updatedRelationship.id) {
          return {
            ...edge,
            data: {
              label: updatedRelationship.label,
              type: updatedRelationship.type,
              multiplicity: updatedRelationship.multiplicity,
            },
          };
        }
        return edge;
      });

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
    setIsEditingRelationship(false);
    setSelectedEdge(null);
  }, [setEdges, socket, isConnected, emit, diagram.id, userId]);

  // handleSave is defined above, near the top of the component

  // Handle adding elements from sidebar
  const handleAddElement = useCallback((element: any, position?: { x: number; y: number }) => {
    if (element.type === 'umlClass') {
      const newNode = {
        id: element.data.id,
        type: 'umlClass',
        position: position || reactFlowInstance?.project({
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

      if (!elementData || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      // Get the bounding rect to calculate correct position
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const element = JSON.parse(elementData);
      const newElement = {
        ...element,
        data: {
          ...element.data,
          id: `${element.data.id}_${Date.now()}` // Make unique
        }
      };

      handleAddElement(newElement, position);
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
      console.log('🤖 IA generó modelo:', umlModel);

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

      console.log('📊 Aplicando nodos:', newNodes.length, 'edges:', newEdges.length);

      // Update nodes and edges - IMPORTANT: Agregar a los existentes, no reemplazar
      let finalNodes: any[] = [];
      let finalEdges: any[] = [];

      setNodes((existingNodes) => {
        finalNodes = [...existingNodes, ...newNodes];
        console.log('✅ Nodos totales después de IA:', finalNodes.length);
        return finalNodes;
      });

      setEdges((existingEdges) => {
        finalEdges = [...existingEdges, ...newEdges];
        console.log('✅ Edges totales después de IA:', finalEdges.length);
        return finalEdges;
      });

      // Wait a bit for state to update, then broadcast and save
      setTimeout(() => {
        // Broadcast to collaborators
        if (socket && isConnected) {
          emit('diagram_change', {
            diagramId: diagram.id,
            userId,
            changes: {
              type: 'full_update',
              nodes: finalNodes,
              edges: finalEdges,
            },
          });
          console.log('📡 Cambios enviados por WebSocket');
        }

        // Save to database
        handleSave();
        console.log('💾 Diagrama guardado en BD');
      }, 500);
    }
  }, [setNodes, setEdges, handleSave, socket, isConnected, emit, diagram.id, userId]);

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
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeClick={onEdgeClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="bg-gray-50"
              connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 2 }}
              defaultEdgeOptions={{
                type: 'smoothstep', // Líneas rectas con esquinas de 90°
                style: { strokeWidth: 2, stroke: '#6b7280' },
              }}
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
                color="#9ca3af"
                gap={20}
                size={2}
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

          {/* Modal Editor de Relación */}
          {isEditingRelationship && selectedEdge && (
            <RelationshipEditor
              relationship={{
                id: selectedEdge.id,
                label: selectedEdge.data?.label,
                type: selectedEdge.data?.type,
                multiplicity: selectedEdge.data?.multiplicity,
              }}
              onSave={onUpdateRelationship}
              onCancel={() => setIsEditingRelationship(false)}
            />
          )}
        </div>
      </div>

      {/* Lado Derecho - Chat IA */}
      {isChatOpen && (
        <div className="w-80 border-l border-gray-300 bg-white flex-shrink-0">
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