import type { OIDCProvider } from '../../oidc'

export interface SetupResponse {
  isSetup: boolean
  oidc: OIDCProvider[]
  disableAdminPasswordLogin: boolean
}
