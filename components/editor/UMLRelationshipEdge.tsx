'use client';

import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

interface UMLRelationshipData {
  label?: string;
  type?: 'ASSOCIATION' | 'AGGREGATION' | 'COMPOSITION' | 'INHERITANCE' | 'DEPENDENCY' | 'REALIZATION';
  multiplicity?: {
    source?: string;
    target?: string;
  };
}

export default function UMLRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  markerStart,
  selected
}: EdgeProps<UMLRelationshipData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8, // Esquinas redondeadas sutiles
  });

  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: selected ? 3 : 2,
      stroke: selected ? '#374151' : '#6b7280',
      ...style
    };

    switch (data?.type) {
      case 'DEPENDENCY':
      case 'REALIZATION':
        return {
          ...baseStyle,
          strokeDasharray: '5,5',
        };
      case 'INHERITANCE':
        return {
          ...baseStyle,
        };
      case 'COMPOSITION':
        return {
          ...baseStyle,
        };
      case 'AGGREGATION':
        return {
          ...baseStyle,
        };
      default: // ASSOCIATION
        return {
          ...baseStyle,
        };
    }
  };

  const getMarkerEnd = () => {
    switch (data?.type) {
      case 'INHERITANCE':
        return 'url(#inheritance-arrow)';
      case 'COMPOSITION':
        return 'url(#composition-diamond)';
      case 'AGGREGATION':
        return 'url(#aggregation-diamond)';
      case 'DEPENDENCY':
      case 'REALIZATION':
        return 'url(#dependency-arrow)';
      default:
        return 'url(#association-arrow)';
    }
  };

  return (
    <>
      {/* SVG Markers Definition */}
      <defs>
        {/* Inheritance Arrow (Empty Triangle) */}
        <marker
          id="inheritance-arrow"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,0 0,12 10,6"
            fill="white"
            stroke="#6b7280"
            strokeWidth="2"
          />
        </marker>

        {/* Composition Diamond (Filled) */}
        <marker
          id="composition-diamond"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,6 4,2 8,6 4,10"
            fill="#6b7280"
            stroke="#6b7280"
            strokeWidth="1"
          />
        </marker>

        {/* Aggregation Diamond (Empty) */}
        <marker
          id="aggregation-diamond"
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0,6 4,2 8,6 4,10"
            fill="white"
            stroke="#6b7280"
            strokeWidth="2"
          />
        </marker>

        {/* Dependency Arrow (Open) */}
        <marker
          id="dependency-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,10 L8,5 z"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
          />
        </marker>

        {/* Association Arrow (Simple) */}
        <marker
          id="association-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,8 L6,4 z"
            fill="#6b7280"
            stroke="#6b7280"
          />
        </marker>
      </defs>

      <BaseEdge
        path={edgePath}
        style={getEdgeStyle()}
        markerEnd={getMarkerEnd()}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 11,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Relationship Label */}
          {data?.label && (
            <div
              className={`px-2 py-1 rounded shadow-sm border text-xs font-medium cursor-pointer hover:shadow transition-all ${
                selected
                  ? 'bg-gray-600 text-white border-gray-700 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              title="Doble clic para editar, Delete para eliminar"
            >
              {data.label}
              {selected && data.type && (
                <div className="text-xs text-gray-200 mt-0.5">
                  {data.type}
                </div>
              )}
            </div>
          )}

          {/* Multiplicity Labels */}
          {data?.multiplicity && (
            <div className="flex justify-between mt-1 space-x-4">
              {data.multiplicity.source && (
                <div className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-700 font-mono border border-gray-300">
                  {data.multiplicity.source}
                </div>
              )}
              {data.multiplicity.target && (
                <div className="bg-gray-100 px-1 py-0.5 rounded text-xs text-gray-700 font-mono border border-gray-300">
                  {data.multiplicity.target}
                </div>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}