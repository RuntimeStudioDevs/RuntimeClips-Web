// RuntimeClips-Web — Definiciones de tipos del Pipeline y Entorno Habbo Hotel

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';
export type PipelineStatus = 'idle' | 'running' | 'completed' | 'error';

export interface PipelineNode {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  index?: number;
  branchId?: string;
  status: NodeStatus;
  progress: number;
  startedAt: number | null;
  finishedAt: number | null;
  durationMs: number | null;
  data: any;
  error: string | null;
}

export interface PipelineEdge {
  from: string;
  to: string;
}

export interface LogEntry {
  id: number;
  ts: number;
  level: 'info' | 'warn' | 'error' | 'success';
  node: string | null;
  message: string;
}

export interface ClipData {
  id: string;
  branchId: string;
  score: number;
  scorePercent: number;
  title: string;
  startClock?: string;
  endClock?: string;
  startSec?: number;
  endSec?: number;
  durationSec: number;
  sizeMb?: string | number;
  file?: string;
  videoUrl?: string;
}

export interface PipelineOutput {
  totalClips: number;
  zipFile: string;
  zipUrl: string;
  zipSizeMb: string | number;
  clips: ClipData[];
  fileName?: string;
  videoUrl?: string;
}

export interface PipelineState {
  runId: string | null;
  status: PipelineStatus;
  url: string | null;
  sourceType: string | null;
  options: Record<string, any>;
  startedAt: number | null;
  finishedAt: number | null;
  error: string | null;
  output: PipelineOutput | null;
}

export interface BrandKit {
  id: string;
  name: string;
  handle?: string;
  palette?: {
    bg: string;
    ink: string;
    accent: string;
    accent2: string;
    card: string;
  };
}

export interface HabboSpeechBubble {
  id: string;
  agentKey: string;
  agentName: string;
  text: string;
  screenX: number;
  screenY: number;
  createdAt: number;
  expiresAt: number;
}
