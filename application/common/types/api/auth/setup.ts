export interface SetupResponse {
  isSetup: boolean
  oidc: {
    name: string
    host: string
    clientId: string
    icon: string
  }[]
  disableAdminPasswordLogin: boolean
}
