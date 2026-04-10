export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Decision {
  id: string;
  title: string;
  description?: string;
  confidence: number;
  status: 'draft' | 'active' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

export type CanvasNodeType = 'rect' | 'ellipse' | 'diamond' | 'triangle' | 'text' | 'sticky';

export type DecisionNodeType = 'safe' | 'risk' | 'conflict' | 'info' | 'decision';

export interface CanvasNode {
  id: string;
  label: string;
  type: CanvasNodeType;
  nodeType: DecisionNodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  locked?: boolean;
  visible?: boolean;
  rotation?: number;
  timestamp: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Insight {
  id: string;
  type: 'confidence' | 'source' | 'conflict';
  title: string;
  body: string;
  confidence: number;
  sourceIds: string[];
  resolved: boolean;
  data: {
    score?: number;
    sources?: Array<{title: string; highlight: string; page: string; icon: string;}>;
  };
  createdAt: Date;
  updatedAt: Date;
}
