'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Calendar, FileText, ArrowLeft, Settings, Share } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useWorkspaceStore } from '@/stores/workspace';
import { diagramAPI } from '@/lib/api';
import { Diagram } from '@/types/uml';

interface WorkspacePageProps {
  params: {
    workspaceId: string;
  };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentWorkspace, fetchWorkspaceById, isLoading } = useWorkspaceStore();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWorkspaceById(params.workspaceId);
  }, [params.workspaceId, user, router, fetchWorkspaceById]);

  useEffect(() => {
    if (currentWorkspace?.diagrams) {
      // Ensure all diagrams have the required data structure
      const validDiagrams = currentWorkspace.diagrams.map(diagram => ({
        ...diagram,
        data: diagram.data || { classes: [], relations: [] }
      }));
      setDiagrams(validDiagrams);
    }
  }, [currentWorkspace]);

  const handleCreateDiagram = async () => {
    if (!newDiagramName.trim() || !user) return;

    try {
      setIsCreatingDiagram(true);
      const newDiagram = await diagramAPI.createDiagram(params.workspaceId, newDiagramName);
      setDiagrams(prev => [newDiagram, ...prev]);
      setNewDiagramName('');

      // Navigate to the new diagram
      router.push(`/workspace/${params.workspaceId}/diagram/${newDiagram.id}`);
    } catch (error: any) {
      console.error('Error creating diagram:', error);
      alert(error.response?.data?.message || 'Failed to create diagram');
    } finally {
      setIsCreatingDiagram(false);
    }
  };

  const handleDiagramClick = (diagramId: string) => {
    router.push(`/workspace/${params.workspaceId}/diagram/${diagramId}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isLoading || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Workspace</h2>
          <p className="text-gray-600">Please wait while we load your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{currentWorkspace.name}</h1>
                <p className="text-gray-600">{currentWorkspace.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                <Share size={16} />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Workspace Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Diagrams</dt>
                      <dd className="text-lg font-medium text-gray-900">{diagrams.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Collaborators</dt>
                      <dd className="text-lg font-medium text-gray-900">{currentWorkspace.collaborators.length + 1}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Created</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create New Diagram */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Create New Diagram
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newDiagramName}
                  onChange={(e) => setNewDiagramName(e.target.value)}
                  placeholder="Enter diagram name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateDiagram()}
                />
                <button
                  onClick={handleCreateDiagram}
                  disabled={!newDiagramName.trim() || isCreatingDiagram}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreatingDiagram ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus size={16} />
                  )}
                  <span>Create Diagram</span>
                </button>
              </div>
            </div>
          </div>

          {/* Diagrams List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                UML Diagrams
              </h3>

              {diagrams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No diagrams</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first UML diagram.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {diagrams.map((diagram) => (
                    <div
                      key={diagram.id}
                      onClick={() => handleDiagramClick(diagram.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">{diagram.name}</h4>
                        <span className="text-xs text-gray-500">v{diagram.version}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {diagram.data?.classes?.length || 0} classes •{' '}
                        {diagram.data?.relations?.length || 0} relations
                      </div>
                      <div className="text-xs text-gray-400">
                        Updated {new Date(diagram.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Collaborators */}
          {currentWorkspace.collaborators.length > 0 && (
            <div className="bg-white shadow rounded-lg mt-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Collaborators
                </h3>
                <div className="space-y-3">
                  {/* Owner */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {currentWorkspace.owner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{currentWorkspace.owner.name}</p>
                        <p className="text-xs text-gray-500">{currentWorkspace.owner.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Owner</span>
                  </div>

                  {/* Collaborators */}
                  {currentWorkspace.collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {collaborator.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{collaborator.user.name}</p>
                          <p className="text-xs text-gray-500">{collaborator.user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 font-medium capitalize">{collaborator.role.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}