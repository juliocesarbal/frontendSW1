import { User } from './auth';

export enum Role {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  owner: User;
  collaborators: WorkspaceCollaborator[];
  _count: {
    collaborators: number;
    diagrams: number;
  };
}

export interface WorkspaceCollaborator {
  id: string;
  role: Role;
  joinedAt: string;
  user: User;
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}