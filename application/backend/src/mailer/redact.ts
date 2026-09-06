// Anything that reaches a log line or an error message goes through here first. The M365
// path can surface tokens from MSAL or from an Exchange response, and the smtp-basic path
// can surface a recipient address in an SMTP reply. Both end up in logger.error.
export function redactString(str: string): string {
  return (
    str
      .replace(/"access_token"\s*:\s*"[^"]*"/g, '"access_token":"[REDACTED]"')
      .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[REDACTED]"')
      .replace(/"(refresh_token|id_token|assertion)"\s*:\s*"[^"]*"/g, '"$1":"[REDACTED]"')
      .replace(/\b(client_secret|access_token|refresh_token|assertion)=[^&\s]+/g, '$1=[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
      // a bare JWT, which is what a token looks like once it is out of its JSON field
      .replace(/\beyJ[A-Za-z0-9._-]{10,}/g, '[REDACTED]')
      // recipient addresses are PII and User.email is encrypted at rest, so it should not
      // arrive in a log via an SMTP rejection either
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+/g, '[REDACTED-ADDRESS]')
  )
}
