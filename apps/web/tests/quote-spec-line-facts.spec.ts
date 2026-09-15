import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { quoteSpecLineFacts } from '../app/utils/quote-spec-line-facts.ts';

const LIVE_QUESTIONNAIRE_LINES = [
  { name: 'Щит ЩО-70 800 А IP54', quantity: 1, unit: 'шт', comment: 'навесной' },
  { name: 'АВР на вводе', quantity: 1, unit: 'комплект' },
] as const;

const LIVE_QUOTE_LINES = [
  { name: 'Щит ЩО-70 800 А IP54', quantity: 1, unit: 'шт' },
  { name: 'Комплект автоматики ввода', quantity: 1, unit: 'шт' },
  { name: 'Рубильник ввода', quantity: 1, unit: 'шт' },
] as const;

const CANNED_BECAUSE =
  'Автоматическая формулировка: комплект автоматики в расчёте заменяет АВР из опроса; рубильник ввода добавлен в КП и не был в опросе.';

describe('quoteSpecLineFacts', () => {
  it('uses the three D-057 templates and file order', () => {
    const facts = quoteSpecLineFacts(
      [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      [{ name: 'X' }, { name: 'C' }, { name: 'Y' }],
    );

    assert.deepEqual(facts, [
      'В опросе есть «A», в КП этой строки нет.',
      'В опросе есть «B», в КП этой строки нет.',
      'В КП есть «X», в опросе его нет.',
      'В КП есть «Y», в опросе его нет.',
      '«C» есть в опросе и в КП.',
    ]);
  });

  it('compares names exactly', () => {
    const facts = quoteSpecLineFacts([{ name: 'Щит' }], [{ name: 'щит' }]);

    assert.deepEqual(facts, [
      'В опросе есть «Щит», в КП этой строки нет.',
      'В КП есть «щит», в опросе его нет.',
    ]);
  });

  it('returns Z-10046 facts 1:1 for LIVE questionnaire vs quote lines', () => {
    assert.deepEqual(quoteSpecLineFacts(LIVE_QUESTIONNAIRE_LINES, LIVE_QUOTE_LINES), [
      'В опросе есть «АВР на вводе», в КП этой строки нет.',
      'В КП есть «Комплект автоматики ввода», в опросе его нет.',
      'В КП есть «Рубильник ввода», в опросе его нет.',
      '«Щит ЩО-70 800 А IP54» есть в опросе и в КП.',
    ]);
  });

  it('does not emit canned because-copy in the facts function', () => {
    const facts = quoteSpecLineFacts(LIVE_QUESTIONNAIRE_LINES, LIVE_QUOTE_LINES);
    const joined = facts.join('\n');
    assert.equal(joined.includes(CANNED_BECAUSE), false);
    assert.equal(joined.includes('Автоматическая формулировка'), false);

    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../app/utils/quote-spec-line-facts.ts'),
      'utf8',
    );
    assert.equal(source.includes('Автоматическая формулировка'), false);
    assert.equal(source.includes(CANNED_BECAUSE), false);
  });
});
