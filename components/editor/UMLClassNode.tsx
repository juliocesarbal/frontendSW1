'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UMLClass } from '@/types/uml';

interface UMLClassNodeData extends UMLClass {
  isSelected?: boolean;
  isBeingEdited?: boolean;
}

const UMLClassNode = memo(({ data, selected }: NodeProps<UMLClassNodeData>) => {
  return (
    <div
      className={`bg-white border-2 rounded-lg shadow-lg min-w-[200px] ${
        selected ? 'border-blue-500' : 'border-gray-300'
      } ${data.isBeingEdited ? 'ring-2 ring-yellow-400' : ''}`}
    >
      {/* Class Header */}
      <div className="bg-blue-50 border-b border-gray-200 px-3 py-2 rounded-t-lg">
        <div className="font-semibold text-gray-900 text-center">
          {data.name}
        </div>
        {/* Stereotypes */}
        {data.stereotypes && data.stereotypes.length > 0 && (
          <div className="text-xs text-gray-600 text-center mt-1">
            {'<<' + data.stereotypes.join(', ') + '>>'}
          </div>
        )}
      </div>

      {/* Attributes Section */}
      <div className="border-b border-gray-200">
        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-700 mb-1">Attributes</div>
          {data.attributes && data.attributes.length > 0 ? (
            <div className="space-y-1">
              {data.attributes.map((attr, index) => (
                <div key={index} className="text-xs font-mono text-gray-800">
                  <span className={attr.stereotype === 'id' ? 'text-blue-600 font-semibold' : ''}>
                    {attr.name}: {attr.type}
                    {attr.multiplicity && ` [${attr.multiplicity}]`}
                    {attr.stereotype && attr.stereotype !== 'id' && ` {${attr.stereotype}}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No attributes</div>
          )}
        </div>
      </div>

      {/* Methods Section */}
      <div className="px-3 py-2">
        <div className="text-xs font-medium text-gray-700 mb-1">Methods</div>
        {data.methods && data.methods.length > 0 ? (
          <div className="space-y-1">
            {data.methods.map((method, index) => (
              <div key={index} className="text-xs font-mono text-gray-800">
                <span className="text-green-600">
                  {method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+'}
                </span>
                <span className="ml-1">
                  {method.name}({method.parameters?.map(p => `${p.name}: ${p.type}`).join(', ')}): {method.returnType}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No methods</div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#3b82f6', width: 8, height: 8 }}
      />
    </div>
  );
});

UMLClassNode.displayName = 'UMLClassNode';

export default UMLClassNode;