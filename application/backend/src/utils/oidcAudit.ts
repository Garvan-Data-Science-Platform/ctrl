import * as jwt from 'jsonwebtoken'
import type { OIDCAuditClaims } from 'common/types/oidc'
import type { OIDCProviderConfig } from '../config'

type MFASignalValues = NonNullable<OIDCProviderConfig['auditLogMfaWarning']>

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

// The token comes straight from the token endpoint, so OIDC Core 3.1.3.7 lets TLS stand in for the
// signature check. Returns a reason instead of throwing, so a bad token can't fail the login.
export function readIdTokenClaims(
  idToken: unknown,
  expected: { issuer: string; clientId: string; nowSeconds: number },
): { claims: OIDCAuditClaims } | { claimsError: string } {
  if (typeof idToken !== 'string' || idToken === '') {
    return { claimsError: 'no ID token in the token response' }
  }

  let decoded: unknown
  try {
    decoded = jwt.decode(idToken, { json: true })
  } catch {
    // jsonwebtoken throws when the payload isn't JSON, which is just another invalid token here
    return { claimsError: 'ID token is not a valid JWT' }
  }
  if (typeof decoded !== 'object' || decoded === null) {
    return { claimsError: 'ID token is not a valid JWT' }
  }
  const payload = decoded as Record<string, unknown>

  if (typeof payload.iss !== 'string' || payload.iss !== expected.issuer) {
    return { claimsError: 'ID token issuer does not match the provider' }
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
  if (!audiences.includes(expected.clientId)) {
    return { claimsError: 'ID token audience does not include this client' }
  }
  if (audiences.length > 1 && payload.azp !== expected.clientId) {
    return { claimsError: 'ID token azp does not match this client' }
  }

  if (typeof payload.exp !== 'number' || payload.exp <= expected.nowSeconds) {
    return { claimsError: 'ID token has expired' }
  }

  const claims: OIDCAuditClaims = {}
  if (typeof payload.acr === 'string') claims.acr = payload.acr
  if (isStringArray(payload.amr)) claims.amr = payload.amr
  if (typeof payload.auth_time === 'number') claims.auth_time = payload.auth_time
  if (typeof payload.idp === 'string') claims.idp = payload.idp
  if (typeof payload.idp_name === 'string') claims.idp_name = payload.idp_name
  return { claims }
}

export function hasMFASignal(
  claims: OIDCAuditClaims | undefined,
  mfaValues: MFASignalValues,
): boolean {
  const acr = claims?.acr
  const acrMatches = acr !== undefined && (mfaValues.acrValues ?? []).includes(acr)
  const amrMatches = (claims?.amr ?? []).some((method) =>
    (mfaValues.amrValues ?? []).includes(method),
  )
  return acrMatches || amrMatches
}
