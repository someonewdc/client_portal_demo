import { hashOpaqueToken } from '@client-portal/platform-core/opaque-token';

import type { RequestFileMeta, RequestSpecLine, RequestStageHistoryEntry } from './request.js';
import type { RequestStatus } from './request-status.js';

export interface RequestCatalogEntry {
  readonly publicNumber: string;
  readonly counterpartyName: string;
  readonly title: string;
  readonly status: RequestStatus;
  readonly accessSecret: string;
  readonly updatedAt: string;
  readonly stageHistory: readonly RequestStageHistoryEntry[];
  readonly specLines: readonly RequestSpecLine[];
  readonly files: readonly RequestFileMeta[];
}

export const REQUEST_CATALOG: readonly RequestCatalogEntry[] = [
  {
    publicNumber: 'З-10041',
    counterpartyName: 'ООО «Северэнергомонтаж»',
    title: 'Щит ЩО-70 800 А',
    status: 'accepted',
    accessSecret: 'seed-z10041-accepted-severenergo',
    updatedAt: '2026-09-01T10:00:00.000Z',
    stageHistory: [{ status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' }],
    specLines: [
      { name: 'Щит ЩО-70 800 А IP54', quantity: 1, unit: 'шт', comment: 'навесной' },
      { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'Опросный-лист-З-10041.pdf',
        kind: 'questionnaire',
        byteSize: 98000,
        uploadedAt: '2026-09-01T09:05:00.000Z',
      },
    ],
  },
  {
    publicNumber: 'З-10042',
    counterpartyName: 'АО «ПортЛайн»',
    title: 'НКУ освещения причала',
    status: 'in_calculation',
    accessSecret: 'seed-z10042-calc-portline',
    updatedAt: '2026-09-02T11:00:00.000Z',
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
    ],
    specLines: [
      { name: 'НКУ освещения причала', quantity: 1, unit: 'шт' },
      { name: 'Шкаф учёта', quantity: 2, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'Опросный-лист-З-10042.pdf',
        kind: 'questionnaire',
        byteSize: 102000,
        uploadedAt: '2026-09-01T09:10:00.000Z',
      },
    ],
  },
  {
    publicNumber: 'З-10043',
    counterpartyName: 'ИП Кузнецов П.А.',
    title: 'ВРУ 400 А',
    status: 'quote_ready',
    accessSecret: 'seed-z10043-quote-kuznetsov',
    updatedAt: '2026-09-04T12:00:00.000Z',
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', reachedAt: '2026-09-04T12:00:00.000Z' },
    ],
    specLines: [
      {
        name: 'Вводно-распределительное устройство 400 А',
        quantity: 1,
        unit: 'шт',
        comment: 'IP54, навесной',
      },
      { name: 'Рубильник ввода', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'Опросный-лист-З-10043.pdf',
        kind: 'questionnaire',
        byteSize: 120400,
        uploadedAt: '2026-09-01T09:05:00.000Z',
      },
      {
        fileName: 'КП-З-10043.pdf',
        kind: 'quote',
        byteSize: 240000,
        uploadedAt: '2026-09-04T12:00:00.000Z',
      },
    ],
  },
  {
    publicNumber: 'З-10044',
    counterpartyName: 'ООО «Теплицы Поволжья»',
    title: 'Щит управления теплицами',
    status: 'invoice_issued',
    accessSecret: 'seed-z10044-invoice-teplitsy',
    updatedAt: '2026-09-06T15:00:00.000Z',
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-02T11:00:00.000Z' },
      { status: 'quote_ready', reachedAt: '2026-09-04T12:00:00.000Z' },
      { status: 'invoice_issued', reachedAt: '2026-09-06T15:00:00.000Z' },
    ],
    specLines: [
      { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
      { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'Опросный-лист-З-10044.pdf',
        kind: 'questionnaire',
        byteSize: 110000,
        uploadedAt: '2026-09-01T09:05:00.000Z',
      },
      {
        fileName: 'КП-З-10044.pdf',
        kind: 'quote',
        byteSize: 256000,
        uploadedAt: '2026-09-04T12:00:00.000Z',
      },
      {
        fileName: 'Счёт-З-10044.pdf',
        kind: 'invoice',
        byteSize: 180000,
        uploadedAt: '2026-09-06T15:00:00.000Z',
      },
    ],
  },
  {
    publicNumber: 'З-10045',
    counterpartyName: 'ЗАО «Горсвет»',
    title: 'Шкафы наружного освещения',
    status: 'in_calculation',
    accessSecret: 'seed-z10045-calc-gorsvet',
    updatedAt: '2026-09-03T14:00:00.000Z',
    stageHistory: [
      { status: 'accepted', reachedAt: '2026-09-01T09:00:00.000Z' },
      { status: 'in_calculation', reachedAt: '2026-09-03T14:00:00.000Z' },
    ],
    specLines: [
      { name: 'Шкаф управления наружным освещением', quantity: 3, unit: 'шт' },
      { name: 'Блок учёта', quantity: 1, unit: 'шт' },
    ],
    files: [
      {
        fileName: 'Опросный-лист-З-10045.pdf',
        kind: 'questionnaire',
        byteSize: 99000,
        uploadedAt: '2026-09-01T09:20:00.000Z',
      },
    ],
  },
];

const SECRET_BY_HASH = new Map(
  REQUEST_CATALOG.map((entry) => [hashOpaqueToken(entry.accessSecret), entry.accessSecret]),
);

export function fixtureSecretForHash(accessSecretHash: string): string | undefined {
  return SECRET_BY_HASH.get(accessSecretHash);
}
