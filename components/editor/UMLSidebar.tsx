'use client';

import React, { useState } from 'react';
import {
  Layers,
  Box,
  Database,
  Users,
  FileText,
  Zap,
  Circle,
  Square,
  Triangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface UMLTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: string;
  data: any;
}

interface SidebarSection {
  title: string;
  icon: React.ReactNode;
  items: UMLTemplate[];
  isOpen: boolean;
}

export default function UMLSidebar({ onAddElement }: { onAddElement: (element: any) => void }) {
  const [sections, setSections] = useState<SidebarSection[]>([
    {
      title: 'Clases',
      icon: <Box size={16} />,
      isOpen: true,
      items: [
        {
          id: 'basic-class',
          name: 'Clase Básica',
          icon: <Box size={14} />,
          type: 'umlClass',
          data: {
            id: `class_${Date.now()}`,
            name: 'NuevaClase',
            position: { x: 0, y: 0 },
            attributes: [
              { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true }
            ],
            methods: [],
            stereotypes: ['entity']
          }
        },
        {
          id: 'entity-class',
          name: 'Clase Entidad',
          icon: <Database size={14} />,
          type: 'umlClass',
          data: {
            id: `entity_${Date.now()}`,
            name: 'Entidad',
            position: { x: 0, y: 0 },
            attributes: [
              { id: 'attr_1', name: 'id', type: 'Long', stereotype: 'id', nullable: false, unique: true },
              { id: 'attr_2', name: 'nombre', type: 'String', nullable: false, unique: false },
              { id: 'attr_3', name: 'fechaCreacion', type: 'LocalDateTime', nullable: false, unique: false }
            ],
            methods: [
              { id: 'method_1', name: 'getId', returnType: 'Long', parameters: [], visibility: 'public' },
              { id: 'method_2', name: 'setId', returnType: 'void', parameters: [{ name: 'id', type: 'Long' }], visibility: 'public' }
            ],
            stereotypes: ['entity']
          }
        },
        {
          id: 'service-class',
          name: 'Clase Servicio',
          icon: <Zap size={14} />,
          type: 'umlClass',
          data: {
            id: `service_${Date.now()}`,
            name: 'Servicio',
            position: { x: 0, y: 0 },
            attributes: [],
            methods: [
              { id: 'method_1', name: 'buscarTodos', returnType: 'List<Entidad>', parameters: [], visibility: 'public' },
              { id: 'method_2', name: 'buscarPorId', returnType: 'Entidad', parameters: [{ name: 'id', type: 'Long' }], visibility: 'public' },
              { id: 'method_3', name: 'guardar', returnType: 'Entidad', parameters: [{ name: 'entidad', type: 'Entidad' }], visibility: 'public' }
            ],
            stereotypes: ['service']
          }
        },
        {
          id: 'controller-class',
          name: 'Clase Controlador',
          icon: <Users size={14} />,
          type: 'umlClass',
          data: {
            id: `controller_${Date.now()}`,
            name: 'Controlador',
            position: { x: 0, y: 0 },
            attributes: [],
            methods: [
              { id: 'method_1', name: 'obtenerTodos', returnType: 'ResponseEntity<List<Entidad>>', parameters: [], visibility: 'public' },
              { id: 'method_2', name: 'obtenerPorId', returnType: 'ResponseEntity<Entidad>', parameters: [{ name: 'id', type: 'Long' }], visibility: 'public' },
              { id: 'method_3', name: 'crear', returnType: 'ResponseEntity<Entidad>', parameters: [{ name: 'entidad', type: 'Entidad' }], visibility: 'public' }
            ],
            stereotypes: ['controller']
          }
        }
      ]
    },
    {
      title: 'Interfaces',
      icon: <FileText size={16} />,
      isOpen: false,
      items: [
        {
          id: 'repository-interface',
          name: 'Repositorio',
          icon: <FileText size={14} />,
          type: 'umlClass',
          data: {
            id: `repository_${Date.now()}`,
            name: 'Repositorio',
            position: { x: 0, y: 0 },
            attributes: [],
            methods: [
              { id: 'method_1', name: 'buscarTodos', returnType: 'List<T>', parameters: [], visibility: 'public' },
              { id: 'method_2', name: 'buscarPorId', returnType: 'Optional<T>', parameters: [{ name: 'id', type: 'ID' }], visibility: 'public' },
              { id: 'method_3', name: 'guardar', returnType: 'T', parameters: [{ name: 'entidad', type: 'T' }], visibility: 'public' }
            ],
            stereotypes: ['interface']
          }
        }
      ]
    },
    {
      title: 'Relaciones',
      icon: <Layers size={16} />,
      isOpen: true,
      items: [
        {
          id: 'association',
          name: 'Asociación',
          icon: <div className="w-3 h-0.5 bg-gray-600"></div>,
          type: 'relationship',
          data: { type: 'ASSOCIATION', style: 'solid' }
        },
        {
          id: 'aggregation',
          name: 'Agregación',
          icon: <Circle size={14} />,
          type: 'relationship',
          data: { type: 'AGGREGATION', style: 'solid' }
        },
        {
          id: 'composition',
          name: 'Composición',
          icon: <Square size={14} />,
          type: 'relationship',
          data: { type: 'COMPOSITION', style: 'solid' }
        },
        {
          id: 'inheritance',
          name: 'Herencia',
          icon: <Triangle size={14} />,
          type: 'relationship',
          data: { type: 'INHERITANCE', style: 'solid' }
        },
        {
          id: 'dependency',
          name: 'Dependencia',
          icon: <div className="w-3 h-0.5 border-t border-dashed border-gray-600"></div>,
          type: 'relationship',
          data: { type: 'DEPENDENCY', style: 'dashed' }
        }
      ]
    }
  ]);

  const toggleSection = (index: number) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, isOpen: !section.isOpen } : section
    ));
  };

  const handleDragStart = (e: React.DragEvent, item: UMLTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleItemClick = (item: UMLTemplate) => {
    if (onAddElement) {
      onAddElement(item);
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-300 h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Layers className="mr-2" size={20} />
          Elementos UML
        </h2>
        <p className="text-sm text-gray-600 mt-1">Arrastra y suelta elementos al canvas</p>
      </div>

      {/* Sections */}
      <div className="p-2">
        {sections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-4">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(sectionIndex)}
              className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
            >
              <div className="flex items-center text-sm font-medium text-gray-800">
                {section.icon}
                <span className="ml-2">{section.title}</span>
              </div>
              {section.isOpen ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
            </button>

            {/* Section Items */}
            {section.isOpen && (
              <div className="ml-2 mt-1 space-y-1">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center p-3 border border-gray-300 rounded hover:bg-gray-200 hover:border-gray-400 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded mr-3 group-hover:bg-gray-300">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type.replace('uml', '')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 bg-gray-100 border-t border-gray-300 mt-auto">
        <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Consejos</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Arrastra elementos al canvas</li>
          <li>• Haz clic para agregar al centro</li>
          <li>• Usa el chat IA para creación masiva</li>
          <li>• Conecta con relaciones</li>
        </ul>
      </div>
    </div>
  );
}