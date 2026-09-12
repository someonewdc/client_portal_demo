import type { RequestRecord, RequestSummary } from '../domain/request.js';
import { isRequestFileKind, isRequestStatus } from '../domain/request-status.js';

interface PrismaRequestSummaryRow {
  readonly publicNumber: string;
  readonly counterpartyName: string;
  readonly title: string;
  readonly status: string;
  readonly updatedAt: Date;
  readonly accessSecretHash: string;
}

interface PrismaRequestRow extends PrismaRequestSummaryRow {
  readonly specLines: readonly {
    readonly name: string;
    readonly quantity: number;
    readonly unit: string;
    readonly comment: string | null;
  }[];
  readonly files: readonly {
    readonly fileName: string;
    readonly kind: string;
    readonly byteSize: number;
    readonly uploadedAt: Date;
    readonly specLines: readonly {
      readonly name: string;
      readonly quantity: number;
      readonly unit: string;
      readonly comment: string | null;
    }[];
  }[];
  readonly stageHistory: readonly {
    readonly status: string;
    readonly reachedAt: Date;
  }[];
}

function requireStatus(value: string) {
  if (!isRequestStatus(value)) {
    throw new Error('Stored request status is not in the catalog enum');
  }
  return value;
}

function requireFileKind(value: string) {
  if (!isRequestFileKind(value)) {
    throw new Error('Stored request file kind is not in the catalog enum');
  }
  return value;
}

export function mapRequestSummary(row: PrismaRequestSummaryRow): RequestSummary {
  return {
    publicNumber: row.publicNumber,
    counterpartyName: row.counterpartyName,
    title: row.title,
    status: requireStatus(row.status),
    updatedAt: row.updatedAt.toISOString(),
    accessSecretHash: row.accessSecretHash,
  };
}

export function mapRequestRecord(row: PrismaRequestRow): RequestRecord {
  return {
    ...mapRequestSummary(row),
    specLines: row.specLines.map((line) => ({
      name: line.name,
      quantity: line.quantity,
      unit: line.unit,
      ...(line.comment === null ? {} : { comment: line.comment }),
    })),
    files: row.files.map((file) => ({
      fileName: file.fileName,
      kind: requireFileKind(file.kind),
      byteSize: file.byteSize,
      uploadedAt: file.uploadedAt.toISOString(),
      specLines: file.specLines.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        ...(line.comment === null ? {} : { comment: line.comment }),
      })),
    })),
    stageHistory: row.stageHistory.map((entry) => ({
      status: requireStatus(entry.status),
      reachedAt: entry.reachedAt.toISOString(),
    })),
  };
}
