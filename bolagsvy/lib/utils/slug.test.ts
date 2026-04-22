import { toSlug, orgNumberFromSlug } from './slug'

describe('toSlug', () => {
  it('converts company name and org number to URL-safe slug', () => {
    expect(toSlug('Spotify AB', '556703-7485')).toBe('spotify-ab-5567037485')
  })

  it('handles Swedish characters', () => {
    expect(toSlug('Åkeri & Söner AB', '123456-7890')).toBe('akeri-soner-ab-1234567890')
  })

  it('handles extra spaces and symbols', () => {
    expect(toSlug('  Foo  Bar!  ', '111111-1111')).toBe('foo-bar-1111111111')
  })
})

describe('orgNumberFromSlug', () => {
  it('extracts org number from slug', () => {
    expect(orgNumberFromSlug('spotify-ab-5567037485')).toBe('5567037485')
  })
})
