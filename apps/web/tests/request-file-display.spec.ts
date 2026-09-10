import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fileKindLabel, formatByteSize } from '../app/utils/request-file-display.ts';

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
});
