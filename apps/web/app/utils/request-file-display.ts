const FILE_KIND_LABELS = {
  invoice: 'Счёт',
  questionnaire: 'Опросный лист',
  quote: 'КП',
} as const;

const FILE_SHEET_LEADS = {
  invoice: 'Счёт.',
  questionnaire: 'Исходные требования.',
  quote: 'Коммерческое предложение.',
} as const;

type KnownFileKind = keyof typeof FILE_KIND_LABELS;

export function fileKindLabel(kind: string): string {
  return FILE_KIND_LABELS[requireKnownFileKind(kind)];
}

export function fileSheetLead(kind: string): string {
  return FILE_SHEET_LEADS[requireKnownFileKind(kind)];
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
