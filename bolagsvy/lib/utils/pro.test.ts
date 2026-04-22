import { isPro } from './pro'

describe('isPro', () => {
  it('returns true when plan is pro and subscription is active', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    expect(isPro({ plan: 'pro', current_period_end: future })).toBe(true)
  })

  it('returns false when plan is free', () => {
    expect(isPro({ plan: 'free', current_period_end: null })).toBe(false)
  })

  it('returns false when subscription has expired', () => {
    const past = new Date(Date.now() - 86400000).toISOString()
    expect(isPro({ plan: 'pro', current_period_end: past })).toBe(false)
  })

  it('returns false when subscription is null', () => {
    expect(isPro(null)).toBe(false)
  })
})
