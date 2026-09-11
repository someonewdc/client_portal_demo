import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { requestNextStepPhrase } from '../app/utils/request-next-step.ts';

describe('request next-step phrase', () => {
  it('maps each catalog status to a fixed Russian next-step sentence', () => {
    assert.equal(requestNextStepPhrase('accepted'), 'Заявку приняли. Сейчас готовят расчёт.');
    assert.equal(
      requestNextStepPhrase('in_calculation'),
      'Идёт расчёт. Коммерческое предложение ещё не готово.',
    );
    assert.equal(
      requestNextStepPhrase('quote_ready'),
      'Коммерческое предложение готово. Счёт ещё не выставлен.',
    );
    assert.equal(
      requestNextStepPhrase('invoice_issued'),
      'Счёт выставлен. Оплата в этом окне не принимается.',
    );
  });

  it('throws on an unknown status instead of an empty phrase', () => {
    assert.throws(() => requestNextStepPhrase('paid'), /Unknown request status: paid/);
  });
});
