export function extractAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/)
  return match ? match[1] : sender
}
