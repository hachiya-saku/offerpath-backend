import { normalizeCompanyName } from './company-name';

describe('normalizeCompanyName', () => {
  it('should normalize company names', () => {
    expect(normalizeCompanyName('OFFERPATH INC.')).toBe('offerpath inc.');
    expect(normalizeCompanyName('  OfferPath Inc.  ')).toBe('offerpath inc.');
    expect(normalizeCompanyName('  Ｇｏｏｇｌｅ   Japan  ')).toBe(
      'google japan',
    );
  });
});
