export interface SetupResponse {
  isSetup: boolean
  oidc: {
    name: string
    host: string
    clientId: string
    icon: string
    displayInAdminPortal: boolean
    displayInUserPortal: boolean
  }[]
  disableAdminPasswordLogin: boolean
}
