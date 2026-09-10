import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routeParamValue } from '../app/utils/route-param-value.ts';

describe('routeParamValue', () => {
  it('does not decode a Vue Router param a second time', () => {
    assert.equal(routeParamValue('file%2Fname.pdf'), 'file%2Fname.pdf');
  });

  it('leaves a cyrillic seed file name unchanged', () => {
    assert.equal(routeParamValue('КП-З-10043.pdf'), 'КП-З-10043.pdf');
  });

  it('uses the first array element and maps undefined to an empty string', () => {
    assert.equal(routeParamValue(['a.pdf']), 'a.pdf');
    assert.equal(routeParamValue(undefined), '');
  });
});
