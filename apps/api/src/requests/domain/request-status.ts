export const REQUEST_STATUSES = [
  'accepted',
  'in_calculation',
  'quote_ready',
  'invoice_issued',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  accepted: 'Принят',
  in_calculation: 'В расчёте',
  quote_ready: 'КП готово',
  invoice_issued: 'Счёт выставлен',
};

export const REQUEST_FILE_KINDS = ['questionnaire', 'quote', 'invoice'] as const;

export type RequestFileKind = (typeof REQUEST_FILE_KINDS)[number];

export const PLANT_NAME = 'ПК «Нордщит»';

export function isRequestStatus(value: string): value is RequestStatus {
  return (REQUEST_STATUSES as readonly string[]).includes(value);
}

export function isRequestFileKind(value: string): value is RequestFileKind {
  return (REQUEST_FILE_KINDS as readonly string[]).includes(value);
}

const NEXT_REQUEST_STATUS: Record<RequestStatus, RequestStatus | null> = {
  accepted: 'in_calculation',
  in_calculation: 'quote_ready',
  quote_ready: 'invoice_issued',
  invoice_issued: null,
};

export function nextRequestStatus(status: RequestStatus): RequestStatus | null {
  return NEXT_REQUEST_STATUS[status];
}
