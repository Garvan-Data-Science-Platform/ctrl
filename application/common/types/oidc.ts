export interface OIDCProvider {
  name: string
  host: string
  clientId: string
  icon: string
  displayInAdminPortal: boolean
  displayInUserPortal: boolean
  authorizeUrlParams: string
  scope: string
}

// The ID token claims kept in the audit log. Anything else in the token is dropped.
export interface OIDCAuditClaims {
  acr?: string
  amr?: string[]
  auth_time?: number
  idp?: string
  idp_name?: string
}

export interface OIDCAuditMeta {
  provider: string
  claims?: OIDCAuditClaims
  claimsError?: string
  // Only set when the provider has `auditLogMfaWarning`
  mfaSignal?: boolean
}
