'use client';

import React from 'react';
import {
  Plus,
  Save,
  Edit3,
  Download,
  Zap,
  Users,
  MessageCircle,
  Undo,
  Redo,
  Grid,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface UMLToolbarProps {
  onAddClass: () => void;
  onSave: () => void;
  onEditClass: () => void;
  hasSelectedNode: boolean;
  isConnected: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onGenerateCode?: () => void;
  onOpenChat?: () => void;
}

export default function UMLToolbar({
  onAddClass,
  onSave,
  onEditClass,
  hasSelectedNode,
  isConnected,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onGenerateCode,
  onOpenChat,
}: UMLToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left Section - Main Tools */}
      <div className="flex items-center space-x-1">
        {/* Add Class */}
        <button
          onClick={onAddClass}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          title="Add New Class (Double-click canvas)"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Class</span>
        </button>

        {/* Edit Class */}
        <button
          onClick={onEditClass}
          disabled={!hasSelectedNode}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
            hasSelectedNode
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Edit Selected Class"
        >
          <Edit3 size={16} />
          <span className="hidden sm:inline">Edit</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={onRedo}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Redo"
        >
          <Redo size={16} />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* Zoom Controls */}
        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={onFitView}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Fit to View"
        >
          <Grid size={16} />
        </button>
      </div>

      {/* Center Section - Status */}
      <div className="flex items-center space-x-4">
        {/* Collaboration Status */}
        <div className="flex items-center space-x-2">
          <Users size={16} className={isConnected ? 'text-green-600' : 'text-red-600'} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Collaborating' : 'Offline'}
          </span>
        </div>

        {/* AI Chat Button */}
        <button
          onClick={onOpenChat}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          title="Open AI Chat"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">AI Chat</span>
        </button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-1">
        {/* Generate Code */}
        <button
          onClick={onGenerateCode}
          className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          title="Generate Spring Boot Code"
        >
          <Zap size={16} />
          <span className="hidden sm:inline">Generate Code</span>
        </button>

        {/* Export */}
        <button
          className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          title="Export Diagram"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          title="Save Diagram"
        >
          <Save size={16} />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>
    </div>
  );
}