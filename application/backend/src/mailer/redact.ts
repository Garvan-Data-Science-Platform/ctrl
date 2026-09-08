// Anything that reaches a log line or an error message goes through here first.
export function redactString(str: string): string {
  return (
    str
      .replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"')
      .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[REDACTED]"')
      .replace(/"(refresh_token|id_token|assertion)"\s*:\s*"[^"]*"/g, '"$1":"[REDACTED]"')
      .replace(
        /\b(client_secret|access_token|refresh_token|id_token|assertion)=[^&\s]+/g,
        '$1=[REDACTED]',
      )
      .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/g, 'Bearer [REDACTED]')
      // bare JWT (token outside its JSON field)
      .replace(/\beyJ[A-Za-z0-9._-]{10,}/g, '[REDACTED]')
      // MSAL refresh tokens (don't fit JWT shape)
      .replace(/\b(0\.[A-Za-z0-9_-]{20,}|OAQABA[A-Za-z0-9_-]{20,})\b/g, '[REDACTED]')
      // recipient addresses are PII; User.email is encrypted at rest
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '[REDACTED-ADDRESS]')
  )
}
