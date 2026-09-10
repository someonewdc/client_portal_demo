const FILE_KIND_LABELS = {
  invoice: 'Счёт',
  questionnaire: 'Опросный лист',
  quote: 'КП',
} as const;

type KnownFileKind = keyof typeof FILE_KIND_LABELS;

export function fileKindLabel(kind: string): string {
  if (!isKnownFileKind(kind)) {
    throw new Error(`Unknown request file kind: ${kind}`);
  }

  return FILE_KIND_LABELS[kind];
}

export function formatByteSize(byteSize: number): string {
  return `${Math.round(byteSize / 1000)} КБ`;
}

function isKnownFileKind(kind: string): kind is KnownFileKind {
  return Object.hasOwn(FILE_KIND_LABELS, kind);
}
