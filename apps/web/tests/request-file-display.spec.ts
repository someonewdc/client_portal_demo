import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  fileKindLabel,
  fileSheetExtractCopy,
  fileSheetLead,
  fileSheetSpecLines,
  formatByteSize,
  requestFileHref,
} from '../app/utils/request-file-display.ts';

describe('request file display', () => {
  it('maps catalog kinds to Russian labels', () => {
    assert.equal(fileKindLabel('questionnaire'), 'Опросный лист');
    assert.equal(fileKindLabel('quote'), 'КП');
    assert.equal(fileKindLabel('invoice'), 'Счёт');
  });

  it('throws on an unknown kind instead of an empty label', () => {
    assert.throws(() => fileKindLabel('other'), /Unknown request file kind: other/);
  });

  it('formats byteSize as rounded decimal kilobytes', () => {
    assert.equal(formatByteSize(240000), '240 КБ');
    assert.equal(formatByteSize(98000), '98 КБ');
    assert.equal(formatByteSize(120400), '120 КБ');
  });

  it('builds a cabinet file sheet href with an encoded file name', () => {
    assert.equal(
      requestFileHref('seed-z10043-quote-kuznetsov', 'КП-З-10043.pdf'),
      `/r/seed-z10043-quote-kuznetsov/d/${encodeURIComponent('КП-З-10043.pdf')}`,
    );
  });

  it('maps catalog kinds to document sheet lead sentences', () => {
    assert.equal(fileSheetLead('questionnaire'), 'Исходные требования.');
    assert.equal(fileSheetLead('quote'), 'Коммерческое предложение.');
    assert.equal(fileSheetLead('invoice'), 'Счёт.');
  });

  it('throws on an unknown kind instead of an empty sheet lead', () => {
    assert.throws(() => fileSheetLead('other'), /Unknown request file kind: other/);
  });

  it('maps catalog kinds to distinct extract bodies beyond the lead', () => {
    const questionnaire = fileSheetExtractCopy('questionnaire');
    const quote = fileSheetExtractCopy('quote');
    const invoice = fileSheetExtractCopy('invoice');

    assert.equal(
      questionnaire.followOn,
      'Ниже — состав, который заказчик передал заводу. Это не коммерческое предложение и не счёт.',
    );
    assert.equal(questionnaire.tableCaption, 'Состав заявки');
    assert.equal(
      questionnaire.closing,
      'По этим данным завод готовит расчёт. Коммерческого предложения в этом листе нет.',
    );

    assert.equal(
      quote.followOn,
      'Ниже — позиции коммерческого предложения. Это не счёт и не исходный опросный лист.',
    );
    assert.equal(quote.tableCaption, 'Спецификация');
    assert.equal(quote.closing, 'Это предложение, не счёт. Счёт выставляется отдельно.');

    assert.equal(
      invoice.followOn,
      'Ниже — позиции выставленного счёта. Это не коммерческое предложение и не опросный лист.',
    );
    assert.equal(invoice.tableCaption, 'Позиции счёта');
    assert.equal(invoice.closing, 'Счёт выставлен. Оплата в этом окне не принимается.');

    assert.notEqual(questionnaire.followOn, quote.followOn);
    assert.notEqual(questionnaire.followOn, invoice.followOn);
    assert.notEqual(quote.followOn, invoice.followOn);
    assert.notEqual(questionnaire.tableCaption, quote.tableCaption);
    assert.notEqual(questionnaire.tableCaption, invoice.tableCaption);
    assert.notEqual(quote.tableCaption, invoice.tableCaption);
    assert.notEqual(questionnaire.closing, quote.closing);
    assert.notEqual(questionnaire.closing, invoice.closing);
    assert.notEqual(quote.closing, invoice.closing);
  });

  it('throws on an unknown kind instead of an empty extract body', () => {
    assert.throws(() => fileSheetExtractCopy('other'), /Unknown request file kind: other/);
  });

  it('reads sheet spec lines from the file, not the request order spec', () => {
    const orderSpec = [
      { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
      { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
    ] as const;
    const questionnaire = fileSheetSpecLines({
      specLines: [
        { name: 'Щит управления теплицами', quantity: 1, unit: 'шт' },
        { name: 'Частотники полива', quantity: 3, unit: 'шт' },
      ],
    });
    const quote = fileSheetSpecLines({
      specLines: [
        { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
        { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
        { name: 'Пульт диспетчера', quantity: 1, unit: 'шт' },
      ],
    });
    const invoice = fileSheetSpecLines({
      specLines: [
        { name: 'Щит управления теплицами', quantity: 1, unit: 'комплект' },
        { name: 'Шкаф частотников', quantity: 1, unit: 'шт' },
      ],
    });

    assert.notDeepEqual(questionnaire, quote);
    assert.notDeepEqual(questionnaire, invoice);
    assert.notDeepEqual(quote, invoice);
    assert.notDeepEqual(questionnaire, [...orderSpec]);
    assert.deepEqual([...invoice], [...orderSpec]);
  });

  it('throws when a file has fewer than two sheet spec lines', () => {
    assert.throws(
      () => fileSheetSpecLines({ specLines: [{ name: 'Щит', quantity: 1, unit: 'шт' }] }),
      /specLines/,
    );
  });
});
