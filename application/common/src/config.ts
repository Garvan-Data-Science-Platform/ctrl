export const backendPort: number = 5000
export const defaultAuditLogsPageSize: number = 25
// Scopes every OIDC login asks for. A provider's `additionalScopes` are added after these.
export const baseOIDCScopes: string[] = ['openid', 'email', 'profile']
