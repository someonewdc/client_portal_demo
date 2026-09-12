const FILE_KIND_LABELS = {
  invoice: 'Счёт',
  questionnaire: 'Опросный лист',
  quote: 'КП',
} as const;

const FILE_SHEET_LEADS = {
  invoice: 'Выставленный счёт.',
  questionnaire: 'Исходные требования.',
  quote: 'Коммерческое предложение.',
} as const;

const FILE_SHEET_EXTRACT_COPY = {
  invoice: {
    closing: 'Счёт выставлен. Оплата на этой странице не принимается.',
    followOn:
      'Ниже — позиции выставленного счёта. Это не коммерческое предложение и не опросный лист.',
    tableCaption: 'Позиции счёта',
  },
  questionnaire: {
    closing: 'По этим данным завод готовит расчёт. Коммерческого предложения в этом листе нет.',
    followOn:
      'Ниже — состав, который заказчик передал заводу. Это не коммерческое предложение и не счёт.',
    tableCaption: 'Состав заявки',
  },
  quote: {
    closing: 'Это предложение, а не счёт. Счёт выставляется отдельно.',
    followOn: 'Ниже — позиции коммерческого предложения. Это не счёт и не исходный опросный лист.',
    tableCaption: 'Спецификация',
  },
} as const;

type KnownFileKind = keyof typeof FILE_KIND_LABELS;

export function fileKindLabel(kind: string): string {
  return FILE_KIND_LABELS[requireKnownFileKind(kind)];
}

export function fileSheetLead(kind: string): string {
  return FILE_SHEET_LEADS[requireKnownFileKind(kind)];
}

export function fileSheetExtractCopy(
  kind: string,
): (typeof FILE_SHEET_EXTRACT_COPY)[KnownFileKind] {
  return FILE_SHEET_EXTRACT_COPY[requireKnownFileKind(kind)];
}

export type FileSheetSpecLine = {
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly comment?: string;
};

export function fileSheetSpecLines(file: {
  specLines: readonly FileSheetSpecLine[];
}): readonly FileSheetSpecLine[] {
  if (file.specLines.length < 2 || file.specLines.length > 5) {
    throw new Error('Request file sheet specLines must have 2–5 lines');
  }

  return file.specLines;
}

export function formatByteSize(byteSize: number): string {
  return `${Math.round(byteSize / 1000)} КБ`;
}

export function requestFileHref(accessSecret: string, fileName: string): string {
  return `/r/${accessSecret}/d/${encodeURIComponent(fileName)}`;
}

export function formatRequestUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(iso));
}

function requireKnownFileKind(kind: string): KnownFileKind {
  if (!isKnownFileKind(kind)) {
    throw new Error(`Unknown request file kind: ${kind}`);
  }

  return kind;
}

function isKnownFileKind(kind: string): kind is KnownFileKind {
  return Object.hasOwn(FILE_KIND_LABELS, kind);
}
