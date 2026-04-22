interface Subscription {
  plan: string
  current_period_end: string | null
}

export function isPro(sub: Subscription | null): boolean {
  if (!sub || sub.plan !== 'pro') return false
  if (!sub.current_period_end) return false
  return new Date(sub.current_period_end) > new Date()
}
