import type { RequestFileKind, RequestStatus } from '../domain/request-status.js';
import type { RequestRecord, RequestSpecLine } from '../domain/request.js';

export const REQUEST_LIVE_COMMAND = Symbol('REQUEST_LIVE_COMMAND');

export interface LiveRequestStateWrite {
  readonly status: RequestStatus;
  readonly updatedAt: Date;
  readonly files: readonly {
    readonly fileName: string;
    readonly kind: RequestFileKind;
    readonly byteSize: number;
    readonly uploadedAt: Date;
    readonly specLines: readonly RequestSpecLine[];
  }[];
  readonly stageHistory: readonly {
    readonly status: RequestStatus;
    readonly reachedAt: Date;
  }[];
}

export type LiveAdvanceApply = (current: RequestRecord) => LiveRequestStateWrite | 'conflict';

export interface RequestLiveCommandPort {
  replaceLive(write: LiveRequestStateWrite): Promise<RequestRecord | null>;
  applyLiveAdvance(apply: LiveAdvanceApply): Promise<RequestRecord | null | 'conflict'>;
}
