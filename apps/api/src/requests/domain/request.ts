import type { RequestFileKind, RequestStatus } from './request-status.js';

export interface RequestSpecLine {
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly comment?: string;
}

export interface RequestFileMeta {
  readonly fileName: string;
  readonly kind: RequestFileKind;
  readonly byteSize: number;
  readonly uploadedAt: string;
}

export interface RequestStageHistoryEntry {
  readonly status: RequestStatus;
  readonly reachedAt: string;
}

export interface RequestRecord {
  readonly publicNumber: string;
  readonly counterpartyName: string;
  readonly title: string;
  readonly status: RequestStatus;
  readonly updatedAt: string;
  readonly accessSecretHash: string;
  readonly specLines: readonly RequestSpecLine[];
  readonly files: readonly RequestFileMeta[];
  readonly stageHistory: readonly RequestStageHistoryEntry[];
}

export interface RequestStage {
  readonly status: RequestStatus;
  readonly label: string;
  readonly reachedAt: string | null;
}

export interface DemoLink {
  readonly publicNumber: string;
  readonly counterpartyName: string;
  readonly title: string;
  readonly status: RequestStatus;
  readonly statusLabel: string;
  readonly portalPath: string;
  readonly updatedAt: string;
}

export interface RequestPortalView {
  readonly publicNumber: string;
  readonly counterpartyName: string;
  readonly title: string;
  readonly status: RequestStatus;
  readonly statusLabel: string;
  readonly updatedAt: string;
  readonly plantName: string;
  readonly stages: readonly RequestStage[];
  readonly specLines: readonly RequestSpecLine[];
  readonly files: readonly RequestFileMeta[];
}
