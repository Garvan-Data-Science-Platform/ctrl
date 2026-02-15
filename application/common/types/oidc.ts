export interface OIDCProvider {
  name: string
  host: string
  clientId: string
  icon: string
  displayInAdminPortal: boolean
  displayInUserPortal: boolean
  authorizeUrlParams: string
}
