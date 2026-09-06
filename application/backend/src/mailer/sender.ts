// Sender parser shared by both providers. Kept apart from provider.ts so the
// interface module stays interface-only, and out of either provider so neither
// depends on the other.
export function extractAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/)
  return match ? match[1] : sender
}
