const REQUEST_NEXT_STEP_PHRASES = {
  accepted: 'Заявку приняли. Сейчас готовят расчёт.',
  in_calculation: 'Идёт расчёт. Коммерческое предложение ещё не готово.',
  quote_ready: 'Коммерческое предложение готово. Счёт ещё не выставлен.',
  invoice_issued: 'Счёт выставлен. Оплата на этой странице не принимается.',
} as const;

type KnownRequestStatus = keyof typeof REQUEST_NEXT_STEP_PHRASES;

export function requestNextStepPhrase(status: string): string {
  return REQUEST_NEXT_STEP_PHRASES[requireKnownRequestStatus(status)];
}

function requireKnownRequestStatus(status: string): KnownRequestStatus {
  if (!isKnownRequestStatus(status)) {
    throw new Error(`Unknown request status: ${status}`);
  }

  return status;
}

function isKnownRequestStatus(status: string): status is KnownRequestStatus {
  return Object.hasOwn(REQUEST_NEXT_STEP_PHRASES, status);
}
