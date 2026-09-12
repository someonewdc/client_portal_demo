import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';

import type { RequestCatalogEntry } from './request-catalog.js';
import type { ConductorSnapshot, RequestFileMeta, RequestRecord } from './request.js';
import type { RequestFileKind, RequestStatus } from './request-status.js';
import { nextRequestStatus, REQUEST_STATUS_LABELS } from './request-status.js';

export const LIVE_REQUEST_PUBLIC_NUMBER = 'З-10046';
export const LIVE_REQUEST_ACCESS_SECRET = 'seed-z10046-live-severnaya-duga';

const LIVE_ACCESS_SECRET_HASH = hashOpaqueToken(LIVE_REQUEST_ACCESS_SECRET);

export const LIVE_QUESTIONNAIRE_FILE = {
  fileName: 'Опросный-лист-З-10046.pdf',
  kind: 'questionnaire' as const satisfies RequestFileKind,
  byteSize: 100000,
};

export const LIVE_QUOTE_FILE = {
  fileName: 'КП-З-10046.pdf',
  kind: 'quote' as const satisfies RequestFileKind,
  byteSize: 240000,
};

export const LIVE_INVOICE_FILE = {
  fileName: 'Счёт-З-10046.pdf',
  kind: 'invoice' as const satisfies RequestFileKind,
  byteSize: 180000,
};

export function isLiveRequestPublicNumber(publicNumber: string): boolean {
  return publicNumber === LIVE_REQUEST_PUBLIC_NUMBER;
}

export function isAllowedLiveRequestExtra(record: {
  readonly publicNumber: string;
  readonly accessSecretHash: string;
}): boolean {
  return (
    record.publicNumber === LIVE_REQUEST_PUBLIC_NUMBER &&
    record.accessSecretHash === LIVE_ACCESS_SECRET_HASH
  );
}

export function liveFilesForStatus(status: RequestStatus, now: Date): readonly RequestFileMeta[] {
  const uploadedAt = now.toISOString();
  const questionnaire = { ...LIVE_QUESTIONNAIRE_FILE, uploadedAt };
  if (status === 'accepted' || status === 'in_calculation') {
    return [questionnaire];
  }
  const quote = { ...LIVE_QUOTE_FILE, uploadedAt };
  if (status === 'quote_ready') {
    return [questionnaire, quote];
  }
  return [questionnaire, quote, { ...LIVE_INVOICE_FILE, uploadedAt }];
}

export function mergeLiveFilesAfterAdvance(
  current: RequestRecord,
  nextStatus: RequestStatus,
  now: Date,
): readonly RequestFileMeta[] {
  return liveFilesForStatus(nextStatus, now).map((wanted) => {
    const existing = current.files.find((file) => file.fileName === wanted.fileName);
    return existing ?? wanted;
  });
}

export function toConductorSnapshot(record: RequestRecord): ConductorSnapshot {
  const nextStatus = nextRequestStatus(record.status);
  return {
    publicNumber: record.publicNumber,
    status: record.status,
    statusLabel: REQUEST_STATUS_LABELS[record.status],
    portalPath: `/r/${LIVE_REQUEST_ACCESS_SECRET}`,
    nextStatus,
    nextStatusLabel: nextStatus === null ? null : REQUEST_STATUS_LABELS[nextStatus],
  };
}

export function liveRequestAcceptedFixture(now: Date): RequestCatalogEntry {
  const iso = now.toISOString();
  return {
    publicNumber: LIVE_REQUEST_PUBLIC_NUMBER,
    counterpartyName: 'ООО «Северная дуга»',
    title: 'Щит ЩО-70 показа',
    status: 'accepted',
    accessSecret: LIVE_REQUEST_ACCESS_SECRET,
    updatedAt: iso,
    stageHistory: [{ status: 'accepted', reachedAt: iso }],
    specLines: [
      {
        name: 'Щит ЩО-70 800 А IP54',
        quantity: 1,
        unit: 'шт',
        comment: 'навесной, показ',
      },
      { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
    ],
    files: [...liveFilesForStatus('accepted', now)],
  };
}
