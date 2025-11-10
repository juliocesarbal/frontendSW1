'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UMLClass } from '@/types/uml';
import { Database, Zap, Users, FileText, Package, Settings } from 'lucide-react';

interface UMLClassNodeData extends UMLClass {
  isSelected?: boolean;
  isBeingEdited?: boolean;
}

const getStereotypeIcon = (stereotype: string) => {
  switch (stereotype.toLowerCase()) {
    case 'entity':
      return <Database size={12} className="text-gray-600" />;
    case 'service':
      return <Zap size={12} className="text-gray-600" />;
    case 'controller':
      return <Users size={12} className="text-gray-600" />;
    case 'interface':
      return <FileText size={12} className="text-gray-600" />;
    case 'component':
      return <Package size={12} className="text-gray-600" />;
    default:
      return <Settings size={12} className="text-gray-600" />;
  }
};

const getStereotypeColor = (stereotype: string) => {
  switch (stereotype.toLowerCase()) {
    case 'entity':
      return 'bg-gray-100 border-gray-300 text-gray-700';
    case 'service':
      return 'bg-gray-100 border-gray-300 text-gray-700';
    case 'controller':
      return 'bg-gray-100 border-gray-300 text-gray-700';
    case 'interface':
      return 'bg-gray-100 border-gray-300 text-gray-700';
    case 'component':
      return 'bg-gray-100 border-gray-300 text-gray-700';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-700';
  }
};

const getVisibilitySymbol = (visibility: string) => {
  switch (visibility) {
    case 'private':
      return <span className="text-gray-600 font-bold">-</span>;
    case 'protected':
      return <span className="text-gray-600 font-bold">#</span>;
    case 'public':
      return <span className="text-gray-600 font-bold">+</span>;
    default:
      return <span className="text-gray-600 font-bold">+</span>;
  }
};

const UMLClassNode = memo(({ data, selected }: NodeProps<UMLClassNodeData>) => {
  const primaryStereotype = data.stereotypes?.[0] || 'class';
  const stereotypeColor = getStereotypeColor(primaryStereotype);

  return (
    <div
      className={`bg-white border-2 rounded min-w-[220px] max-w-[320px] transition-all duration-200 ${
        selected
          ? 'border-gray-500 shadow-lg'
          : 'border-gray-300 hover:border-gray-400'
      } ${data.isBeingEdited ? 'ring-2 ring-gray-400 ring-opacity-75' : ''}`}
    >
      {/* Encabezado de Clase */}
      <div className={`border-b border-gray-200 px-4 py-3 rounded-t ${stereotypeColor}`}>
        {/* Stereotypes */}
        {data.stereotypes && data.stereotypes.length > 0 && (
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center space-x-1 text-xs">
              {getStereotypeIcon(primaryStereotype)}
              <span className="font-medium">
                {'<<' + data.stereotypes.join(', ') + '>>'}
              </span>
            </div>
          </div>
        )}

        {/* Class Name */}
        <div className="font-bold text-center text-sm">
          {data.name}
        </div>
      </div>

      {/* Sección de Atributos */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-4 py-3">
          {data.attributes && data.attributes.length > 0 ? (
            <div className="space-y-2">
              {data.attributes.map((attr, index) => (
                <div key={index} className="flex items-start text-xs font-mono">
                  <div className="flex items-center space-x-1 min-w-0 flex-1">
                    {/* Visibility (for attributes, usually omitted or + for public) */}
                    <span className="text-gray-600">+</span>

                    {/* Attribute Name */}
                    <span className={`font-medium ${
                      attr.stereotype === 'id' ? 'text-gray-700 font-bold' : 'text-gray-700'
                    }`}>
                      {attr.name}
                    </span>

                    {/* Type */}
                    <span className="text-gray-600">:</span>
                    <span className="text-gray-700 font-medium">{attr.type}</span>

                    {/* Constraints */}
                    {attr.stereotype === 'id' && (
                      <span className="text-gray-600 text-xs bg-gray-200 px-1 rounded">PK</span>
                    )}
                    {attr.stereotype === 'fk' && (
                      <span className="text-blue-600 text-xs bg-blue-100 px-1 rounded">FK</span>
                    )}
                    {attr.unique && attr.stereotype !== 'id' && attr.stereotype !== 'fk' && (
                      <span className="text-gray-600 text-xs bg-gray-200 px-1 rounded">UK</span>
                    )}
                    {!attr.nullable && attr.stereotype !== 'id' && attr.stereotype !== 'fk' && (
                      <span className="text-gray-600 text-xs">*</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic text-center py-2">Sin atributos</div>
          )}
        </div>
      </div>

      {/* Sección de Métodos */}
      <div className="px-4 py-3 bg-white rounded-b">
        {data.methods && data.methods.length > 0 ? (
          <div className="space-y-2">
            {data.methods.map((method, index) => (
              <div key={index} className="text-xs font-mono">
                <div className="flex items-start space-x-1">
                  {/* Visibility Symbol */}
                  {getVisibilitySymbol(method.visibility)}

                  {/* Method Name and Parameters */}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-800">{method.name}</span>
                    <span className="text-gray-600">(</span>
                    <span className="text-gray-600">
                      {method.parameters?.map(p => `${p.name}: ${p.type}`).join(', ')}
                    </span>
                    <span className="text-gray-600">)</span>
                    <span className="text-gray-600">: </span>
                    <span className="text-gray-700 font-medium">{method.returnType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic text-center py-2">Sin métodos</div>
        )}
      </div>

      {/* Puntos de Conexión - 2 handles por lado: 1 source + 1 target */}
      {/* Source (salida) y Target (entrada) separados claramente */}

      {/* RIGHT - Source arriba, Target abajo */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-3 h-3 border-2 border-blue-400 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-125 transition-all"
        style={{ right: -6, top: '35%' }}
        title="Salida"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="w-3 h-3 border-2 border-green-400 bg-green-600 rounded-full hover:bg-green-700 hover:scale-125 transition-all"
        style={{ right: -6, top: '65%' }}
        title="Entrada"
      />

      {/* LEFT - Source arriba, Target abajo */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-3 h-3 border-2 border-blue-400 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-125 transition-all"
        style={{ left: -6, top: '35%' }}
        title="Salida"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-3 h-3 border-2 border-green-400 bg-green-600 rounded-full hover:bg-green-700 hover:scale-125 transition-all"
        style={{ left: -6, top: '65%' }}
        title="Entrada"
      />

      {/* BOTTOM - Source izquierda, Target derecha */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-3 h-3 border-2 border-blue-400 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-125 transition-all"
        style={{ bottom: -6, left: '35%' }}
        title="Salida"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3 h-3 border-2 border-green-400 bg-green-600 rounded-full hover:bg-green-700 hover:scale-125 transition-all"
        style={{ bottom: -6, left: '65%' }}
        title="Entrada"
      />

      {/* TOP - Source izquierda, Target derecha */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3 h-3 border-2 border-blue-400 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-125 transition-all"
        style={{ top: -6, left: '35%' }}
        title="Salida"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-3 h-3 border-2 border-green-400 bg-green-600 rounded-full hover:bg-green-700 hover:scale-125 transition-all"
        style={{ top: -6, left: '65%' }}
        title="Entrada"
      />
    </div>
  );
});

UMLClassNode.displayName = 'UMLClassNode';

export default UMLClassNode;