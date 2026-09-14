import { extractAddress } from './sender'

describe('extractAddress', () => {
  it('extracts email from display-name-plus-brackets format', () => {
    expect(extractAddress('CTRL <ctrl-noreply@garvan.org.au>')).toBe('ctrl-noreply@garvan.org.au')
  })

  it('returns input unchanged for a bare email', () => {
    expect(extractAddress('noreply@example.com')).toBe('noreply@example.com')
  })
})
