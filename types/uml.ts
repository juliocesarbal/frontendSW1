export interface UMLClass {
  id: string;
  name: string;
  position: { x: number; y: number };
  attributes: UMLAttribute[];
  methods: UMLMethod[];
}

export interface UMLAttribute {
  id: string;
  name: string;
  type: string;
  multiplicity?: string;
  stereotype?: string;
  nullable: boolean;
  unique: boolean;
}

export interface UMLMethod {
  id: string;
  name: string;
  returnType: string;
  parameters: Parameter[];
  visibility: 'public' | 'private' | 'protected';
}

export interface Parameter {
  name: string;
  type: string;
}

export enum RelationType {
  ASSOCIATION = 'ASSOCIATION',
  INHERITANCE = 'INHERITANCE',
  COMPOSITION = 'COMPOSITION',
  AGGREGATION = 'AGGREGATION',
  DEPENDENCY = 'DEPENDENCY',
  REALIZATION = 'REALIZATION',
}

export interface UMLRelation {
  id: string;
  type: RelationType;
  multiplicity?: string;
  name?: string;
  sourceClassId: string;
  targetClassId: string;
}

export interface Diagram {
  id: string;
  name: string;
  data: {
    classes: UMLClass[];
    relations: UMLRelation[];
    metadata?: any;
  };
  version: number;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
}