'use client';

import React, { useState } from 'react';
import { Download, Code, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { codeGenAPI } from '@/lib/api';

interface CodeGenerationPanelProps {
  diagramId: string;
  diagramName: string;
}

export default function CodeGenerationPanel({ diagramId, diagramName }: CodeGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSpringBoot = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      const result = await codeGenAPI.generateSpringBoot(diagramId);

      if (result.success) {
        setGenerationResult(result);
      } else {
        setError(result.error || 'Failed to generate Spring Boot project');
      }
    } catch (error: any) {
      console.error('Code generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate Spring Boot project');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generationResult?.generatedCodeId) return;

    try {
      const blob = await codeGenAPI.downloadProject(generationResult.generatedCodeId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${diagramName.toLowerCase().replace(/\s+/g, '-')}-springboot.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download project');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Code size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Code Generation</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Generate a complete Spring Boot project from your UML diagram.
          </p>

          <button
            onClick={handleGenerateSpringBoot}
            disabled={isGenerating}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
              isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating Project...</span>
              </>
            ) : (
              <>
                <Code size={16} />
                <span>Generate Spring Boot Project</span>
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {generationResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-800 mb-1">
                  Project Generated Successfully!
                </h4>
                <p className="text-xs text-green-700 mb-3">
                  {generationResult.message}
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  <Download size={14} />
                  <span>Download ZIP</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Generation Failed
                </h4>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Features List */}
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Project Includes:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• JPA Entity classes with annotations</li>
            <li>• Repository interfaces (Spring Data JPA)</li>
            <li>• Service layer with CRUD operations</li>
            <li>• REST Controllers with endpoints</li>
            <li>• Spring Boot application configuration</li>
            <li>• Maven build configuration (pom.xml)</li>
            <li>• PostgreSQL database configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}