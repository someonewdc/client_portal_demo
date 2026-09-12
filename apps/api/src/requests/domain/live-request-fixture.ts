import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';

import type { RequestCatalogEntry } from './request-catalog.js';

export const LIVE_REQUEST_PUBLIC_NUMBER = 'З-10046';
export const LIVE_REQUEST_ACCESS_SECRET = 'seed-z10046-live-severnaya-duga';

const LIVE_ACCESS_SECRET_HASH = hashOpaqueToken(LIVE_REQUEST_ACCESS_SECRET);

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
    files: [
      {
        fileName: 'Опросный-лист-З-10046.pdf',
        kind: 'questionnaire',
        byteSize: 100000,
        uploadedAt: iso,
      },
    ],
  };
}
